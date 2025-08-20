
import React from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { mockPrayerRequests } from '../services/mockData';
import { SparklesIcon } from '../components/ui/Icons';

const PrayerRequests: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Prayer Wall</h1>

            <Card>
                <h2 className="text-xl font-semibold mb-2">Share a Prayer Request</h2>
                <textarea 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="What can we pray for you about?"
                ></textarea>
                <div className="text-right mt-2">
                    <Button>Submit Request</Button>
                </div>
            </Card>

            <div className="space-y-4">
                {mockPrayerRequests.map(req => (
                    <Card key={req.id}>
                        <div className="flex items-start space-x-4">
                            <Avatar src={req.authorAvatar} alt={req.author} size="md" />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{req.author}</p>
                                    <p className="text-xs text-gray-400">{req.timestamp}</p>
                                </div>
                                <p className="mt-1 text-gray-700 dark:text-gray-300">{req.request}</p>
                                <div className="mt-3">
                                    <Button variant="ghost" size="sm">
                                        <SparklesIcon className="w-5 h-5 mr-2"/> I prayed ({req.prayers})
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PrayerRequests;
