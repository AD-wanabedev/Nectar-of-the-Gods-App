import { useState, useEffect } from 'react';
import { collateralDB } from '../db';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import { Search, FileText, Image as ImageIcon, ExternalLink, Share2, Upload, Link as LinkIcon, Trash2, X } from 'lucide-react';

export default function Library() {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkData, setLinkData] = useState({ title: '', url: '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const data = await collateralDB.getAll();
            setItems(data);
        } catch (error) {
            console.error("Failed to load items:", error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const userId = auth.currentUser.uid;
            const storageRef = ref(storage, `users/${userId}/collateral/${Date.now()}_${file.name}`);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await collateralDB.add({
                title: file.name,
                type: file.type.startsWith('image/') ? 'Image' : 'PDF',
                url: downloadURL,
                folder: 'Uploads'
            });

            loadItems();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveLink = async () => {
        if (!linkData.title || !linkData.url) {
            alert("Please fill both fields");
            return;
        }

        await collateralDB.add({
            title: linkData.title,
            type: 'Link',
            url: linkData.url,
            folder: 'Links'
        });

        setLinkData({ title: '', url: '' });
        setShowLinkModal(false);
        loadItems();
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this item?")) {
            await collateralDB.delete(id);
            loadItems();
        }
    };

    const openItem = (item) => {
        window.open(item.url, '_blank', 'noopener,noreferrer');
    };

    const shareItem = (item) => {
        if (navigator.share) {
            navigator.share({ title: item.title, url: item.url });
        }
    };

    const filteredItems = items.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-28 pt-4 space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 z-10" size={16} />
                    <GlassInput
                        placeholder="Search..."
                        className="pl-10 w-full text-center"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                />
                <GlassButton
                    onClick={() => document.getElementById('file-upload').click()}
                    className="flex-1 bg-blue-600/20 hover:bg-blue-600"
                    disabled={uploading}
                >
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                </GlassButton>
                <GlassButton onClick={() => setShowLinkModal(true)} className="flex-1 bg-blue-600/20 hover:bg-blue-600">
                    <LinkIcon size={16} /> Save Link
                </GlassButton>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {filteredItems.map(item => (
                    <GlassCard
                        key={item.id}
                        onClick={() => openItem(item)}
                        className="aspect-square flex flex-col justify-between p-4 group relative cursor-pointer hover:bg-white/10"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="absolute top-2 right-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 z-20"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="flex-1 flex items-center justify-center pointer-events-none">
                            {item.type === 'PDF' ? <FileText size={40} className="text-red-400" /> :
                                item.type === 'Image' ? (
                                    <img
                                        src={item.url}
                                        alt={item.title}
                                        className="w-full h-full object-cover rounded-lg opacity-80"
                                    />
                                ) :
                                    <ExternalLink size={40} className="text-green-400" />}
                        </div>

                        <div className="mt-3 pointer-events-none">
                            <div className="flex justify-between items-end">
                                <div className="overflow-hidden">
                                    <p className="text-white font-medium text-sm leading-tight truncate">{item.title}</p>
                                    <p className="text-white/40 text-[10px] uppercase mt-1">{item.type}</p>
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); shareItem(item); }} className="text-white/60 hover:text-blue-400 cursor-pointer pointer-events-auto z-20">
                                    <Share2 size={16} />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-2 text-center text-white/40 py-10 text-sm">
                        No items found. Upload some!
                    </div>
                )}
            </div>

            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-20">
                    <div className="glass-card w-full max-w-md p-6 relative bg-gray-900 border-blue-500/20">
                        <button onClick={() => setShowLinkModal(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6">Save Link</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-white/70 mb-1">Name *</label>
                                <GlassInput
                                    placeholder="Ex: Product Catalog"
                                    value={linkData.title}
                                    onChange={e => setLinkData(prev => ({ ...prev, title: e.target.value }))}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-white/70 mb-1">URL *</label>
                                <GlassInput
                                    placeholder="https://example.com"
                                    value={linkData.url}
                                    onChange={e => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <GlassButton onClick={() => setShowLinkModal(false)} variant="secondary" className="flex-1">
                                    Cancel
                                </GlassButton>
                                <GlassButton onClick={handleSaveLink} className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-100 border-blue-500/30">
                                    Save
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

