import { useState, useEffect, useRef } from 'react';
import GlassInput from './ui/GlassInput';
import GlassButton from './ui/GlassButton';
import { db, accountsDB } from '../db';
import { X, Calendar, UserPlus, Mic, Instagram, Phone, Mail, MessageCircle, User, Check, Building2, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

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

    // --- Account Dropdown ---
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            const data = await accountsDB.getAll();
            setAccounts(data);
        };
        fetchAccounts();
    }, []);

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
        accountId: '',
        name: '',
        phone: '',
        email: '',
        teamMember: 'AD',
        platform: 'Call',
        notes: '',
        honeyTypes: [],
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

    const startListening = async () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Voice input not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error("Microphone permission denied:", err);
            alert("Microphone permission is required for speech-to-text. Please allow it in your browser settings.");
            return;
        }

        let recognition;
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
        } catch (e) {
            console.error("SpeechRecognition error:", e);
            alert("Voice input is not supported in this browser version. Please update or use Chrome.");
            return;
        }

        // PWA specific settings
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onstart = () => {
            console.log("Speech recognition started");
            setIsListening(true);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert("Microphone permission denied. Please allow it in your device settings.");
            } else if (event.error === 'network') {
                alert("Network error occurred during speech recognition. Check your connection.");
            } else if (event.error === 'no-speech') {
                // Ignore no-speech on mobile to avoid annoying popups when taking a breath
                console.log("No speech detected");
            } else {
                alert(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            console.log("Speech recognition ended naturally or stopped by user");
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // If we have final results, append them to the existing notes correctly
            if (finalTranscript) {
                setFormData(prev => ({
                    ...prev,
                    notes: (prev.notes ? prev.notes.trim() + ' ' : '') + finalTranscript.trim()
                }));
                finalTranscript = ''; // Reset after applying to prevent duplication
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start recognition:", e);
            setIsListening(false);
        }
    };

    useEffect(() => {
        if (initialData) {
            let initialDateStr = '';
            let initialHour = '10';
            let initialMinute = '00';
            let initialAmPm = 'AM';

            if (initialData.nextFollowUp) {
                const d = new Date(initialData.nextFollowUp);
                initialDateStr = format(d, 'yyyy-MM-dd');
                initialHour = format(d, 'hh');
                initialMinute = format(d, 'mm');
                initialAmPm = format(d, 'a');
            }

            setFormData(prev => {
                const merged = { ...prev, ...initialData };
                return {
                    ...merged,
                    accountId: initialData.accountId || prev.accountId,
                    honeyTypes: initialData.honeyTypes || (initialData.honeyType ? [initialData.honeyType] : prev.honeyTypes),
                    notes: initialData.notes || prev.notes,
                    date: initialDateStr,
                    hour: initialHour,
                    minute: initialMinute,
                    ampm: initialAmPm,
                    platform: initialData.platform || prev.platform || 'Instagram'
                };
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Multi-select toggle function
    const toggleHoney = (honeyType) => {
        setFormData(prev => {
            const currentTypes = prev.honeyTypes || [];
            if (currentTypes.includes(honeyType)) {
                return { ...prev, honeyTypes: currentTypes.filter(h => h !== honeyType) };
            } else {
                return { ...prev, honeyTypes: [...currentTypes, honeyType] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let followUpIsoString = null;

        if (formData.date) {
            let hour24 = parseInt(formData.hour || 10);
            if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
            if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;

            const followUpDate = new Date(formData.date);
            followUpDate.setHours(hour24, parseInt(formData.minute || 0));
            followUpIsoString = followUpDate.toISOString();
        }

        const payload = {
            accountId: formData.accountId,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || '',
            teamMember: formData.teamMember,
            platform: formData.platform,
            notes: formData.notes,
            honeyTypes: formData.honeyTypes,
            orderValue: formData.orderValue,
            saleDate: formData.saleDate,
            nextFollowUp: followUpIsoString
        };

        try {
            if (!payload.accountId) {
                alert("Please select an Account/Business to link to.");
                return;
            }

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
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] animate-in fade-in"
            />

            {/* Panel - CENTERED on Desktop, Full-screen on Mobile */}
            <div className={`
                fixed z-[101]
                /* Desktop: Centered Modal */
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:w-[600px] md:max-w-[90vw] md:h-auto md:max-h-[85vh]
                md:rounded-2xl md:border md:border-gray-700
                
                /* Mobile: Full Screen with Bottom Nav Safe Area */
                top-0 left-0 w-full h-[100dvh]
                
                /* Layout */
                flex flex-col
                bg-gray-900 shadow-2xl overflow-hidden
                
                /* Animation */
                animate-in md:zoom-in-95 fade-in
                slide-in-from-bottom-8 md:slide-in-from-bottom-0
                duration-300
            `}>

                {/* Header - Sticky */}
                <div className="
                    flex-shrink-0 sticky top-0 z-10
                    bg-gray-900/95 backdrop-blur-md
                    border-b border-gray-800
                    px-6 pt-12 md:pt-4 pb-4
                    flex items-center justify-between
                ">
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        {initialData ? 'Edit Contact' : 'New Contact'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            w-8 h-8 rounded-lg
                            bg-gray-800 hover:bg-gray-700
                            text-white/60 hover:text-white
                            flex items-center justify-center
                            transition-colors border border-gray-700
                        "
                    >
                        ✕
                    </button>
                </div>

                {/* Form Wrapper */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    {/* Scrollable Form Body Container */}
                    <div
                        className="flex-1 overflow-y-auto w-full p-5 md:p-6 space-y-6 custom-scrollbar"
                        style={{
                            // Pad the bottom natively on mobile forcing the scroll to clear the sticky buttons
                            paddingBottom: window.innerWidth < 768 ? 'calc(100px + env(safe-area-inset-bottom))' : '1.5rem'
                        }}
                    >
                        {/* Name & Contact Picker */}
                        <div className="space-y-1.5">
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

                        {/* Account Selection Dropdown */}
                        <div className="relative">
                            <label className="block text-xs text-white/70 mb-1 flex items-center gap-1">
                                <Building2 size={12} /> Account / Business *
                            </label>
                            <select
                                required
                                name="accountId"
                                value={formData.accountId || ''}
                                onChange={handleChange}
                                className="glass-input w-full appearance-none bg-black text-white"
                                disabled={!!initialData?.accountId} // Prevent moving between accounts lightly
                            >
                                <option value="" disabled className="text-white/50 bg-black">Select an Account...</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id} className="text-white bg-black">{a.businessName}</option>
                                ))}
                            </select>
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

                        {/* Assigned To Row */}
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
                                    className={`text-xs flex items-center gap-1 transition-all p-1 rounded-md ${isListening ? 'text-red-400 bg-red-400/10 shadow-[0_0_10px_rgba(248,113,113,0.5)] animate-pulse' : 'text-blue-400 hover:bg-blue-400/10'}`}
                                >
                                    <Mic size={12} className={isListening ? "animate-bounce" : ""} />
                                    {isListening ? 'Stop Listening' : 'Speak'}
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
                            <label className="block text-xs text-brand-white/70 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Calendar size={12} /> Next Follow-up</span>
                                {formData.date && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, date: '', hour: '', minute: '', ampm: '' }))}
                                        className="text-white/40 hover:text-red-400 flex items-center gap-1 text-[10px]"
                                    >
                                        <X size={10} /> Clear Follow-up
                                    </button>
                                )}
                            </label>
                            {formData.date ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
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
                            ) : (
                                <div className="flex justify-center p-3 border border-white/10 rounded-xl bg-black/20 text-white/40 text-sm">
                                    No follow-up needed
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixed Footer with Contextual Nav Clearance */}
                    <div
                        className="
                            flex-shrink-0 z-20
                            bg-gray-900/95 backdrop-blur-md
                            border-t border-gray-800
                            p-4 md:p-6 pb-[env(safe-area-inset-bottom)]
                            flex gap-3 items-center justify-end
                        "
                        style={{
                            paddingBottom: window.innerWidth < 768 ? 'calc(5rem + env(safe-area-inset-bottom))' : undefined
                        }}
                    >
                        {initialData && (
                            <button
                                type="button"
                                onClick={handleDeleteLead}
                                className="
                                    px-5 py-2.5 rounded-xl
                                    bg-red-500/10 hover:bg-red-500/20
                                    text-red-400 border border-red-500/20
                                    transition-colors font-semibold text-sm mr-auto
                                "
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className={`
                                px-6 py-2.5 rounded-xl
                                bg-gray-800 hover:bg-gray-700
                                text-white border border-gray-600
                                transition-colors font-semibold text-sm
                                ${!initialData ? 'flex-1 md:flex-none' : ''}
                            `}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`
                                px-8 py-2.5 rounded-xl
                                bg-gold-500 hover:bg-gold-600
                                text-gray-950 font-bold text-sm
                                shadow-[0_0_15px_rgba(234,179,8,0.2)]
                                transition-all
                                ${!initialData ? 'flex-1 md:flex-none w-full md:w-auto' : ''}
                            `}
                        >
                            Save Lead
                        </button>
                    </div>
                </form>
            </div >
        </>
    );
}
