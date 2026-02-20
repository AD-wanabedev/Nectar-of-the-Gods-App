import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function GoalRing({
    progress, // 0 to 100
    label,
    value,
    color = "text-brand-gold",
    icon: Icon,
    size = 120,
    strokeWidth = 8
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative">
            <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
                {/* Background Ring */}
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-white/5 dark:text-white/10"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={clsx(color, "drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]")}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {Icon && <Icon size={24} className={clsx("mb-1 opacity-80", color)} />}
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
                </div>
            </div>
            <span className="mt-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</span>
        </div>
    );
}
