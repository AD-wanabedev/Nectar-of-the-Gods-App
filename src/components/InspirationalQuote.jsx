import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
    { text: "The obstacle is the way.", author: "Marcus Aurelius" },
    { text: "Do not wait; the time will never be 'just right'.", author: "Napoleon Hill" },
    { text: "Focus is more valuable than intelligence.", author: "Unknown" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "What we do now echoes in eternity.", author: "Marcus Aurelius" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
];

export default function InspirationalQuote() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Pick a random quote on mount, or rotate daily based on date?
        // For now, random on mount.
        setIndex(Math.floor(Math.random() * quotes.length));
    }, []);

    const nextQuote = () => {
        setIndex((prev) => (prev + 1) % quotes.length);
    };

    return (
        <div onClick={nextQuote} className="cursor-pointer mb-6">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-center px-4"
                >
                    <Quote size={20} className="mx-auto mb-2 text-brand-gold dark:text-pink-300 opacity-80" />
                    <p className="text-lg font-serif italic text-brand-dark/90 dark:text-white/90 mb-1">
                        "{quotes[index].text}"
                    </p>
                    <p className="text-xs text-brand-dark/60 dark:text-white/60 uppercase tracking-widest">
                        — {quotes[index].author}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
