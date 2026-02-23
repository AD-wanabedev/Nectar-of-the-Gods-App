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
    onExportPDF,
    totalValue = 0,
    showNewOnly = false, setShowNewOnly,
    showHighPriority = false, setShowHighPriority
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
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 mb-6 sticky top-0 z-30 shadow-2xl flex flex-col gap-4">

            {/* Top Row: Search & Filters (Flex Wrap prevents clipping) */}
            <div className="flex flex-wrap items-center gap-3 w-full">
                {/* Search */}
                <div className="relative flex-grow min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Search leads, names, phones..."
                        className="w-full pl-10 pr-10 h-11 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all text-sm"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                    {localSearch && (
                        <button
                            onClick={() => setLocalSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Dropdowns */}
                <FilterDropdown label="Status" options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
                <FilterDropdown label="Priority" options={PRIORITY_OPTIONS} value={filterPriority} onChange={setFilterPriority} />
                <FilterDropdown label="Type" options={TYPE_OPTIONS} value={filterType} onChange={setFilterType} />

                {/* Actions */}
                <div className="flex gap-2 ml-auto shrink-0">
                    <button
                        onClick={onExportCSV}
                        className="h-11 px-5 rounded-xl text-sm bg-gold-500 hover:bg-gold-600 text-gray-950 font-bold border-none shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-2 transition-all"
                    >
                        <Download size={16} /> CSV
                    </button>
                    <button
                        onClick={onExportPDF}
                        className="h-11 px-5 rounded-xl text-sm bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 flex items-center gap-2 transition-all"
                    >
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* Bottom Row: Quick Toggles & Total Value */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-700/50 gap-4">
                {/* Quick Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowNewOnly && setShowNewOnly(!showNewOnly)}
                        className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-colors ${showNewOnly ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-gray-800 border-gray-600 text-gray-300 hover:text-white hover:border-blue-500'}`}
                    >
                        Show New Only
                    </button>
                    <button
                        onClick={() => setShowHighPriority && setShowHighPriority(!showHighPriority)}
                        className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-colors ${showHighPriority ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-gray-800 border-gray-600 text-gray-300 hover:text-white hover:border-red-500'}`}
                    >
                        High Priority
                    </button>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-xl border border-gray-700/50">
                    <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Total Value</span>
                    <span className="text-green-400 text-xl font-black">
                        ₹{totalValue.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </div>
    );
}
