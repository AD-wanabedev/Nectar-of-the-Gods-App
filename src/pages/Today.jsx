import { Plus, Mic, Search, Phone, Calendar, Clock, Users, DollarSign, Star, ShoppingBag, Edit2, TrendingUp } from 'lucide-react';
import InspirationalQuote from '../components/InspirationalQuote';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GoalRing from '../components/ui/GoalRing';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { format, isBefore, isToday, parseISO, startOfToday, getHours } from 'date-fns';

export default function Today() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const data = await db.leads.getAll();
                setLeads(data);
            } catch (error) {
                console.error("Error fetching leads:", error);
            }
        };
        fetchLeads();
    }, []);

    const today = startOfToday();
    const currentHour = getHours(new Date());

    const greeting = useMemo(() => {
        if (currentHour < 12) return "Good Morning";
        if (currentHour < 18) return "Good Afternoon";
        return "Good Evening";
    }, [currentHour]);

    // --- Metrics Calculations (Memoized for performance) ---
    const metrics = useMemo(() => {
        const totalLeads = leads.length;
        const revenue = leads.reduce((sum, l) => sum + (parseFloat(l.orderValue) || 0), 0);
        const highPriorityCount = leads.filter(l => l.priority === 'High').length;
        const salesCount = leads.filter(l => (parseFloat(l.orderValue) || 0) > 0).length;

        // Goals (Mock targets for visualization)
        const revenueGoal = 50000;
        const revenueProgress = Math.min((revenue / revenueGoal) * 100, 100);

        const callsMade = leads.filter(l => l.platform === 'Call').length; // Mock metric
        const callsGoal = 10;
        const callsProgress = Math.min((callsMade / callsGoal) * 100, 100);

        return {
            totalLeads,
            revenue,
            highPriorityCount,
            salesCount,
            revenueGoal,
            revenueProgress,
            callsMade,
            callsProgress
        };
    }, [leads]);

    const overdueItems = useMemo(() => leads.filter(l => {
        if (!l.nextFollowUp) return false;
        const date = parseISO(l.nextFollowUp);
        return isBefore(date, today) && l.status !== 'Closed';
    }), [leads, today]);

    const todayFollowUps = useMemo(() => leads.filter(l => {
        if (!l.nextFollowUp) return false;
        const date = parseISO(l.nextFollowUp);
        return isToday(date) && l.status !== 'Closed';
    }), [leads, today]);

    return (
        <div className="pb-24 pt-6 px-4">
            <header className="mb-6">
                <h1 className="text-3xl font-light text-gray-900 dark:text-white">
                    {greeting}, <span className="font-bold text-brand-gold">Angad</span>
                </h1>
                <p className="text-brand-dark/60 dark:text-white/60 text-sm mt-1">
                    Here is your daily briefing.
                </p>
            </header>

            <InspirationalQuote />

            <div className="space-y-8 mt-6">
                {/* Goal Rings - The Cockpit */}
                <div className="flex items-center justify-around">
                    <GoalRing
                        progress={metrics.revenueProgress}
                        value={`₹${(metrics.revenue / 1000).toFixed(1)}k`}
                        label="Revenue"
                        icon={TrendingUp}
                        color="text-brand-gold"
                    />
                    <GoalRing
                        progress={metrics.callsProgress}
                        value={metrics.callsMade}
                        label="Calls Made"
                        icon={Phone}
                        color="text-blue-500"
                    />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 justify-center">
                    <GlassButton onClick={() => navigate('/leads')} className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-brand-gold/20 hover:bg-brand-gold/30 border border-brand-gold/30 text-brand-gold shadow-lg shadow-brand-gold/10">
                        <Plus size={24} />
                    </GlassButton>
                    <GlassButton onClick={() => navigate('/leads')} className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-brand-dark dark:text-brand-white border border-white/10">
                        <Search size={20} />
                    </GlassButton>
                </div>

                {/* Overdue Section */}
                {overdueItems.length > 0 && (
                    <section>
                        <h2 className="text-gray-800 dark:text-gray-100 text-sm font-bold mb-2">Overdue</h2>
                        <div className="space-y-3">
                            {overdueItems.map(item => (
                                <GlassCard key={item.id} className="relative overflow-hidden group hover:border-red-500/30 transition-all p-0 bg-red-500/5 border-red-500/10">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                                    <div className="flex items-center justify-between p-4 pl-6">
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{item.name}</h3>
                                            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                Due: {format(parseISO(item.nextFollowUp), 'MMM d')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <GlassButton
                                                onClick={() => navigate(`/leads`)} // Ideally open edit modal
                                                className="p-2 h-9 w-9 rounded-full bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-red-500/20 hover:text-red-500"
                                            >
                                                <Edit2 size={16} />
                                            </GlassButton>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </section>
                )}

                {/* Today's Follow-ups */}
                <section>
                    <h2 className="text-gray-800 dark:text-gray-100 text-sm font-bold mb-2">Today's Focus</h2>
                    <div className="space-y-3">
                        {todayFollowUps.length === 0 ? (
                            <GlassCard className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm border-dashed">
                                No follow-ups scheduled for today.
                                <br />
                                <span className="text-xs opacity-70">Enjoy the calm or find a new lead!</span>
                            </GlassCard>
                        ) : (
                            todayFollowUps.map((item) => (
                                <GlassCard key={item.id} className="group p-0 relative overflow-hidden transition-all hover:border-brand-gold/30 hover:shadow-lg hover:shadow-brand-gold/5">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.priority === 'High' ? 'bg-red-400' :
                                        item.priority === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'
                                        }`} />

                                    <div className="flex items-center justify-between p-4 pl-6">
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate pr-2">
                                                {item.name}
                                            </h3>

                                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <Clock size={12} className="text-brand-gold" />
                                                    {format(parseISO(item.nextFollowUp), 'h:mm a')}
                                                </span>
                                                {item.phone && (
                                                    <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                                                        <Phone size={10} /> {item.phone}
                                                    </span>
                                                )}
                                            </div>

                                            {item.honeyTypes && item.honeyTypes.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-black/5 dark:border-white/5">
                                                        {Array.isArray(item.honeyTypes) ? item.honeyTypes[0] : item.honeyTypes}
                                                        {Array.isArray(item.honeyTypes) && item.honeyTypes.length > 1 && ` +${item.honeyTypes.length - 1}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <GlassButton
                                            onClick={(e) => { e.stopPropagation(); navigate(`/leads`); }}
                                            className="p-2 h-9 w-9 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-400 dark:text-gray-500 group-hover:text-brand-gold group-hover:border-brand-gold/20 transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </GlassButton>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </section>

                {/* Upcoming Preview */}
                <section>
                    <h2 className="text-brand-dark/80 dark:text-white/80 text-sm font-semibold mb-2 px-1">Upcoming</h2>
                    <GlassCard className="bg-blue-500/5 border-blue-500/10 py-6">
                        <p className="text-center text-brand-dark/40 dark:text-white/40 text-sm">Check "Leads" for future follow-ups</p>
                    </GlassCard>
                </section>
            </div>
        </div>
    );
}
