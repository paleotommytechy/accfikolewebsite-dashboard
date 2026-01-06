
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import type { CoinTransaction, StoreItem } from '../types';
import Button from '../components/ui/Button';
import { WifiIcon, ShoppingCartIcon, CoinIcon, XIcon, CloudUploadIcon } from '../components/ui/Icons';
import { useNavigate } from 'react-router-dom';

const StatusBadge: React.FC<{ status: 'pending' | 'approved' | 'rejected' }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full capitalize";
    const statusClasses = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
        approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
}

const Store: React.FC = () => {
    const { currentUser, refreshCurrentUser } = useAppContext();
    const { addToast } = useNotifier();
    const navigate = useNavigate();
    
    // Data States
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Purchase Modal States
    const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(currentUser?.whatsapp || '');
    const [network, setNetwork] = useState('MTN');
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!supabase || !currentUser) return;
            setLoading(true);
            
            // 1. Fetch Store Items
            const { data: itemsData, error: itemsError } = await supabase
                .from('store_items')
                .select('*')
                .eq('is_active', true)
                .order('cost', { ascending: true });
                
            if (itemsError) {
                // If the table doesn't exist yet, we might get an error. 
                // Log it safely.
                console.error("Error fetching store items:", itemsError.message || itemsError);
                // Don't show toast on load failure to avoid spamming if table missing
            } else {
                setStoreItems(itemsData || []);
            }

            // 2. Fetch User Transactions (History)
            const { data: txData, error: txError } = await supabase
                .from('coin_transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20); // Limit history for performance

            if (txError) {
                console.error("Error fetching transactions:", txError.message || txError);
            } else if (txData) {
                setTransactions(txData as CoinTransaction[]);
            }
            
            setLoading(false);
        };

        fetchData();
    }, [currentUser]);

    const handleBuyClick = (item: StoreItem) => {
        setSelectedItem(item);
        setIsPurchaseModalOpen(true);
        // Pre-fill phone number if available
        if (currentUser?.whatsapp) {
            setPhoneNumber(currentUser.whatsapp);
        }
    };

    const handleConfirmPurchase = async () => {
        if (!selectedItem || !supabase || !currentUser) return;
        
        if (currentUser.coins < selectedItem.cost) {
            addToast("Insufficient coins! Upload more materials to earn.", 'error');
            return;
        }

        // Specific validation for Data Bundles
        if (selectedItem.icon === 'wifi') {
            if (!phoneNumber || !network) {
                addToast("Phone number and network are required for data bundles.", 'error');
                return;
            }
        }

        setPurchasing(true);
        
        const metadata = selectedItem.icon === 'wifi' 
            ? { phoneNumber, network } 
            : {};

        try {
            const { error } = await supabase.rpc('purchase_store_item', {
                p_item_id: selectedItem.id,
                p_user_id: currentUser.id,
                p_metadata: metadata
            });

            if (error) {
                // Safely handle the error object to extract the message
                throw new Error(error.message || error.details || "Unknown RPC error");
            }

            addToast("Purchase successful! Admin will process your request shortly.", 'success');
            setIsPurchaseModalOpen(false);
            setPhoneNumber(''); 
            
            // Refresh coin balance and history
            await refreshCurrentUser();
            // Re-fetch transactions (simple inline reload for now)
            const { data: txData } = await supabase
                .from('coin_transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20);
            if (txData) setTransactions(txData as CoinTransaction[]);

        } catch (error: any) {
            console.error("Purchase error:", error);
            const msg = error?.message || "An error occurred during purchase.";
            addToast(`Purchase failed: ${msg}`, 'error');
        } finally {
            setPurchasing(false);
        }
    };

    // Helper to render icon based on string stored in DB
    const renderIcon = (iconName: string, className: string = "w-6 h-6") => {
        switch (iconName) {
            case 'wifi': return <WifiIcon className={className} />;
            case 'shirt': return <span className="text-2xl">👕</span>;
            case 'coffee': return <span className="text-2xl">☕</span>;
            default: return <ShoppingCartIcon className={className} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gradient-to-r from-yellow-500 to-amber-600 p-6 rounded-xl text-white shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold">Coin Store</h1>
                    <p className="text-yellow-100 text-sm">Redeem your hard-earned coins for real value.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <CoinIcon className="w-8 h-8 text-yellow-200" />
                    <div>
                        <p className="text-xs uppercase font-bold text-yellow-100">Balance</p>
                        <p className="text-2xl font-bold">{currentUser?.coins.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            {/* Store Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="col-span-full text-center py-8">Loading store items...</p>
                ) : storeItems.length > 0 ? (
                    storeItems.map(item => (
                        <Card key={item.id} className={`flex flex-col h-full border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${item.icon === 'wifi' ? 'border-yellow-400 dark:border-yellow-600' : 'border-transparent'}`}>
                            <div className={`p-4 rounded-t-lg flex justify-center items-center h-32 ${item.icon === 'wifi' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                {renderIcon(item.icon, "w-16 h-16 text-gray-600 dark:text-gray-300")}
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                {item.icon === 'wifi' && <span className="inline-block px-2 py-1 mb-2 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full w-fit">HOT DEAL 🔥</span>}
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{item.name}</h3>
                                <p className="text-sm text-gray-500 mt-2 flex-grow">{item.description}</p>
                                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                                    <span className="font-bold text-lg text-primary-600">{item.cost} Coins</span>
                                    <Button size="sm" onClick={() => handleBuyClick(item)} disabled={currentUser ? currentUser.coins < item.cost : true}>
                                        {currentUser && currentUser.coins >= item.cost ? 'Buy Now' : 'Need Coins'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500">No items available in the store right now.</p>
                )}
                
                {/* Upload CTA Card */}
                <div onClick={() => navigate('/academics')} className="cursor-pointer bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-md p-6 text-white flex flex-col justify-center items-center text-center transition-transform hover:scale-105">
                    <CloudUploadIcon className="w-12 h-12 mb-3 text-primary-200" />
                    <h3 className="font-bold text-xl">Need More Coins?</h3>
                    <p className="text-primary-100 text-sm mt-2">Upload past questions or notes to earn 50-100 coins instantly!</p>
                    <button className="mt-4 bg-white text-primary-700 font-bold py-2 px-4 rounded-full text-sm hover:bg-primary-50">
                        Upload Now
                    </button>
                </div>
            </div>

            {/* Transaction History */}
            <Card title="Recent Transactions">
                {transactions.length > 0 ? (
                    <div className="flow-root">
                        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map(tx => (
                                <li key={tx.id} className="py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate dark:text-white">
                                                {tx.reason || (tx.source_type === 'store_purchase' ? 'Store Purchase' : 'Activity Reward')}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                {new Date(tx.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                                            <p className={`font-semibold ${tx.coin_amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {tx.coin_amount > 0 ? '+' : ''}{tx.coin_amount} Coins
                                            </p>
                                            {tx.status && <StatusBadge status={tx.status} />}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500 py-4 text-center">No transaction history yet.</p>
                )}
            </Card>

            {/* Purchase Modal */}
            {isPurchaseModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                    <Card className="w-full max-w-md relative">
                        <button onClick={() => setIsPurchaseModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <XIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                {renderIcon(selectedItem.icon, "w-8 h-8 text-yellow-600")}
                            </div>
                            <h2 className="text-xl font-bold">Confirm Purchase</h2>
                            <p className="text-gray-500">{selectedItem.name}</p>
                            <p className="text-2xl font-bold text-primary-600 mt-2">{selectedItem.cost} Coins</p>
                        </div>

                        {selectedItem.icon === 'wifi' && (
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={phoneNumber} 
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
                                        placeholder="080..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Network</label>
                                    <select 
                                        value={network} 
                                        onChange={(e) => setNetwork(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
                                    >
                                        <option value="MTN">MTN</option>
                                        <option value="Airtel">Airtel</option>
                                        <option value="Glo">Glo</option>
                                        <option value="9mobile">9mobile</option>
                                    </select>
                                </div>
                                <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                    Note: Data will be sent to this number within 24 hours.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={() => setIsPurchaseModalOpen(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleConfirmPurchase} disabled={purchasing}>
                                {purchasing ? 'Processing...' : 'Confirm Buy'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Store;
