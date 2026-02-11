import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { leadsDB } from '../db';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import AddLeadForm from '../components/AddLeadForm';
import { Search, Plus, Filter, Phone, MoreHorizontal, Instagram, Mail, MessageCircle, FileDown, FileUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await leadsDB.getAll();
            setLeads(data);
        } catch (error) {
            console.error("Failed to load leads:", error);
            alert("Failed to load leads. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setShowAddForm(true);
    };

    const handleAdd = () => {
        setEditingLead(null);
        setShowAddForm(true);
    };

    const handleCloseForm = () => {
        setShowAddForm(false);
        setEditingLead(null);
        loadLeads(); // Refresh data after adding/editing
    };

    const exportCSV = () => {
        if (!leads || leads.length === 0) return alert("No leads to export.");

        const headers = ["Name", "Phone", "Email", "Status", "Priority", "Assigned To", "Notes", "Next Follow Up"];
        const rows = leads.map(l => [
            l.name,
            l.phone,
            l.email || '',
            l.status,
            l.priority,
            l.teamMember,
            l.notes || '',
            l.nextFollowUp
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `moonshine_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split("\n").slice(1); // Skip header

                let count = 0;
                for (const row of rows) {
                    const cols = row.split(",").map(c => c.replace(/^"|"$/g, '').trim());
                    if (cols.length < 2) continue;

                    const [name, phone, email, status, priority, teamMember, notes, nextFollowUp] = cols;

                    if (name) {
                        await leadsDB.add({
                            name,
                            phone: phone || '',
                            email: email || '',
                            status: status || 'New',
                            priority: priority || 'Medium',
                            teamMember: teamMember || 'Me',
                            notes: notes || '',
                            nextFollowUp: nextFollowUp || new Date().toISOString(),
                            platform: 'Call'
                        });
                        count++;
                    }
                }
                alert(`Imported ${count} leads successfully!`);
                loadLeads(); // Refresh after import
            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to import leads. Check CSV format.");
            }
        };
        reader.readAsText(file);
    };

    // Filter leads in memory
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm);
        const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    }).sort((a, b) => new Date(b.nextFollowUp) - new Date(a.nextFollowUp));

    if (loading) {
        return (
            <div className="p-8 text-center text-white/50">
                <div className="animate-pulse">Loading leads...</div>
            </div>
        );
    }

    return (
        <div className="pb-24 pt-4 space-y-4">
            {/* Search & Filter Header */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                    <GlassInput
                        placeholder="Search leads..."
                        className="pl-10 text-center"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <GlassButton onClick={exportCSV} className="w-10 px-0 bg-green-600/20 hover:bg-green-600" title="Export CSV">
                    <FileDown size={18} />
                </GlassButton>
                <label className="cursor-pointer">
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-white/10 text-white transition-all">
                        <FileUp size={18} />
                    </div>
                </label>
                <GlassButton
                    className="w-10 px-0"
                    variant={priorityFilter === 'All' ? 'secondary' : 'primary'}
                    onClick={() => setPriorityFilter(f => f === 'All' ? 'High' : f === 'High' ? 'Medium' : 'All')}
                    title={`Filter: ${priorityFilter}`}
                >
                    <Filter size={18} />
                </GlassButton>
            </div>

            {/* Leads List */}
            <div className="space-y-3">
                {filteredLeads.length === 0 ? (
                    <div className="text-center py-10 text-white/40">
                        <p>No leads found.</p>
                        <p className="text-xs mt-1">Tap + to add one.</p>
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <GlassCard key={lead.id} onClick={() => handleEdit(lead)} className="active:scale-[0.99] cursor-pointer hover:bg-white/10 group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className={`w-1 self-stretch rounded-full ${lead.priority === 'High' ? 'bg-red-400' :
                                        lead.priority === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'
                                        }`} />
                                    <div>
                                        <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                                            {lead.name}
                                            <span className="text-white/40">
                                                {lead.platform === 'Instagram' && <Instagram size={14} />}
                                                {lead.platform === 'WhatsApp' && <MessageCircle size={14} />}
                                                {lead.platform === 'Gmail' && <Mail size={14} />}
                                                {(lead.platform === 'Call' || !lead.platform) && <Phone size={14} />}
                                            </span>
                                        </h3>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <p className="text-white/60 text-sm flex items-center gap-1">
                                                <Phone size={12} /> {lead.phone}
                                            </p>
                                            {lead.teamMember && lead.teamMember !== 'Me' && (
                                                <p className="text-white/50 text-xs">
                                                    Assigned to: <span className="text-blue-300">{lead.teamMember}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/5">
                                                {lead.status}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                                                Due: {format(parseISO(lead.nextFollowUp), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button className="text-white/40 p-2 hover:text-white">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className="fixed right-6 bottom-32 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 flex items-center justify-center z-40 border border-white/20 backdrop-blur-md"
            >
                <Plus size={28} />
            </motion.button>

            {/* Add Lead Modal */}
            {showAddForm && (
                <AddLeadForm
                    onClose={handleCloseForm}
                    initialData={editingLead}
                />
            )}
        </div>
    );
}
