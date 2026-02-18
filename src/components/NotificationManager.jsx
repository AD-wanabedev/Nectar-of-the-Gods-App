import { useState, useEffect } from 'react';
import { leadsDB } from '../db';
import { differenceInMinutes, parseISO } from 'date-fns';

export default function NotificationManager() {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (permission === 'default') {
            Notification.requestPermission().then(setPermission);
        }
    }, [permission]);

    useEffect(() => {
        if (permission !== 'granted') return;

        const checkFollowUps = async () => {
            try {
                const leads = await leadsDB.getAll();
                const now = new Date();

                leads.forEach(lead => {
                    if (!lead.nextFollowUp) return;

                    const followUpTime = parseISO(lead.nextFollowUp);
                    const diff = differenceInMinutes(followUpTime, now);

                    // Notify if due within the next 2 minutes or slightly past due (up to 5 mins ago)
                    // We use a local storage key to prevent duplicate notifications for the same time slot
                    if (diff >= -5 && diff <= 2) {
                        const notifKey = `notif-${lead.id}-${followUpTime.toISOString()}`;
                        if (!sessionStorage.getItem(notifKey)) {
                            new Notification(`Follow-up Due: ${lead.name}`, {
                                body: `Call ${lead.name} (${lead.phone}) now!`,
                                icon: '/pwa-192x192.png' // Ensure this path is correct based on public folder
                            });
                            sessionStorage.setItem(notifKey, 'true');
                        }
                    }
                });
            } catch (error) {
                console.error("Notification check failed:", error);
            }
        };

        // Check every minute
        const intervalId = setInterval(checkFollowUps, 60000);

        // Initial check
        checkFollowUps();

        return () => clearInterval(intervalId);
    }, [permission]);

    return null; // Logic-only component
}
