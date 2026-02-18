import React from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-4">
                    <GlassCard className="max-w-md w-full p-8 text-center border-red-500/30 bg-red-900/10">
                        <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
                        <p className="text-white/60 mb-6">
                            The application encountered an unexpected error.
                        </p>
                        <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32">
                            <code className="text-red-400 text-xs font-mono">
                                {this.state.error?.toString()}
                            </code>
                        </div>
                        <GlassButton
                            onClick={() => window.location.reload()}
                            className="w-full justify-center"
                        >
                            Reload Application
                        </GlassButton>
                    </GlassCard>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
