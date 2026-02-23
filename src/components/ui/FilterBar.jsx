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
    totalValue = 0 // Added total value prop
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
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 mb-6 sticky top-0 z-30 shadow-xl">
            {/* Top Section: Filters + Actions */}
            <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                {/* Search */}
                <div className="relative flex-1 w-full group">
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
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0">
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
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <GlassButton
                        onClick={onExportCSV}
                        className="h-11 px-6 text-sm bg-gold-500 hover:bg-gold-600 text-gray-950 font-bold border-none shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2 flex-1 md:flex-none"
                    >
                        <Download size={16} /> CSV
                    </GlassButton>
                    <GlassButton
                        onClick={onExportPDF}
                        className="h-11 px-6 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center justify-center gap-2 flex-1 md:flex-none"
                    >
                        <Download size={16} /> PDF
                    </GlassButton>
                </div>
            </div>

            {/* Bottom Section: Secondary Filters + Total */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                <div className="flex gap-2 hidden md:flex">
                    {/* Placeholder for Quick Toggles if requested later, currently preserving layout structure */}
                </div>

                <div className="flex items-center gap-3 bg-gray-800/60 px-4 py-2 rounded-lg border border-gray-700 shrink-0 ml-auto w-full md:w-auto justify-between md:justify-end">
                    <span className="text-gray-400 text-sm font-semibold tracking-wider">TOTAL VALUE</span>
                    <span className="text-green-400 text-xl font-bold">
                        ₹{totalValue.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </div>
    );
}
