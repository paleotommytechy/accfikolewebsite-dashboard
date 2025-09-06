import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { CoinTransaction } from '../types';

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
    const { currentUser } = useAppContext();
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!supabase || !currentUser) return;
            setLoading(true);
            
            // Step 1: Fetch transactions without the broken joins
            const { data: txData, error: txError } = await supabase
                .from('coin_transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (txError) {
                console.error("Error fetching transactions:", txError);
                setLoading(false);
                return;
            }

            if (!txData || txData.length === 0) {
                setTransactions([]);
                setLoading(false);
                return;
            }

            // Step 2: Group source IDs by type
            const taskIds = txData
                .filter(tx => tx.source_type === 'task')
                .map(tx => tx.source_id);
            const challengeIds = txData
                .filter(tx => tx.source_type === 'challenge')
                .map(tx => tx.source_id);

            // Step 3: Fetch source details in parallel
            const [tasksResponse, challengesResponse] = await Promise.all([
                taskIds.length > 0 ? supabase.from('tasks').select('id, title').in('id', taskIds) : Promise.resolve({ data: [], error: null }),
                challengeIds.length > 0 ? supabase.from('weekly_challenges').select('id, title').in('id', challengeIds) : Promise.resolve({ data: [], error: null })
            ]);

            if (tasksResponse.error) console.error("Error fetching task details:", tasksResponse.error);
            if (challengesResponse.error) console.error("Error fetching challenge details:", challengesResponse.error);

            // FIX: Explicitly type the items in the map to ensure they are treated as tuples, resolving the Map constructor overload error.
            const tasksMap = new Map(tasksResponse.data?.map((t: { id: string; title: string }) => [t.id, t.title]));
            // FIX: Explicitly type the items in the map to ensure they are treated as tuples, resolving the Map constructor overload error.
            const challengesMap = new Map(challengesResponse.data?.map((c: { id: string; title: string }) => [c.id, c.title]));

            // Step 4: Combine data
            const enrichedTransactions = txData.map(tx => {
                if (tx.source_type === 'task') {
                    return { ...tx, tasks: { title: tasksMap.get(tx.source_id) || 'Unknown Task' } };
                }
                if (tx.source_type === 'challenge') {
                    return { ...tx, weekly_challenges: { title: challengesMap.get(tx.source_id) || 'Unknown Challenge' } };
                }
                return tx;
            });

            setTransactions(enrichedTransactions as CoinTransaction[]);
            setLoading(false);
        };

        fetchTransactions();
    }, [currentUser]);

    const getSourceName = (tx: CoinTransaction): string => {
        if (tx.source_type === 'task' && tx.tasks) {
            return tx.tasks.title;
        }
        if (tx.source_type === 'challenge' && tx.weekly_challenges) {
            return tx.weekly_challenges.title;
        }
        return 'Unknown Activity';
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Coin Store</h1>
                <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 text-lg font-bold px-4 py-2 rounded-lg">
                    {currentUser?.coins} Coins
                </div>
            </div>
            
            <Card title="Transaction History">
                {loading ? (
                    <p>Loading history...</p>
                ) : transactions.length > 0 ? (
                    <div className="flow-root">
                        <ul role="list" className="-my-4 divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map(tx => (
                                <li key={tx.id} className="flex items-center py-4 space-x-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate dark:text-white">
                                            {getSourceName(tx)}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${tx.status === 'approved' ? 'text-green-600' : 'text-gray-500'}`}>
                                            {tx.status === 'approved' ? '+' : ''}{tx.coin_amount}
                                        </p>
                                        <StatusBadge status={tx.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500">You haven't earned any coins yet. Complete some tasks to get started!</p>
                )}
            </Card>
        </div>
    );
};

export default Store;
