import { useState, useEffect } from 'react';
import { documentationDB, leadsDB } from '../db';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import { FileText, Mic, Image as ImageIcon, Download, Calendar, Trash2, Save, Loader2, X, Edit2, Sparkles, Copy, Check } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

export default function Documentation() {
    const [entries, setEntries] = useState([]);
    const [content, setContent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showOverview, setShowOverview] = useState(false);
    const [weeklySummary, setWeeklySummary] = useState('');

    // Smart Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportText, setReportText] = useState('');
    const [reportCopied, setReportCopied] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const data = await documentationDB.getAll();
            setEntries(data);
        } catch (error) {
            console.error("Failed to load entries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) return;

        try {
            if (editingId) {
                await documentationDB.update(editingId, {
                    content,
                    type: 'text', // Preserve type ideally, but for now text
                    isEdited: true
                });
                setEditingId(null);
            } else {
                await documentationDB.add({
                    content,
                    type: 'text',
                    date: new Date().toISOString()
                });
            }
            setContent('');
            loadEntries();
        } catch (error) {
            console.error("Failed to save entry:", error);
            alert("Failed to save entry.");
        }
    };

    const handleEdit = (entry) => {
        setContent(entry.content);
        setEditingId(entry.id);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setContent('');
        setEditingId(null);
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this entry?")) {
            await documentationDB.delete(id);
            if (editingId === id) handleCancelEdit();
            loadEntries();
        }
    };

    // Paste Image Handler
    const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    await uploadAndInsertImage(file);
                }
            }
        }
    };

    const uploadAndInsertImage = async (file) => {
        setUploading(true);
        try {
            const userId = auth.currentUser.uid;
            const storageRef = ref(storage, `users/${userId}/documentation/${Date.now()}_clipboard.png`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Insert markdown image syntax
            // If editing a text entry, we append the image link. 
            // If it was empty, it becomes an image entry effectively but we store as text with MD link for flexibility.
            setContent(prev => prev + `\n![Image](${downloadURL})\n`);
        } catch (error) {
            console.error("Upload failed details:", error);
            console.error("Storage Config:", storage.app.options.storageBucket);
            alert(`Failed to upload: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Speech to Text
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setContent(prev => (prev ? prev + ' ' : '') + transcript);
        };
        recognition.onerror = (event) => {
            console.error("Speech error", event);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert("Microphone access blocked. Please allow microphone permission in your browser settings.");
            } else if (event.error === 'no-speech') {
                alert("No speech detected. Please try again.");
            } else {
                alert(`Speech recognition error: ${event.error}`);
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Recognition start error:", e);
        }
    };

    // File Upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await uploadAndInsertImage(file);
    };

    // Export Markdown
    const handleExport = () => {
        let mdContent = `# Nectar of the Gods - Documentation Export\nGenerated on ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;

        entries.forEach(entry => {
            const dateStr = format(entry.createdAt?.toDate() || new Date(entry.date), 'yyyy-MM-dd HH:mm');
            mdContent += `## ${dateStr}\n`;
            if (entry.type === 'image') {
                mdContent += `![${entry.content}](${entry.url})\n\n`;
            } else if (entry.type === 'video') {
                mdContent += `[Video: ${entry.content}](${entry.url})\n\n`;
            } else {
                mdContent += `${entry.content}\n\n`;
            }
            mdContent += `---\n\n`;
        });

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `documentation_${format(new Date(), 'yyyy-MM-dd')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Weekly Overview (Legacy - kept for backward compat if needed, but Smart Report supersedes)
    const generateWeeklyOverview = () => {
        const weekAgo = subDays(new Date(), 7);
        const weeklyEntries = entries.filter(e => {
            const d = e.createdAt?.toDate() || new Date(e.date);
            return d >= weekAgo;
        });

        let summary = `Weekly Overview (${format(weekAgo, 'MMM d')} - ${format(new Date(), 'MMM d')})\n\n`;
        summary += `Total Entries: ${weeklyEntries.length}\n`;

        // Group by day
        const byDay = {};
        weeklyEntries.forEach(e => {
            const d = format(e.createdAt?.toDate() || new Date(e.date), 'yyyy-MM-dd');
            if (!byDay[d]) byDay[d] = 0;
            byDay[d]++;
        });

        Object.keys(byDay).sort().forEach(d => {
            summary += `- ${d}: ${byDay[d]} entries\n`;
        });

        setWeeklySummary(summary);
        setShowOverview(true);
    };

    // --- Smart Report Generator ---
    const generateSmartReport = async () => {
        setLoading(true);
        try {
            const weekAgo = subDays(new Date(), 7);
            const now = new Date();

            // 1. Fetch recent Leads (for "Worked on")
            const allLeads = await leadsDB.getAll();
            const recentLeads = allLeads.filter(l => {
                const updated = l.updatedAt?.toDate ? l.updatedAt.toDate() : new Date(l.updatedAt || 0); // Handle various date formats
                const created = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt || 0);
                return updated >= weekAgo || created >= weekAgo;
            });

            // 2. Fetch recent Sales (for "Wins")
            const recentSales = allLeads.filter(l => {
                // Assuming sale happens if orderValue > 0 and recently updated
                const val = parseFloat(l.orderValue) || 0;
                if (val <= 0) return false;
                const date = l.saleDate ? new Date(l.saleDate) : null;
                return date && date >= weekAgo;
            });

            // 3. Fetch Focus Areas (High Priority)
            const focusLeads = allLeads.filter(l => l.priority === 'High' && l.status !== 'Closed');

            // --- Construct Email Format ---
            let report = `Weekly Report (${format(weekAgo, 'MMM d')} - ${format(now, 'MMM d')})\n`;
            report += `By 6 PM every Friday\n\n`;

            report += `• What you worked on (tasks/projects)\n`;
            if (recentLeads.length === 0) report += `  - No specific leads updated this week.\n`;
            recentLeads.slice(0, 10).forEach(l => {
                report += `  - ${l.name} (${l.status}) - ${l.establishment || 'No Est.'}\n`;
            });
            if (recentLeads.length > 10) report += `  - ...and ${recentLeads.length - 10} more.\n`;
            report += `\n`;

            report += `• Current focus areas\n`;
            if (focusLeads.length === 0) report += `  - Prospecting new leads.\n`;
            focusLeads.slice(0, 5).forEach(l => {
                report += `  - Closing ${l.name} (${l.establishment || 'No Est.'})\n`;
            });
            report += `\n`;

            report += `• Any roadblocks\n`;
            report += `  - [Fill in manual roadblocks here]\n`; // Placeholder for user
            report += `\n`;

            report += `• Key learnings or wins\n`;
            if (recentSales.length > 0) {
                const totalValue = recentSales.reduce((sum, s) => sum + (parseFloat(s.orderValue) || 0), 0);
                report += `  - Closed ${recentSales.length} sales totaling ₹${totalValue.toLocaleString()}.\n`;
                recentSales.forEach(s => {
                    report += `  - Sold to ${s.name}: ₹${s.orderValue}\n`;
                });
            } else {
                report += `  - Focused on pipeline building.\n`;
            }

            setReportText(report);
            setShowReportModal(true);
        } catch (error) {
            console.error("Report Gen Error:", error);
            alert("Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    const copyReport = () => {
        navigator.clipboard.writeText(reportText);
        setReportCopied(true);
        setTimeout(() => setReportCopied(false), 2000);
    };

    return (
        <div className="pb-24 pt-4 space-y-6">
            <div className="flex justify-between items-center px-2">
                <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-white">Documentation</h1>
                <div className="flex gap-2">
                    <GlassButton onClick={generateSmartReport} className="text-xs bg-brand-gold/10 text-brand-gold border-brand-gold/20" title="Smart Weekly Report">
                        <Sparkles size={16} className="mr-1" /> Report
                    </GlassButton>
                    <GlassButton onClick={handleExport} className="text-xs" title="Export Markdown">
                        <Download size={16} />
                    </GlassButton>
                </div>
            </div>

            {/* Input Area */}
            <GlassCard className={`p-4 space-y-4 border-brand-gold/20 ${editingId ? 'ring-2 ring-brand-gold/50' : ''}`}>
                {editingId && (
                    <div className="flex justify-between items-center text-xs text-brand-gold mb-2">
                        <span className="font-bold flex items-center gap-1"><Edit2 size={12} /> Editing Entry</span>
                        <button onClick={handleCancelEdit} className="hover:underline">Cancel</button>
                    </div>
                )}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Log your work... (Paste images directly!)"
                    className="w-full h-32 bg-transparent text-brand-dark dark:text-brand-white placeholder-brand-dark/30 dark:placeholder-brand-white/30 resize-none focus:outline-none"
                />
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={startListening}
                            className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-brand-dark/5 dark:bg-brand-white/5 text-brand-dark/60 dark:text-brand-white/60 hover:text-brand-blue'}`}
                            title="Speech to Text"
                        >
                            <Mic size={20} />
                        </button>
                        <button
                            onClick={() => document.getElementById('doc-upload').click()}
                            className="p-2 rounded-full bg-brand-dark/5 dark:bg-brand-white/5 text-brand-dark/60 dark:text-brand-white/60 hover:text-brand-peach transition-all"
                            title="Upload Media"
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                        </button>
                        <input
                            type="file"
                            id="doc-upload"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,video/*"
                        />
                    </div>
                    <GlassButton onClick={handleSave} disabled={!content.trim()} className="px-6 bg-brand-gold/20 text-brand-gold hover:bg-brand-gold hover:text-brand-dark">
                        <Save size={16} className="mr-2" /> {editingId ? 'Update' : 'Log'}
                    </GlassButton>
                </div>
            </GlassCard>

            {/* Entries Timeline */}
            <div className="relative space-y-8 pl-4">
                {/* Timeline Line */}
                <div className="absolute left-[27px] top-6 bottom-0 w-0.5 bg-brand-gold/20"></div>

                {entries.map((entry, index) => (
                    <div key={entry.id} className="relative group">
                        {/* Timeline Dot */}
                        <div className="absolute left-[19px] top-6 w-4 h-4 rounded-full bg-brand-dark dark:bg-brand-white border-4 border-brand-gold z-10"></div>

                        <div className="pl-12">
                            {/* Date Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
                                    {format(entry.createdAt?.toDate() || new Date(entry.date), 'MMM d, yyyy')}
                                </span>
                                <span className="text-[10px] text-brand-dark/40 dark:text-brand-white/40">
                                    {format(entry.createdAt?.toDate() || new Date(entry.date), 'h:mm a')}
                                </span>
                            </div>

                            {/* Content Card */}
                            <GlassCard className="p-5 relative hover:border-brand-gold/30 transition-all border-brand-dark/5 dark:border-brand-white/5 bg-brand-white/50 dark:bg-black/20">
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(entry)}
                                        className="p-1.5 text-brand-dark/40 dark:text-brand-white/40 hover:text-brand-gold transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="p-1.5 text-brand-dark/40 dark:text-brand-white/40 hover:text-brand-gold transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {entry.type === 'image' ? (
                                    <div className="space-y-3">
                                        <img src={entry.url} alt="Entry" className="max-h-80 rounded-lg border-2 border-brand-gold/10 shadow-sm" />
                                        {entry.content && <p className="text-sm text-brand-dark/80 dark:text-brand-white/80 italic">"{entry.content}"</p>}
                                    </div>
                                ) : (
                                    <div className="text-brand-dark/90 dark:text-brand-white/90 whitespace-pre-wrap leading-relaxed text-sm">
                                        {entry.content.split(/(!\[.*?\]\(.*?\))/g).map((part, i) => {
                                            const imgMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
                                            if (imgMatch) {
                                                return <img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="max-h-80 rounded-lg border-2 border-brand-gold/10 my-3 shadow-sm" />;
                                            }
                                            return part;
                                        })}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>
                ))}

                {entries.length === 0 && !loading && (
                    <div className="text-center py-20 pl-8">
                        <div className="inline-flex p-4 rounded-full bg-brand-gold/10 text-brand-gold mb-4">
                            <Sparkles size={32} />
                        </div>
                        <p className="text-brand-dark/40 dark:text-brand-white/40 font-script text-xl">
                            The journey begins today...
                        </p>
                    </div>
                )}
            </div>

            {/* Smart Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-lg p-6 relative flex flex-col max-h-[85vh] bg-brand-dark border-brand-gold/20">
                        <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-brand-white/60 hover:text-brand-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-brand-white mb-1 flex items-center gap-2">
                            <Sparkles size={20} className="text-brand-gold" /> AI Report Generator
                        </h2>
                        <p className="text-xs text-brand-white/50 mb-4">Formatted for email to Anu, Ankita, and Sharjeel.</p>

                        <div className="flex-1 overflow-auto bg-black/50 p-4 rounded-lg border border-white/5 mb-4">
                            <pre className="whitespace-pre-wrap text-brand-white/80 font-mono text-sm">
                                {reportText}
                            </pre>
                        </div>

                        <div className="flex gap-2">
                            <GlassButton onClick={copyReport} className="flex-1 bg-brand-gold/20 text-brand-gold hover:bg-brand-gold hover:text-brand-dark">
                                {reportCopied ? <><Check size={18} className="mr-2" /> Copied!</> : <><Copy size={18} className="mr-2" /> Copy to Clipboard</>}
                            </GlassButton>
                            <GlassButton onClick={() => setShowReportModal(false)} variant="secondary">Close</GlassButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
