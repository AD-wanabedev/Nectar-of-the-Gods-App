import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { accountsDB, leadsDB } from '../db';
import GlassCard from '../components/ui/GlassCard';
import AddLeadForm from '../components/AddLeadForm';
import AddAccountForm from '../components/AddAccountForm';
import LeadDetailPanel from '../components/ui/LeadDetailPanel';
import FilterBar from '../components/ui/FilterBar';
import AccountsTable from '../components/ui/AccountsTable';
import AccountsList from '../components/ui/AccountsList';
import KanbanBoard from '../components/ui/KanbanBoard';
import { LayoutList, LayoutGrid, LayoutTemplate } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function Leads() {
    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban' | 'list'
    const [showAddContactForm, setShowAddContactForm] = useState(false);
    const [showAddAccountForm, setShowAddAccountForm] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [editingLead, setEditingLead] = useState(null);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterType, setFilterType] = useState('All');

    // Quick Action Toggles
    const [showNewOnly, setShowNewOnly] = useState(false);
    const [showHighPriority, setShowHighPriority] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Responsive Auto-switch to List view on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768 && viewMode === 'table') {
                setViewMode('list');
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [viewMode]);

    useEffect(() => {
        loadData();
    }, []);

    // Parse incoming routing state (from Analytics drilldowns, Today deep links, and global FAB)
    useEffect(() => {
        if (location.state?.filterPriority) setFilterPriority(location.state.filterPriority);
        if (location.state?.filterStatus) setFilterStatus(location.state.filterStatus);
        if (location.state?.filterType) setFilterType(location.state.filterType);

        // Global FAB navigation — open the correct modal
        if (location.state?.openModal === 'account') {
            setShowAddAccountForm(true);
        } else if (location.state?.openModal === 'contact') {
            setEditingLead(null);
            setShowAddContactForm(true);
        }

        // Deep Links from Today.jsx for single contacts
        const processDeepLink = async () => {
            if (location.state?.openLeadId) {
                const allLeads = await leadsDB.getAll();
                const leadToOpen = allLeads.find(l => l.id === location.state.openLeadId);
                if (leadToOpen) {
                    setEditingLead(leadToOpen);
                    setShowAddContactForm(true);
                }
            }
            // Clear location state to prevent loop on refresh
            if (location.state) {
                navigate(location.pathname, { replace: true });
            }
        };
        if (location.state) processDeepLink();
    }, [location.state, navigate, location.pathname]);

    const loadData = async (isRefetch = false) => {
        try {
            if (!isRefetch && accounts.length === 0) setLoading(true);
            const [accData, conData] = await Promise.all([
                accountsDB.getAll(),
                leadsDB.getAll()
            ]);
            setAccounts(accData);
            setContacts(conData);
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

    const handleAddAccount = () => {
        setShowAddAccountForm(true);
    };

    const handleAddContact = () => {
        setEditingLead(null);
        setShowAddContactForm(true);
    };

    const handleDeleteAccount = async (account) => {
        if (window.confirm(`Are you sure you want to delete ${account.businessName}? All associated contacts will NOT be deleted, but orphaned.`)) {
            try {
                await accountsDB.delete(account.id);
                loadData(true);
            } catch (error) {
                console.error("Failed to delete account:", error);
                alert("Failed to delete account.");
            }
        }
    };

    const handleCloseContactForm = () => {
        setShowAddContactForm(false);
        setEditingLead(null);
        loadData(true);
    };

    const handleCloseAccountForm = (refreshNeeded = false) => {
        setShowAddAccountForm(false);
        if (refreshNeeded) loadData(true);
    };

    // Filter definitions
    const filteredAccounts = accounts.filter(account => {
        const term = searchTerm.toLowerCase();
        const accContacts = contacts.filter(c => c.accountId === account.id);

        // Search matches company, or any matching contact's name, email, or phone
        const matchesSearch = !term ||
            (account.businessName?.toLowerCase().includes(term)) ||
            accContacts.some(c =>
                c.name?.toLowerCase().includes(term) ||
                c.email?.toLowerCase().includes(term) ||
                c.phone?.includes(term)
            );

        const matchesPriority = filterPriority === 'All' || account.priority === filterPriority;
        const matchesStatus = filterStatus === 'All' || account.status === filterStatus;

        let matchesType = true;
        if (filterType !== 'All') {
            matchesType = accContacts.some(c => c.leadType === filterType);
        }

        return matchesSearch && matchesPriority && matchesStatus && matchesType;
    }).sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));

    // Calculate aggregated Total Value for FilterBar Unified Header
    const calculatedTotalValue = filteredAccounts.reduce((sum, acc) => sum + (parseFloat(acc.totalRevenue) || 0), 0);

    // Dynamic CSV Export utilizing Papaparse
    const exportCSV = () => {
        if (filteredAccounts.length === 0) return alert("No active data to export.");

        // Flatten the export data natively
        const exportData = filteredAccounts.map(a => {
            const accContacts = contacts.filter(c => c.accountId === a.id);
            const primary = accContacts[0] || {};
            return {
                'Company Name': a.businessName || '',
                'Status': a.status || 'New',
                'Priority': a.priority || 'Medium',
                'Total Revenue': a.totalRevenue || 0,
                'Primary Contact Name': primary.name || '',
                'Primary Phone': primary.phone || '',
                'Primary Email': primary.email || '',
                'Account Owner': primary.teamMember || 'Unassigned',
                'Created At': (() => {
                    try {
                        if (!a.createdAt) return '';
                        const d = new Date(a.createdAt);
                        return isNaN(d) ? '' : format(d, 'yyyy-MM-dd');
                    } catch { return ''; }
                })()
            };
        });

        const csvString = Papa.unparse(exportData);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `moonshine_crm_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Excel Export utilizing xlsx
    const exportExcel = () => {
        if (filteredAccounts.length === 0) return alert("No active data to export.");

        const exportData = filteredAccounts.map(a => {
            const accContacts = contacts.filter(c => c.accountId === a.id);
            const primary = accContacts[0] || {};
            return {
                'Company Name': a.businessName || '',
                'Status': a.status || 'New',
                'Priority': a.priority || 'Medium',
                'Total Revenue': a.totalRevenue || 0,
                'Primary Contact Name': primary.name || '',
                'Primary Phone': primary.phone || '',
                'Primary Email': primary.email || '',
                'Account Owner': primary.teamMember || 'Unassigned',
                'Created At': (() => {
                    try {
                        if (!a.createdAt) return '';
                        const d = new Date(a.createdAt);
                        return isNaN(d) ? '' : format(d, 'yyyy-MM-dd');
                    } catch { return ''; }
                })()
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // Add styling mapping if requested later, keeping simple array buffers for now
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
        XLSX.writeFile(workbook, `moonshine_crm_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    // Import CSV / Excel
    const importData = async (file) => {
        const ext = file.name.split('.').pop().toLowerCase();

        const processRows = async (rows) => {
            if (!rows || rows.length === 0) {
                alert('The file appears to be empty or unreadable.');
                return;
            }

            // Placeholder values that mean "no real contact" — skip silently
            const SKIP_NAMES = new Set(['-', '[not public]', 'n/a', 'na', '']);

            // ── Step 1: group all rows by company name (case-insensitive key) ──
            const companyMap = new Map(); // key → { canonical, rows[] }
            for (const row of rows) {
                const raw = (row['Company Name'] || '').trim();
                if (!raw) continue;
                const key = raw.toLowerCase();
                if (!companyMap.has(key)) companyMap.set(key, { canonical: raw, rows: [] });
                companyMap.get(key).rows.push(row);
            }

            if (companyMap.size === 0) {
                alert('No valid rows found. Make sure the "Company Name" column is filled in.');
                return;
            }

            let accountsCreated = 0;
            let contactsCreated = 0;
            let rowsSkipped = 0;

            // ── Step 2: one account per unique company ──
            for (const [, { canonical, rows: companyRows }] of companyMap) {
                const firstRow = companyRows[0];
                try {
                    const accountId = await accountsDB.add({
                        businessName: canonical,
                        status: firstRow['Status'] || 'New',
                        priority: firstRow['Priority'] || 'Medium',
                        totalRevenue: parseFloat(firstRow['Total Revenue']) || 0,
                        notes: '',
                    });
                    accountsCreated++;

                    // ── Step 3: add every contact row under the same account ──
                    for (const row of companyRows) {
                        const rawName = (row['Primary Contact Name'] || '').trim();
                        const contactName = SKIP_NAMES.has(rawName.toLowerCase()) ? '' : rawName;
                        const contactPhone = (row['Primary Phone'] || '').trim();
                        const contactEmail = (row['Primary Email'] || '').trim();
                        const teamMember = (row['Account Owner'] || '').trim();

                        if (!contactName && !contactPhone && !contactEmail) { rowsSkipped++; continue; }

                        await leadsDB.add({
                            accountId,
                            name: contactName || canonical,
                            phone: contactPhone,
                            email: contactEmail,
                            teamMember: teamMember || 'Unassigned',
                            leadType: 'B2B',
                            status: row['Status'] || 'New',
                            priority: row['Priority'] || 'Medium',
                        });
                        contactsCreated++;
                    }
                } catch (err) {
                    console.error('Import error for:', canonical, err);
                    rowsSkipped++;
                }
            }

            await loadData(true);
            alert(
                `✅ Import complete!\n` +
                `${accountsCreated} unique account(s) created.\n` +
                `${contactsCreated} contact(s) linked.` +
                (rowsSkipped > 0 ? `\n${rowsSkipped} row(s) skipped (no contact info or placeholder names).` : '')
            );
        };

        if (ext === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (result) => { await processRows(result.data); },
                error: () => alert('Failed to parse CSV file. Please check the format.'),
            });
        } else if (ext === 'xlsx' || ext === 'xls') {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            await processRows(rows);
        } else {
            alert('Unsupported file type. Please use .csv or .xlsx');
        }
    };

    // PDF Export utilizing jsPDF and autoTable
    const exportPDF = () => {
        if (filteredAccounts.length === 0) return alert("No active data to export.");

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Moonshine CRM Export', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 30);
        doc.text(`Records: ${filteredAccounts.length}`, 14, 36);

        const tableColumn = ["Company", "Status", "Priority", "Revenue", "Contact", "Phone"];
        const tableRows = [];

        filteredAccounts.forEach(a => {
            const accContacts = contacts.filter(c => c.accountId === a.id);
            const primary = accContacts[0] || {};
            const revenueFormatted = `Rs. ${(a.totalRevenue || 0).toLocaleString()}`;
            const rowData = [
                a.businessName || 'NA',
                a.status || 'New',
                a.priority || 'Medium',
                revenueFormatted,
                primary.name || 'NA',
                primary.phone || 'NA'
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            startY: 45,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8 },
            columnStyles: { 3: { halign: 'right' } }
        });

        doc.save(`moonshine_crm_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const renderView = () => {
        switch (viewMode) {
            case 'list':
                return <AccountsList
                    accounts={filteredAccounts}
                    contacts={contacts}
                    onRowClick={handleAccountClick}
                    onEditClick={handleAccountClick}
                    onDeleteClick={handleDeleteAccount}
                />;
            case 'kanban':
                return <KanbanBoard
                    accounts={filteredAccounts}
                    onRefreshAccounts={() => loadData(true)}
                />;
            case 'table':
            default:
                return <AccountsTable
                    accounts={filteredAccounts}
                    contacts={contacts}
                    isLoading={loading}
                    onRowClick={handleAccountClick}
                    onEditClick={handleAccountClick}
                    onDeleteClick={handleDeleteAccount}
                />;
        }
    };

    return (
        <div className="pb-24 pt-2 px-2 md:px-6 space-y-4 w-full min-h-screen flex flex-col">
            {/* Top Toolbar (Condensed for Bug 7) */}
            <div className="flex justify-between items-center mb-1 gap-2">
                <h1 className="text-xl font-bold text-gold-300 flex-shrink-0 mr-4">CRM Database</h1>

                {/* View Toggles */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-full bg-gray-800 p-1 rounded-lg border border-gray-700 shrink-0">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 px-4 rounded-md transition-all flex items-center gap-1.5 text-xs font-medium ${viewMode === 'table' ? 'bg-gold-500 text-gray-950 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                        <LayoutTemplate size={14} /> Table
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-1.5 px-4 rounded-md transition-all flex items-center gap-1.5 text-xs font-medium ${viewMode === 'kanban' ? 'bg-gold-500 text-gray-950 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                        <LayoutGrid size={14} /> Kanban
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 px-4 rounded-md transition-all flex items-center gap-1.5 text-xs font-medium ${viewMode === 'list' ? 'bg-gold-500 text-gray-950 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                        <LayoutList size={14} /> List
                    </button>
                </div>
            </div>

            {/* Notion Filter Bar Engine - Optimized Header */}
            <FilterBar
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                filterPriority={filterPriority} setFilterPriority={setFilterPriority}
                filterType={filterType} setFilterType={setFilterType}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onImport={importData}
                onAddLead={handleAddContact}
                onAddAccount={handleAddAccount}
            />

            {/* Dynamic View Injection */}
            <div className="flex-1 w-full overflow-hidden">
                {renderView()}
            </div>

            {/* New Account Form */}
            {showAddAccountForm && (
                <AddAccountForm onClose={handleCloseAccountForm} />
            )}

            {/* Add / Edit Contact Form */}
            {showAddContactForm && (
                <AddLeadForm onClose={handleCloseContactForm} initialData={editingLead} />
            )}

            {/* Account Detail Flyout Drawer */}
            {selectedAccount && (
                <LeadDetailPanel
                    account={selectedAccount}
                    contacts={contacts.filter(c => c.accountId === selectedAccount.id)}
                    onClose={() => setSelectedAccount(null)}
                    onRefreshAccounts={() => loadData(true)}
                />
            )}
        </div>
    );
}
