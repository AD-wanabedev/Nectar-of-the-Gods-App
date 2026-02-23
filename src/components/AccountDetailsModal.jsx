import { useState, useEffect } from 'react';
import { db, leadsDB } from '../db';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import AddLeadForm from './AddLeadForm';
import { X, Phone, Mail, Instagram, MessageCircle, Building2, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function AccountDetailsModal({ account, onClose, onRefreshAccounts }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const allLeads = await leadsDB.getAll();
            const accountLeads = allLeads.filter(l => l.accountId === account.id);
            setContacts(accountLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error("Failed to load contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
        // Prevent body scroll when this modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleAddContact = () => {
        setEditingContact({
            accountId: account.id,
            establishment: account.businessName
        });
        setShowAddForm(true);
    };

    const handleEditContact = (contact) => {
        setEditingContact(contact);
        setShowAddForm(true);
    };

    const handleDeleteContact = async (contactId) => {
        if (confirm("Remove this contact from the account?")) {
            await leadsDB.delete(contactId);
            loadContacts();
        }
    };

    const handleCloseAddForm = () => {
        setShowAddForm(false);
        setEditingContact(null);
        loadContacts();
        if (onRefreshAccounts) onRefreshAccounts(); // Refresh revenue up top
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-card w-full max-w-md max-h-[90vh] flex flex-col relative overflow-hidden shadow-2xl bg-brand-dark/95 border border-white/10"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-brand-dark flex-shrink-0 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Building2 size={20} className="text-brand-gold" />
                            {account.businessName}
                        </h2>
                        <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-medium tracking-wider uppercase">
                                {account.status || 'New'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 font-medium tracking-wider uppercase">
                                ₹{account.totalRevenue?.toLocaleString() || '0'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">Associated Contacts</h3>
                        <GlassButton onClick={handleAddContact} className="py-1.5 px-3 text-xs flex gap-1 items-center bg-brand-gold/20 text-brand-gold">
                            <UserPlus size={14} /> Add
                        </GlassButton>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-white/40 animate-pulse text-sm">Loading contacts...</div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-8 text-white/40 text-sm border border-dashed border-white/10 rounded-xl">
                            No contacts linked to this account yet.
                        </div>
                    ) : (
                        contacts.map(contact => (
                            <GlassCard key={contact.id} className="p-4 relative group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-white text-base leading-tight">
                                            {contact.name || 'Unnamed Contact'}
                                        </h4>
                                        <div className="flex gap-2 mt-1">
                                            {contact.teamMember && <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-1.5 rounded">{contact.teamMember}</span>}
                                            {contact.platform && <span className="text-[10px] text-white/50 bg-white/5 px-1.5 rounded">{contact.platform}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {contact.phone && (
                                            <a href={`tel:${contact.phone}`} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg">
                                                <Phone size={16} />
                                            </a>
                                        )}
                                        <button onClick={() => handleEditContact(contact)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteContact(contact.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {(contact.phone || contact.email) && (
                                    <div className="mt-2 pt-2 border-t border-white/5 text-xs text-white/50 space-y-1">
                                        {contact.phone && <p>{contact.phone}</p>}
                                        {contact.email && <p>{contact.email}</p>}
                                    </div>
                                )}
                                {contact.notes && (
                                    <p className="mt-2 text-xs text-white/60 italic line-clamp-2">"{contact.notes}"</p>
                                )}
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>

            {/* Nested Add/Edit Form */}
            {showAddForm && (
                <div className="absolute inset-0 z-[60]">
                    <AddLeadForm onClose={handleCloseAddForm} initialData={editingContact} />
                </div>
            )}
        </div>
    );
}
