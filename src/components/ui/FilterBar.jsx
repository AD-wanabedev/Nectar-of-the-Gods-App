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
    onExportExcel
}) {
    const STATUS_OPTIONS = ['All', 'New', 'In Progress', 'Converted', 'Lost'];
    const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];
    const TYPE_OPTIONS = ['All', 'B2B', 'B2C'];

    const [showExportOptions, setShowExportOptions] = useState(false);

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
                <div className="flex gap-2 ml-auto shrink-0 relative">
                    <button
                        onClick={() => setShowExportOptions(!showExportOptions)}
                        className="h-11 px-6 rounded-xl text-sm bg-gold-500 hover:bg-gold-600 text-gray-950 font-bold border-none shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-2 transition-all"
                    >
                        <Download size={16} /> Export
                    </button>
                    {showExportOptions && (
                        <div className="absolute top-full right-0 mt-2 py-2 w-40 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                            <button
                                onClick={() => { if (onExportCSV) onExportCSV(); setShowExportOptions(false); }}
                                className="px-4 py-2 text-sm text-left text-white/80 hover:bg-gray-800 hover:text-white transition-colors border-b border-gray-800"
                            >
                                Download .CSV
                            </button>
                            <button
                                onClick={() => { if (onExportExcel) onExportExcel(); setShowExportOptions(false); }}
                                className="px-4 py-2 text-sm text-left text-white/80 hover:bg-gray-800 hover:text-white transition-colors"
                            >
                                Download .Excel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
