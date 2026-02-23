import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { leadsDB, accountsDB } from '../db';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import AddLeadForm from '../components/AddLeadForm';
import AccountDetailsModal from '../components/AccountDetailsModal';
import { Search, Plus, Filter, Phone, MoreHorizontal, Instagram, Mail, MessageCircle, FileDown, FileUp, Building2, Trash2, Check, IndianRupee } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SwipeableAccountCard = ({ account, onClick, onDelete }) => {
    const x = useMotionValue(0);
    const background = useTransform(x, [-100, 0, 100], ["rgba(239, 68, 68, 0.2)", "rgba(0,0,0,0)", "rgba(34, 197, 94, 0.2)"]);
    const opacityRight = useTransform(x, [50, 100], [0, 1]);
    const opacityLeft = useTransform(x, [-50, -100], [0, 1]);

    const handleDragEnd = (_, info) => {
        if (info.offset.x < -100) {
            onDelete(account);
        }
    };

    return (
        <motion.div style={{ background }} className="relative rounded-2xl overflow-hidden mb-3">
            {/* Right Action (Delete) */}
            <motion.div style={{ opacity: opacityLeft }} className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-red-500/20 text-red-500">
                <Trash2 size={24} />
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                className="relative z-10"
                whileDrag={{ scale: 1.02 }}
            >
                <GlassCard onClick={() => onClick(account)} className="active:scale-[0.99] cursor-pointer hover:bg-brand-dark/5 dark:hover:bg-white/10 group relative overflow-hidden !m-0 !rounded-none !bg-transparent border-0 shadow-none pb-4">
                    {/* Priority Indicator Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${account.priority === 'High' ? 'bg-red-500' :
                        account.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />

                    <div className="pl-4 pr-2 flex justify-between items-start">
                        <div className="flex-1 pt-1 space-y-2">
                            {/* Header: Business Name */}
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-brand-gold flex-shrink-0" />
                                <h3 className="font-bold text-brand-dark dark:text-white text-xl leading-tight">
                                    {account.businessName}
                                </h3>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-dark/5 dark:bg-white/5 text-brand-dark/70 dark:text-white/70 tracking-wide uppercase font-medium">
                                    {account.status || 'New'}
                                </span>
                                {account.totalRevenue > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-bold border border-green-500/20 flex items-center gap-0.5">
                                        <IndianRupee size={10} /> {account.totalRevenue.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); onDelete(account); }} className="text-brand-dark/40 dark:text-white/40 p-2 -mr-2 -mt-1 hover:text-red-500 transition-colors">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default function Leads() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        loadAccounts();
    }, []);

    // Check for deep link from Today.jsx
    useEffect(() => {
        const processDeepLink = async () => {
            if (location.state?.openLeadId) {
                const allLeads = await leadsDB.getAll();
                const leadToOpen = allLeads.find(l => l.id === location.state.openLeadId);
                if (leadToOpen) {
                    setEditingLead(leadToOpen);
                    setShowAddForm(true);
                    // Clear the state so it doesn't re-open on refresh
                    navigate(location.pathname, { replace: true });
                }
            }
        };
        processDeepLink();
    }, [location.state, navigate, location.pathname]);

    const loadAccounts = async (isRefetch = false) => {
        try {
            if (!isRefetch && accounts.length === 0) setLoading(true);
            const data = await accountsDB.getAll();
            setAccounts(data);
        } catch (error) {
            console.error("Failed to load accounts:", error);
            alert("Failed to load accounts. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const handleAccountClick = (account) => {
        setSelectedAccount(account);
    };

    const handleAdd = () => {
        setEditingLead(null);
        setShowAddForm(true);
    };

    const handleDelete = async (account) => {
        if (window.confirm(`Are you sure you want to delete ${account.businessName}? This will NOT delete associated leads.`)) {
            try {
                await accountsDB.delete(account.id);
                loadAccounts(true); // Silent refresh
            } catch (error) {
                console.error("Failed to delete account:", error);
                alert("Failed to delete account.");
            }
        }
    };

    const handleCloseForm = () => {
        setShowAddForm(false);
        setEditingLead(null);
        loadAccounts(true); // Refresh data silently to keep scroll position
    };

    const exportCSV = async () => {
        if (!accounts || accounts.length === 0) return alert("No accounts to export.");

        const headers = ["Business Name", "Status", "Priority", "Total Revenue", "Created At"];
        const rows = accounts.map(a => [
            a.businessName,
            a.status,
            a.priority,
            a.totalRevenue || 0,
            a.createdAt ? format(new Date(a.createdAt), 'yyyy-MM-dd') : ''
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `moonshine_accounts_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = (e) => {
        // Disabled for now as Accounts/Leads import logic requires deep relation handling
        alert("Account imports are disabled pending relational schema support.");
    };

    const triggerImport = () => {
        document.getElementById('csv-import-input').click();
    };

    // Filter accounts in memory
    const filteredAccounts = accounts.filter(account => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = account.businessName.toLowerCase().includes(term);
        const matchesPriority = priorityFilter === 'All' || account.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    }).sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));

    if (loading) {
        return (
            <div className="p-8 text-center text-white/50">
                <div className="animate-pulse">Loading accounts...</div>
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
                        placeholder="Search..."
                        className="pl-10 !text-center"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Export Button - Transparent */}
                <GlassButton
                    onClick={exportCSV}
                    className="w-12 h-12 p-0 rounded-full flex items-center justify-center !bg-transparent !border-transparent text-brand-dark dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors !shadow-none"
                    title="Export CSV"
                    variant="custom" // Use custom to avoid default glass styles if needed, or just override
                >
                    <FileDown size={28} />
                </GlassButton>

                {/* Import Button - Transparent */}
                <GlassButton
                    onClick={triggerImport}
                    className="w-12 h-12 p-0 rounded-full flex items-center justify-center !bg-transparent !border-transparent text-brand-dark dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors !shadow-none"
                    title="Import CSV"
                    variant="custom"
                >
                    <FileUp size={28} />
                </GlassButton>

                {/* Hidden Import Input */}
                <input id="csv-import-input" type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

                {/* Filter Button - Transparent (Inactive) / Highlighted (Active) */}
                <GlassButton
                    className={`w-12 h-12 p-0 rounded-full flex items-center justify-center transition-all !shadow-none ${priorityFilter !== 'All' ? 'bg-brand-dark dark:bg-white text-white dark:text-brand-dark' : '!bg-transparent !border-transparent text-brand-dark dark:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}
                    onClick={() => setPriorityFilter(f => f === 'All' ? 'High' : f === 'High' ? 'Medium' : 'All')}
                    title={`Filter: ${priorityFilter}`}
                    variant="custom"
                >
                    <Filter size={28} />
                </GlassButton>
            </div>

            {/* Accounts List */}
            <div className="space-y-3">
                {filteredAccounts.length === 0 ? (
                    <div className="text-center py-10 text-brand-dark/40 dark:text-white/40">
                        <p>No accounts found.</p>
                        <p className="text-xs mt-1">Tap + to add one.</p>
                    </div>
                ) : (
                    filteredAccounts.map(account => (
                        <SwipeableAccountCard
                            key={account.id}
                            account={account}
                            onClick={handleAccountClick}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            {/* FAB */}
            <FloatingActionButton onAddLead={handleAdd} onImport={triggerImport} />

            {/* Account Details Modal */}
            {
                selectedAccount && (
                    <AccountDetailsModal
                        account={selectedAccount}
                        onClose={() => setSelectedAccount(null)}
                        onRefreshAccounts={loadAccounts}
                    />
                )
            }
        </div >
    );
}
