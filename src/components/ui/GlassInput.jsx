import clsx from 'clsx';

export default function GlassInput({ className, ...props }) {
    return (
        <input
            className={clsx(
                "glass-input w-full",
                className
            )}
            {...props}
        />
    );
}
