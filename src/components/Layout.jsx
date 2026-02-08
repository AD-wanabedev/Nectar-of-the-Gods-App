import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Target, BookOpen } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Today', icon: Home },
        { path: '/leads', label: 'Leads', icon: Users },
        { path: '/projects', label: 'Projects', icon: Target },
        { path: '/library', label: 'Library', icon: BookOpen },
    ];

    return (
        <div className="min-h-screen pb-28"> {/* Increased padding to avoid overlap */}
            <main className="container mx-auto p-4 max-w-md md:max-w-4xl lg:max-w-7xl">
                <Outlet />
            </main>

            <nav className="glass-nav">
                {navItems.map(({ path, label, icon: Icon }) => {
                    const isActive = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full transition-colors",
                                isActive ? "text-blue-500 scale-105" : "text-white/40 hover:text-white"
                            )}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-xs mt-1">{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
