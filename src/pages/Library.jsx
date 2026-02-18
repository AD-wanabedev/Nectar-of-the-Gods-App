import { useState, useEffect } from 'react';
import { collateralDB } from '../db';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import { Search, FileText, ExternalLink, Share2, Upload, Link as LinkIcon, Trash2, X } from 'lucide-react';
import DrivePicker from '../components/DrivePicker';

const GOOGLE_CLIENT_ID = '802929189698-ci1dhice44to5mjjkdtpdg0ltu5u03jm.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyBWtPIDDFJdYIgxKCH3SVFXyCNq1B8AYHg';

export default function Library() {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkData, setLinkData] = useState({ title: '', url: '' });
    const [uploading, setUploading] = useState(false);

    const handleDrivePick = (docs) => {
        if (!docs) return;
        docs.forEach(async (doc) => {
            await collateralDB.add({
                title: doc.name,
                type: 'Link', // treating as Link for now so it opens in new tab
                url: doc.url,
                folder: 'Drive Link',
                driveId: doc.id,
                mimeType: doc.mimeType
            });
        });
        loadItems();
    };

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
        <div className="pb-28 pt-4 space-y-6">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-white/50 z-10" size={16} />
                    <GlassInput
                        placeholder="Search assets..."
                        className="pl-10 w-full text-center bg-brand-white/5 border-brand-white/10 focus:border-brand-gold/50"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Upload Card */}
                <button
                    onClick={() => document.getElementById('file-upload').click()}
                    className="group relative overflow-hidden rounded-xl bg-brand-white/5 border border-brand-white/10 p-6 text-left transition-all hover:border-brand-gold/50 hover:bg-brand-white/10 hover:shadow-glass-hover"
                >
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileUpload}
                        accept="image/*,application/pdf"
                    />
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                        <Upload size={100} className="text-brand-gold" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold group-hover:scale-110 transition-transform">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-brand-white group-hover:text-brand-gold transition-colors">Upload File</h3>
                            <p className="text-sm text-brand-white/50">{uploading ? 'Uploading...' : 'Images & PDFs'}</p>
                        </div>
                    </div>
                </button>

                {/* Drive Card */}
                <DrivePicker
                    onPick={handleDrivePick}
                    clientId={GOOGLE_CLIENT_ID}
                    developerKey={GOOGLE_API_KEY}
                />

                {/* Link Card */}
                <button
                    onClick={() => setShowLinkModal(true)}
                    className="group relative overflow-hidden rounded-xl bg-brand-white/5 border border-brand-white/10 p-6 text-left transition-all hover:border-brand-gold/50 hover:bg-brand-white/10 hover:shadow-glass-hover"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                        <LinkIcon size={100} className="text-brand-gold" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold group-hover:scale-110 transition-transform">
                            <LinkIcon size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-brand-white group-hover:text-brand-gold transition-colors">Save Link</h3>
                            <p className="text-sm text-brand-white/50">Bookmarks & URLs</p>
                        </div>
                    </div>
                </button>
            </div>

            <h2 className="text-xl font-bold text-brand-white px-2">Your Library</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                    <GlassCard
                        key={item.id}
                        onClick={() => openItem(item)}
                        className="aspect-square flex flex-col justify-between p-4 group relative cursor-pointer hover:bg-brand-white/10 border-brand-white/5 hover:border-brand-gold/30"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="absolute top-2 right-2 text-brand-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 z-20"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="flex-1 flex items-center justify-center pointer-events-none">
                            {item.type === 'PDF' ? <FileText size={40} className="text-red-400 group-hover:scale-110 transition-transform duration-300" /> :
                                item.type === 'Image' ? (
                                    <img
                                        src={item.url}
                                        alt={item.title}
                                        className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                ) :
                                    <ExternalLink size={40} className="text-green-400 group-hover:scale-110 transition-transform duration-300" />}
                        </div>

                        <div className="mt-3 pointer-events-none">
                            <div className="flex justify-between items-end">
                                <div className="overflow-hidden">
                                    <p className="text-brand-white font-medium text-sm leading-tight truncate">{item.title}</p>
                                    <p className="text-brand-white/40 text-[10px] uppercase mt-1 tracking-wider">{item.type}</p>
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); shareItem(item); }} className="text-brand-white/60 hover:text-blue-400 cursor-pointer pointer-events-auto z-20">
                                    <Share2 size={16} />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full text-center text-brand-white/40 py-20 text-sm italic">
                        No items found. Import some assets above!
                    </div>
                )}
            </div>

            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pb-20">
                    <div className="glass-card w-full max-w-md p-6 relative bg-brand-dark border-brand-gold/20 shadow-2xl shadow-brand-gold/10">
                        <button onClick={() => setShowLinkModal(false)} className="absolute top-4 right-4 text-brand-white/60 hover:text-brand-white">
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold text-brand-white mb-6 font-sans">Save New Link</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-brand-white/60 mb-1 uppercase tracking-wider">Name *</label>
                                <GlassInput
                                    placeholder="Ex: Product Catalog"
                                    value={linkData.title}
                                    onChange={e => setLinkData(prev => ({ ...prev, title: e.target.value }))}
                                    autoFocus
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-brand-white/60 mb-1 uppercase tracking-wider">URL *</label>
                                <GlassInput
                                    placeholder="https://example.com"
                                    value={linkData.url}
                                    onChange={e => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex gap-3 pt-6">
                                <GlassButton onClick={() => setShowLinkModal(false)} variant="secondary" className="flex-1 text-xs uppercase tracking-wide">
                                    Cancel
                                </GlassButton>
                                <GlassButton onClick={handleSaveLink} className="flex-1 bg-brand-gold/20 hover:bg-brand-gold text-brand-gold hover:text-brand-dark border-brand-gold/30 text-xs uppercase tracking-wide font-bold">
                                    Save Link
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

