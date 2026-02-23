import { X, Building2, IndianRupee, MapPin, Phone, Mail, FileText, UserPlus, Users, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import AddLeadForm from '../AddLeadForm';
import { db, leadsDB, accountsDB } from '../../db';

export default function LeadDetailPanel({ account, contacts, onClose, onRefreshAccounts }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [editableAccount, setEditableAccount] = useState({ ...account });

    // Close panel on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !showContactForm) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, showContactForm]);

    // Handle outside click wrapper logic could go here or in parent
    const saveAccountInline = async (field, value) => {
        try {
            await accountsDB.update(account.id, { [field]: value });
            setEditableAccount(prev => ({ ...prev, [field]: value }));
            if (onRefreshAccounts) onRefreshAccounts(true); // Silent
        } catch (err) {
            console.error('Failed to inline update account', err);
        }
    };

    const handleDeleteContact = async (id) => {
        if (confirm("Remove contact from this account?")) {
            await leadsDB.delete(id);
            if (onRefreshAccounts) onRefreshAccounts(true);
        }
    };

    return (
        <>
            {/* Backdrop Overlay (Fix for Bug 5) */}
            <div
                className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Slide-in Panel */}
            <div className="fixed inset-y-0 right-0 w-full md:w-1/2 md:max-w-xl bg-brand-dark/95 backdrop-blur-xl md:border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header Sticky */}
                <div className="flex-shrink-0 p-5 border-b border-white/5 bg-black/20 flex justify-between items-start">
                    <div className="flex-1 pr-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                            <Building2 size={24} className="text-brand-gold" />
                            {editableAccount.businessName}
                        </h2>

                        <div className="flex flex-wrap gap-2 text-xs">
                            <select
                                value={editableAccount.status || 'New'}
                                onChange={(e) => saveAccountInline('status', e.target.value)}
                                className="bg-white/5 border border-white/10 rounded px-2 py-1 outline-none focus:border-brand-gold uppercase tracking-wider font-bold"
                                style={{ color: editableAccount.status === 'Converted' ? '#4ade80' : editableAccount.status === 'Lost' ? '#f87171' : '#a78bfa' }}
                            >
                                <option value="New">NEW</option>
                                <option value="In Progress">IN PROGRESS</option>
                                <option value="Converted">CONVERTED</option>
                                <option value="Lost">LOST</option>
                            </select>

                            <select
                                value={editableAccount.priority || 'Medium'}
                                onChange={(e) => saveAccountInline('priority', e.target.value)}
                                className="bg-white/5 border border-white/10 text-white/70 rounded px-2 py-1 outline-none focus:border-brand-gold uppercase tracking-wider font-bold"
                            >
                                <option value="Low">LOW PRIORITY</option>
                                <option value="Medium">MED PRIORITY</option>
                                <option value="High">HIGH PRIORITY</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Total Value</span>
                            <div className="flex items-center text-green-400 font-bold text-lg bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 mt-1">
                                <IndianRupee size={14} />
                                {isEditing ? (
                                    <input
                                        type="number"
                                        className="bg-transparent outline-none w-20 ml-1 text-right"
                                        defaultValue={editableAccount.totalRevenue || 0}
                                        autoFocus
                                        onBlur={(e) => {
                                            saveAccountInline('totalRevenue', parseFloat(e.target.value) || 0);
                                            setIsEditing(false);
                                        }}
                                    />
                                ) : (
                                    <span onClick={() => setIsEditing(true)} className="cursor-text ml-1">
                                        {(editableAccount.totalRevenue || 0).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Body (Added pb-24 for Bug 6 navbar overlap) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-24 space-y-6">

                    {/* Contacts Section */}
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} /> Associated Contacts ({contacts.length})
                            </h3>
                            <GlassButton
                                onClick={() => { setEditingContact(null); setShowContactForm(true); }}
                                className="py-1 px-3 text-xs bg-brand-gold/10 text-brand-gold border-brand-gold/20 hover:bg-brand-gold/20 flex gap-1 items-center"
                            >
                                <UserPlus size={12} /> Add
                            </GlassButton>
                        </div>

                        <div className="space-y-3">
                            {contacts.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-white/30 text-sm">
                                    <p>No contacts linked.</p>
                                    <p className="text-xs mt-1">Add one to track conversations.</p>
                                </div>
                            ) : contacts.map(contact => (
                                <GlassCard key={contact.id} className="p-4 bg-white/[0.02] hover:bg-white/[0.04]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-white leading-tight">{contact.name || 'Unknown'}</h4>
                                            <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded font-medium">Owner: {contact.teamMember || 'Me'}</span>
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingContact(contact); setShowContactForm(true); }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteContact(contact.id)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 mt-3 text-xs text-white/60">
                                        {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-green-400 transition-colors w-fit"><Phone size={12} /> {contact.phone}</a>}
                                        {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-blue-400 transition-colors w-fit truncate"><Mail size={12} /> {contact.email}</a>}
                                    </div>
                                    {contact.notes && (
                                        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/50 italic flex items-start gap-2">
                                            <FileText size={12} className="flex-shrink-0 mt-0.5" />
                                            <p className="line-clamp-3">{contact.notes}</p>
                                        </div>
                                    )}
                                </GlassCard>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Render Overlay Form inside Panel bounds or fullscreen depending on UX choice, going Fullscreen explicitly for AddLeadForm stability */}
                {showContactForm && (
                    <div className="fixed inset-0 z-[60]">
                        <AddLeadForm
                            onClose={() => {
                                setShowContactForm(false);
                                if (onRefreshAccounts) onRefreshAccounts(true);
                            }}
                            initialData={editingContact || { accountId: account.id, establishment: account.businessName }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
