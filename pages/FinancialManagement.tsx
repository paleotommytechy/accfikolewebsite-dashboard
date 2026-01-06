import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Donation, StorePurchase } from '../types';
import Avatar from '../components/auth/Avatar';
import { ChatIcon, CheckCircleIcon, XCircleIcon, ShoppingCartIcon, WifiIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';

const FinancialManagement: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast, showConfirm } = useNotifier();
    
    // Donation State
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loadingDonations, setLoadingDonations] = useState(true);
    const [activeTab, setActiveTab] = useState<'donations' | 'redemptions'>('donations');
    
    // Store Redemptions State
    const [redemptions, setRedemptions] = useState<StorePurchase[]>([]);
    const [loadingRedemptions, setLoadingRedemptions] = useState(true);

    const fetchDonations = useCallback(async () => {
        if (!supabase) return;
        setLoadingDonations(true);
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles(full_name, avatar_url, whatsapp)')
            .order('created_at', { ascending: false });

        if (error) {
            addToast('Error fetching donations: ' + error.message, 'error');
        } else {
            setDonations(data as Donation[] || []);
        }
        setLoadingDonations(false);
    }, [addToast]);

    const fetchRedemptions = useCallback(async () => {
        if (!supabase) return;
        setLoadingRedemptions(true);
        // We use a join, but user_store_purchases links to profiles via user_id
        const { data, error } = await supabase
            .from('user_store_purchases')
            .select('*, profiles:user_id(full_name, avatar_url, whatsapp)')
            .order('created_at', { ascending: false });

        if (error) {
            addToast('Error fetching redemptions: ' + error.message, 'error');
        } else {
            setRedemptions(data as any[] || []);
        }
        setLoadingRedemptions(false);
    }, [addToast]);

    useEffect(() => {
        if (activeTab === 'donations') fetchDonations();
        else fetchRedemptions();
    }, [activeTab, fetchDonations, fetchRedemptions]);

    // --- Real-time Subscription ---
    useEffect(() => {
        if (!supabase) return;
        const channel = supabase
            .channel('financial-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, () => {
                addToast('New donation recorded.', 'info');
                if (activeTab === 'donations') fetchDonations();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_store_purchases' }, () => {
                addToast('New store redemption request.', 'info');
                if (activeTab === 'redemptions') fetchRedemptions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTab, fetchDonations, fetchRedemptions]);

    // --- Donation Logic ---
    const handleUpdateDonationStatus = async (donationId: string, status: 'confirmed' | 'rejected') => {
        if (!supabase || !currentUser) return;
        const { error } = await supabase.rpc('update_donation_status', {
            p_donation_id: donationId,
            p_new_status: status,
            p_admin_id: currentUser.id
        });
        if (error) {
            addToast('Error updating status: ' + error.message, 'error');
        } else {
            addToast(`Donation status updated to ${status}.`, 'success');
            fetchDonations();
        }
    };
    
    const handleSendReminder = async (userId: string, name: string, amount: number, fund: string) => {
        if (!supabase || !currentUser) return;
        const message = `Hi ${name}, friendly reminder regarding your pledge of ₦${amount.toLocaleString()} for "${fund}". Please send proof of payment when ready!`;
        const { error } = await supabase.from('messages').insert({ sender_id: currentUser.id, recipient_id: userId, text: message });
        if (error) addToast('Failed to send reminder.', 'error');
        else addToast('Reminder sent.', 'success');
    };

    // --- Redemption Logic ---
    const handleProcessRedemption = async (purchase: StorePurchase, status: 'fulfilled' | 'rejected') => {
        if (!supabase || !currentUser) return;
        
        const action = status === 'fulfilled' ? 'Fulfill (Send Data)' : 'Reject (Refund Coins)';
        
        showConfirm(`Are you sure you want to ${action}?`, async () => {
            const { error } = await supabase.rpc('process_store_redemption', {
                p_purchase_id: purchase.id,
                p_status: status,
                p_admin_id: currentUser.id
            });

            if (error) {
                addToast('Error processing request: ' + error.message, 'error');
            } else {
                addToast(`Request ${status}. User has been notified.`, 'success');
                fetchRedemptions();
            }
        });
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            fulfilled: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
    };

    return (
         <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Financial Management</h1>
            
            <div className="border-b dark:border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('donations')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'donations' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Donations
                    </button>
                    <button
                        onClick={() => setActiveTab('redemptions')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'redemptions' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Store Redemptions
                    </button>
                </nav>
            </div>

            {activeTab === 'donations' ? (
                <Card title="Donation Tracking">
                    {loadingDonations ? <p>Loading...</p> : donations.length === 0 ? <p className="text-gray-500">No donations found.</p> : (
                        <ul className="space-y-3">
                            {donations.map(d => (
                                <li key={d.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={d.profiles?.avatar_url} alt="" />
                                            <div>
                                                <p className="font-semibold">{d.profiles?.full_name}</p>
                                                <p className="text-sm text-gray-500">Pledged: ₦{d.amount.toLocaleString()} for {d.fund_name}</p>
                                                <p className="text-xs text-gray-400">{new Date(d.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            {d.status === 'pending' ? (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={() => handleSendReminder(d.user_id, d.profiles?.full_name || '', d.amount, d.fund_name)}><ChatIcon className="w-4 h-4" /></Button>
                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleUpdateDonationStatus(d.id, 'rejected')}><XCircleIcon className="w-4 h-4" /></Button>
                                                    <Button size="sm" onClick={() => handleUpdateDonationStatus(d.id, 'confirmed')}><CheckCircleIcon className="w-4 h-4" /></Button>
                                                </>
                                            ) : <StatusBadge status={d.status} />}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            ) : (
                <Card title="Store Redemptions">
                    {loadingRedemptions ? <p>Loading...</p> : redemptions.length === 0 ? <p className="text-gray-500">No requests found.</p> : (
                        <ul className="space-y-3">
                            {redemptions.map(req => (
                                <li key={req.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-yellow-100 p-2 rounded-full mt-1"><ShoppingCartIcon className="w-5 h-5 text-yellow-700" /></div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">{req.item_name} <span className="font-normal text-gray-500">({req.cost} coins)</span></p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Avatar src={req.profiles?.avatar_url} alt="" size="sm" />
                                                    <span className="text-sm font-medium">{req.profiles?.full_name}</span>
                                                </div>
                                                
                                                {/* Display Metadata (Phone/Network) if available */}
                                                {req.purchase_metadata && (
                                                    <div className="mt-2 text-sm bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600 inline-block">
                                                        {req.purchase_metadata.network && (
                                                            <p className="flex items-center gap-1"><strong>Network:</strong> {req.purchase_metadata.network}</p>
                                                        )}
                                                        {req.purchase_metadata.phoneNumber && (
                                                            <p className="flex items-center gap-1"><strong>Phone:</strong> {req.purchase_metadata.phoneNumber}</p>
                                                        )}
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end md:self-center">
                                            {req.status === 'pending' ? (
                                                <>
                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleProcessRedemption(req, 'rejected')}>
                                                        Reject & Refund
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleProcessRedemption(req, 'fulfilled')}>
                                                        Mark Sent
                                                    </Button>
                                                </>
                                            ) : <StatusBadge status={req.status} />}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}
        </div>
    );
};

export default FinancialManagement;