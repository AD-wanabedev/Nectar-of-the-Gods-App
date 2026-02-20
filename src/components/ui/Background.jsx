import React from 'react';

export default function Background() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0a0a0c] dark:bg-[#0a0a0c]">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#111113] to-[#0a0a0c]" />

            {/* Drifting Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-gold/10 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob" />

            <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-brand-peach/10 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />

            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-900/10 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-4000" />

            {/* Subtle Overlay Texture (Grain/Noise could be added here later if desired) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-200 brightness-100" />
        </div>
    );
}
