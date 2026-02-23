import { useState, useEffect } from 'react';
import GlassInput from './ui/GlassInput';
import { accountsDB } from '../db';
import { X, Building2 } from 'lucide-react';

export default function AddAccountForm({ onClose, initialData = null }) {
    const leadTypes = ['B2C', 'B2B', 'Collaborator'];
    const b2bSubTypes = ['Horeca', 'Retail', 'Corporate', 'B2B Other'];
    const collaboratorSubTypes = ['Artist', 'Influencer', 'Agency', 'Collab Other'];

    const [formData, setFormData] = useState({
        businessName: '',
        leadType: 'B2C',
        leadSubType: '',
        status: 'New',
        priority: 'Medium',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                businessName: initialData.businessName || '',
                leadType: initialData.leadType || 'B2C',
                leadSubType: initialData.leadSubType || '',
                status: initialData.status || 'New',
                priority: initialData.priority || 'Medium',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (initialData && initialData.id) {
                await accountsDB.update(initialData.id, payload);
            } else {
                payload.totalRevenue = payload.totalRevenue || 0;
                await accountsDB.add(payload);
            }
            onClose(true);
        } catch (error) {
            console.error("Failed to save account:", error);
            alert("Error saving account!");
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => onClose(false)} />
            <div className={`
                fixed z-[101] flex flex-col bg-gray-900 shadow-2xl overflow-hidden
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-w-[90vw] md:h-auto md:max-h-[85vh] md:rounded-2xl md:border md:border-gray-700
                top-0 left-0 w-full h-[100dvh]
                animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300
            `}>

                <div className="flex-shrink-0 sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-6 pt-12 md:pt-4 pb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                        <Building2 className="text-brand-gold" size={20} />
                        {initialData ? 'Edit Account' : 'New Account'}
                    </h2>
                    <button type="button" onClick={() => onClose(false)} className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-24 md:pb-6">

                        <div>
                            <label className="block text-xs text-white/70 mb-1">Business / Account Name *</label>
                            <GlassInput required name="businessName" placeholder="Ex: The Royal Bar" value={formData.businessName} onChange={handleChange} autoFocus={!initialData} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-white/70 mb-1">Account Type</label>
                                <select name="leadType" value={formData.leadType} onChange={handleChange} className="glass-input w-full appearance-none bg-black">
                                    {leadTypes.map(t => <option key={t} value={t} className="text-white bg-black">{t}</option>)}
                                </select>
                            </div>
                            {formData.leadType === 'B2B' && (
                                <div className="animate-in fade-in slide-in-from-left-2">
                                    <label className="block text-xs text-white/70 mb-1">B2B Category</label>
                                    <select name="leadSubType" value={formData.leadSubType} onChange={handleChange} className="glass-input w-full appearance-none bg-black">
                                        <option value="" className="text-white/50 bg-black">Select...</option>
                                        {b2bSubTypes.map(t => <option key={t} value={t} className="text-white bg-black">{t}</option>)}
                                    </select>
                                </div>
                            )}
                            {formData.leadType === 'Collaborator' && (
                                <div className="animate-in fade-in slide-in-from-left-2">
                                    <label className="block text-xs text-white/70 mb-1">Collab Type</label>
                                    <select name="leadSubType" value={formData.leadSubType} onChange={handleChange} className="glass-input w-full appearance-none bg-black">
                                        <option value="" className="text-white/50 bg-black">Select...</option>
                                        {collaboratorSubTypes.map(t => <option key={t} value={t} className="text-white bg-black">{t}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-white/70 mb-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="glass-input w-full appearance-none bg-black">
                                    <option value="New" className="text-white bg-black">New</option>
                                    <option value="In Progress" className="text-white bg-black">In Progress</option>
                                    <option value="Converted" className="text-green-400 bg-black">Converted</option>
                                    <option value="Lost" className="text-red-400 bg-black">Lost</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-white/70 mb-1">Priority</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} className="glass-input w-full appearance-none bg-black">
                                    <option value="High" className="text-white bg-black">High</option>
                                    <option value="Medium" className="text-white bg-black">Medium</option>
                                    <option value="Low" className="text-white bg-black">Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0 z-20 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4 md:p-6 pb-[env(safe-area-inset-bottom)] flex gap-3 items-center justify-end" style={{ paddingBottom: window.innerWidth < 768 ? 'calc(5rem + env(safe-area-inset-bottom))' : undefined }}>
                        <button type="button" onClick={() => onClose(false)} className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 transition-colors font-semibold text-sm flex-1 md:flex-none">
                            Cancel
                        </button>
                        <button type="submit" className="px-8 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-gray-950 font-bold text-sm shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all flex-1 md:flex-none w-full md:w-auto">
                            Save Account
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
