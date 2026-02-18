import { useState, useEffect } from 'react';
import { leadsDB } from '../db';
import GlassCard from '../components/ui/GlassCard';
import { TrendingUp, DollarSign, BarChart2, Calendar, ShoppingBag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

const COLORS = ['#a07b32', '#fdcca6', '#f6f2e9', '#292929', '#ff8042', '#0088fe'];

export default function Sales() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        weeklyRevenue: 0,
        totalSales: 0,
        averageOrderValue: 0
    });
    const [honeyData, setHoneyData] = useState([]);
    const [dailyData, setDailyData] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const allLeads = await leadsDB.getAll();

            // Filter only leads with order value > 0 (Sales)
            const sales = allLeads.filter(l => l.orderValue && parseFloat(l.orderValue) > 0);

            processStats(sales);
            setLeads(sales);
        } catch (error) {
            console.error("Failed to load sales data:", error);
        } finally {
            setLoading(false);
        }
    };

    const processStats = (sales) => {
        let totalRev = 0;
        let weeklyRev = 0;
        const honeyCounts = {};
        const dailyRevenue = {};

        const weekAgo = subDays(new Date(), 7);

        sales.forEach(sale => {
            const val = parseFloat(sale.orderValue) || 0;
            totalRev += val;

            const saleDate = sale.saleDate ? new Date(sale.saleDate) : new Date(sale.created || Date.now());

            if (saleDate >= weekAgo) {
                weeklyRev += val;
            }

            // Honey Distribution
            const type = sale.honeyType || 'Unknown';
            honeyCounts[type] = (honeyCounts[type] || 0) + 1;

            // Daily Revenue (Last 7 days for chart)
            const dateKey = format(saleDate, 'MMM d');
            dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + val;
        });

        // Format Honey Data for Chart
        const hData = Object.keys(honeyCounts).map(key => ({
            name: key,
            value: honeyCounts[key]
        })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

        // Format Daily Data
        const dData = Object.keys(dailyRevenue).map(key => ({
            name: key,
            revenue: dailyRevenue[key]
        }));

        setStats({
            totalRevenue: totalRev,
            weeklyRevenue: weeklyRev,
            totalSales: sales.length,
            averageOrderValue: sales.length > 0 ? totalRev / sales.length : 0
        });
        setHoneyData(hData);
        setDailyData(dData);
    };

    if (loading) return <div className="p-8 text-center text-brand-white/50 animate-pulse">Loading Sales Data...</div>;

    return (
        <div className="pb-24 pt-4 space-y-6">
            <h1 className="text-2xl font-bold text-brand-white px-2">Sales Dashboard</h1>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 flex flex-col items-center justify-center border-brand-gold/20">
                    <p className="text-brand-white/40 text-xs uppercase tracking-wider mb-1">Total Revenue</p>
                    <h2 className="text-2xl font-bold text-brand-gold">₹{stats.totalRevenue.toLocaleString()}</h2>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center border-brand-white/5">
                    <p className="text-brand-white/40 text-xs uppercase tracking-wider mb-1">Weekly Revenue</p>
                    <h2 className="text-xl font-bold text-brand-peach">₹{stats.weeklyRevenue.toLocaleString()}</h2>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center border-brand-white/5">
                    <p className="text-brand-white/40 text-xs uppercase tracking-wider mb-1">Total Orders</p>
                    <h2 className="text-xl font-bold text-brand-white">{stats.totalSales}</h2>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center border-brand-white/5">
                    <p className="text-brand-white/40 text-xs uppercase tracking-wider mb-1">Avg. Order</p>
                    <h2 className="text-xl font-bold text-brand-white">₹{Math.round(stats.averageOrderValue).toLocaleString()}</h2>
                </GlassCard>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Honey Distribution */}
                <GlassCard className="p-6 h-[300px]">
                    <h3 className="text-sm font-bold text-brand-white mb-4 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-brand-gold" /> Top Products
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={honeyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {honeyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#292929', borderColor: '#a07b32', borderRadius: '8px' }}
                                itemStyle={{ color: '#f6f2e9' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Daily Revenue Trend */}
                <GlassCard className="p-6 h-[300px]">
                    <h3 className="text-sm font-bold text-brand-white mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-brand-peach" /> Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                            <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip
                                cursor={{ fill: '#ffffff10' }}
                                contentStyle={{ backgroundColor: '#292929', borderColor: '#a07b32', borderRadius: '8px' }}
                                itemStyle={{ color: '#f6f2e9' }}
                            />
                            <Bar dataKey="revenue" fill="#a07b32" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Recent Sales List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-brand-white px-2 uppercase tracking-wide opacity-50">Recent Sales</h3>
                {leads.slice(0, 5).map(sale => (
                    <GlassCard key={sale.id} className="p-4 flex justify-between items-center group hover:bg-brand-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold">
                                ₹
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-white text-sm">{sale.name}</h4>
                                <p className="text-xs text-brand-white/50">{sale.honeyType || 'Product'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-brand-gold">₹{parseFloat(sale.orderValue).toLocaleString()}</p>
                            <p className="text-[10px] text-brand-white/30">
                                {sale.saleDate ? format(new Date(sale.saleDate), 'MMM d') : format(new Date(), 'MMM d')}
                            </p>
                        </div>
                    </GlassCard>
                ))}
                {leads.length === 0 && (
                    <div className="text-center py-10 text-brand-white/30 italic">
                        No sales recorded yet.
                    </div>
                )}
            </div>
        </div>
    );
}
