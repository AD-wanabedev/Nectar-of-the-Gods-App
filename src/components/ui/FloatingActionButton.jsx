import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserPlus, FileUp, X } from 'lucide-react';
import clsx from 'clsx';

export default function FloatingActionButton({ onAddLead, onImport }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const menuItems = [
        { label: 'Import CSV', icon: FileUp, onClick: onImport, delay: 0.1 },
        { label: 'New Lead', icon: UserPlus, onClick: onAddLead, delay: 0.05 },
    ];

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 pointer-events-auto">
                        {menuItems.map((item, index) => (
                            <motion.button
                                key={item.label}
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                transition={{ duration: 0.2, delay: item.delay }}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className="group flex items-center gap-3"
                            >
                                <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 backdrop-blur-md rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.label}
                                </span>
                                <div className="w-12 h-12 rounded-full glass-btn bg-brand-dark/80 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg hover:bg-brand-gold hover:text-brand-dark transition-colors">
                                    <item.icon size={20} />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={toggleOpen}
                animate={{ rotate: isOpen ? 45 : 0 }}
                whileTap={{ scale: 0.9 }}
                className={clsx(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl pointer-events-auto",
                    "bg-gradient-to-tr from-brand-gold to-brand-amber text-brand-dark border border-white/20",
                    "hover:scale-105 transition-all duration-300"
                )}
            >
                <Plus size={28} strokeWidth={2.5} />
            </motion.button>
        </div>
    );
}
