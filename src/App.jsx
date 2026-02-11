import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import TodayPage from './pages/Today';
import LeadsPage from './pages/Leads';
import ProjectsPage from './pages/Projects';
import Library from './pages/Library';
import { Home, Users, Target, BookOpen } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <div>Loading Moonshine...</div>
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
        { id: 'library', path: '/library', icon: BookOpen, label: 'Library' }
    ];

    // Determine current ID for active tab styling
    const getActiveId = () => {
        const path = location.pathname;
        if (path === '/') return 'today';
        return path.substring(1).split('/')[0];
    };

    const activeId = getActiveId();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <Auth user={user} />

            <main className="px-4 pt-4 pb-24">
                <Routes>
                    <Route path="/" element={<TodayPage />} />
                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 pb-safe z-50">
                <div className="grid grid-cols-4 gap-1 px-2 py-2">
                    {navItems.map(({ id, path, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => navigate(path)}
                            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeId === id
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="text-[10px] font-medium">{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
