import { useState, useEffect, useRef } from 'react';
import GlassInput from './ui/GlassInput';
import GlassButton from './ui/GlassButton';
import { db } from '../db';
import { X, Calendar, UserPlus, Mic, Instagram, Phone, Mail, MessageCircle, User, Check, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

import { PlusCircle } from 'lucide-react';

export default function AddLeadForm({ onClose, initialData = null }) {
    // --- Team Member Logic ---
    const [teamMembers, setTeamMembers] = useState(() => {
        const stored = localStorage.getItem('moonshine_team');
        return stored ? JSON.parse(stored) : ['AD', 'Rohan', 'Akshay'];
    });
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [showHoneyDropdown, setShowHoneyDropdown] = useState(false); // Toggle for honey dropdown

    // --- Quick Sale Add Logic ---
    const [isAddingSale, setIsAddingSale] = useState(false);
    const [addAmount, setAddAmount] = useState('');

    const handleAddSale = () => {
        if (!addAmount || isNaN(parseFloat(addAmount))) return;

        const currentTotal = parseFloat(formData.orderValue) || 0;
        const addition = parseFloat(addAmount);
        const newTotal = currentTotal + addition;

        setFormData(prev => ({
            ...prev,
            orderValue: newTotal.toString(),
            saleDate: format(new Date(), 'yyyy-MM-dd'), // Update sale date to today
            notes: (prev.notes ? prev.notes + '\n' : '') + `[${format(new Date(), 'dd/MM')}] Added sale: ₹${addition}`
        }));

        setAddAmount('');
        setIsAddingSale(false);
    };

    const handleDeleteLead = async () => {
        if (!initialData?.id) return;
        if (confirm("Are you sure you want to delete this lead?")) {
            await db.leads.delete(initialData.id);
            onClose();
        }
    };

    const addTeamMember = () => {
        if (!newMemberName.trim()) return;
        const updated = [...teamMembers, newMemberName];
        setTeamMembers(updated);
        localStorage.setItem('moonshine_team', JSON.stringify(updated));
        setFormData(prev => ({ ...prev, teamMember: newMemberName }));
        setNewMemberName('');
        setShowAddTeam(false);
    };

    const deleteTeamMember = (member, e) => {
        e.stopPropagation();
        if (member === 'AD') return; // Cannot delete default
        if (confirm(`Remove ${member} from team?`)) {
            const updated = teamMembers.filter(m => m !== member);
            setTeamMembers(updated);
            localStorage.setItem('moonshine_team', JSON.stringify(updated));
            if (formData.teamMember === member) {
                setFormData(prev => ({ ...prev, teamMember: 'AD' }));
            }
        }
    };

    // --- Form State ---
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        priority: 'Medium',
        status: 'New',
        leadType: 'B2C', // Default
        leadSubType: '',
        teamMember: 'AD',
        platform: 'Call',
        notes: '',
        honeyTypes: [], // Multi-select array
        establishment: '', // New field
        orderValue: '',
        saleDate: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hour: '10',
        minute: '00',
        ampm: 'AM'
    });

    // Contact Picker Logic
    const pickContact = async () => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['name', 'tel'];
                const opts = { multiple: false };
                const contacts = await navigator.contacts.select(props, opts);
                if (contacts.length) {
                    const { name, tel } = contacts[0];
                    setFormData(prev => ({
                        ...prev,
                        name: name?.[0] || prev.name,
                        phone: tel?.[0] || prev.phone
                    }));
                }
            } catch (ex) {
                console.error("Contact picker failed:", ex);
            }
        } else {
            alert("Contact Picker not supported on this device.");
        }
    };

    // Speech Recognition Logic
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Voice input not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setFormData(prev => ({ ...prev, notes: (prev.notes ? prev.notes + ' ' : '') + transcript }));
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    useEffect(() => {
        if (initialData) {
            const d = new Date(initialData.nextFollowUp);
            setFormData({
                ...initialData,
                establishment: initialData.establishment || '',
                honeyTypes: initialData.honeyTypes || (initialData.honeyType ? [initialData.honeyType] : []),
                leadType: initialData.leadType || 'B2C',
                leadSubType: initialData.leadSubType || '',
                notes: initialData.notes || '',
                date: format(d, 'yyyy-MM-dd'),
                hour: format(d, 'hh'),
                minute: format(d, 'mm'),
                ampm: format(d, 'a')
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ... (keep toggleHoney)

    const handleSubmit = async (e) => {
        e.preventDefault();

        let hour24 = parseInt(formData.hour);
        if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;

        const followUpDate = new Date(formData.date);
        followUpDate.setHours(hour24, parseInt(formData.minute));

        const payload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || '',
            priority: formData.priority,
            status: formData.status,
            leadType: formData.leadType,
            leadSubType: formData.leadSubType,
            teamMember: formData.teamMember,
            platform: formData.platform,
            notes: formData.notes,
            honeyTypes: formData.honeyTypes, // Array
            establishment: formData.establishment, // New Field
            orderValue: formData.orderValue,
            saleDate: formData.saleDate,
            nextFollowUp: followUpDate.toISOString()
        };

        try {
            if (initialData && initialData.id) {
                await db.leads.update(initialData.id, payload);
            } else {
                await db.leads.add(payload);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save lead:", error);
            alert("Error saving lead!");
        }
    };

    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const honeyOptions = [
        "Acacia Honey", "Mustard Honey", "Multifloral Honey", "Sidr Honey",
        "Smoked Honey", "Gondhoraj Honey", "Jeera Masala Honey", "Chilly Honey",
        "Cinnamon Sidr Honey", "Mustard Ginger Honey", "Chilli Honey", "Coffee Honey",
        "Forest Honey", "Sundarban Honey", "Tribal Honey", "Ajwain Honey",
        "Niger Honey", "Dark - phondaghat Honey", "Natural (MFH) Kejriwal Honey",
        "Network Honey", "Bee Hotels"
    ];

    const leadTypes = ["B2C", "B2B", "Collaborator"];
    const b2bSubTypes = ["Restaurant", "Cafe", "Bar", "Hotel", "Airline", "White Labelling", "Retail"];
    const collaboratorSubTypes = ["Promoter", "Influencer", "Bar Consultant"];

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center bg-black/80 backdrop-blur-sm md:p-4 animate-in fade-in" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-card fixed inset-0 w-full h-full rounded-none md:relative md:inset-auto md:w-full md:max-w-md md:max-h-[85vh] md:rounded-2xl !overflow-y-auto p-6 pb-32 md:pb-6 bg-brand-dark border-0 md:border md:border-blue-500/20 shadow-none md:shadow-blue-900/20 custom-scrollbar"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white z-10 bg-black/50 p-2 rounded-full md:bg-transparent md:p-0">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 pt-2 md:pt-0">
                    {initialData ? 'Edit Lead' : 'New Lead'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name & Contact Picker */}
                    <div>
                        <label className="block text-xs text-white/70 mb-1 flex justify-between items-center">
                            Name *
                            <button
                                type="button"
                                onClick={pickContact}
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                            >
                                <User size={12} /> Pick Contact
                            </button>
                        </label>
                        <GlassInput
                            required
                            name="name"
                            placeholder="Ex: John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            autoFocus={!initialData}
                        />
                    </div>

                    {/* Lead Type Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-white/70 mb-1">Lead Type</label>
                            <select
                                name="leadType"
                                value={formData.leadType}
                                onChange={handleChange}
                                className="glass-input w-full appearance-none bg-black"
                            >
                                {leadTypes.map(t => <option key={t} value={t} className="text-white bg-black">{t}</option>)}
                            </select>
                        </div>
                        {formData.leadType === 'B2B' && (
                            <div className="animate-in fade-in slide-in-from-left-2">
                                <label className="block text-xs text-white/70 mb-1">B2B Category</label>
                                <select
                                    name="leadSubType"
                                    value={formData.leadSubType}
                                    onChange={handleChange}
                                    className="glass-input w-full appearance-none bg-black"
                                >
                                    <option value="" className="text-white/50 bg-black">Select...</option>
                                    {b2bSubTypes.map(t => <option key={t} value={t} className="text-white bg-black">{t}</option>)}
                                </select>
                            </div>
                        )}
                        {formData.leadType === 'Collaborator' && (
                            <div className="animate-in fade-in slide-in-from-left-2">
                                <label className="block text-xs text-white/70 mb-1">Collab Type</label>
                                <select
                                    name="leadSubType"
                                    value={formData.leadSubType}
                                    onChange={handleChange}
                                    className="glass-input w-full appearance-none bg-black"
                                >
                                    <option value="" className="text-white/50 bg-black">Select...</option>
                                    {collaboratorSubTypes.map(t => <option key={t} value={t} className="text-white bg-black">{t}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Establishment Name (New) */}
                    <div>
                        <label className="block text-xs text-white/70 mb-1 flex items-center gap-1">
                            <Building2 size={12} /> Establishment / Bar Name
                        </label>
                        <GlassInput
                            name="establishment"
                            placeholder="Ex: The Royal Bar"
                            value={formData.establishment}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-white/70 mb-1">Phone</label>
                        <GlassInput
                            type="tel"
                            name="phone"
                            placeholder="+1234567890"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-white/70 mb-1">Email</label>
                        <GlassInput
                            type="email"
                            name="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Priority & Team Member */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-white/70 mb-1">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="glass-input w-full appearance-none bg-black"
                            >
                                <option value="High" className="text-white bg-black">High</option>
                                <option value="Medium" className="text-white bg-black">Medium</option>
                                <option value="Low" className="text-white bg-black">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-white/70 mb-1 flex justify-between">
                                Assigned To
                                <button type="button" onClick={() => setShowAddTeam(!showAddTeam)} className="text-blue-400 hover:text-blue-300">
                                    <UserPlus size={12} />
                                </button>
                            </label>

                            {showAddTeam ? (
                                <div className="flex gap-1">
                                    <GlassInput
                                        value={newMemberName}
                                        onChange={e => setNewMemberName(e.target.value)}
                                        placeholder="Name"
                                        className="py-1 px-2 text-sm h-10"
                                    />
                                    <GlassButton type="button" onClick={addTeamMember} className="px-2 h-10 bg-blue-600">+</GlassButton>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        name="teamMember"
                                        value={formData.teamMember}
                                        onChange={handleChange}
                                        className="glass-input w-full appearance-none bg-black"
                                    >
                                        {teamMembers.map(m => (
                                            <option key={m} value={m} className="text-white bg-black">{m}</option>
                                        ))}
                                    </select>
                                    <div className="flex flex-wrap gap-2">
                                        {teamMembers.filter(m => m !== 'AD').map(m => (
                                            <span key={m} className="text-xs bg-white/10 px-2 py-1 rounded-full flex items-center gap-1 text-white/70">
                                                {m}
                                                <button type="button" onClick={(e) => deleteTeamMember(m, e)} className="text-white/40 hover:text-red-400">
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Follow-up Channel */}
                    <div className="space-y-3 mb-4">
                        <label className="block text-xs text-white/70">Follow-up Channel</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['Instagram', 'WhatsApp', 'Call', 'Gmail'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, platform: p }))}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${formData.platform === p
                                        ? 'bg-blue-600/20 border-blue-500 text-white'
                                        : 'bg-black/40 border-white/5 text-white/40 hover:bg-white/5'
                                        }`}
                                >
                                    {p === 'Instagram' && <Instagram size={18} />}
                                    {p === 'WhatsApp' && <MessageCircle size={18} />}
                                    {p === 'Call' && <Phone size={18} />}
                                    {p === 'Gmail' && <Mail size={18} />}
                                    <span className="text-[10px] mt-1">{p}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sale Details Section */}
                    <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider">Sale Details</h3>

                        {/* Multi-Select Honey */}
                        <div className="relative">
                            <label className="block text-xs text-brand-white/70 mb-1">Honey Products</label>
                            <button
                                type="button"
                                onClick={() => setShowHoneyDropdown(!showHoneyDropdown)}
                                className="glass-input w-full text-left flex items-center justify-between"
                            >
                                <span className={formData.honeyTypes.length ? "text-white" : "text-white/50"}>
                                    {formData.honeyTypes.length > 0
                                        ? `${formData.honeyTypes.length} Selected`
                                        : "Select Honey Types..."}
                                </span>
                                {showHoneyDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {/* Dropdown Content */}
                            {showHoneyDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-black/95 border border-brand-gold/20 rounded-xl z-20 max-h-48 overflow-y-auto custom-scrollbar shadow-2xl">
                                    <div className="grid grid-cols-1 gap-1">
                                        {honeyOptions.map(h => {
                                            const isSelected = formData.honeyTypes.includes(h);
                                            return (
                                                <button
                                                    key={h}
                                                    type="button"
                                                    onClick={() => toggleHoney(h)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${isSelected
                                                        ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                                                        : 'text-white/60 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-brand-gold bg-brand-gold' : 'border-white/30'}`}>
                                                        {isSelected && <Check size={10} className="text-black font-bold" />}
                                                    </div>
                                                    {h}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Selected Chips */}
                            {formData.honeyTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.honeyTypes.map(h => (
                                        <span key={h} className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2 py-1 rounded-full flex items-center gap-1">
                                            {h}
                                            <button type="button" onClick={() => toggleHoney(h)}>
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-brand-white/70 mb-1 flex justify-between items-center">
                                    Order Value (₹)
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingSale(!isAddingSale)}
                                        className="text-brand-gold hover:text-brand-peach text-xs flex items-center gap-1"
                                    >
                                        {isAddingSale ? <X size={12} /> : <PlusCircle size={12} />}
                                        {isAddingSale ? 'Cancel' : 'Add Sale'}
                                    </button>
                                </label>
                                {isAddingSale ? (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                        <GlassInput
                                            type="number"
                                            placeholder="Amount"
                                            value={addAmount}
                                            onChange={e => setAddAmount(e.target.value)}
                                            className="flex-1"
                                            autoFocus
                                        />
                                        <GlassButton
                                            type="button"
                                            onClick={handleAddSale}
                                            className="bg-green-600/20 text-green-400 hover:bg-green-600/40"
                                            disabled={!addAmount}
                                        >
                                            <Check size={16} />
                                        </GlassButton>
                                    </div>
                                ) : (
                                    <GlassInput
                                        type="number"
                                        name="orderValue"
                                        placeholder="0.00"
                                        value={formData.orderValue || ''}
                                        onChange={handleChange}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-brand-white/70 mb-1">Sale Date</label>
                                <GlassInput
                                    type="date"
                                    name="saleDate"
                                    value={formData.saleDate || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="relative pt-4">
                        <label className="block text-xs text-white/70 mb-1 flex justify-between items-center">
                            Notes
                            <button
                                type="button"
                                onClick={startListening}
                                className={`text-xs flex items-center gap-1 ${isListening ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}
                            >
                                <Mic size={12} /> {isListening ? 'Listening...' : 'Speak'}
                            </button>
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Add notes..."
                            className="glass-input w-full bg-black/50 p-3 h-20 resize-none text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded-xl border border-white/10"
                        />
                    </div>

                    {/* Follow-up Date */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="block text-xs text-brand-white/70 mb-1 flex items-center gap-2">
                            <Calendar size={12} /> Next Follow-up
                        </label>
                        <div className="space-y-2">
                            <GlassInput type="date" name="date" value={formData.date} onChange={handleChange} />
                            <div className="flex gap-2">
                                <select name="hour" value={formData.hour} onChange={handleChange} className="glass-input flex-1 bg-black appearance-none text-center">
                                    {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span className="text-brand-white self-center">:</span>
                                <select name="minute" value={formData.minute} onChange={handleChange} className="glass-input flex-1 bg-black appearance-none text-center">
                                    {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select name="ampm" value={formData.ampm} onChange={handleChange} className="glass-input flex-1 bg-black appearance-none text-center">
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 mt-8 border-t border-white/5">
                        {initialData && (
                            <GlassButton type="button" onClick={handleDeleteLead} className="bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-500/30">
                                Delete
                            </GlassButton>
                        )}
                        <GlassButton type="button" onClick={onClose} variant="secondary" className="flex-1">
                            Cancel
                        </GlassButton>
                        <GlassButton type="submit" className="flex-1 bg-brand-gold/20 hover:bg-brand-gold/40 text-brand-gold border-brand-gold/30 font-bold">
                            Save Lead
                        </GlassButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
