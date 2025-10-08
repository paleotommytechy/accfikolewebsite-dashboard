import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Donation } from '../types';
import Avatar from '../components/auth/Avatar';
import { ChatIcon, CheckCircleIcon, XCircleIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';

const FinancialManagement: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    const fetchDonations = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles(full_name, avatar_url, whatsapp)')
            .order('created_at', { ascending: false });

        if (error) {
            addToast('Error fetching donations: ' + error.message, 'error');
        } else {
            setDonations(data as Donation[] || []);
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchDonations();
    }, [fetchDonations]);

    const handleUpdateStatus = async (donationId: string, status: 'confirmed' | 'rejected') => {
        if (!supabase || !currentUser) return;
        const { error } = await supabase.rpc('update_donation_status', {
            p_donation_id: donationId,
            p_new_status: status,
            p_admin_id: currentUser.id
        });
        if (error) {
            addToast('Error updating status: ' + error.message, 'error');
        } else {
            addToast(`Donation status updated to ${status}. A message has been sent to the user.`, 'success');
            fetchDonations();
        }
    };
    
    const handleSendReminder = async (donation: Donation) => {
        if (!supabase || !currentUser || !donation.profiles) return;
        const message = `Hi ${donation.profiles.full_name}, this is a friendly reminder regarding your pledge to give ₦${donation.amount.toLocaleString()} for "${donation.fund_name}". Please remember to complete the transfer and send us the proof of payment. Thank you for your heart to give!`;

        const { error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            recipient_id: donation.user_id,
            text: message
        });

        if (error) {
            addToast('Failed to send reminder: ' + error.message, 'error');
        } else {
            addToast('Reminder message sent successfully.', 'success');
        }
    };

    const StatusBadge: React.FC<{ status: Donation['status'] }> = ({ status }) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[status]}`}>{status}</span>;
    };
    
    const visibleDonations = donations.filter(d => 
        activeTab === 'pending' ? d.status === 'pending' : d.status !== 'pending'
    );

    return (
         <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Financial Management</h1>
            <Card title="Donation Management">
                <div className="border-b dark:border-gray-700 mb-4">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('pending')} className={`${activeTab === 'pending' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            Pending
                        </button>
                         <button onClick={() => setActiveTab('completed')} className={`${activeTab === 'completed' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            Completed & Rejected
                        </button>
                    </nav>
                </div>
                {loading ? <p>Loading donations...</p> : visibleDonations.length === 0 ? <p className="text-center py-6 text-gray-500">No {activeTab} donations found.</p> : (
                     <ul className="space-y-3">
                        {visibleDonations.map(d => (
                            <li key={d.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar src={d.profiles?.avatar_url} alt={d.profiles?.full_name || '...'} />
                                        <div className="min-w-0">
                                            <p className="font-semibold truncate">{d.profiles?.full_name}</p>
                                            <p className="text-sm text-gray-500">{new Date(d.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-left sm:text-right">
                                         <p className="font-bold text-lg text-primary-600 dark:text-primary-400">₦{d.amount.toLocaleString()}</p>
                                         <p className="text-sm text-gray-500">{d.fund_name}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t dark:border-gray-700 flex flex-wrap items-center justify-end gap-2">
                                    {d.status === 'pending' ? (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={() => handleSendReminder(d)}><ChatIcon className="w-4 h-4 mr-1" /> Send Reminder</Button>
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleUpdateStatus(d.id, 'rejected')}><XCircleIcon className="w-4 h-4 mr-1" /> Reject</Button>
                                            <Button size="sm" onClick={() => handleUpdateStatus(d.id, 'confirmed')}><CheckCircleIcon className="w-4 h-4 mr-1" /> Confirm</Button>
                                        </>
                                    ) : (
                                        <StatusBadge status={d.status} />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default FinancialManagement;