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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 bg-black/20 text-white border ${value !== 'All' ? 'border-brand-gold text-brand-gold' : 'border-white/10'} rounded-lg px-3 py-2 text-sm focus:outline-none hover:bg-white/5 transition-colors`}
            >
                {label}: <span className="font-bold">{value}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Mobile Fullscreen Overlay */}
                    <div className="md:hidden fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    {/* Dropdown Menu */}
                    <div className={`
                        fixed md:absolute z-[50] md:z-[40]
                        bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto md:top-full md:mt-2
                        w-full md:w-56 bg-gray-900 md:bg-gray-900/95 md:backdrop-blur border-t md:border border-white/10 md:rounded-xl shadow-2xl
                        animate-in slide-in-from-bottom md:slide-in-from-top-2 duration-200
                    `}>
                        <div className="flex justify-between items-center p-4 md:hidden border-b border-white/5">
                            <h3 className="font-bold text-white">Filter by {label}</h3>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-2 max-h-[60vh] overflow-y-auto">
                            {options.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                                        ${value === opt ? 'bg-brand-gold/10 text-brand-gold font-bold' : 'text-white/80 hover:bg-white/5'}
                                    `}
                                >
                                    {opt}
                                    {value === opt && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
