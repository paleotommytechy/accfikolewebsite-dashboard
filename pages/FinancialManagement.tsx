
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Donation, StorePurchase, StoreItem } from '../types';
import Avatar from '../components/auth/Avatar';
import { ChatIcon, CheckCircleIcon, XCircleIcon, ShoppingCartIcon, WifiIcon, PlusIcon, PencilAltIcon, TrashIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const InputLoadingSkeleton = () => <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;

const FinancialManagement: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast, showConfirm } = useNotifier();
    
    // Donation State
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loadingDonations, setLoadingDonations] = useState(true);
    const [activeTab, setActiveTab] = useState<'donations' | 'redemptions' | 'items'>('donations');
    
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
        else if (activeTab === 'redemptions') fetchRedemptions();
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
            
            <div className="border-b dark:border-gray-700 overflow-x-auto">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('donations')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'donations' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Donations
                    </button>
                    <button
                        onClick={() => setActiveTab('redemptions')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'redemptions' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Store Redemptions
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'items' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Manage Store Items
                    </button>
                </nav>
            </div>

            {activeTab === 'donations' && (
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
            )}

            {activeTab === 'redemptions' && (
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

            {activeTab === 'items' && <StoreItemsManager />}
        </div>
    );
};

// --- Store Items Manager Component ---
const StoreItemsManager: React.FC = () => {
    const { addToast, showConfirm } = useNotifier();
    const [items, setItems] = useState<StoreItem[]>([]);
    const [editing, setEditing] = useState<Partial<StoreItem> | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase.from('store_items').select('*').order('cost', { ascending: true });
        if (error) {
            console.error("Error fetching items:", error);
            // Don't toast here as table might not exist yet during migration
        } else {
            setItems(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !editing || !editing.name || !editing.cost) return;

        const { error } = await supabase.from('store_items').upsert(editing);
        if (error) {
            addToast('Error saving item: ' + error.message, 'error');
        } else {
            addToast(`Item ${editing.id ? 'updated' : 'created'} successfully!`, 'success');
            setEditing(null);
            fetchItems();
        }
    };

    const handleDelete = (id: string) => {
        showConfirm('Are you sure you want to delete this item?', async () => {
            if (!supabase) return;
            const { error } = await supabase.from('store_items').delete().eq('id', id);
            if (error) {
                addToast('Error deleting item: ' + error.message, 'error');
            } else {
                addToast('Item deleted.', 'success');
                fetchItems();
            }
        });
    };

    return (
        <Card title="Manage Store Inventory">
            <div className="space-y-4">
                {editing ? (
                    <form onSubmit={handleSave} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in-up">
                        <h3 className="font-bold mb-4">{editing.id ? 'Edit Item' : 'Add New Item'}</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Item Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        value={editing.name || ''} 
                                        onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cost (Coins)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        value={editing.cost || 0} 
                                        onChange={e => setEditing(p => ({ ...p, cost: parseInt(e.target.value) }))}
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                    rows={2}
                                    value={editing.description || ''} 
                                    onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Icon Type</label>
                                    <select 
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        value={editing.icon || 'shopping-cart'} 
                                        onChange={e => setEditing(p => ({ ...p, icon: e.target.value }))}
                                    >
                                        <option value="shopping-cart">General (Cart)</option>
                                        <option value="wifi">Data Bundle (Wifi)</option>
                                        <option value="coffee">Coffee</option>
                                        <option value="shirt">Merch/Shirt</option>
                                        <option value="book">Book</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <input 
                                        type="checkbox" 
                                        id="isActive"
                                        checked={editing.is_active ?? true}
                                        onChange={e => setEditing(p => ({ ...p, is_active: e.target.checked }))}
                                        className="h-4 w-4 rounded text-primary-600"
                                    />
                                    <label htmlFor="isActive" className="text-sm">Is Active (Visible in Store)</label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit">Save Item</Button>
                        </div>
                    </form>
                ) : (
                    <Button onClick={() => setEditing({ icon: 'shopping-cart', cost: 100, is_active: true })}>
                        <PlusIcon className="w-5 h-5 mr-2" /> Add New Item
                    </Button>
                )}

                {loading ? <p>Loading inventory...</p> : items.length === 0 && !editing ? <p className="text-gray-500 py-4">No items found.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map(item => (
                            <div key={item.id} className={`p-4 rounded-lg border ${item.is_active ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 opacity-75'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-full ${item.icon === 'wifi' ? 'bg-yellow-100 text-yellow-600' : 'bg-primary-100 text-primary-600'}`}>
                                            {item.icon === 'wifi' ? <WifiIcon className="w-5 h-5"/> : <ShoppingCartIcon className="w-5 h-5"/>}
                                        </div>
                                        <h4 className="font-bold">{item.name}</h4>
                                    </div>
                                    <span className="font-bold text-yellow-600">{item.cost}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}><PencilAltIcon className="w-4 h-4"/></Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleDelete(item.id)}><TrashIcon className="w-4 h-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FinancialManagement;
