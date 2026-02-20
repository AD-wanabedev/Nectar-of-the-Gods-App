import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function GlassButton({ children, className, variant = 'primary', ...props }) {
    const variants = {
        primary: "glass-btn-primary",
        secondary: "glass-btn",
        danger: "bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30 backdrop-blur-md",
        success: "bg-green-500/20 hover:bg-green-500/30 text-green-100 border border-green-500/30 backdrop-blur-md",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className={clsx(
                "shadow-lg active:scale-95 transition-all duration-300",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
