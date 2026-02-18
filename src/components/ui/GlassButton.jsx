import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function GlassButton({ children, className, variant = 'primary', ...props }) {
    const variants = {
        primary: "bg-white/20 hover:bg-white/30 text-white",
        secondary: "bg-black/20 hover:bg-black/30 text-white/80",
        danger: "bg-red-500/20 hover:bg-red-500/30 text-red-100 border-red-500/30",
        success: "bg-green-500/20 hover:bg-green-500/30 text-green-100 border-green-500/30",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className={clsx(
                "glass-btn backdrop-blur-md border border-white/10 shadow-sm",
                "flex items-center justify-center gap-2",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
