import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import { UsersIcon, ClipboardListIcon, TrendingUpIcon, ArrowUpIcon, XCircleIcon } from '../components/ui/Icons';

// --- TYPES ---
interface AnalyticsData {
  totalMembers: { value: number; change: number; };
  activeUsers: { value: number; total: number; };
  avgTaskCompletion: number;
  taskCompletion: { name: string; assigned: number; completed: number; }[];
  engagement: { name: string; value: number; }[];
}

// --- CUSTOM RECHARTS COMPONENTS ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-gray-800 dark:text-gray-100">{label}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.fill }}>
                        {`${pld.name}: ${pld.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const PIE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

// --- UI COMPONENTS ---
interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    details?: React.ReactNode;
    animationDelay?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, details, animationDelay = '0ms' }) => (
    <Card className="flex flex-col p-6 animate-fade-in-up" style={{ animationDelay }}>
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                {icon}
            </div>
        </div>
        <div className="mt-2">
            <p className="text-4xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            <div className="mt-1">{details}</div>
        </div>
    </Card>
);

const StatCardSkeleton: React.FC = () => (
    <Card className="p-6">
        <div className="animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="mt-2">
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="mt-2 h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/5"></div>
            </div>
        </div>
    </Card>
);

const ChartSkeleton: React.FC = () => (
    <Card>
        <div className="animate-pulse h-[300px] flex flex-col">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
    </Card>
);

const AnalyticsSkeleton: React.FC = () => (
    <div className="space-y-8">
        <div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
            <div className="mt-2 h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3"><ChartSkeleton /></div>
            <div className="lg:col-span-2"><ChartSkeleton /></div>
        </div>
    </div>
);

const AnalyticsError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <div className="text-center py-20">
        <XCircleIcon className="w-16 h-16 mx-auto text-red-400" />
        <h3 className="text-lg font-semibold mt-4">Could not load analytics</h3>
        <p className="text-gray-500 mt-2">There was an issue fetching the data. Please try again.</p>
        <Button onClick={onRetry} className="mt-4">
            Retry
        </Button>
    </div>
);

// --- MAIN COMPONENT ---
const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useNotifier();

  const fetchAnalytics = useCallback(async () => {
    if (!supabase) {
      addToast("Supabase client is not available.", "error");
      setError("Database connection not configured.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_analytics');

    if (rpcError) {
      console.error("Error fetching dashboard analytics:", rpcError);
      addToast("Failed to fetch analytics data.", "error");
      setError(rpcError.message);
      setData(null);
    } else {
      setData(rpcData);
    }
    setLoading(false);
  }, [addToast]);
  
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);


  if (loading) {
    return <AnalyticsSkeleton />;
  }
  
  if (error || !data) {
    return <AnalyticsError onRetry={fetchAnalytics} />;
  }
  
  const activeUserPercentage = data.activeUsers.total > 0
    ? ((data.activeUsers.value / data.activeUsers.total) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-8">
        <div className="animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Leader Analytics</h1>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">An overview of community health and engagement metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
                title="Total Members"
                value={data.totalMembers.value.toString()}
                icon={<UsersIcon className="w-6 h-6 text-blue-500" />}
                details={
                    <span className={`flex items-center text-sm font-medium ${data.totalMembers.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <ArrowUpIcon className={`w-4 h-4 mr-1 ${data.totalMembers.change < 0 ? 'transform rotate-180' : ''}`} />
                        {data.totalMembers.change >= 0 ? '+' : ''}{data.totalMembers.change} this month
                    </span>
                }
                animationDelay="100ms"
            />
            <StatCard 
                title="Avg. Task Completion"
                value={`${data.avgTaskCompletion.toFixed(0)}%`}
                icon={<ClipboardListIcon className="w-6 h-6 text-purple-500" />}
                details={<p className="text-sm text-gray-500">Based on the last 4 weeks</p>}
                animationDelay="200ms"
            />
            <StatCard 
                title="Active Users"
                value={data.activeUsers.value.toString()}
                icon={<TrendingUpIcon className="w-6 h-6 text-emerald-500" />}
                details={<p className="text-sm text-gray-500">In the last 24 hours ({activeUserPercentage}% of total)</p>}
                animationDelay="300ms"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card title="Weekly Task Completion" className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.taskCompletion} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700"/>
                        <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-gray-500 dark:text-gray-400" />
                        <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} className="text-gray-500 dark:text-gray-400" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}/>
                        <Legend />
                        <Bar dataKey="assigned" fill="#cbd5e1" name="Assigned" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            <Card title="User Engagement Breakdown" className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data.engagement}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            labelLine={false}
                        >
                            {data.engagement.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
        </div>
    </div>
  );
};

export default Analytics;
