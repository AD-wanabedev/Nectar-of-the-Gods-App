import { useState, useEffect } from 'react';
import GlassInput from './ui/GlassInput';
import GlassButton from './ui/GlassButton';
import { db } from '../db';
import { X, Calendar, UserPlus, Mic, Instagram, Phone, Mail, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';

export default function AddLeadForm({ onClose, initialData = null }) {
    // --- Team Member Logic ---
    const [teamMembers, setTeamMembers] = useState(() => {
        const stored = localStorage.getItem('moonshine_team');
        return stored ? JSON.parse(stored) : ['AD', 'Rohan', 'Akshay'];
    });
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');

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
        teamMember: 'AD',
        platform: 'Call',
        notes: '',
        honeyType: '',
        orderValue: '',
        saleDate: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hour: '10',
        minute: '00',
        ampm: 'AM'
    });

    // --- Contact Picker ---
    const pickContact = async () => {
        try {
            if (!('contacts' in navigator && 'ContactsManager' in window)) {
                // Fallback or better error handling
                // Is this logic correct? navigator.contacts is the API.
            }
            // Actually, just check navigator.contacts
            if (!navigator.contacts || !navigator.contacts.select) {
                alert("Contact picker not supported on this device/browser");
                return;
            }

            const props = ['name', 'tel', 'email'];
            const contacts = await navigator.contacts.select(props, { multiple: false });

            if (contacts && contacts.length > 0) {
                const contact = contacts[0];
                setFormData(prev => ({
                    ...prev,
                    name: contact.name?.[0] || '',
                    phone: contact.tel?.[0] || '',
                    email: contact.email?.[0] || prev.email
                }));
            }
        } catch (error) {
            console.error("Contact picker error:", error);
            // Ignore abort error
        }
    };

    // --- Speech to Text ---
    const [isListening, setIsListening] = useState(false);

    const startListening = () => {
        // Check for API support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported on this device/browser. Please use Chrome or Edge.");
            return;
        }

        // Request microphone permission explicitly on mobile
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    startRecognition();
                })
                .catch((error) => {
                    console.error("Microphone permission denied:", error);
                    alert("Please allow microphone access to use voice input. Check your browser settings.");
                });
        } else {
            // Fallback for older browsers
            startRecognition();
        }
    };

    const startRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log("Speech recognition started");
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Transcript:", transcript);
            setFormData(prev => ({
                ...prev,
                notes: (prev.notes ? prev.notes + ' ' : '') + transcript
            }));
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);

            if (event.error === 'not-allowed') {
                alert("Microphone access denied. Go to your browser Settings → Site Settings → Microphone and allow access for this site.");
            } else if (event.error === 'no-speech') {
                alert("No speech detected. Please try again and speak clearly.");
            } else if (event.error === 'aborted') {
                // User cancelled, don't show error
            } else {
                alert(`Speech recognition error: ${event.error}. Make sure you're using HTTPS and Chrome/Edge browser.`);
            }

            setIsListening(false);
        };

        recognition.onend = () => {
            console.log("Speech recognition ended");
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (error) {
            console.error("Failed to start recognition:", error);
            alert("Failed to start voice input. Please try again.");
            setIsListening(false);
        }
    };

    useEffect(() => {
        if (initialData) {
            const d = new Date(initialData.nextFollowUp);
            setFormData({
                ...initialData,
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
            teamMember: formData.teamMember,
            platform: formData.platform,
            notes: formData.notes,
            honeyType: formData.honeyType,
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="glass-card w-full max-w-md max-h-[85vh] overflow-y-auto p-6 pb-20 relative bg-gray-900 border-blue-500/20 shadow-blue-900/20">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white z-10">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">
                    {initialData ? 'Edit Lead' : 'New Lead'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                    <div>
                        <label className="block text-xs text-white/70 mb-1">Phone *</label>
                        <GlassInput
                            required
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

                    <div className="relative">
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

                    <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider">Sale Details</h3>

                        <div>
                            <label className="block text-xs text-brand-white/70 mb-1">Honey Product</label>
                            <select
                                name="honeyType"
                                value={formData.honeyType || ''}
                                onChange={handleChange}
                                className="glass-input w-full appearance-none bg-black"
                            >
                                <option value="" className="bg-black text-white/50">Select Honey Type...</option>
                                {[
                                    "Acacia Honey", "Mustard Honey", "Multifloral Honey", "Sidr Honey",
                                    "Smoked Honey", "Gondhoraj Honey", "Jeera Masala Honey", "Chilly Honey",
                                    "Forest Honey", "Sundarban Honey", "Tribal Honey", "Ajwain Honey",
                                    "Niger Honey", "Dark - phondaghat Honey", "Natural (MFH) Kejriwal Honey",
                                    "Network Honey"
                                ].map(h => (
                                    <option key={h} value={h} className="bg-black text-white">{h}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-brand-white/70 mb-1">Order Value (₹)</label>
                                <GlassInput
                                    type="number"
                                    name="orderValue"
                                    placeholder="0.00"
                                    value={formData.orderValue || ''}
                                    onChange={handleChange}
                                />
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

                    <div className="pt-4 pb-6 flex gap-3 sticky bottom-0 bg-gray-900/95 backdrop-blur-sm -mx-6 px-6 mt-6">
                        {initialData && (
                            <GlassButton type="button" onClick={handleDeleteLead} className="bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-500/30">
                                Delete
                            </GlassButton>
                        )}
                        <GlassButton type="button" onClick={onClose} variant="secondary" className="flex-1">
                            Cancel
                        </GlassButton>
                        <GlassButton type="submit" className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-100 border-blue-500/30">
                            Save Lead
                        </GlassButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
