import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Target, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import Background from './ui/Background';

export default function Layout() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Today', icon: Home },
        { path: '/leads', label: 'Leads', icon: Users },
        { path: '/projects', label: 'Projects', icon: Target },
        { path: '/library', label: 'Library', icon: BookOpen },
    ];

    return (
        <div className="min-h-screen pb-28 text-white"> {/* Applied text-white global default for dark theme preference */}
            <Background />

            <main className="container mx-auto p-4 max-w-md md:max-w-4xl lg:max-w-7xl animate-in fade-in duration-500">
                <Outlet />
            </main>

            <nav className="glass-nav">
                {navItems.map(({ path, label, icon: Icon }) => {
                    const isActive = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className="relative flex flex-col items-center justify-center w-full h-full group"
                        >
                            {/* Active State Glow - Behind the icon */}
                            {isActive && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-user-gold/20 rounded-full blur-md animate-pulse" />
                            )}

                            <div className={clsx(
                                "transition-all duration-300 transform",
                                isActive ? "text-[#D4AF37] scale-110 -translate-y-1 drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" : "text-white/40 hover:text-white group-hover:scale-105"
                            )}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            <span className={clsx(
                                "text-[10px] mt-1 transition-all duration-300 font-medium tracking-wide",
                                isActive ? "text-[#D4AF37] opacity-100" : "text-white/40 opacity-0 group-hover:opacity-100"
                            )}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/10 pointer-events-none font-mono">
                    v2.0 Glass OS
                </div>
            </nav>
        </div>
    );
}
