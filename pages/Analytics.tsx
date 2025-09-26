import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7'];

interface AnalyticsData {
  totalMembers: {
    value: number;
    change: number;
  };
  activeUsers: {
    value: number;
    total: number;
  };
  avgTaskCompletion: number;
  taskCompletion: {
    name: string;
    assigned: number;
    completed: number;
  }[];
  engagement: {
    name: string;
    value: number;
  }[];
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotifier();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!supabase) {
        addToast("Supabase client is not available.", "error");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data: rpcData, error } = await supabase.rpc('get_dashboard_analytics');

      if (error) {
        console.error("Error fetching dashboard analytics:", error);
        addToast("Failed to fetch analytics data.", "error");
        setData(null);
      } else {
        setData(rpcData);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [addToast]);

  if (loading) {
    return <div className="text-center p-8">Loading analytics...</div>;
  }
  
  if (!data) {
    return <div className="text-center p-8 text-red-500">Could not load analytics data.</div>;
  }
  
  const activeUserPercentage = data.activeUsers.total > 0
    ? ((data.activeUsers.value / data.activeUsers.total) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Leader Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <Card title="Total Members">
                <p className="text-4xl font-bold">{data.totalMembers.value}</p>
                <p className="text-sm text-green-500">+{data.totalMembers.change} this month</p>
            </Card>
            <Card title="Avg. Task Completion">
                <p className="text-4xl font-bold">{data.avgTaskCompletion.toFixed(0)}%</p>
                <p className="text-sm text-gray-500">Last 4 weeks</p>
            </Card>
            <Card title="Active Users (24h)">
                <p className="text-4xl font-bold">{data.activeUsers.value}</p>
                <p className="text-sm text-gray-500">{activeUserPercentage}% of total</p>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Weekly Task Completion">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.taskCompletion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}/>
                        <Legend />
                        <Bar dataKey="assigned" fill="#475569" />
                        <Bar dataKey="completed" fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            <Card title="User Engagement">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data.engagement}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.engagement.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}/>
                        <Legend/>
                    </PieChart>
                </ResponsiveContainer>
            </Card>
        </div>
    </div>
  );
};

export default Analytics;