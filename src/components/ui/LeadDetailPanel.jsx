import { X, Building2, IndianRupee, MapPin, Phone, Mail, FileText, UserPlus, Users, Edit2, Trash2, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import AddLeadForm from '../AddLeadForm';
import { db, leadsDB, accountsDB } from '../../db';

const PRIORITY_OPTIONS = [
    { value: 'High', label: 'High Priority', dot: '🔴' },
    { value: 'Medium', label: 'Med Priority', dot: '🟡' },
    { value: 'Low', label: 'Low Priority', dot: '🔵' },
];

const STATUS_OPTIONS = [
    { value: 'New', label: 'New' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Converted', label: 'Converted' },
    { value: 'Lost', label: 'Lost' }
];

const STATUS_COLORS = {
    'New': 'text-blue-400',
    'In Progress': 'text-orange-400',
    'Converted': 'text-green-400',
    'Lost': 'text-red-400'
};

function InlineDropdown({ value, options, onChange, colors }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOpt = options.find(o => o.value === value) || options[0];
    const selectedColor = colors ? colors[value] : 'text-white';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 bg-gray-900/90 backdrop-blur border border-white/10 hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors outline-none focus:border-brand-gold/50 ${selectedColor}`}
            >
                {selectedOpt.dot && <span className="text-xs mr-1">{selectedOpt.dot}</span>}
                {selectedOpt.label}
                <ChevronDown size={14} className={`transition-transform text-white/50 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[60] top-full mt-1 left-0 w-44 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-1 animate-in slide-in-from-top-2 duration-200">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white/5 ${colors ? colors[opt.value] : 'text-white/80'} ${value === opt.value ? 'bg-white/5' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                {opt.dot && <span className="text-xs">{opt.dot}</span>}
                                {opt.label}
                            </div>
                            {value === opt.value && <Check size={14} className="text-brand-gold" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

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

            {/* Slide-in Panel -> Converted to Centered Modal */}
            <div className={`
                fixed z-[50] flex flex-col bg-gray-900 shadow-2xl overflow-hidden
                
                /* Desktop Centering logic */
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:w-[800px] md:max-w-[95vw] md:h-auto md:max-h-[85vh]
                md:rounded-2xl md:border md:border-gray-700
                
                /* Mobile Full Screen logic */
                top-0 left-0 w-full h-[100dvh] rounded-none border-none
                
                /* Animations */
                animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95
                duration-200
            `}>
                {/* Header Sticky */}
                <div className="flex-shrink-0 pt-12 md:pt-5 pb-5 px-5 border-b border-gray-800 bg-gray-900/95 flex justify-between items-start sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex-1 pr-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                            <Building2 size={24} className="text-brand-gold" />
                            {editableAccount.businessName}
                        </h2>

                        <div className="flex flex-wrap gap-2 text-xs">
                            <InlineDropdown
                                value={editableAccount.status || 'New'}
                                options={STATUS_OPTIONS}
                                colors={STATUS_COLORS}
                                onChange={(val) => saveAccountInline('status', val)}
                            />
                            <InlineDropdown
                                value={editableAccount.priority || 'Medium'}
                                options={PRIORITY_OPTIONS}
                                onChange={(val) => saveAccountInline('priority', val)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Body (Added bottom-nav padding for Mobile bounds via safe-area overrides) */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6"
                    style={{
                        paddingBottom: window.innerWidth < 768 ? 'calc(100px + env(safe-area-inset-bottom))' : '1.5rem'
                    }}
                >
                    {/* Total Value Indicator (Moved to top of content for spacious UI Issue 5) */}
                    <div className="flex items-center justify-between gap-3 bg-gray-800/50 rounded-lg px-4 py-3 border border-white/10">
                        <span className="text-white/60 text-sm uppercase tracking-wider font-semibold">Total Value</span>
                        <div className="flex items-center text-green-400 font-bold text-2xl">
                            ₹
                            {isEditing ? (
                                <input
                                    type="number"
                                    className="bg-transparent outline-none w-24 ml-1 text-right"
                                    defaultValue={editableAccount.totalRevenue || 0}
                                    autoFocus
                                    onBlur={(e) => {
                                        saveAccountInline('totalRevenue', parseFloat(e.target.value) || 0);
                                        setIsEditing(false);
                                    }}
                                />
                            ) : (
                                <span onClick={() => setIsEditing(true)} className="cursor-text ml-1">
                                    {(editableAccount.totalRevenue || 0).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Contacts Section */}
                    <section>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                            <h3 className="text-white/60 text-xs uppercase tracking-wider flex items-center gap-2 font-semibold">
                                <Users size={14} /> Associated Contacts ({contacts.length})
                            </h3>
                            <button
                                onClick={() => { setEditingContact(null); setShowContactForm(true); }}
                                className="flex items-center gap-1 text-brand-gold hover:text-brand-gold/80 text-sm transition-colors font-medium"
                            >
                                <UserPlus size={14} /> Add
                            </button>
                        </div>

                        <div className="space-y-3">
                            {contacts.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-white/30 text-sm">
                                    <p>No contacts linked.</p>
                                    <p className="text-xs mt-1">Add one to track conversations.</p>
                                </div>
                            ) : contacts.map(contact => (
                                <div key={contact.id} className="bg-gray-800/50 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-white font-bold text-lg">{contact.name}</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingContact(contact); setShowContactForm(true); }} className="text-blue-400 hover:text-blue-300 p-1">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteContact(contact.id)} className="text-red-400 hover:text-red-300 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Owner */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users size={12} className="text-white/40" />
                                        <span className="text-xs text-white/60">Owner:</span>
                                        <span className="text-sm text-brand-gold">{contact.teamMember || 'Unassigned'}</span>
                                    </div>

                                    {/* Phone */}
                                    {contact.phone && (
                                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 mb-3 text-blue-400 hover:text-blue-300 w-fit">
                                            <Phone size={12} />
                                            <span className="text-sm">{contact.phone}</span>
                                        </a>
                                    )}

                                    {/* Email */}
                                    {contact.email && (
                                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 mb-3 text-blue-400 hover:text-blue-300 w-fit truncate">
                                            <Mail size={12} />
                                            <span className="text-sm">{contact.email}</span>
                                        </a>
                                    )}

                                    {/* Notes */}
                                    {contact.notes && (
                                        <div className="bg-gray-900/50 rounded p-3 border border-white/5 mt-2">
                                            <p className="text-white/70 text-sm italic">{contact.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Render Overlay Form inside root Fragment to escape 'transform' coordinate matrix */}
            {showContactForm && (
                <AddLeadForm
                    onClose={() => {
                        setShowContactForm(false);
                        if (onRefreshAccounts) onRefreshAccounts(true);
                    }}
                    initialData={editingContact || { accountId: account.id, establishment: account.businessName }}
                />
            )}
        </>
    );
}
