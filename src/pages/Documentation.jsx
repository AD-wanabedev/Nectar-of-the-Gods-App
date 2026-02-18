import { useState, useEffect } from 'react';
import { documentationDB } from '../db';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import { FileText, Mic, Image as ImageIcon, Download, Calendar, Trash2, Save, Loader2 } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

export default function Documentation() {
    const [entries, setEntries] = useState([]);
    const [content, setContent] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showOverview, setShowOverview] = useState(false);
    const [weeklySummary, setWeeklySummary] = useState('');

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
            await documentationDB.add({
                content,
                type: 'text',
                date: new Date().toISOString()
            });
            setContent('');
            loadEntries();
        } catch (error) {
            console.error("Failed to save entry:", error);
            alert("Failed to save entry.");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this entry?")) {
            await documentationDB.delete(id);
            loadEntries();
        }
    };

    // Speech to Text
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
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
        };

        recognition.start();
    };

    // File Upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const userId = auth.currentUser.uid;
            const storageRef = ref(storage, `users/${userId}/documentation/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await documentationDB.add({
                content: file.name,
                url: downloadURL,
                type: file.type.startsWith('image/') ? 'image' : 'video',
                date: new Date().toISOString()
            });
            loadEntries();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
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

    // Weekly Overview
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

    return (
        <div className="pb-24 pt-4 space-y-6">
            <div className="flex justify-between items-center px-2">
                <h1 className="text-2xl font-bold text-brand-white">Documentation</h1>
                <div className="flex gap-2">
                    <GlassButton onClick={generateWeeklyOverview} className="text-xs" title="Weekly Overview">
                        <Calendar size={16} />
                    </GlassButton>
                    <GlassButton onClick={handleExport} className="text-xs" title="Export Markdown">
                        <Download size={16} />
                    </GlassButton>
                </div>
            </div>

            {/* Input Area */}
            <GlassCard className="p-4 space-y-4 border-brand-gold/20">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Log your work..."
                    className="w-full h-32 bg-transparent text-brand-white placeholder-brand-white/30 resize-none focus:outline-none"
                />
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={startListening}
                            className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-brand-white/5 text-brand-white/60 hover:text-brand-blue'}`}
                            title="Speech to Text"
                        >
                            <Mic size={20} />
                        </button>
                        <button
                            onClick={() => document.getElementById('doc-upload').click()}
                            className="p-2 rounded-full bg-brand-white/5 text-brand-white/60 hover:text-brand-peach transition-all"
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
                        <Save size={16} className="mr-2" /> Log
                    </GlassButton>
                </div>
            </GlassCard>

            {/* Entries List */}
            <div className="space-y-4">
                {entries.map(entry => (
                    <div key={entry.id} className="relative group">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-brand-white/10"></div>
                        <div className="pl-10 relative">
                            <div className="absolute left-[11px] top-1 w-2.5 h-2.5 rounded-full bg-brand-gold border-2 border-brand-dark z-10"></div>

                            <p className="text-xs text-brand-white/40 mb-1 font-mono">
                                {format(entry.createdAt?.toDate() || new Date(entry.date), 'h:mm a · MMM d')}
                            </p>

                            <GlassCard className="p-4 hover:border-brand-white/20 transition-colors group">
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="absolute top-2 right-2 text-brand-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>

                                {entry.type === 'text' && (
                                    <p className="text-brand-white/90 whitespace-pre-wrap">{entry.content}</p>
                                )}
                                {entry.type === 'image' && (
                                    <div className="space-y-2">
                                        <img src={entry.url} alt="Entry" className="max-h-60 rounded-lg border border-brand-white/10" />
                                        <p className="text-xs text-brand-white/50">{entry.content}</p>
                                    </div>
                                )}
                                {entry.type === 'video' && (
                                    <div className="space-y-2">
                                        <video src={entry.url} controls className="max-h-60 rounded-lg border border-brand-white/10" />
                                        <p className="text-xs text-brand-white/50">{entry.content}</p>
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>
                ))}
                {entries.length === 0 && !loading && (
                    <div className="text-center py-10 text-brand-white/30">
                        Start your documentation journey.
                    </div>
                )}
            </div>

            {/* Weekly Overview Modal */}
            {showOverview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-md p-6 relative flex flex-col max-h-[80vh]">
                        <button onClick={() => setShowOverview(false)} className="absolute top-4 right-4 text-brand-white/60 hover:text-brand-white">
                            <Trash2 size={24} className="rotate-45" /> {/* Using Trash2 as close icon temporarily or just use explicit X */}
                        </button>
                        <h2 className="text-xl font-bold text-brand-white mb-4">Weekly Snapshot</h2>
                        <pre className="flex-1 overflow-auto whitespace-pre-wrap text-brand-white/80 font-mono text-sm bg-black/50 p-4 rounded-lg">
                            {weeklySummary}
                        </pre>
                        <GlassButton onClick={() => setShowOverview(false)} className="mt-4">Close</GlassButton>
                    </div>
                </div>
            )}
        </div>
    );
}
