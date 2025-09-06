import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { WeeklyChallenge, Task, CoinTransaction } from '../types';
import Avatar from '../components/auth/Avatar';
import { CheckIcon } from '../components/ui/Icons';

const CoinApprovalManager: React.FC = () => {
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingTxnId, setApprovingTxnId] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        
        const { data: txData, error: txError } = await supabase
            .from('coin_transactions')
            .select('*, profiles(full_name, avatar_url)')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        
        if (txError) {
            console.error('Error fetching transactions', txError);
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

        const [tasksResponse, challengesResponse] = await Promise.all([
            taskIds.length > 0 ? supabase.from('tasks').select('id, title').in('id', taskIds) : Promise.resolve({ data: [], error: null }),
            challengeIds.length > 0 ? supabase.from('weekly_challenges').select('id, title').in('id', challengeIds) : Promise.resolve({ data: [], error: null })
        ]);

        if (tasksResponse.error) console.error("Error fetching task details for admin:", tasksResponse.error);
        if (challengesResponse.error) console.error("Error fetching challenge details for admin:", challengesResponse.error);

        const tasksMap = new Map(tasksResponse.data?.map(t => [t.id, t.title]));
        const challengesMap = new Map(challengesResponse.data?.map(c => [c.id, c.title]));

        const enrichedTransactions = txData.map(tx => {
            if (tx.source_type === 'task') {
                return { ...tx, tasks: { title: tasksMap.get(tx.source_id) || 'Unknown Task' } };
            }
            if (tx.source_type === 'challenge') {
                return { ...tx, weekly_challenges: { title: challengesMap.get(tx.source_id) || 'Unknown Challenge' } };
            }
            return tx;
        });

        setTransactions(enrichedTransactions as CoinTransaction[] || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        if (!supabase) return;

        if (status === 'approved') {
            setApprovingTxnId(id);
            try {
                const { error } = await supabase.rpc('approve_coin_transaction', { transaction_id: id });
                if (error) throw error;
                alert('Transaction approved and coins awarded.');
                fetchTransactions();
            } catch (error: any) {
                alert('Error approving transaction: ' + error.message);
            } finally {
                setApprovingTxnId(null);
            }
        } else { // 'rejected'
            const { error } = await supabase.from('coin_transactions').update({ status }).eq('id', id);
            if (error) {
                alert('Error updating status: ' + error.message);
            } else {
                alert(`Transaction ${status}.`);
                fetchTransactions();
            }
        }
    };
    
    const getSourceDescription = (tx: CoinTransaction): string => {
        const type = tx.source_type.charAt(0).toUpperCase() + tx.source_type.slice(1);
        let title = 'Unknown Activity';

        if (tx.source_type === 'task' && tx.tasks) {
            title = tx.tasks.title;
        } else if (tx.source_type === 'challenge' && tx.weekly_challenges) {
            title = tx.weekly_challenges.title;
        }
        return `${type}: ${title}`;
    };

    return (
        <Card title="Pending Coin Transactions">
            {loading ? (
                <p className="text-gray-500 p-4">Loading pending transactions...</p>
            ) : transactions.length > 0 ? (
                <ul className="space-y-4">
                    {transactions.map(tx => (
                        <li key={tx.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <Avatar src={tx.profiles?.avatar_url} alt={tx.profiles?.full_name || 'User'} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{tx.profiles?.full_name || 'Unknown User'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{getSourceDescription(tx)}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto">
                                <div className="text-lg font-bold text-yellow-500 flex-shrink-0">
                                    +{tx.coin_amount}
                                </div>
                                <div className="flex gap-2 ml-auto">
                                    <Button size="sm" onClick={() => handleUpdateStatus(tx.id, 'approved')} disabled={approvingTxnId === tx.id}>
                                        {approvingTxnId === tx.id ? 'Approving...' : 'Approve'}
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(tx.id, 'rejected')}>Reject</Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-10">
                    <CheckIcon className="w-16 h-16 mx-auto text-green-400 dark:text-green-500" />
                    <h3 className="text-lg font-semibold mt-4">All Caught Up!</h3>
                    <p className="text-gray-500 mt-2">There are no pending coin transactions to review.</p>
                </div>
            )}
        </Card>
    );
};


const ChallengeManager: React.FC = () => {
    const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
    const [editingChallenge, setEditingChallenge] = useState<Partial<WeeklyChallenge> | null>(null);

    const fetchChallenges = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('weekly_challenges').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching challenges', error);
        else setChallenges(data || []);
    }, []);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supabase || !editingChallenge) return;
        
        const challengeData = { ...editingChallenge };
        const { error } = await supabase.from('weekly_challenges').upsert(challengeData);

        if (error) alert('Error saving challenge: ' + error.message);
        else {
            alert(`Challenge ${editingChallenge.id ? 'updated' : 'created'} successfully!`);
            setEditingChallenge(null);
            fetchChallenges();
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase || !window.confirm('Are you sure you want to delete this challenge?')) return;
        const { error } = await supabase.from('weekly_challenges').delete().eq('id', id);
        if (error) alert('Error deleting challenge: ' + error.message);
        else {
            alert('Challenge deleted.');
            fetchChallenges();
        }
    };
    
    return (
        <Card title="Weekly Challenges Management">
            {editingChallenge ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold">{editingChallenge.id ? 'Edit Challenge' : 'Create New Challenge'}</h3>
                    <InputField label="Title" value={editingChallenge.title || ''} onChange={e => setEditingChallenge(p => ({...p, title: e.target.value}))} required />
                    <TextAreaField label="Details" value={editingChallenge.details || ''} onChange={e => setEditingChallenge(p => ({...p, details: e.target.value}))} />
                    <InputField label="Coin Reward" type="number" value={editingChallenge.coin_reward || 0} onChange={e => setEditingChallenge(p => ({...p, coin_reward: parseInt(e.target.value, 10)}))} required />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Start Date" type="date" value={editingChallenge.start_date || ''} onChange={e => setEditingChallenge(p => ({...p, start_date: e.target.value}))} />
                        <InputField label="Due Date" type="date" value={editingChallenge.due_date || ''} onChange={e => setEditingChallenge(p => ({...p, due_date: e.target.value}))} />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Save Challenge</Button>
                        <Button variant="ghost" type="button" onClick={() => setEditingChallenge(null)}>Cancel</Button>
                    </div>
                </form>
            ) : (
                <Button onClick={() => setEditingChallenge({ title: '', details: '', coin_reward: 50 })} className="mb-4">Create New Challenge</Button>
            )}

            <ul className="space-y-2">
                {challenges.map(c => (
                    <li key={c.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{c.title}</p>
                            <p className="text-sm text-yellow-500">{c.coin_reward} coins</p>
                        </div>
                        <div className="space-x-2 flex-shrink-0">
                            <Button size="sm" variant="outline" onClick={() => setEditingChallenge(c)}>Edit</Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDelete(c.id)}>Delete</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const TaskManager: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching tasks', error);
        else setTasks(data || []);
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supabase || !editingTask) return;
        const { error } = await supabase.from('tasks').upsert(editingTask);
        if (error) alert('Error saving task: ' + error.message);
        else {
            alert(`Task ${editingTask.id ? 'updated' : 'created'} successfully!`);
            setEditingTask(null);
            fetchTasks();
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase || !window.confirm('Are you sure? This will delete the task and all its assignments.')) return;
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) alert('Error deleting task: ' + error.message);
        else {
            alert('Task deleted.');
            fetchTasks();
        }
    };

    const handleAssignDaily = async (id: string) => {
        setAssigningTaskId(id);
        if (!supabase || !window.confirm('This will assign this task to all users for today. This action cannot be undone. Continue?')) {
            setAssigningTaskId(null);
            return;
        }

        try {
            // FIX: Removed incorrect generic type argument from rpc call and corrected logic.
            // The RPC function returns void, so success is determined by the absence of an error.
            const { error } = await supabase.rpc('assign_task_to_all_users', { task_id_to_assign: id });
            if (error) throw error;

            alert('Task assigned successfully to all users for today.');
        } catch (error: any) {
            alert('Error assigning task: ' + error.message);
        } finally {
            setAssigningTaskId(null);
        }
    };
    
    return (
        <Card title="Tasks Management">
            {editingTask ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold">{editingTask.id ? 'Edit Task' : 'Create New Task'}</h3>
                    <InputField label="Title" value={editingTask.title || ''} onChange={e => setEditingTask(p => ({...p, title: e.target.value}))} required />
                    <TextAreaField label="Details" value={editingTask.details || ''} onChange={e => setEditingTask(p => ({...p, details: e.target.value}))} />
                    <InputField label="Coin Reward" type="number" value={editingTask.coin_reward || 0} onChange={e => setEditingTask(p => ({...p, coin_reward: parseInt(e.target.value, 10)}))} required />
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Frequency</label>
                        <select value={editingTask.frequency || 'daily'} onChange={e => setEditingTask(p => ({...p, frequency: e.target.value as Task['frequency']}))} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="once">Once</option>
                        </select>
                    </div>
                    <InputField label="Due Date (optional)" type="date" value={editingTask.due_date || ''} onChange={e => setEditingTask(p => ({...p, due_date: e.target.value}))} />

                    <div className="flex gap-2">
                        <Button type="submit">Save Task</Button>
                        <Button variant="ghost" type="button" onClick={() => setEditingTask(null)}>Cancel</Button>
                    </div>
                </form>
            ) : (
                <Button onClick={() => setEditingTask({ title: '', details: '', frequency: 'daily', coin_reward: 10 })} className="mb-4">Create New Task</Button>
            )}

            <ul className="space-y-2">
                {tasks.map(t => (
                    <li key={t.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{t.title} <span className="text-xs font-normal bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full capitalize">{t.frequency}</span></p>
                            <p className="text-sm text-yellow-500">{t.coin_reward} coins</p>
                        </div>
                        <div className="space-x-2 flex-shrink-0">
                            {t.frequency === 'daily' && (
                                <Button size="sm" variant="outline" onClick={() => handleAssignDaily(t.id)} disabled={assigningTaskId === t.id}>
                                    {assigningTaskId === t.id ? 'Assigning...' : 'Assign Daily'}
                                </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setEditingTask(t)}>Edit</Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDelete(t.id)}>Delete</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
};


const DeveloperSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Developer Settings</h1>
            <CoinApprovalManager />
            <ChallengeManager />
            <TaskManager />
        </div>
    );
};


const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <textarea {...props} rows={3} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);

export default DeveloperSettings;