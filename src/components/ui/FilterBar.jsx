import { useState, useEffect } from 'react';
import { Search, Download, X, Plus } from 'lucide-react';
import GlassInput from './GlassInput';
import GlassButton from './GlassButton';
import FilterDropdown from './FilterDropdown';

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

    // Local debounced search state
    const [localSearch, setLocalSearch] = useState(searchTerm);

    useEffect(() => {
        setLocalSearch(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(localSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, setSearchTerm]);

    return (
        <div className="flex flex-col md:flex-row gap-3 p-4 bg-brand-dark/40 dark:bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md sticky top-0 z-30 mb-4 shadow-xl">
            {/* Search */}
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-gold-500 transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search accounts, names, phones..."
                    className="w-full pl-10 pr-10 text-sm h-11 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
                {localSearch && (
                    <button
                        onClick={() => setLocalSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1 rounded-full transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 min-w-max overflow-x-auto hide-scrollbar">
                <FilterDropdown
                    label="Status"
                    options={STATUS_OPTIONS}
                    value={filterStatus}
                    onChange={setFilterStatus}
                />
                <FilterDropdown
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    value={filterPriority}
                    onChange={setFilterPriority}
                />
                <FilterDropdown
                    label="Type"
                    options={TYPE_OPTIONS}
                    value={filterType}
                    onChange={setFilterType}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 min-w-max">
                <GlassButton
                    onClick={onExportCSV}
                    className="h-11 px-4 text-sm bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 flex items-center gap-2 border-brand-gold/20"
                >
                    <Download size={16} /> CSV
                </GlassButton>
                <GlassButton
                    onClick={onExportPDF}
                    className="h-11 px-4 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center gap-2 border-blue-500/20"
                >
                    <Download size={16} /> PDF
                </GlassButton>
            </div>
        </div>
    );
}
