import React from 'react';

export default function Background() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0a0a0c] dark:bg-[#0a0a0c]">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#111113] to-[#0a0a0c]" />

            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-platinum/5 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-brand-platinum/5 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-4000" />
            </div>      {/* Subtle Overlay Texture (Grain/Noise could be added here later if desired) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-200 brightness-100" />
        </div>
    );
}
