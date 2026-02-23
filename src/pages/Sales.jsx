import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsDB, accountsDB } from '../db';
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
    const navigate = useNavigate();
    const [allLeads, setAllLeads] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadsData, accountsData] = await Promise.all([
                leadsDB.getAll(),
                accountsDB.getAll()
            ]);
            setAllLeads(leadsData);
            setAllAccounts(accountsData);
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

        // --- Core Account Metrics (Deduped Revenue) ---
        const totalLeads = allAccounts.length; // 1 Account = 1 Real Lead Business
        const totalSales = allAccounts.filter(a => (a.totalRevenue || 0) > 0).length;
        const conversionRate = totalLeads ? ((totalSales / totalLeads) * 100).toFixed(1) : 0;

        const totalRevenue = allAccounts.reduce((sum, a) => sum + (a.totalRevenue || 0), 0);
        const averageOrderValue = totalSales ? (totalRevenue / totalSales) : 0;

        // --- Collections ---
        const salesOnly = allLeads.filter(l => l.orderValue && parseFloat(l.orderValue) > 0);

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

        // Calculate overarching pipeline health directly from Accounts
        allAccounts.forEach(acc => {
            if (acc.priority) priorityCounts[acc.priority] = (priorityCounts[acc.priority] || 0) + 1;
            if (acc.status) statusCounts[acc.status] = (statusCounts[acc.status] || 0) + 1;
        });

        allLeads.forEach(lead => {
            const createdDate = lead.created ? new Date(lead.created) : new Date(Date.now() - 86400000); // fallback

            // Time filters
            if (createdDate >= weekAgo) leadsThisWeek++;
            if (createdDate >= startOfThisMonth) leadsThisMonth++;

            // Breakdowns for granular contact insights
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

    }, [allLeads, allAccounts]);

    if (loading) return <div className="p-8 text-center text-brand-dark/50 dark:text-brand-white/50 animate-pulse">Computing Analytics...</div>;
    if (!dashboardData) return <div className="p-8 text-center text-brand-dark/50 dark:text-brand-white/50">No data available for analytics.</div>;

    const {
        totalLeads, totalSales, conversionRate, totalRevenue, averageOrderValue, revenueGrowth,
        priorityCounts, statusCounts, teamMemberCounts, sourceCounts, b2cCount, b2bCount, b2bCategories,
        honeyChartData, revenueChartData, recentSales
    } = dashboardData;

    // Helper components
    const MetricCard = ({ title, value, subtitle, icon: Icon, trend, colorClass = "text-brand-gold", onClick }) => (
        <GlassCard onClick={onClick} className={`p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-colors ${onClick ? 'cursor-pointer' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                <Icon size={80} className={colorClass} />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-xl bg-black/5 dark:bg-white/5 ${colorClass}`}>
                        <Icon size={24} />
                    </div>
                </div>
                <h3 className="text-sm font-medium text-brand-dark/60 dark:text-white/60 mb-1">{title}</h3>
                <div className="text-3xl font-bold text-brand-dark dark:text-white mb-2">{value}</div>
                {subtitle && <p className="text-xs text-brand-dark/50 dark:text-white/50 font-medium">{subtitle}</p>}
                {trend != null && (
                    <div className={`flex items-center gap-1 text-xs mt-3 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <ArrowUpRight size={14} className={trend < 0 ? 'rotate-90' : ''} />
                        <span className="font-bold">{Math.abs(trend).toFixed(1)}%</span>
                        <span className="text-brand-dark/40 dark:text-white/40 ml-1">vs last month</span>
                    </div>
                )}
            </div>
        </GlassCard>
    );

    const BreakdownBar = ({ label, count, total, color, onClick }) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
            <div onClick={onClick} className={`mb-3 group hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors ${onClick ? 'cursor-pointer' : ''}`}>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-brand-dark/70 dark:text-white/70 group-hover:text-white flex items-center gap-1.5">
                        {label} <span className="text-[10px] text-white/30">{count}</span>
                    </span>
                    <span className="font-bold text-brand-dark dark:text-white">{percentage}%</span>
                </div>
                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
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

            {/* Core Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Revenue"
                    value={`₹${(dashboardData.totalRevenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    trend={dashboardData.revenueGrowth}
                    colorClass="text-green-500"
                    onClick={() => navigate('/leads')}
                />
                <MetricCard
                    title="Total Sales"
                    value={dashboardData.totalSales}
                    subtitle={`Avg ₹${Math.round(dashboardData.averageOrderValue).toLocaleString()}`}
                    icon={ShoppingBag}
                    colorClass="text-brand-gold"
                    onClick={() => navigate('/leads', { state: { filterStatus: 'Converted' } })}
                />
                <MetricCard
                    title="Active Pipeline"
                    value={dashboardData.totalLeads}
                    subtitle="+ Active Businesses"
                    icon={Users}
                    colorClass="text-blue-500"
                    onClick={() => navigate('/leads', { state: { filterStatus: 'In Progress' } })}
                />
                <MetricCard
                    title="Conversion Rate"
                    value={`${dashboardData.conversionRate}%`}
                    subtitle="Lead to Sale"
                    icon={TrendingUp}
                    colorClass="text-purple-500"
                />
            </div>

            {/* Pipeline Health & Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-brand-dark/50 dark:text-white/50 uppercase tracking-widest mb-6">Status Pipeline</h3>
                    <BreakdownBar label="Converted" count={dashboardData.statusCounts['Converted']} total={dashboardData.totalLeads} color="bg-green-500" onClick={() => navigate('/leads', { state: { filterStatus: 'Converted' } })} />
                    <BreakdownBar label="In Progress" count={dashboardData.statusCounts['In Progress']} total={dashboardData.totalLeads} color="bg-blue-500" onClick={() => navigate('/leads', { state: { filterStatus: 'In Progress' } })} />
                    <BreakdownBar label="New Leads" count={dashboardData.statusCounts['New']} total={dashboardData.totalLeads} color="bg-purple-500" onClick={() => navigate('/leads', { state: { filterStatus: 'New' } })} />
                    <BreakdownBar label="Lost" count={dashboardData.statusCounts['Lost']} total={dashboardData.totalLeads} color="bg-red-500" onClick={() => navigate('/leads', { state: { filterStatus: 'Lost' } })} />
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-brand-dark/50 dark:text-white/50 uppercase tracking-widest mb-6">Priority Distribution</h3>
                    <BreakdownBar label="High Priority" count={dashboardData.priorityCounts['High']} total={dashboardData.totalLeads} color="bg-red-500" onClick={() => navigate('/leads', { state: { filterPriority: 'High' } })} />
                    <BreakdownBar label="Medium Priority" count={dashboardData.priorityCounts['Medium']} total={dashboardData.totalLeads} color="bg-brand-gold" onClick={() => navigate('/leads', { state: { filterPriority: 'Medium' } })} />
                    <BreakdownBar label="Low Priority" count={dashboardData.priorityCounts['Low']} total={dashboardData.totalLeads} color="bg-blue-300" onClick={() => navigate('/leads', { state: { filterPriority: 'Low' } })} />
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-brand-dark/50 dark:text-white/50 uppercase tracking-widest mb-6">Audience Type</h3>
                    <BreakdownBar label="B2B (Business)" count={dashboardData.b2bCount} total={allLeads.length} color="bg-indigo-500" onClick={() => navigate('/leads', { state: { filterType: 'B2B' } })} />
                    <BreakdownBar label="B2C (Consumer)" count={dashboardData.b2cCount} total={allLeads.length} color="bg-pink-500" onClick={() => navigate('/leads', { state: { filterType: 'B2C' } })} />
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
