
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../components/ui/Card';
import { mockAnalyticsData } from '../services/mockData';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7'];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Leader Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Total Members">
                <p className="text-4xl font-bold">128</p>
                <p className="text-sm text-green-500">+5 this month</p>
            </Card>
            <Card title="Avg. Task Completion">
                <p className="text-4xl font-bold">85%</p>
                <p className="text-sm text-gray-500">Last 4 weeks</p>
            </Card>
            <Card title="Active Users (24h)">
                <p className="text-4xl font-bold">92</p>
                <p className="text-sm text-gray-500">72% of total</p>
            </Card>
             <Card title="Prayer Requests">
                <p className="text-4xl font-bold">45</p>
                <p className="text-sm text-gray-500">This week</p>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Weekly Task Completion">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalyticsData.taskCompletion}>
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
                            data={mockAnalyticsData.engagement}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {mockAnalyticsData.engagement.map((entry, index) => (
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
