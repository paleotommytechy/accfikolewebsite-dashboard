
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { WeeklyChallenge, Task, CoinTransaction, Resource, ResourceCategory, Quiz, QuizQuestion } from '../types';
import Avatar from '../components/auth/Avatar';
import { CheckIcon, PlusIcon, PencilAltIcon, TrashIcon, ChatIcon, CheckCircleIcon, XCircleIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const InputLoadingSkeleton = () => <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;
const EditorLoadingSkeleton = () => <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;

const CoinApprovalManager: React.FC = () => {
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingTxnId, setUpdatingTxnId] = useState<number | null>(null);
    const { addToast } = useNotifier();

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

        const tasksMap = new Map(tasksResponse.data?.map((t: { id: string; title: string }): [string, string] => [t.id, t.title]));
        const challengesMap = new Map(challengesResponse.data?.map((c: { id: string; title: string }): [string, string] => [c.id, c.title]));

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

    // --- Real-time Subscription ---
    useEffect(() => {
        if (!supabase) return;
        const channel = supabase
            .channel('public:coin_transactions')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coin_transactions' }, payload => {
                // A new transaction was created, refetch the list to show it in the queue.
                if (payload.new.status === 'pending') {
                    fetchTransactions();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchTransactions]);

    const getSourceName = (tx: CoinTransaction): string => {
        if (tx.source_type === 'task' && tx.tasks) {
            return tx.tasks.title;
        } else if (tx.source_type === 'challenge' && tx.weekly_challenges) {
            return tx.weekly_challenges.title;
        }
        return 'an activity';
    };

    const handleUpdateStatus = async (transaction: CoinTransaction, status: 'approved' | 'rejected') => {
        if (!supabase) return;

        const { id: transactionId, user_id, coin_amount } = transaction;
        setUpdatingTxnId(transactionId);

        try {
            if (status === 'approved') {
                const { error: rpcError } = await supabase.rpc('approve_coin_transaction', { p_transaction_id: transactionId });
                if (rpcError) throw rpcError;

                const notificationMessage = `Your reward of ${coin_amount} coins for completing "${getSourceName(transaction)}" has been approved!`;
                
                const { error: notificationError } = await supabase.from('notifications').insert({
                    user_id: user_id,
                    type: 'coin_approved',
                    message: notificationMessage,
                    link: '/store'
                });
                if (notificationError) console.error("Failed to create notification:", notificationError);

                addToast('Transaction approved and coins awarded.', 'success');
            } else { // 'rejected'
                const { error } = await supabase.from('coin_transactions').update({ status }).eq('id', transactionId);
                if (error) throw error;
                addToast('Transaction rejected.', 'info');
            }
            fetchTransactions();
        } catch (error: any) {
            addToast(`Error updating transaction: ${error.message}`, 'error');
        } finally {
            setUpdatingTxnId(null);
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
                                    <Button size="sm" onClick={() => handleUpdateStatus(tx, 'approved')} disabled={updatingTxnId === tx.id}>
                                        {updatingTxnId === tx.id ? 'Updating...' : 'Approve'}
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(tx, 'rejected')} disabled={updatingTxnId === tx.id}>
                                        Reject
                                    </Button>
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
    const { addToast, showConfirm } = useNotifier();

    const fetchChallenges = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('weekly_challenges').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching challenges', error);
        else setChallenges(data || []);
    }, []);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);
    
    const clearChallengeLocalStorage = (id: string | undefined) => {
        const keyId = id || 'new';
        localStorage.removeItem(`challenge-editor-title-${keyId}`);
        localStorage.removeItem(`challenge-editor-details-${keyId}`);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supabase || !editingChallenge) return;
        
        const challengeData = { ...editingChallenge };
        const { error } = await supabase.from('weekly_challenges').upsert(challengeData);

        if (error) addToast('Error saving challenge: ' + error.message, 'error');
        else {
            addToast(`Challenge ${editingChallenge.id ? 'updated' : 'created'} successfully!`, 'success');
            clearChallengeLocalStorage(editingChallenge.id);
            setEditingChallenge(null);
            fetchChallenges();
        }
    };

    const handleDelete = (id: string) => {
        if (!supabase) return;
        
        const confirmedDelete = async () => {
            const { error } = await supabase.from('weekly_challenges').delete().eq('id', id);
            if (error) addToast('Error deleting challenge: ' + error.message, 'error');
            else {
                addToast('Challenge deleted.', 'success');
                clearChallengeLocalStorage(id);
                fetchChallenges();
            }
        };

        showConfirm('Are you sure you want to delete this challenge?', confirmedDelete);
    };
    
    const handleCancel = () => {
        clearChallengeLocalStorage(editingChallenge?.id);
        setEditingChallenge(null);
    };
    
    const commonInputProps = {
        className: "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500",
    };

    return (
        <Card title="Weekly Challenges Management">
            {editingChallenge ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold">{editingChallenge.id ? 'Edit Challenge' : 'Create New Challenge'}</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                        <Suspense fallback={<InputLoadingSkeleton />}>
                            <AutoSaveField {...commonInputProps} as="input" value={editingChallenge.title || ''} onChange={e => setEditingChallenge(p => ({...p, title: e.target.value}))} required storageKey={`challenge-editor-title-${editingChallenge.id || 'new'}`} />
                        </Suspense>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Details</label>
                        <Suspense fallback={<EditorLoadingSkeleton />}>
                            <AutoSaveField {...commonInputProps} as="textarea" value={editingChallenge.details || ''} onChange={e => setEditingChallenge(p => ({...p, details: e.target.value}))} storageKey={`challenge-editor-details-${editingChallenge.id || 'new'}`} />
                        </Suspense>
                    </div>
                    <InputField label="Coin Reward" type="number" value={editingChallenge.coin_reward || 50} onChange={e => setEditingChallenge(p => ({...p, coin_reward: parseInt(e.target.value, 10)}))} required />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Start Date" type="date" value={editingChallenge.start_date || ''} onChange={e => setEditingChallenge(p => ({...p, start_date: e.target.value}))} />
                        <InputField label="Due Date" type="date" value={editingChallenge.due_date || ''} onChange={e => setEditingChallenge(p => ({...p, due_date: e.target.value}))} />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Save Challenge</Button>
                        <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
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
    const { addToast, showConfirm } = useNotifier();

    const fetchTasks = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching tasks', error);
        else setTasks(data || []);
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);
    
    const clearTaskLocalStorage = (id: string | undefined) => {
        const keyId = id || 'new';
        localStorage.removeItem(`task-editor-title-${keyId}`);
        localStorage.removeItem(`task-editor-details-${keyId}`);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supabase || !editingTask) return;
        const { error } = await supabase.from('tasks').upsert(editingTask);
        if (error) addToast('Error saving task: ' + error.message, 'error');
        else {
            addToast(`Task ${editingTask.id ? 'updated' : 'created'} successfully!`, 'success');
            clearTaskLocalStorage(editingTask.id);
            setEditingTask(null);
            fetchTasks();
        }
    };

    const handleDelete = (id: string) => {
        if (!supabase) return;

        const confirmedDelete = async () => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) addToast('Error deleting task: ' + error.message, 'error');
            else {
                addToast('Task deleted.', 'success');
                clearTaskLocalStorage(id);
                fetchTasks();
            }
        };

        showConfirm('Are you sure? This will delete the task and all its assignments.', confirmedDelete);
    };

    const handleAssignTask = (id: string) => {
        if (!supabase) return;

        const assignTask = async () => {
            setAssigningTaskId(id);
            try {
                const { error } = await supabase.rpc('assign_task_to_all_users', { task_id_to_assign: id });
                if (error) throw error;
                addToast('Task assigned successfully to all users for today.', 'success');
            } catch (error: any) {
                addToast('Error assigning task: ' + error.message, 'error');
            } finally {
                setAssigningTaskId(null);
            }
        };
        
        showConfirm('This will assign this task to all users. This action cannot be undone. Continue?', assignTask);
    };
    
    const handleCancel = () => {
        clearTaskLocalStorage(editingTask?.id);
        setEditingTask(null);
    };
    
    const commonInputProps = {
        className: "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500",
    };

    return (
        <Card title="Tasks Management">
            {editingTask ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold">{editingTask.id ? 'Edit Task' : 'Create New Task'}</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                        <Suspense fallback={<InputLoadingSkeleton />}>
                            <AutoSaveField {...commonInputProps} as="input" value={editingTask.title || ''} onChange={e => setEditingTask(p => ({...p, title: e.target.value}))} required storageKey={`task-editor-title-${editingTask.id || 'new'}`} />
                        </Suspense>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Details</label>
                        <Suspense fallback={<EditorLoadingSkeleton />}>
                            <AutoSaveField {...commonInputProps} as="textarea" value={editingTask.details || ''} onChange={e => setEditingTask(p => ({...p, details: e.target.value}))} storageKey={`task-editor-details-${editingTask.id || 'new'}`} />
                        </Suspense>
                    </div>
                    <InputField label="Coin Reward" type="number" value={editingTask.coin_reward || 0} onChange={e => setEditingTask(p => ({...p, coin_reward: parseInt(e.target.value, 10)}))} required />
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Frequency</label>
                        <select value={editingTask.frequency || 'daily'} onChange={e => setEditingTask(p => ({...p, frequency: e.target.value as Task['frequency']}))} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="once">Once</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Save Task</Button>
                        <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
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
                            {(t.frequency === 'daily' || t.frequency === 'once') && (
                                <Button size="sm" variant="outline" onClick={() => handleAssignTask(t.id)} disabled={assigningTaskId === t.id}>
                                    {assigningTaskId === t.id ? 'Assigning...' : 'Assign Now'}
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

const ResourceManager: React.FC = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [editingResource, setEditingResource] = useState<Partial<Resource> | null>(null);
    const { addToast, showConfirm } = useNotifier();

    const fetchData = useCallback(async () => {
        if (!supabase) return;
        const [resourcesRes, categoriesRes] = await Promise.all([
            supabase.from('resources').select('*').order('created_at', { ascending: false }),
            supabase.from('resource_categories').select('*').order('name', { ascending: true })
        ]);
        
        if (resourcesRes.error) console.error('Error fetching resources', resourcesRes.error);
        else setResources(resourcesRes.data || []);
        
        if (categoriesRes.error) console.error('Error fetching categories', categoriesRes.error);
        else setCategories(categoriesRes.data || []);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const clearResourceLocalStorage = (id: string | undefined) => {
        const keyId = id || 'new';
        localStorage.removeItem(`resource-editor-title-${keyId}`);
        localStorage.removeItem(`resource-editor-description-${keyId}`);
        localStorage.removeItem(`resource-editor-url-${keyId}`);
        localStorage.removeItem(`resource-editor-thumbnail_url-${keyId}`);
    };
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supabase || !editingResource || !editingResource.title || !editingResource.url || !editingResource.category) {
            addToast('Please fill all required fields.', 'error');
            return;
        }
        const { error } = await supabase.from('resources').upsert(editingResource);
        if (error) {
            addToast('Error saving resource: ' + error.message, 'error');
        } else {
            addToast(`Resource ${editingResource.id ? 'updated' : 'created'} successfully!`, 'success');
            clearResourceLocalStorage(editingResource.id);
            setEditingResource(null);
            fetchData();
        }
    };

    const handleDelete = (id: string) => {
        showConfirm('Are you sure you want to delete this resource?', async () => {
            if (!supabase) return;
            const { error } = await supabase.from('resources').delete().eq('id', id);
            if (error) {
                addToast('Error deleting resource: ' + error.message, 'error');
            } else {
                addToast('Resource deleted.', 'success');
                clearResourceLocalStorage(id);
                fetchData();
            }
        });
    };
    
    const handleCancel = () => {
        clearResourceLocalStorage(editingResource?.id);
        setEditingResource(null);
    };

    const commonInputProps = {
        className: "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500",
    };

    const storageKeyId = editingResource?.id || 'new';

    return (
        <Card title="Resource Library Management">
            {editingResource ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border dark:border-gray-700 rounded-lg animate-fade-in-up">
                    <h3 className="text-lg font-semibold">{editingResource.id ? 'Edit Resource' : 'Create New Resource'}</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                        <Suspense fallback={<InputLoadingSkeleton />}>
                           <AutoSaveField {...commonInputProps} as="input" value={editingResource.title || ''} onChange={e => setEditingResource(p => ({ ...p, title: e.target.value }))} required storageKey={`resource-editor-title-${storageKeyId}`} />
                        </Suspense>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                        <Suspense fallback={<EditorLoadingSkeleton />}>
                           <AutoSaveField {...commonInputProps} as="textarea" value={editingResource.description || ''} onChange={e => setEditingResource(p => ({ ...p, description: e.target.value }))} storageKey={`resource-editor-description-${storageKeyId}`} />
                        </Suspense>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">URL</label>
                        <Suspense fallback={<InputLoadingSkeleton />}>
                           <AutoSaveField {...commonInputProps} as="input" type="url" placeholder="https://example.com/resource" value={editingResource.url || ''} onChange={e => setEditingResource(p => ({ ...p, url: e.target.value }))} required storageKey={`resource-editor-url-${storageKeyId}`} />
                        </Suspense>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Thumbnail Image URL (optional)</label>
                        <Suspense fallback={<InputLoadingSkeleton />}>
                           <AutoSaveField {...commonInputProps} as="input" type="url" placeholder="https://example.com/image.png" value={editingResource.thumbnail_url || ''} onChange={e => setEditingResource(p => ({ ...p, thumbnail_url: e.target.value }))} storageKey={`resource-editor-thumbnail_url-${storageKeyId}`} />
                        </Suspense>
                    </div>
                    <SelectField label="Category" value={editingResource.category || ''} onChange={e => setEditingResource(p => ({ ...p, category: e.target.value as Resource['category'] }))} required>
                        <option value="" disabled>Select a category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </SelectField>
                    <div className="flex gap-2">
                        <Button type="submit">Save Resource</Button>
                        <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
                    </div>
                </form>
            ) : (
                <Button onClick={() => setEditingResource({ title: '', url: '', category: categories[0]?.name || '' })} className="mb-4">Create New Resource</Button>
            )}
            <ul className="space-y-2">
                {resources.map(r => (
                    <li key={r.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{r.title}</p>
                            <p className="text-sm text-gray-500">{r.category}</p>
                        </div>
                        <div className="space-x-2 flex-shrink-0">
                            <Button size="sm" variant="outline" onClick={() => setEditingResource(r)}>Edit</Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDelete(r.id)}>Delete</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const ResourceCategoryManager: React.FC = () => {
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [editing, setEditing] = useState<Partial<ResourceCategory> | null>(null);
    const { addToast } = useNotifier();

    const fetchCategories = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('resource_categories').select('*').order('name');
        if (error) addToast(error.message, 'error');
        else setCategories(data || []);
    }, [addToast]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    
    const clearCategoryLocalStorage = (id: string | undefined) => {
        const keyId = id || 'new';
        localStorage.removeItem(`resource-category-editor-name-${keyId}`);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.name || !supabase) return;
        const { error } = await supabase.from('resource_categories').upsert(editing);
        if (error) addToast(error.message, 'error');
        else {
            addToast(`Category ${editing.id ? 'updated' : 'created'}.`, 'success');
            clearCategoryLocalStorage(editing.id);
            setEditing(null);
            fetchCategories();
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('resource_categories').delete().eq('id', id);
        if (error) {
            if (error.code === '23503') { // Foreign key violation
                addToast('Cannot delete category. It is currently being used by some resources.', 'error');
            } else {
                addToast(error.message, 'error');
            }
        } else {
            addToast('Category deleted.', 'success');
            clearCategoryLocalStorage(id);
            fetchCategories();
        }
    };
    
    const handleCancel = () => {
        clearCategoryLocalStorage(editing?.id);
        setEditing(null);
    };

    return (
        <Card title="Resource Categories">
            <div className="space-y-4">
                {editing ? (
                    <form onSubmit={handleSave} className="space-y-4 p-4 mb-4 border dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold">{editing.id ? 'Edit' : 'Create'} Category</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category Name</label>
                            <Suspense fallback={<InputLoadingSkeleton />}>
                                <AutoSaveField as="input" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" value={editing?.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} required storageKey={`resource-category-editor-name-${editing.id || 'new'}`} />
                            </Suspense>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                ) : (
                    <Button onClick={() => setEditing({})}>
                        <PlusIcon className="w-5 h-5 mr-2" /> Add New Category
                    </Button>
                )}
                 <ul className="space-y-2">
                    {categories.map(item => (
                        <li key={item.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                            <span>{item.name}</span>
                            <div className="space-x-2 flex-shrink-0">
                                <Button size="sm" variant="outline" onClick={() => setEditing(item)}><PencilAltIcon className="w-4 h-4" /></Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDelete(item.id)}><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

const QuizManager: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
    const [editing, setEditing] = useState<Partial<Quiz> | null>(null);
    const { addToast } = useNotifier();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        if (!supabase) return;
        const [quizzesRes, challengesRes] = await Promise.all([
            supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
            supabase.from('weekly_challenges').select('id, title').order('created_at', { ascending: false }),
        ]);
        if (quizzesRes.error) addToast(quizzesRes.error.message, 'error'); else setQuizzes(quizzesRes.data || []);
        if (challengesRes.error) addToast(challengesRes.error.message, 'error'); else setChallenges(challengesRes.data || []);
    }, [addToast]);
    
    useEffect(() => { fetchData(); }, [fetchData]);

    const clearQuizLocalStorage = (id: string | undefined) => {
        const keyId = id || 'new';
        localStorage.removeItem(`quiz-editor-title-${keyId}`);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.title || !editing.challenge_id || !supabase) {
            addToast('Please fill all required fields.', 'error');
            return;
        }
        const { error } = await supabase.from('quizzes').upsert(editing, { onConflict: 'challenge_id' });
        if (error) {
            if (error.code === '23505') addToast('A quiz already exists for this challenge. Please edit the existing one.', 'error');
            else addToast(error.message, 'error');
        } else {
            addToast(`Quiz ${editing.id ? 'updated' : 'created'}.`, 'success');
            clearQuizLocalStorage(editing.id);
            setEditing(null);
            fetchData();
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('quizzes').delete().eq('id', id);
        if (error) addToast(error.message, 'error');
        else { addToast('Quiz deleted.', 'success'); clearQuizLocalStorage(id); fetchData(); }
    };
    
    const handleCancel = () => {
        clearQuizLocalStorage(editing?.id);
        setEditing(null);
    };
    
    return (
        <Card title="Challenge Quizzes Management">
            <div className="space-y-4">
                {editing ? (
                    <form onSubmit={handleSave} className="space-y-4 p-4 mb-4 border dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold">{editing.id ? 'Edit Quiz' : 'Create New Quiz'}</h3>
                        <SelectField label="Link to Challenge" value={editing.challenge_id || ''} onChange={e => setEditing(p => ({ ...p, challenge_id: e.target.value }))} required>
                             <option value="" disabled>Select a challenge</option>
                             {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </SelectField>
                        <div>
                           <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Quiz Title</label>
                           <Suspense fallback={<InputLoadingSkeleton />}>
                               <AutoSaveField as="input" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" value={editing.title || ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} required storageKey={`quiz-editor-title-${editing.id || 'new'}`} />
                           </Suspense>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <InputField label="Coin Reward" type="number" value={editing.coin_reward || 25} onChange={e => setEditing(p => ({ ...p, coin_reward: parseInt(e.target.value) }))} required />
                           <InputField label="Questions to Pass" type="number" value={editing.pass_threshold || 2} onChange={e => setEditing(p => ({ ...p, pass_threshold: parseInt(e.target.value) }))} required />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                ) : (
                    <Button onClick={() => setEditing({})}>
                        <PlusIcon className="w-5 h-5 mr-2" /> Add New Quiz
                    </Button>
                )}
                 <ul className="space-y-2">
                    {quizzes.map(item => (
                        <li key={item.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-sm text-gray-500">For: {challenges.find(c => c.id === item.challenge_id)?.title || '...'}</p>
                            </div>
                            <div className="space-x-2 flex-shrink-0">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/developer-settings/quiz-editor/${item.id}`)}>Manage Questions</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditing(item)}><PencilAltIcon className="w-4 h-4" /></Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDelete(item.id)}><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};


const DeveloperSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Developer Settings</h1>
            <CoinApprovalManager />
            <ResourceManager />
            <ResourceCategoryManager />
            <ChallengeManager />
            <QuizManager />
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

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string; children: React.ReactNode}> = ({label, children, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <select {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
            {children}
        </select>
    </div>
);

export default DeveloperSettings;
