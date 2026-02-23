import { useState, useEffect, useMemo } from 'react';
import { leadsDB } from '../db';
import GlassCard from '../components/ui/GlassCard';
import {
    TrendingUp, DollarSign, BarChart2, Calendar, ShoppingBag,
    Users, Target, Award, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, subDays, isSameDay, parseISO, startOfMonth, subMonths } from 'date-fns';

// Brand Palette (Gold & Peach)
const COLORS = ['#a07b32', '#fdcca6', '#c49a45', '#eeb085', '#8c6b2b', '#ffe4cc'];

export default function Sales() {
    const [allLeads, setAllLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await leadsDB.getAll();
            setAllLeads(data);
        } catch (error) {
            console.error("Failed to load leads data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Complex Aggregations using useMemo ---
    const dashboardData = useMemo(() => {
        if (!allLeads.length) return null;

        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const startOfLastMonth = startOfMonth(subMonths(now, 1));
        const weekAgo = subDays(now, 7);
        const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);

        // --- Collections ---
        const salesOnly = allLeads.filter(l => l.orderValue && parseFloat(l.orderValue) > 0);

        // --- Core Lead Metrics ---
        const totalLeads = allLeads.length;
        const totalSales = salesOnly.length;
        const conversionRate = totalLeads ? ((totalSales / totalLeads) * 100).toFixed(1) : 0;

        // --- Core Revenue Metrics ---
        const totalRevenue = salesOnly.reduce((sum, l) => sum + (parseFloat(l.orderValue) || 0), 0);
        const averageOrderValue = totalSales ? (totalRevenue / totalSales) : 0;

        // --- Time-Based Revenue Trends ---
        let revenueThisMonth = 0;
        let revenueLastMonth = 0;
        let leadsThisWeek = 0;
        let leadsThisMonth = 0;
        const monthlyRevenueMap = {};

        // Initialize months for chart
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), i, 1);
            monthlyRevenueMap[format(d, 'yyyy-MM')] = 0;
        }

        // --- Breakdowns ---
        const priorityCounts = { High: 0, Medium: 0, Low: 0 };
        const statusCounts = { New: 0, 'In Progress': 0, Converted: 0, Lost: 0 };
        const teamMemberCounts = {};
        const sourceCounts = {};
        const b2cCount = allLeads.filter(l => l.leadType === 'B2C').length;
        const b2bCount = allLeads.filter(l => l.leadType === 'B2B').length;
        const b2bCategories = {};
        const honeyCounts = {};

        allLeads.forEach(lead => {
            const createdDate = lead.created ? new Date(lead.created) : new Date(Date.now() - 86400000); // fallback

            // Time filters
            if (createdDate >= weekAgo) leadsThisWeek++;
            if (createdDate >= startOfThisMonth) leadsThisMonth++;

            // Breakdowns
            if (lead.priority) priorityCounts[lead.priority] = (priorityCounts[lead.priority] || 0) + 1;
            if (lead.status) statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
            if (lead.teamMember) teamMemberCounts[lead.teamMember] = (teamMemberCounts[lead.teamMember] || 0) + 1;
            if (lead.platform) sourceCounts[lead.platform] = (sourceCounts[lead.platform] || 0) + 1;

            if (lead.leadType === 'B2B' && lead.leadSubType) {
                b2bCategories[lead.leadSubType] = (b2bCategories[lead.leadSubType] || 0) + 1;
            }

            // Sales/Revenue Specific
            if (lead.orderValue && parseFloat(lead.orderValue) > 0) {
                const val = parseFloat(lead.orderValue);
                const saleDate = lead.saleDate ? new Date(lead.saleDate) : createdDate;

                if (saleDate >= startOfThisMonth) revenueThisMonth += val;
                else if (saleDate >= startOfLastMonth) revenueLastMonth += val;

                if (saleDate >= startOfCurrentYear) {
                    const key = format(saleDate, 'yyyy-MM');
                    if (monthlyRevenueMap[key] !== undefined) monthlyRevenueMap[key] += val;
                }

                // Honey Products Sold
                const types = lead.honeyTypes && lead.honeyTypes.length > 0
                    ? lead.honeyTypes
                    : (lead.honeyType ? [lead.honeyType] : ['Unknown']);

                types.forEach(type => {
                    honeyCounts[type] = (honeyCounts[type] || 0) + 1;
                });
            }
        });

        // Format data for Recharts
        const honeyChartData = Object.keys(honeyCounts)
            .map(name => ({ name, value: honeyCounts[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const revenueChartData = Object.keys(monthlyRevenueMap).sort().map(key => ({
            name: format(parseISO(key + '-01'), 'MMM'),
            revenue: monthlyRevenueMap[key]
        }));

        // Growth metrics
        const revenueGrowth = revenueLastMonth === 0
            ? 100
            : Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100);

        return {
            totalLeads, totalSales, conversionRate, totalRevenue, averageOrderValue,
            revenueThisMonth, revenueLastMonth, revenueGrowth, leadsThisWeek, leadsThisMonth,
            priorityCounts, statusCounts, teamMemberCounts, sourceCounts,
            b2cCount, b2bCount, b2bCategories,
            honeyChartData, revenueChartData, recentSales: salesOnly.slice(-5).reverse()
        };

    }, [allLeads]);

    if (loading) return <div className="p-8 text-center text-brand-dark/50 dark:text-brand-white/50 animate-pulse">Computing Analytics...</div>;
    if (!dashboardData) return <div className="p-8 text-center text-brand-dark/50 dark:text-brand-white/50">No data available for analytics.</div>;

    const {
        totalLeads, totalSales, conversionRate, totalRevenue, averageOrderValue, revenueGrowth,
        priorityCounts, statusCounts, teamMemberCounts, sourceCounts, b2cCount, b2bCount, b2bCategories,
        honeyChartData, revenueChartData, recentSales
    } = dashboardData;

    // Helper components
    const MetricCard = ({ title, value, icon: Icon, trend, prefix = '', suffix = '', colorClass = 'text-brand-gold' }) => (
        <GlassCard className="p-4 flex flex-col justify-between border-brand-white/5 hover:border-brand-gold/30 transition-all">
            <div className="flex justify-between items-start mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                <div className={`p-2 rounded-full bg-brand-dark/5 dark:bg-brand-white/10 ${colorClass}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <h2 className={`text-2xl font-bold ${colorClass}`}>
                    {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                </h2>
                {trend !== undefined && (
                    <div className={`flex items-center text-xs font-bold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
        </GlassCard>
    );

    const BreakdownBar = ({ label, value, total, colorHex }) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{value} ({Math.round(percentage)}%)</span>
                </div>
                <div className="w-full bg-brand-dark/10 dark:bg-brand-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: colorHex }} />
                </div>
            </div>
        );
    };

    return (
        <div className="pb-28 pt-4 px-2 space-y-6">
            <header className="px-2">
                <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-white flex items-center gap-2">
                    <TrendingUp className="text-brand-gold" />
                    Sales Analytics
                </h1>
                <p className="text-xs text-brand-dark/60 dark:text-brand-white/60 mt-1 uppercase tracking-wider">
                    Comprehensive Business Performance
                </p>
            </header>

            {/* Core Revenue Metrics */}
            <div className="grid grid-cols-2 gap-3">
                <MetricCard title="Total Revenue" value={totalRevenue} prefix="₹" icon={DollarSign} trend={revenueGrowth} />
                <MetricCard title="Sales (Converted)" value={totalSales} icon={Award} colorClass="text-brand-peach" />
                <MetricCard title="Avg Order Value" value={Math.round(averageOrderValue)} prefix="₹" icon={Target} colorClass="text-blue-400" />
                <MetricCard title="Conversion Rate" value={conversionRate} suffix="%" icon={TrendingUp} colorClass="text-green-400" />
            </div>

            {/* Core Lead Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                    <h3 className="text-sm font-bold text-brand-dark dark:text-brand-white mb-4 flex items-center gap-2">
                        <Users size={16} className="text-brand-gold" /> Lead Overview ({totalLeads} Total)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">By Priority</p>
                            <BreakdownBar label="High Priority" value={priorityCounts.High} total={totalLeads} colorHex="#ef4444" />
                            <BreakdownBar label="Medium Priority" value={priorityCounts.Medium} total={totalLeads} colorHex="#f59e0b" />
                            <BreakdownBar label="Low Priority" value={priorityCounts.Low} total={totalLeads} colorHex="#3b82f6" />
                        </div>
                        <div className="pt-2 border-t border-brand-white/10">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">By Status</p>
                            <BreakdownBar label="New" value={statusCounts.New} total={totalLeads} colorHex="#8b5cf6" />
                            <BreakdownBar label="In Progress" value={statusCounts['In Progress']} total={totalLeads} colorHex="#3b82f6" />
                            <BreakdownBar label="Converted" value={statusCounts.Converted} total={totalLeads} colorHex="#10b981" />
                            <BreakdownBar label="Lost" value={statusCounts.Lost} total={totalLeads} colorHex="#ef4444" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-sm font-bold text-brand-dark dark:text-brand-white mb-4 flex items-center gap-2">
                        <PieChartIcon size={16} className="text-brand-gold" /> Segments & Sources
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">B2B vs B2C</p>
                            <BreakdownBar label="B2B Clients" value={b2bCount} total={totalLeads} colorHex="#c49a45" />
                            <BreakdownBar label="B2C Consumers" value={b2cCount} total={totalLeads} colorHex="#fdcca6" />
                        </div>
                        {b2bCount > 0 && (
                            <div className="pt-2 border-t border-brand-white/10">
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">B2B Categories</p>
                                {Object.entries(b2bCategories)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([cat, count], idx) => (
                                        <BreakdownBar key={cat} label={cat} value={count} total={b2bCount} colorHex={COLORS[idx % COLORS.length]} />
                                    ))}
                            </div>
                        )}
                        <div className="pt-2 border-t border-brand-white/10">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Lead Sources</p>
                            {Object.entries(sourceCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([source, count], idx) => (
                                    <BreakdownBar key={source} label={source} value={count} total={totalLeads} colorHex={['#E1306C', '#25D366', '#4285F4', '#EA4335'][idx % 4] || '#888'} />
                                ))}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Shared Charts */}
            <div className="grid grid-cols-1 gap-6">
                {/* Honey Distribution */}
                <GlassCard className="p-6 h-[400px]">
                    <h3 className="text-sm font-bold text-brand-dark dark:text-brand-white mb-4 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-brand-gold" /> Top Revenue Products
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
                                data={honeyChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {honeyChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#a07b32', borderRadius: '12px', color: '#f6f2e9', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#f6f2e9', fontWeight: 'bold' }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value) => <span className="text-gray-800 dark:text-gray-200 text-xs font-medium">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Daily Revenue Trend */}
                <GlassCard className="p-6 h-[350px]">
                    <h3 className="text-sm font-bold text-brand-dark dark:text-brand-white mb-4 flex items-center gap-2">
                        <BarChart2 size={16} className="text-brand-peach" /> Multi-Month Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueChartData}>
                            <XAxis dataKey="name" stroke="#a07b32" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#a07b32" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`} />
                            <Tooltip
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#a07b32', borderRadius: '12px', color: '#f6f2e9' }}
                                itemStyle={{ color: '#f6f2e9', fontWeight: 'bold', fontSize: '16px' }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#a07b32" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Team Performance */}
            <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-brand-dark dark:text-brand-white mb-4 flex items-center gap-2">
                    <Target size={16} className="text-brand-gold" /> Team Ownership Overview
                </h3>
                <div className="grid gap-3">
                    {Object.entries(teamMemberCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([member, count], idx) => (
                            <div key={member} className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold text-xs">
                                        {member.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{member}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-500 bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full">
                                    {count} Leads
                                </span>
                            </div>
                        ))}
                </div>
            </GlassCard>

        </div>
    );
}
