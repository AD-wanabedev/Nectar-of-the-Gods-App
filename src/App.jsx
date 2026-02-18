import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import TodayPage from './pages/Today';
import LeadsPage from './pages/Leads';
import ProjectsPage from './pages/Projects';
import Library from './pages/Library';
import SalesPage from './pages/Sales';
import DocumentationPage from './pages/Documentation';
import GlassButton from './components/ui/GlassButton';
import { Home, Users, Target, BookOpen, LogOut, User as UserIcon, RefreshCw, Smartphone, DollarSign, FileText, Sun, Moon } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './components/ThemeContext';

function AppContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    const forceRefresh = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (let registration of registrations) {
                    registration.unregister();
                }
                window.location.reload(true);
            });
        } else {
            window.location.reload(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-white dark:bg-black flex flex-col items-center justify-center text-brand-dark dark:text-white gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-gold"></div>
                <div>Loading Nectar...</div>
            </div>
        );
    }

    if (!user) {
        return <Auth user={user} />;
    }

    const navItems = [
        { id: 'today', path: '/', icon: Home, label: 'Today' },
        { id: 'leads', path: '/leads', icon: Users, label: 'Leads' },
        { id: 'projects', path: '/projects', icon: Target, label: 'Projects' },
        { id: 'sales', path: '/sales', icon: DollarSign, label: 'Sales' },
        { id: 'library', path: '/library', icon: BookOpen, label: 'Library' },
        { id: 'docs', path: '/docs', icon: FileText, label: 'Docs' }
    ];

    const getActiveId = () => {
        const path = location.pathname;
        if (path === '/') return 'today';
        return path.substring(1).split('/')[0];
    };

    const activeId = getActiveId();

    return (
        <div className="min-h-screen bg-brand-white dark:bg-brand-dark transition-colors duration-300">
            {/* Structured Header - Fixes overlapping items */}
            <header className="sticky top-0 z-[100] w-full px-4 py-3 bg-brand-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-brand-dark/5 dark:border-brand-white/5 flex items-center justify-between transition-colors duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center border border-brand-gold/30">
                        <UserIcon size={16} className="text-brand-gold" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-brand-dark/90 dark:text-brand-white/90 truncate max-w-[120px] md:max-w-xs transition-colors">
                            {user.displayName || user.email?.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-brand-dark/40 dark:text-brand-white/40 uppercase tracking-tighter transition-colors">Authorized</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl bg-brand-dark/5 dark:bg-brand-white/5 border border-brand-dark/5 dark:border-brand-white/5 text-brand-dark/70 dark:text-brand-white/40 hover:text-brand-gold hover:bg-brand-gold/10 transition-all focus:outline-none"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button
                        onClick={forceRefresh}
                        className="p-2 mr-1 rounded-xl bg-brand-dark/5 dark:bg-brand-white/5 border border-brand-dark/5 dark:border-brand-white/5 text-brand-dark/70 dark:text-brand-white/40 hover:text-brand-gold hover:bg-brand-gold/10 transition-all focus:outline-none"
                        title="Force Clear Cache & Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <GlassButton
                        onClick={handleSignOut}
                        className="bg-brand-dark/5 dark:bg-brand-white/5 hover:bg-red-500/20 px-3 py-1.5 border-brand-dark/10 dark:border-brand-white/10 hover:border-red-500/30 group transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase hidden sm:inline text-brand-dark/60 dark:text-brand-white/60 group-hover:text-red-400">Logout</span>
                            <LogOut size={14} className="text-brand-dark/40 dark:text-brand-white/40 group-hover:text-red-400 transition-colors" />
                        </div>
                    </GlassButton>
                </div>
            </header>

            <main className="px-4 pt-4 pb-28 max-w-7xl mx-auto w-full">
                <Routes>
                    <Route path="/" element={<TodayPage />} />
                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/docs" element={<DocumentationPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-brand-white/90 dark:bg-brand-dark/90 backdrop-blur-lg border-t border-brand-dark/10 dark:border-brand-white/10 pb-safe z-50 flex glass-nav transition-colors duration-300">
                <div className="grid grid-cols-6 gap-1 px-1 py-1 w-full max-w-3xl mx-auto">
                    {navItems.map(({ id, path, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => navigate(path)}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all ${activeId === id
                                ? 'text-brand-gold'
                                : 'text-brand-dark/70 dark:text-brand-white/40 hover:text-brand-dark dark:hover:text-brand-white/80'
                                }`}
                        >
                            <Icon size={22} className={`transition-transform ${activeId === id ? 'scale-110' : ''}`} />
                            <span className={`text-[9px] font-medium ${activeId === id ? 'text-brand-gold' : ''}`}>{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
