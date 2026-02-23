import { Search, Filter, Download } from 'lucide-react';
import GlassInput from './GlassInput';
import GlassButton from './GlassButton';

export default function FilterBar({
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterType,
    setFilterType,
    onExportCSV,
    onExportPDF
}) {
    const STATUS_OPTIONS = ['All', 'New', 'In Progress', 'Converted', 'Lost'];
    const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];
    const TYPE_OPTIONS = ['All', 'B2B', 'B2C'];

    return (
        <div className="flex flex-col md:flex-row gap-3 p-4 bg-brand-dark/40 dark:bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md sticky top-0 z-30 mb-4 shadow-xl">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                <GlassInput
                    placeholder="Search accounts, names, phones..."
                    className="pl-10 text-sm h-10 !bg-black/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 min-w-max overflow-x-auto hide-scrollbar">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold min-w-[110px]"
                >
                    <option value="All">All Status</option>
                    {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold min-w-[110px]"
                >
                    <option value="All">All Priority</option>
                    {PRIORITY_OPTIONS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold min-w-[100px]"
                >
                    <option value="All">All Types</option>
                    {TYPE_OPTIONS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 min-w-max">
                <GlassButton
                    onClick={onExportCSV}
                    className="h-10 px-4 text-sm bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 flex items-center gap-2 border-brand-gold/20"
                >
                    <Download size={16} /> CSV
                </GlassButton>
                <GlassButton
                    onClick={onExportPDF}
                    className="h-10 px-4 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center gap-2 border-blue-500/20"
                >
                    <Download size={16} /> PDF
                </GlassButton>
            </div>
        </div>
    );
}
