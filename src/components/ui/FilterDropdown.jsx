import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import GlassButton from './GlassButton';

export default function FilterDropdown({ label, options, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add color mapping to standard CRM options if labels match Status/Priority
    const getOptionColor = (opt) => {
        if (!opt || opt === 'All') return 'bg-gray-600';
        const colors = {
            'new': 'bg-blue-500', 'customer': 'bg-green-500',
            'qualified': 'bg-purple-500', 'lost': 'bg-gray-500',
            'high': 'bg-red-500', 'medium': 'bg-amber-500', 'low': 'bg-gray-500'
        };
        return colors[opt.toLowerCase()] || 'bg-gold-500';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 
                    bg-gray-800/80 hover:bg-gray-700
                    text-white
                    px-4 py-2.5 
                    rounded-lg 
                    border border-gray-600
                    hover:border-gold-500/50
                    transition-all
                    min-w-[140px] text-sm
                `}
            >
                <span>{label}: <span className="font-medium">{value || 'All'}</span></span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="
                    absolute top-full left-0 mt-2
                    w-48
                    bg-gray-800 
                    rounded-lg 
                    border border-gray-600
                    shadow-2xl shadow-black/60
                    py-2
                    z-[60]
                    overflow-hidden
                ">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className="
                                w-full text-left px-4 py-2.5
                                hover:bg-gray-700
                                transition-colors
                                flex items-center gap-3
                                text-white text-sm
                            "
                        >
                            <span className={`w-2 h-2 rounded-full ${getOptionColor(opt)}`}></span>
                            <span>{opt}</span>
                            {value === opt && (
                                <span className="ml-auto text-gold-400">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
