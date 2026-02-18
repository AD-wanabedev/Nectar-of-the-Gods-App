import { useEffect, useState } from 'react';
import useDrivePicker from 'react-google-drive-picker';
import { Cloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DrivePicker({ onPick, clientId, developerKey }) {
    const [openPicker, authResponse] = useDrivePicker();
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleOpenPicker = () => {
        setStatus('loading');
        try {
            openPicker({
                clientId: clientId,
                developerKey: developerKey,
                viewId: "DOCS",
                showUploadView: true,
                showUploadFolders: true,
                supportDrives: true,
                multiselect: true,
                callbackFunction: (data) => {
                    if (data.action === 'picked') {
                        setStatus('success');
                        onPick(data.docs);
                        setTimeout(() => setStatus('idle'), 3000);
                    } else if (data.action === 'cancel') {
                        setStatus('idle');
                    }
                },
            });
        } catch (error) {
            console.error("Drive Picker Error:", error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <button
            onClick={handleOpenPicker}
            className="group relative w-full overflow-hidden rounded-xl bg-brand-white/5 border border-brand-white/10 p-6 text-left transition-all hover:border-brand-gold/50 hover:bg-brand-white/10 hover:shadow-glass-hover"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Cloud size={100} className="text-brand-gold" />
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold group-hover:scale-110 transition-transform">
                    {status === 'loading' ? <Loader2 size={24} className="animate-spin" /> :
                        status === 'success' ? <CheckCircle size={24} /> :
                            status === 'error' ? <AlertCircle size={24} /> :
                                <Cloud size={24} />}
                </div>

                <div>
                    <h3 className="text-lg font-bold text-brand-white group-hover:text-brand-gold transition-colors">
                        Google Drive
                    </h3>
                    <p className="text-sm text-brand-white/50">
                        {status === 'error' ? 'Connection failed. Try again.' :
                            status === 'success' ? 'Files imported successfully!' :
                                'Import documents, sheets, and images directly.'}
                    </p>
                </div>
            </div>
        </button>
    );
}
