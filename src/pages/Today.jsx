import { Plus, Mic, Search, Phone, Calendar, Clock } from 'lucide-react';
import InspirationalQuote from '../components/InspirationalQuote';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

    const overdueItems = leads.filter(l => {
        const date = parseISO(l.nextFollowUp);
        return isBefore(date, today) && l.status !== 'Closed';
    });

    const todayFollowUps = leads.filter(l => {
        const date = parseISO(l.nextFollowUp);
        return isToday(date) && l.status !== 'Closed';
    });

    return (
        <div className="pb-24 pt-6 px-4">
            <InspirationalQuote />

            <div className="space-y-6">
                {/* Quick Actions */}
                <div className="flex gap-3 justify-center mb-6">
                    <GlassButton onClick={() => navigate('/leads')} className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/30">
                        <Plus size={24} />
                    </GlassButton>
                    <GlassButton onClick={() => navigate('/leads')} className="rounded-full w-12 h-12 p-0 flex items-center justify-center">
                        <Search size={20} />
                    </GlassButton>
                </div>

                {/* Overdue Section */}
                {overdueItems.length > 0 && (
                    <section>
                        <h2 className="text-white/80 text-sm font-semibold mb-2 px-1">Overdue</h2>
                        <div className="space-y-2">
                            {overdueItems.map(item => (
                                <GlassCard key={item.id} className="bg-red-500/10 border-red-500/20 p-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-white">{item.name}</p>
                                        <p className="text-xs text-white/60">Due: {format(parseISO(item.nextFollowUp), 'MMM d')}</p>
                                    </div>
                                    <GlassButton variant="danger" className="p-2 h-8 w-8 rounded-full">
                                        <Phone size={14} />
                                    </GlassButton>
                                </GlassCard>
                            ))}
                        </div>
                    </section>
                )}

                {/* Today's Follow-ups */}
                <section>
                    <h2 className="text-white/80 text-sm font-semibold mb-2 px-1">Today's Focus</h2>
                    <div className="space-y-3">
                        {todayFollowUps.length === 0 ? (
                            <GlassCard className="p-4 text-center text-white/40 text-sm">
                                No follow-ups scheduled for today.
                                <br />
                                <span className="text-xs">Take a break or find a new lead!</span>
                            </GlassCard>
                        ) : (
                            todayFollowUps.map((item) => (
                                <GlassCard key={item.id} className="flex flex-row items-center justify-between p-3 active:scale-98">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-10 rounded-full ${item.priority === 'High' ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' :
                                            item.priority === 'Medium' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-blue-400'
                                            }`} />
                                        <div>
                                            <h3 className="text-white font-medium">{item.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <span className="flex items-center gap-1"><Clock size={10} /> {format(parseISO(item.nextFollowUp), 'h:mm a')}</span>
                                                {/* <span>•</span> */}
                                                {/* <span>{item.type}</span>  -- Type not in schema yet, assumed Call */}
                                            </div>
                                        </div>
                                    </div>
                                    {/* <GlassButton variant="secondary" className="p-2 rounded-full h-8 w-8 !bg-white/10">
                                        <Phone size={14} />
                                    </GlassButton> */}
                                </GlassCard>
                            ))
                        )}
                    </div>
                </section>

                {/* Upcoming Preview */}
                <section>
                    <h2 className="text-white/80 text-sm font-semibold mb-2 px-1">Upcoming</h2>
                    <GlassCard className="bg-blue-500/5 border-blue-500/10 py-6">
                        <p className="text-center text-white/40 text-sm">Check "Leads" for future follow-ups</p>
                    </GlassCard>
                </section>
            </div>
        </div>
    );
}
