import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className, onClick, ...props }) {
    return (
        <motion.div
            whileTap={onClick ? { scale: 0.98 } : {}}
            className={clsx(
                "glass-card",
                "flex flex-col",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    );
}
