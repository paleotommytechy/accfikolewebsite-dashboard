
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { AppSettings, GroupChallenge, MasterTask } from '../types';

const AccessDenied: React.FC = () => (
    <Card title="Access Denied">
        <p className="text-red-500">You do not have permission to view this page. Please contact an administrator if you believe this is an error.</p>
    </Card>
);

const ScriptureSettings: React.FC = () => {
    const [scripture, setScripture] = useState('');
    const [settingId, setSettingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchScripture = async () => {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('app_settings')
                .select('id, scripture_of_the_day')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error("Error fetching scripture:", error);
            } else if (data) {
                setScripture(data.scripture_of_the_day || '');
                setSettingId(data.id);
            }
        };
        fetchScripture();
    }, []);

    const handleSave = async () => {
        if (!supabase) return;
        const { error } = await supabase
            .from('app_settings')
            .upsert({ id: settingId || undefined, scripture_of_the_day: scripture });

        if (error) {
            alert('Error saving scripture: ' + error.message);
        } else {
            alert('Scripture of the Day updated successfully!');
        }
    };

    return (
        <Card title="Scripture of the Day Management">
            <div className="space-y-4">
                <textarea
                    value={scripture}
                    onChange={(e) => setScripture(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Enter the scripture verse for the day..."
                />
                <Button onClick={handleSave}>Save Scripture</Button>
            </div>
        </Card>
    );
};

const ChallengeManager: React.FC = () => {
    const { currentUser } = useAppContext();
    const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
    const [editingChallenge, setEditingChallenge] = useState<Partial<GroupChallenge> | null>(null);

    const fetchChallenges = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('group_challenges').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching challenges', error);
        else setChallenges(data || []);
    }, []);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supabase || !editingChallenge || !currentUser) return;
        
        const challengeData = {
            ...editingChallenge,
            created_by: editingChallenge.id ? undefined : currentUser.id, // Only set creator on new challenges
        };

        const { error } = await supabase.from('group_challenges').upsert(challengeData);

        if (error) {
            alert('Error saving challenge: ' + error.message);
        } else {
            alert(`Challenge ${editingChallenge.id ? 'updated' : 'created'} successfully!`);
            setEditingChallenge(null);
            fetchChallenges();
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase || !window.confirm('Are you sure you want to delete this challenge?')) return;
        const { error } = await supabase.from('group_challenges').delete().eq('id', id);
        if (error) alert('Error deleting challenge: ' + error.message);
        else {
            alert('Challenge deleted.');
            fetchChallenges();
        }
    };
    
    const formTitle = editingChallenge?.id ? 'Edit Challenge' : 'Create New Challenge';

    return (
        <Card title="Group Challenges Management">
            {editingChallenge ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold">{formTitle}</h3>
                    <InputField label="Title" value={editingChallenge.title || ''} onChange={e => setEditingChallenge(p => ({...p, title: e.target.value}))} required />
                    <TextAreaField label="Description" value={editingChallenge.description || ''} onChange={e => setEditingChallenge(p => ({...p, description: e.target.value}))} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Start Date" type="date" value={editingChallenge.start_date || ''} onChange={e => setEditingChallenge(p => ({...p, start_date: e.target.value}))} />
                        <InputField label="End Date" type="date" value={editingChallenge.end_date || ''} onChange={e => setEditingChallenge(p => ({...p, end_date: e.target.value}))} />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Save Challenge</Button>
                        <Button variant="ghost" type="button" onClick={() => setEditingChallenge(null)}>Cancel</Button>
                    </div>
                </form>
            ) : (
                <Button onClick={() => setEditingChallenge({ title: '', description: '' })} className="mb-4">Create New Challenge</Button>
            )}

            <ul className="space-y-2">
                {challenges.map(c => (
                    <li key={c.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{c.title}</p>
                            <p className="text-sm text-gray-500">{c.description}</p>
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
    const { currentUser } = useAppContext();
    const [tasks, setTasks] = useState<MasterTask[]>([]);
    const [editingTask, setEditingTask] = useState<Partial<MasterTask> | null>(null);

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
        if (!supabase || !editingTask || !currentUser) return;

        const taskData = { ...editingTask, created_by: editingTask.id ? undefined : currentUser.id };
        const { error } = await supabase.from('tasks').upsert(taskData);
        if (error) alert('Error saving task: ' + error.message);
        else {
            alert(`Task ${editingTask.id ? 'updated' : 'created'} successfully!`);
            setEditingTask(null);
            fetchTasks();
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase || !window.confirm('Are you sure? This will delete the task for everyone.')) return;
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) alert('Error deleting task: ' + error.message);
        else {
            alert('Task deleted.');
            fetchTasks();
        }
    };
    
    return (
        <Card title="Tasks Management">
            {editingTask ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold">{editingTask.id ? 'Edit Task' : 'Create New Task'}</h3>
                    <InputField label="Title" value={editingTask.title || ''} onChange={e => setEditingTask(p => ({...p, title: e.target.value}))} required />
                    <TextAreaField label="Description" value={editingTask.description || ''} onChange={e => setEditingTask(p => ({...p, description: e.target.value}))} />
                    <div className="flex gap-2">
                        <Button type="submit">Save Task</Button>
                        <Button variant="ghost" type="button" onClick={() => setEditingTask(null)}>Cancel</Button>
                    </div>
                </form>
            ) : (
                <Button onClick={() => setEditingTask({ title: '', description: '' })} className="mb-4">Create New Task</Button>
            )}

            <ul className="space-y-2">
                {tasks.map(t => (
                    <li key={t.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{t.title}</p>
                            <p className="text-sm text-gray-500">{t.description}</p>
                        </div>
                        <div className="space-x-2 flex-shrink-0">
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
    const { isAdmin, isLoading } = useAppContext();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return (
             <div className="space-y-6">
                 <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Developer Settings</h1>
                 <AccessDenied />
             </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Developer Settings</h1>
            <ScriptureSettings />
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
