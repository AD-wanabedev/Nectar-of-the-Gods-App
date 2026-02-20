import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { leadsDB } from '../db';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import AddLeadForm from '../components/AddLeadForm';
import { Search, Plus, Filter, Phone, MoreHorizontal, Instagram, Mail, MessageCircle, FileDown, FileUp, Building2 } from 'lucide-react';
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
                const promises = [];
                const BATCH_SIZE = 20;

                for (const row of rows) {
                    const cols = row.split(",").map(c => c.replace(/^"|"$/g, '').trim());
                    if (cols.length < 2) continue;

                    const [name, phone, email, status, priority, teamMember, notes, nextFollowUp] = cols;

                    if (name) {
                        promises.push(leadsDB.add({
                            name,
                            phone: phone || '',
                            email: email || '',
                            status: status || 'New',
                            priority: priority || 'Medium',
                            teamMember: teamMember || 'Me',
                            notes: notes || '',
                            nextFollowUp: nextFollowUp || new Date().toISOString(),
                            platform: 'Call',
                            leadType: 'B2C', // Default for import
                            createdAt: new Date().toISOString()
                        }));
                        count++;
                    }
                }

                // Execute in batches
                for (let i = 0; i < promises.length; i += BATCH_SIZE) {
                    const batch = promises.slice(i, i + BATCH_SIZE);
                    await Promise.all(batch);
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
        const term = searchTerm.toLowerCase();
        const matchesSearch = lead.name.toLowerCase().includes(term) ||
            (lead.phone && lead.phone.includes(term)) ||
            (lead.establishment && lead.establishment.toLowerCase().includes(term));
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/50 dark:text-white/50" size={24} />
                    <GlassInput
                        placeholder="Search name, phone, establishment..."
                        className="pl-10 text-center"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <GlassButton onClick={exportCSV} className="w-10 h-10 p-0 rounded-full flex items-center justify-center text-brand-dark dark:text-brand-white hover:text-brand-gold hover:bg-brand-gold/10 transition-colors" title="Export CSV">
                    <FileDown size={24} />
                </GlassButton>
                <label className="cursor-pointer">
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                    <div className="w-10 h-10 flex items-center justify-center rounded-full glass-btn text-brand-dark dark:text-brand-white hover:text-brand-gold hover:bg-brand-gold/10 transition-colors">
                        <FileUp size={24} />
                    </div>
                </label>
                <GlassButton
                    className={`w-10 h-10 p-0 rounded-full flex items-center justify-center transition-all ${priorityFilter !== 'All' ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/50' : 'text-brand-dark dark:text-brand-white hover:text-brand-gold hover:bg-brand-gold/10'}`}
                    onClick={() => setPriorityFilter(f => f === 'All' ? 'High' : f === 'High' ? 'Medium' : 'All')}
                    title={`Filter: ${priorityFilter}`}
                >
                    <Filter size={24} />
                </GlassButton>
            </div>

            {/* Leads List */}
            <div className="space-y-3">
                {filteredLeads.length === 0 ? (
                    <div className="text-center py-10 text-brand-dark/40 dark:text-white/40">
                        <p>No leads found.</p>
                        <p className="text-xs mt-1">Tap + to add one.</p>
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <GlassCard key={lead.id} onClick={() => handleEdit(lead)} className="active:scale-[0.99] cursor-pointer hover:bg-brand-dark/5 dark:hover:bg-white/10 group relative overflow-hidden">
                            {/* Priority Indicator Strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${lead.priority === 'High' ? 'bg-red-500' :
                                lead.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />

                            <div className="pl-3 flex justify-between items-start">
                                <div className="flex-1">
                                    {/* Header: Name/Platform */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-brand-dark dark:text-white text-lg leading-tight">
                                            {lead.name}
                                        </h3>
                                        <span className="text-brand-dark/40 dark:text-white/40">
                                            {lead.platform === 'Instagram' && <Instagram size={14} />}
                                            {lead.platform === 'WhatsApp' && <MessageCircle size={14} />}
                                            {lead.platform === 'Gmail' && <Mail size={14} />}
                                            {(lead.platform === 'Call' || !lead.platform) && <Phone size={14} />}
                                        </span>
                                    </div>

                                    {/* Establishment Name */}
                                    {lead.establishment && (
                                        <p className="text-brand-dark/70 dark:text-white/70 text-sm font-medium flex items-center gap-1 mb-1">
                                            <Building2 size={12} className="text-brand-gold" /> {lead.establishment}
                                        </p>
                                    )}

                                    {/* Type Badges */}
                                    <div className="flex flex-wrap gap-1 my-1.5">
                                        {lead.leadType && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 font-medium">
                                                {lead.leadType}
                                            </span>
                                        )}
                                        {lead.leadSubType && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 font-medium">
                                                {lead.leadSubType}
                                            </span>
                                        )}
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-brand-dark/5 dark:bg-white/5 text-brand-dark/60 dark:text-white/60 uppercase tracking-wide">
                                            {lead.status}
                                        </span>
                                    </div>

                                    {/* Contact Details */}
                                    <div className="flex flex-col gap-1 mt-2">
                                        {lead.phone && (
                                            <p className="text-brand-dark/60 dark:text-white/60 text-xs flex items-center gap-1.5">
                                                <Phone size={10} /> {lead.phone}
                                            </p>
                                        )}
                                        {lead.email && (
                                            <p className="text-brand-dark/60 dark:text-white/60 text-xs flex items-center gap-1.5">
                                                <Mail size={10} /> {lead.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Footer: Assigned & Due */}
                                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-brand-dark/5 dark:border-white/5">
                                        {lead.teamMember && lead.teamMember !== 'Me' && (
                                            <p className="text-brand-dark/50 dark:text-white/50 text-[10px]">
                                                Assigned: <span className="text-brand-gold">{lead.teamMember}</span>
                                            </p>
                                        )}
                                        <p className="text-brand-dark/50 dark:text-white/50 text-[10px] ml-auto">
                                            Follow-up: {format(parseISO(lead.nextFollowUp), 'MMM d, h:mm a')}
                                        </p>
                                    </div>
                                </div>

                                <button className="text-brand-dark/40 dark:text-white/40 p-2 -mr-2 -mt-1 hover:text-brand-dark dark:hover:text-white">
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
            {
                showAddForm && (
                    <AddLeadForm
                        onClose={handleCloseForm}
                        initialData={editingLead}
                    />
                )
            }
        </div >
    );
}
