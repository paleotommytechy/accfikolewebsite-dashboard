// This is a new file: pages/PostEditor.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import type { Post } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const POST_CATEGORIES: Post['category'][] = ['Devotional', 'Bible Study', 'Announcement', 'Other'];

const PostEditor: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();

    const [post, setPost] = useState<Partial<Post>>({
        title: '',
        content: '',
        category: 'Devotional',
        status: 'draft',
        image_url: '',
    });
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (postId) {
            const fetchPost = async () => {
                if (!supabase) return;
                setLoading(true);
                const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single();
                if (error || !data) {
                    addToast('Could not find post to edit.', 'error');
                    navigate('/blog-management');
                } else {
                    setPost(data);
                }
                setLoading(false);
            };
            fetchPost();
        }
    }, [postId, navigate, addToast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPost(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent, newStatus: 'draft' | 'published') => {
        e.preventDefault();
        if (!currentUser || !supabase) return;
        setIsSubmitting(true);

        const postData = {
            ...post,
            status: newStatus,
            author_id: post.author_id || currentUser.id,
        };
        
        const { error } = await supabase.from('posts').upsert(postData);

        if (error) {
            addToast('Error saving post: ' + error.message, 'error');
        } else {
            addToast(`Post successfully ${newStatus === 'published' ? 'published' : 'saved as draft'}!`, 'success');
            navigate('/blog-management');
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return <div className="text-center p-8">Loading editor...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {postId ? 'Edit Post' : 'Create New Post'}
            </h1>
            <Card>
                <form className="space-y-4">
                    <InputField label="Post Title" name="title" value={post.title} onChange={handleInputChange} placeholder="Enter a compelling title" required />
                    
                    <TextAreaField label="Content" name="content" value={post.content} onChange={handleInputChange} rows={15} placeholder="Write your post content here... Supports basic markdown." required />

                    <InputField label="Featured Image URL" name="image_url" type="url" value={post.image_url || ''} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />

                    <SelectField label="Category" name="category" value={post.category} onChange={handleInputChange}>
                        {POST_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </SelectField>
                    
                    <div className="flex justify-end items-center gap-4 pt-4 border-t dark:border-gray-700">
                        <span className="text-sm text-gray-500">Current Status: <span className="font-semibold capitalize">{post.status}</span></span>
                        <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, 'draft')} disabled={isSubmitting}>Save as Draft</Button>
                        <Button type="submit" onClick={(e) => handleSubmit(e, 'published')} disabled={isSubmitting}>
                            {isSubmitting ? 'Publishing...' : 'Publish Post'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// Reusable form field components
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <textarea {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <select {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
            {children}
        </select>
    </div>
);

export default PostEditor;
