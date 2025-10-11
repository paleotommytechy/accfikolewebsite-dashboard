import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import type { PrayerRequest } from '../types';
import { SparklesIcon, TrashIcon, HeartIcon } from '../components/ui/Icons';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const EditorLoadingSkeleton = () => <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;

const timeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

const SkeletonCard: React.FC = () => (
    <Card className="animate-pulse">
        <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32 mt-2"></div>
            </div>
        </div>
    </Card>
);

const PrayerRequests: React.FC = () => {
    const { currentUser, isAdmin } = useAppContext();
    const { addToast, showConfirm } = useNotifier();
    const [requests, setRequests] = useState<PrayerRequest[]>([]);
    const [newRequest, setNewRequest] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('prayer_requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching prayer requests', error);
            addToast('Could not fetch prayer requests.', 'error');
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // --- Real-time Subscription ---
    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel('public:prayer_requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'prayer_requests' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newReq = payload.new as PrayerRequest;
                        setRequests(prev => [newReq, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedReq = payload.new as PrayerRequest;
                        setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedReq = payload.old as { id: string };
                        setRequests(prev => prev.filter(r => r.id !== deletedReq.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequest.trim() || !currentUser || !supabase) return;

        setSubmitting(true);
        const authorName = currentUser.full_name || currentUser.email.split('@')[0];

        const { error } = await supabase.from('prayer_requests').insert({
            request: newRequest,
            author_id: currentUser.id,
            author_name: authorName,
            author_avatar: currentUser.avatar_url,
        });

        if (error) {
            addToast('Error submitting request: ' + error.message, 'error');
        } else {
            addToast('Your prayer request has been shared.', 'success');
            localStorage.removeItem(`new-prayer-request-content-${currentUser.id}`);
            setNewRequest('');
            // No need to fetch, real-time will update the UI
        }
        setSubmitting(false);
    };

    const handlePray = async (request: PrayerRequest) => {
        if (!supabase) return;
        
        // Optimistic UI update
        const originalPrayers = request.prayers;
        setRequests(prev => prev.map(r => r.id === request.id ? { ...r, prayers: r.prayers + 1 } : r));

        const { error } = await supabase.rpc('increment_prayer_count', { request_id_in: request.id });

        if (error) {
            addToast('Could not record your prayer. Please try again.', 'error');
            // Revert optimistic update on error
            setRequests(prev => prev.map(r => r.id === request.id ? { ...r, prayers: originalPrayers } : r));
        }
    };

    const handleDelete = (request: PrayerRequest) => {
        showConfirm('Are you sure you want to delete this prayer request?', async () => {
            if (!supabase) return;
            const { error } = await supabase.from('prayer_requests').delete().eq('id', request.id);
            if (error) {
                addToast('Failed to delete request: ' + error.message, 'error');
            } else {
                addToast('Prayer request deleted.', 'success');
                // No need to manually filter state, real-time will handle it
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Prayer Wall</h1>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <h2 className="text-xl font-semibold">Share a Prayer Request</h2>
                    <Suspense fallback={<EditorLoadingSkeleton />}>
                        <AutoSaveField
                            as="textarea"
                            storageKey={`new-prayer-request-content-${currentUser?.id}`}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            rows={3}
                            placeholder="What can we pray for you about? Your name and profile picture will be shared with your request."
                            value={newRequest}
                            onChange={(e) => setNewRequest(e.target.value)}
                            disabled={submitting}
                        />
                    </Suspense>
                    <div className="text-right">
                        <Button type="submit" disabled={!newRequest.trim() || submitting}>
                            {submitting ? 'Sharing...' : 'Share Request'}
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : requests.length > 0 ? (
                    requests.map(req => (
                        <Card key={req.id} className="animate-fade-in-up">
                            <div className="flex items-start space-x-4">
                                <Avatar src={req.author_avatar} alt={req.author_name} size="md" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{req.author_name}</p>
                                        <p className="text-xs text-gray-400">{timeAgo(req.created_at)}</p>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{req.request}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <Button variant="ghost" size="sm" onClick={() => handlePray(req)}>
                                            <SparklesIcon className="w-5 h-5 mr-2 text-primary-500"/> I prayed ({req.prayers || 0})
                                        </Button>
                                        {(currentUser?.id === req.author_id || isAdmin) && (
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(req)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <div className="text-center py-10">
                            <HeartIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                            <h3 className="text-lg font-semibold mt-4">The Prayer Wall is Quiet</h3>
                            <p className="text-gray-500 mt-2">Be the first to share a request and invite others to pray with you.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PrayerRequests;