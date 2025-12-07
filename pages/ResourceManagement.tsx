
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Resource, ResourceCategory } from '../types';
import { PencilAltIcon, TrashIcon, PlusIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const InputLoadingSkeleton = () => <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;
const EditorLoadingSkeleton = () => <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;

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

const ResourceManagement: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Resource Management</h1>
            <ResourceManager />
            <ResourceCategoryManager />
        </div>
    );
};

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string; children: React.ReactNode}> = ({label, children, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <select {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
            {children}
        </select>
    </div>
);

export default ResourceManagement;
