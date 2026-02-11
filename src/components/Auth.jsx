import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import GlassButton from './ui/GlassButton';
import { LogIn, LogOut, User } from 'lucide-react';

export default function Auth({ user }) {
    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Sign in error:", error);
            alert(`Failed to sign in: ${error.message}`);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    if (!user) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div className="glass-card max-w-md w-full p-8 text-center">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">Moonshine Leads</h1>
                        <p className="text-white/60">Sign in to sync your leads across devices</p>
                    </div>
                    <GlassButton
                        onClick={handleSignIn}
                        className="w-full bg-blue-600/20 hover:bg-blue-600/40 flex items-center justify-center gap-2"
                    >
                        <LogIn size={20} />
                        Sign in with Google
                    </GlassButton>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
            <div className="flex items-center gap-2 text-white/80 text-sm">
                <User size={16} />
                {user.displayName || user.email}
            </div>
            <GlassButton
                onClick={handleSignOut}
                className="bg-red-600/20 hover:bg-red-600/40 px-3 py-2"
            >
                <LogOut size={16} />
            </GlassButton>
        </div>
    );
}
