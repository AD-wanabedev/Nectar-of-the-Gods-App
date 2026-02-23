import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
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

    // For simplicity, we implement single selection here (matching the current filter mechanism),
    // but styled as a glassmorphic dropdown menu.

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 
                    bg-gray-800 hover:bg-gray-700
                    text-white
                    px-4 py-2 
                    rounded-lg 
                    border ${value !== 'All' ? 'border-gold-500/50 text-gold-300' : 'border-gray-700 hover:border-gold-500/30'}
                    transition-all
                    min-w-[140px] shadow-sm
                `}
            >
                <span className="text-sm">{label}: <span className="font-bold ml-1">{value || 'All'}</span></span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="
                    absolute top-full left-0 mt-2
                    w-full min-w-[200px]
                    bg-gray-800 
                    rounded-lg 
                    border border-white/10
                    shadow-2xl shadow-black/50
                    py-2
                    z-50
                    animate-in fade-in slide-in-from-top-2 duration-200
                ">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className={`
                                w-full flex items-center justify-between px-4 py-2.5 
                                text-sm transition-colors text-left
                                ${value === opt ? 'bg-gold-500/10 text-gold-300 font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                            `}
                        >
                            <span>{opt}</span>
                            {value === opt && <Check size={16} className="text-gold-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
