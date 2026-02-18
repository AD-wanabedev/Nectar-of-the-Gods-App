import { Plus, Mic, Search, Phone, Calendar, Clock, Users, DollarSign, Star, ShoppingBag, Edit2 } from 'lucide-react';
import InspirationalQuote from '../components/InspirationalQuote';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { format, isBefore, isToday, parseISO, startOfToday } from 'date-fns';

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
                // alert("Error loading leads. Please check your connection.");
            }
        };
        fetchLeads();
    }, []);

    const today = startOfToday();

    // --- Metrics Calculations (Memoized for performance) ---
    const metrics = useMemo(() => {
        return {
            totalLeads: leads.length,
            revenue: leads.reduce((sum, l) => sum + (parseFloat(l.orderValue) || 0), 0),
            highPriorityCount: leads.filter(l => l.priority === 'High').length,
            salesCount: leads.filter(l => (parseFloat(l.orderValue) || 0) > 0).length
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
            <InspirationalQuote />

            <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <GlassCard className="p-3 flex flex-col items-center justify-center gap-1 bg-black/5 dark:bg-white/10 border-brand-gold/20">
                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 mb-1">
                            <Users size={18} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalLeads}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Leads</span>
                    </GlassCard>

                    <GlassCard className="p-3 flex flex-col items-center justify-center gap-1 bg-black/5 dark:bg-white/10 border-brand-gold/20">
                        <div className="p-2 rounded-full bg-green-500/10 text-green-400 mb-1">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.revenue.toLocaleString()}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Revenue</span>
                    </GlassCard>

                    <GlassCard className="p-3 flex flex-col items-center justify-center gap-1 bg-black/5 dark:bg-white/10 border-brand-gold/20">
                        <div className="p-2 rounded-full bg-red-500/10 text-red-400 mb-1">
                            <Star size={18} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.highPriorityCount}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">High Priority</span>
                    </GlassCard>

                    <GlassCard className="p-3 flex flex-col items-center justify-center gap-1 bg-black/5 dark:bg-white/10 border-brand-gold/20">
                        <div className="p-2 rounded-full bg-brand-gold/10 text-brand-gold mb-1">
                            <ShoppingBag size={18} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.salesCount}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Sales</span>
                    </GlassCard>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 justify-center mb-6">
                    <GlassButton onClick={() => navigate('/leads')} className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/30 text-pink-500">
                        <Plus size={24} />
                    </GlassButton>
                    <GlassButton onClick={() => navigate('/leads')} className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-white">
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
