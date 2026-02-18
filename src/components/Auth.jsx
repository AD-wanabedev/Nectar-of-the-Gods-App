import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import GlassButton from './ui/GlassButton';
import GlassInput from './ui/GlassInput';
import { LogIn, LogOut, User, Mail, Lock, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function Auth({ user }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Google Sign in error:", error);
            alert(`Google Sign in failed: ${error.message}`);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            console.error("Email Auth error:", error);
            alert(`${isLogin ? 'Login' : 'Sign Up'} failed: ${error.message}`);
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent! Check your inbox.");
        } catch (error) {
            console.error("Reset password error:", error);
            alert(`Error: ${error.message}`);
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
                <div className="glass-card max-w-md w-full p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">Moonshine Leads</h1>
                        <p className="text-white/60">
                            {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
                        </p>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4 mb-2">
                        <div>
                            <GlassInput
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                        {isLogin || (
                            <div>
                                <GlassInput
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        )}
                        {isLogin && (
                            <div>
                                <GlassInput
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        )}

                        <GlassButton
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600/50 hover:bg-blue-600/70 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    {isLogin ? <LogIn size={20} /> : <User size={20} />}
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                </>
                            )}
                        </GlassButton>
                    </form>

                    {isLogin && (
                        <div className="text-right mb-4">
                            <button
                                onClick={handleForgotPassword}
                                className="text-xs text-white/40 hover:text-white/60 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-black text-white/40 uppercase">Or continue with</span>
                        </div>
                    </div>

                    <GlassButton
                        onClick={handleGoogleSignIn}
                        className="w-full bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 mb-4"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </GlassButton>

                    <div className="text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-blue-400 hover:text-blue-300 underline"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
