import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { PrayerRequest } from '../types';
import { SparklesIcon } from '../components/ui/Icons';

const PrayerRequests: React.FC = () => {
    const { currentUser } = useAppContext();
    const [requests, setRequests] = useState<PrayerRequest[]>([]);
    const [newRequest, setNewRequest] = useState('');

    const fetchRequests = async () => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('prayer_requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error('Error fetching prayer requests', error);
        else setRequests(data || []);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequest.trim() || !currentUser || !supabase) return;

        const { error } = await supabase.from('prayer_requests').insert({
            request: newRequest,
            author_id: currentUser.id,
            author_name: currentUser.name,
            author_avatar: currentUser.avatar_url,
        } as any);

        if (error) {
            alert('Error submitting request: ' + error.message);
        } else {
            setNewRequest('');
            fetchRequests(); // Re-fetch requests to show the new one
        }
    };
    
    // Note: The "I prayed" button logic would typically involve an RPC call in Supabase
    // to increment a counter atomically. We'll keep it as a UI element for now.

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Prayer Wall</h1>

            <Card>
                <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold mb-2">Share a Prayer Request</h2>
                    <textarea 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                        placeholder="What can we pray for you about?"
                        value={newRequest}
                        onChange={(e) => setNewRequest(e.target.value)}
                    ></textarea>
                    <div className="text-right mt-2">
                        <Button type="submit" disabled={!newRequest.trim()}>Submit Request</Button>
                    </div>
                </form>
            </Card>

            <div className="space-y-4">
                {requests.map(req => (
                    <Card key={req.id}>
                        <div className="flex items-start space-x-4">
                            <Avatar src={req.author_avatar} alt={req.author_name} size="md" />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{req.author_name}</p>
                                    <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleString()}</p>
                                </div>
                                <p className="mt-1 text-gray-700 dark:text-gray-300">{req.request}</p>
                                <div className="mt-3">
                                    <Button variant="ghost" size="sm">
                                        <SparklesIcon className="w-5 h-5 mr-2"/> I prayed ({req.prayers || 0})
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