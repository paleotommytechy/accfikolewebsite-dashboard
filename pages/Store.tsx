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

            const taskIds = txData.filter(tx => tx.source_type === 'task').map(tx => tx.source_id);
            const challengeIds = txData.filter(tx => tx.source_type === 'challenge').map(tx => tx.source_id);
            const quizIds = txData.filter(tx => tx.source_type === 'quiz').map(tx => tx.source_id);

            const [tasksResponse, challengesResponse, quizzesResponse] = await Promise.all([
                taskIds.length > 0 ? supabase.from('tasks').select('id, title').in('id', taskIds) : Promise.resolve({ data: [], error: null }),
                challengeIds.length > 0 ? supabase.from('weekly_challenges').select('id, title').in('id', challengeIds) : Promise.resolve({ data: [], error: null }),
                quizIds.length > 0 ? supabase.from('quizzes').select('id, title').in('id', quizIds) : Promise.resolve({ data: [], error: null }),
            ]);

            if (tasksResponse.error) console.error("Error fetching task details:", tasksResponse.error);
            if (challengesResponse.error) console.error("Error fetching challenge details:", challengesResponse.error);
            if (quizzesResponse.error) console.error("Error fetching quiz details:", quizzesResponse.error);

            const tasksMap = new Map(tasksResponse.data?.map((t: { id: string; title: string }): [string, string] => [t.id, t.title]));
            const challengesMap = new Map(challengesResponse.data?.map((c: { id: string; title: string }): [string, string] => [c.id, c.title]));
            const quizzesMap = new Map(quizzesResponse.data?.map((q: { id: string; title: string }): [string, string] => [q.id, q.title]));

            const enrichedTransactions = txData.map(tx => {
                if (tx.source_type === 'task') {
                    return { ...tx, tasks: { title: tasksMap.get(tx.source_id) || 'Unknown Task' } };
                }
                if (tx.source_type === 'challenge') {
                    return { ...tx, weekly_challenges: { title: challengesMap.get(tx.source_id) || 'Unknown Challenge' } };
                }
                if (tx.source_type === 'quiz') {
                    return { ...tx, quizzes: { title: quizzesMap.get(tx.source_id) || 'Unknown Quiz' } };
                }
                return tx;
            });

            setTransactions(enrichedTransactions as CoinTransaction[]);
            setLoading(false);
        };

        fetchTransactions();
    }, [currentUser]);

    const getSourceName = (tx: CoinTransaction): string => {
        switch (tx.source_type) {
            case 'task':
                return tx.tasks?.title || 'Unknown Task';
            case 'challenge':
                return tx.weekly_challenges?.title || 'Unknown Challenge';
            case 'quiz':
                return tx.quizzes?.title || 'Unknown Quiz';
            case 'onboarding':
                return `Onboarding: ${tx.reason || 'First Steps'}`;
            case 'admin_adjustment':
                return `Admin: ${tx.reason || 'Adjustment'}`;
            default:
                return tx.reason || 'Unknown Activity';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Coin Store</h1>
                <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 text-base sm:text-lg font-bold px-4 py-2 rounded-lg">
                    {currentUser?.coins} Coins
                </div>
            </div>
            
            <Card title="Transaction History">
                {loading ? (
                    <p>Loading history...</p>
                ) : transactions.length > 0 ? (
                    <div className="flow-root">
                        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map(tx => (
                                <li key={tx.id} className="py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate dark:text-white">
                                                {getSourceName(tx)}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                {new Date(tx.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                                            <p className={`font-semibold ${tx.status === 'approved' ? 'text-green-600' : 'text-gray-500'}`}>
                                                {tx.status === 'approved' ? '+' : ''}{tx.coin_amount} Coins
                                            </p>
                                            <StatusBadge status={tx.status} />
                                        </div>
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