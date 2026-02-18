import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import { Smartphone, Ban, CheckCircle, Save, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function Settings() {
    const [devices, setDevices] = useState([]);
    const [currentDeviceId, setCurrentDeviceId] = useState('');
    const [sheetUrl, setSheetUrl] = useState('');
    const [savingSheet, setSavingSheet] = useState(false);

    useEffect(() => {
        setCurrentDeviceId(localStorage.getItem('nectar_device_id'));
        const loadSettings = () => {
            const storedUrl = localStorage.getItem('nectar_sheet_url');
            if (storedUrl) setSheetUrl(storedUrl);
        }
        loadSettings();

        if (!auth.currentUser) return;

        const q = query(collection(db, 'users', auth.currentUser.uid, 'devices'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const deviceList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDevices(deviceList.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive)));
        });

        return () => unsubscribe();
    }, []);

    const toggleBlock = async (device) => {
        if (device.id === currentDeviceId) {
            alert("You cannot block your current device.");
            return;
        }
        if (confirm(`${device.blocked ? 'Unblock' : 'Block'} this device?`)) {
            try {
                await updateDoc(doc(db, 'users', auth.currentUser.uid, 'devices', device.id), {
                    blocked: !device.blocked
                });
            } catch (error) {
                console.error("Error updating device:", error);
                alert("Failed to update device status.");
            }
        }
    };

    const saveSheetUrl = () => {
        setSavingSheet(true);
        localStorage.setItem('nectar_sheet_url', sheetUrl);
        setTimeout(() => setSavingSheet(false), 1000);
    };

    return (
        <div className="pb-24 pt-6 px-4 space-y-8">
            <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-white">Settings & Privacy</h1>

            {/* Device Management */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-brand-dark/80 dark:text-white/80 flex items-center gap-2">
                    <Smartphone size={20} /> Active Devices
                </h2>
                <div className="space-y-3">
                    {devices.map(device => {
                        const isCurrent = device.id === currentDeviceId;
                        return (
                            <GlassCard key={device.id} className={`p-4 flex justify-between items-center ${device.blocked ? 'opacity-50 grayscale' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-brand-dark dark:text-white text-sm">
                                            {device.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop/Laptop'}
                                        </p>
                                        {isCurrent && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">This Device</span>}
                                        {device.blocked && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">BLOCKED</span>}
                                    </div>
                                    <p className="text-xs text-brand-dark/50 dark:text-white/50 truncate max-w-[200px]" title={device.userAgent}>
                                        {device.userAgent}
                                    </p>
                                    <p className="text-[10px] text-brand-dark/40 dark:text-white/40 mt-1">
                                        Last active: {device.lastActive ? format(new Date(device.lastActive), 'MMM d, h:mm a') : 'Unknown'}
                                    </p>
                                </div>
                                {!isCurrent && (
                                    <GlassButton
                                        onClick={() => toggleBlock(device)}
                                        variant={device.blocked ? "secondary" : "danger"}
                                        className="text-xs px-3 py-1.5"
                                    >
                                        {device.blocked ? 'Unblock' : 'Block'}
                                    </GlassButton>
                                )}
                            </GlassCard>
                        );
                    })}
                </div>
            </section>

            {/* Master Tracker Sync */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-brand-dark/80 dark:text-white/80 flex items-center gap-2">
                    <ExternalLink size={20} /> Master Tracker Sync
                </h2>
                <GlassCard className="p-4 space-y-4">
                    <p className="text-xs text-brand-dark/60 dark:text-white/60">
                        Paste your Google Apps Script Web App URL here to automatically sync new leads and sales to your Google Sheet.
                    </p>
                    <div className="flex gap-2">
                        <GlassInput
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className="text-xs"
                        />
                        <GlassButton onClick={saveSheetUrl} className="bg-brand-gold/20 text-brand-gold">
                            {savingSheet ? <CheckCircle size={18} /> : <Save size={18} />}
                        </GlassButton>
                    </div>
                </GlassCard>
            </section>
        </div>
    );
}
