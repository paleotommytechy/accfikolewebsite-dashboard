// This is a new file: pages/BlogManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import type { Post } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PencilAltIcon, TrashIcon, PlusIcon } from '../components/ui/Icons';

const BlogManagement: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToast, showConfirm } = useNotifier();

    const fetchPosts = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        // We bypass RLS for management, so we need to fetch all posts, not just 'published'
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles:author_id(full_name, avatar_url)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching posts for management:", error.message);
            addToast('Could not load posts.', 'error');
        } else {
            setPosts((data as Post[]) || []);
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleDelete = (post: Post) => {
        showConfirm(`Are you sure you want to delete the post "${post.title}"?`, async () => {
            if (!supabase) return;
            const { error } = await supabase.from('posts').delete().eq('id', post.id);
            if (error) {
                addToast('Failed to delete post: ' + error.message, 'error');
            } else {
                addToast('Post deleted successfully.', 'success');
                fetchPosts();
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Blog Management</h1>
                <Button onClick={() => navigate('/blog-management/editor')} className="w-full sm:w-auto">
                    <PlusIcon className="w-5 h-5 mr-2" /> Create New Post
                </Button>
            </div>

            <Card>
                {loading ? (
                    <p className="text-center p-4">Loading posts...</p>
                ) : posts.length === 0 ? (
                    <div className="text-center p-8">
                        <p className="text-gray-500">No posts found. Get started by creating one!</p>
                    </div>
                ) : (
                    <>
                        {/* --- DESKTOP TABLE VIEW --- */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-dark divide-y divide-gray-200 dark:divide-gray-700">
                                    {posts.map(post => (
                                        <tr key={post.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{post.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.profiles.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                                    {post.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <Button aria-label={`Edit ${post.title}`} size="sm" variant="outline" onClick={() => navigate(`/blog-management/editor/${post.id}`)}><PencilAltIcon className="w-4 h-4" /></Button>
                                                <Button aria-label={`Delete ${post.title}`} size="sm" variant="secondary" onClick={() => handleDelete(post)}><TrashIcon className="w-4 h-4" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* --- MOBILE CARD VIEW --- */}
                        <div className="block md:hidden">
                             <div className="space-y-4">
                                {posts.map(post => (
                                    <div key={post.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <div>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white truncate">{post.title}</p>
                                            <p className="text-sm text-gray-500">by {post.profiles.full_name}</p>
                                        </div>

                                        <hr className="my-3 border-gray-200 dark:border-gray-700" />
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Status:</span>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                                    {post.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 font-medium">Created:</span>
                                                <span className="text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        
                                        <hr className="my-3 border-gray-200 dark:border-gray-700" />
                                        
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button aria-label={`Edit ${post.title}`} variant="outline" size="sm" onClick={() => navigate(`/blog-management/editor/${post.id}`)}>
                                                <PencilAltIcon className="w-4 h-4 mr-1" /> Edit
                                            </Button>
                                            <Button aria-label={`Delete ${post.title}`} variant="secondary" size="sm" onClick={() => handleDelete(post)}>
                                                <TrashIcon className="w-4 h-4 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default BlogManagement;