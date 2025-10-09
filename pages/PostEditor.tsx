// This is a new file: pages/PostEditor.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import type { Post } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CloudUploadIcon } from '../components/ui/Icons';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const InputLoadingSkeleton = () => <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;
const EditorLoadingSkeleton = () => <div className="w-full h-[360px] bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;


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
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPost(prev => ({ ...prev, [name]: value }));
    };
    
    const dataUrlToBlob = (dataUrl: string): Blob => {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) {
            throw new Error('Invalid data URL');
        }
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleGenerateImage = async () => {
        if (!post.title) {
            addToast('Please enter a title for the blog post first.', 'info');
            return;
        }
        setIsGeneratingImage(true);
        try {
            const apiResponse = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: post.title }),
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.message || 'Failed to generate image');
            }

            const { base64Image } = await apiResponse.json();
            const imageUrl = `data:image/png;base64,${base64Image}`;
            setPost(prev => ({...prev, image_url: imageUrl}));
            addToast('Image generated successfully!', 'success');
        } catch (error: any) {
            console.error("Error generating image:", error);
            addToast('Failed to generate image: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setIsGeneratingImage(false);
        }
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
        
        if (postData.image_url && postData.image_url.startsWith('data:image')) {
            try {
                const blob = dataUrlToBlob(postData.image_url);
                const filePath = `public/blog_images/${currentUser.id}/${Date.now()}.png`;
    
                const { error: uploadError } = await supabase.storage
                    .from('blog_images')
                    .upload(filePath, blob);
    
                if (uploadError) throw uploadError;
    
                const { data } = supabase.storage.from('blog_images').getPublicUrl(filePath);
                postData.image_url = data.publicUrl;
            } catch (uploadError: any) {
                addToast(`Error uploading to bucket 'blog_images': ${uploadError.message}`, 'error');
                setIsSubmitting(false);
                return;
            }
        }
        
        const { error } = await supabase.from('posts').upsert(postData);

        if (error) {
            addToast('Error saving post: ' + error.message, 'error');
        } else {
            addToast(`Post successfully ${newStatus === 'published' ? 'published' : 'saved as draft'}!`, 'success');
            // Clear autosaved content from localStorage
            localStorage.removeItem(`post-editor-title-${postId || 'new'}`);
            localStorage.removeItem(`post-editor-content-${postId || 'new'}`);
            navigate('/blog-management');
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return <div className="text-center p-8">Loading editor...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                {postId ? 'Edit Post' : 'Create New Post'}
            </h1>
            <Card>
                <form className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Post Title</label>
                        <Suspense fallback={<InputLoadingSkeleton />}>
                            <AutoSaveField
                                as="input"
                                storageKey={`post-editor-title-${postId || 'new'}`}
                                name="title"
                                value={post.title || ''}
                                onChange={handleInputChange}
                                placeholder="Enter a compelling title"
                                required
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </Suspense>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Content</label>
                        <Suspense fallback={<EditorLoadingSkeleton />}>
                            <AutoSaveField
                                as="textarea"
                                storageKey={`post-editor-content-${postId || 'new'}`}
                                name="content"
                                value={post.content || ''}
                                onChange={handleInputChange}
                                placeholder="Write your post content here... (Markdown is supported)"
                                rows={15}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                           />
                        </Suspense>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Featured Image URL</label>
                            <Button type="button" size="sm" variant="outline" onClick={handleGenerateImage} disabled={isGeneratingImage || !post.title}>
                                <CloudUploadIcon className="w-4 h-4 mr-2" />
                                {isGeneratingImage ? 'Generating...' : 'Generate with AI'}
                            </Button>
                        </div>
                        <InputField name="image_url" type="url" value={post.image_url || ''} onChange={handleInputChange} placeholder="https://example.com/image.jpg or generate one" />
                        {post.image_url && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Image Preview:</p>
                                <img src={post.image_url} alt="Post preview" className="w-full h-auto max-h-64 object-contain rounded-md border dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
                            </div>
                        )}
                    </div>


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
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
    <div>
        {label && <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>}
        <input {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
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