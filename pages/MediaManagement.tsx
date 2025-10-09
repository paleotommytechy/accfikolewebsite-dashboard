import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';
import type { GalleryPost } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CloudUploadIcon, TrashIcon, XIcon } from '../components/ui/Icons';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const InputLoadingSkeleton = () => <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;

const MediaManagement: React.FC = () => {
    // Component State
    const [posts, setPosts] = useState<GalleryPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [moreImagesUrl, setMoreImagesUrl] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    
    const { currentUser } = useAppContext();
    const { addToast, showConfirm } = useNotifier();

    const fetchPosts = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('gallery_posts')
            .select('*, profiles:author_id(full_name, avatar_url)')
            .order('created_at', { ascending: false });
        
        if (error) {
            addToast('Failed to fetch gallery posts: ' + error.message, 'error');
        } else {
            setPosts((data as GalleryPost[]) || []);
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).slice(0, 3);
            setFiles(selectedFiles);
            // FIX: Explicitly type `file` as `File` to resolve TypeScript error.
            const newPreviews = selectedFiles.map((file: File) => URL.createObjectURL(file));
            setPreviews(newPreviews);
        }
    };
    
    const removeImage = (index: number) => {
        setFiles(f => f.filter((_, i) => i !== index));
        setPreviews(p => p.filter((_, i) => i !== index));
    };
    
    const resetForm = () => {
        setTitle('');
        setCategory('');
        setMoreImagesUrl('');
        setFiles([]);
        setPreviews([]);
        // Clear autosaved data
        localStorage.removeItem('media-management-title');
        localStorage.removeItem('media-management-category');
        localStorage.removeItem('media-management-moreImagesUrl');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !supabase || files.length === 0 || !title || !category) {
            addToast('Please provide a title, category, and at least one image.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const imageUrls: string[] = [];
            for (const file of files) {
                const filePath = `public/${currentUser.id}/${Date.now()}-${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('gallery_images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage.from('gallery_images').getPublicUrl(filePath);
                imageUrls.push(publicUrl);
            }

            const { error: insertError } = await supabase.from('gallery_posts').insert({
                title,
                category,
                more_images_url: moreImagesUrl || undefined,
                image_urls: imageUrls,
                author_id: currentUser.id
            });

            if (insertError) throw insertError;
            
            addToast('Gallery post created successfully!', 'success');
            resetForm();
            fetchPosts();

        } catch (error: any) {
            addToast(`Error during upload/save to 'gallery_images': ${error.message}.`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (post: GalleryPost) => {
        showConfirm(`Are you sure you want to delete "${post.title}"? This will also remove all associated images.`, async () => {
             if (!supabase) return;
             try {
                // Delete images from storage
                const filePaths = post.image_urls.map(url => {
                    const path = new URL(url).pathname.split('/gallery_images/')[1];
                    return path;
                });

                if (filePaths.length > 0) {
                     const { error: storageError } = await supabase.storage
                        .from('gallery_images')
                        .remove(filePaths);
                    if (storageError) console.error("Partial failure: Could not delete all images from storage.", storageError);
                }

                // Delete post from database
                const { error: dbError } = await supabase.from('gallery_posts').delete().eq('id', post.id);
                if (dbError) throw dbError;

                addToast('Post deleted successfully.', 'success');
                fetchPosts();

            } catch (error: any) {
                 addToast('Error deleting post: ' + error.message, 'error');
            }
        });
    };

    const commonInputProps = {
        className: "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Media Management</h1>

            <Card title="Upload New Gallery Post">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                            <Suspense fallback={<InputLoadingSkeleton />}>
                                <AutoSaveField {...commonInputProps} as="input" value={title} onChange={e => setTitle(e.target.value)} required storageKey="media-management-title" />
                            </Suspense>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                            <Suspense fallback={<InputLoadingSkeleton />}>
                                <AutoSaveField {...commonInputProps} as="input" placeholder="e.g., Sunday Service" value={category} onChange={e => setCategory(e.target.value)} required storageKey="media-management-category" />
                            </Suspense>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Link for More Images (Optional)</label>
                        <Suspense fallback={<InputLoadingSkeleton />}>
                            <AutoSaveField {...commonInputProps} as="input" placeholder="Telegram, Google Drive, etc." value={moreImagesUrl} onChange={e => setMoreImagesUrl(e.target.value)} storageKey="media-management-moreImagesUrl" />
                        </Suspense>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Images (up to 3)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-dark rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                        <span>Upload files</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    </div>
                    
                    {previews.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {previews.map((src, index) => (
                                <div key={index} className="relative">
                                    <img src={src} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><XIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-right">
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading...' : 'Create Post'}</Button>
                    </div>
                </form>
            </Card>

            <Card title="Existing Posts">
                {loading ? <p>Loading posts...</p> : posts.length === 0 ? <p className="text-center text-gray-500 py-4">No gallery posts found.</p> : (
                    <ul className="space-y-4">
                        {posts.map(post => (
                            <li key={post.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <img src={post.image_urls[0]} alt={post.title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{post.title}</p>
                                    <p className="text-sm text-gray-500">{post.category} - {post.image_urls.length} image(s)</p>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => handleDelete(post)}><TrashIcon className="w-4 h-4" /></Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default MediaManagement;