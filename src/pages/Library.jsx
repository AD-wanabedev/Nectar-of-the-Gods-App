import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import { Search, FileText, Image as ImageIcon, ExternalLink, Share2, Upload, Link as LinkIcon, Trash2, X } from 'lucide-react';

export default function Library() {
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkData, setLinkData] = useState({ title: '', url: '' });
    const fileInputRef = useRef(null);

    const items = useLiveQuery(() => db.collateral.toArray());

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await db.collateral.add({
                title: file.name,
                type: file.type.startsWith('image/') ? 'Image' : 'PDF',
                data: file,
                folder: 'Uploads',
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to save file. It might be too large.");
        }
    };

    const handleSaveLink = async () => {
        if (!linkData.title || !linkData.url) {
            alert("Please fill both fields");
            return;
        }

        await db.collateral.add({
            title: linkData.title,
            type: 'Link',
            url: linkData.url,
            folder: 'Links',
            createdAt: new Date().toISOString()
        });

        setLinkData({ title: '', url: '' });
        setShowLinkModal(false);
    };

    const handleDelete = (id) => {
        if (confirm("Delete this item?")) db.collateral.delete(id);
    };

    const openItem = (item) => {
        if (item.type === 'Link') {
            window.open(item.url, '_blank', 'noopener,noreferrer');
        } else if (item.data) {
            const url = URL.createObjectURL(item.data);
            window.open(url, '_blank');
        }
    };

    const shareItem = (item) => {
        if (item.type === 'Link' && navigator.share) {
            navigator.share({ title: item.title, url: item.url });
        } else if (item.data && navigator.share) {
            const file = new File([item.data], item.title, { type: item.data.type });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title: item.title });
            } else {
                alert("Sharing files not supported on this device/browser.");
            }
        } else {
            alert("Cannot share this item type directly.");
        }
    };

    const filteredItems = items?.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

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

            {/* Actions */}
            <div className="flex gap-2 mb-4">
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                />
                <GlassButton onClick={() => fileInputRef.current?.click()} className="flex-1 bg-blue-600/20 hover:bg-blue-600">
                    <Upload size={16} /> Upload
                </GlassButton>
                <GlassButton onClick={() => setShowLinkModal(true)} className="flex-1 bg-blue-600/20 hover:bg-blue-600">
                    <LinkIcon size={16} /> Save Link
                </GlassButton>
            </div>

            {/* Grid */}
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
                                    item.data ? (
                                        <img
                                            src={URL.createObjectURL(item.data)}
                                            alt={item.title}
                                            className="w-full h-full object-cover rounded-lg opacity-80"
                                        />
                                    ) : <ImageIcon size={40} className="text-blue-400" />
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

            {/* Custom Link Modal */}
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
