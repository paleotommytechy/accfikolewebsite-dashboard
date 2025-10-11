
// This is a new file: pages/BlogPost.tsx
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import type { Post, PostComment } from '../types';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import Button from '../components/ui/Button';
import { HeartIcon, ChatIcon, ShareIcon, BookmarkIcon, SendIcon } from '../components/ui/Icons';
import { marked } from 'marked';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const EditorLoadingSkeleton = () => <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>;

const BlogPost: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // SEO Effect
    useEffect(() => {
        if (!post) return;
        
        const originalTitle = document.title;
        const metaDescription = document.querySelector('meta[name="description"]');
        const originalDescriptionContent = metaDescription ? metaDescription.getAttribute('content') : null;

        // Set new title and description
        document.title = `${post.title} - ACCF Ikole Blog`;
        if (metaDescription) {
            const excerpt = post.content.substring(0, 160).replace(/\n/g, ' ').trim() + '...';
            metaDescription.setAttribute('content', excerpt);
        }

        // Cleanup function
        return () => {
            document.title = originalTitle;
            if (metaDescription && originalDescriptionContent) {
                metaDescription.setAttribute('content', originalDescriptionContent);
            }
        };
    }, [post]);

    const fetchPostAndInteractions = useCallback(async () => {
        if (!supabase || !postId) return;
        setLoading(true);

        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('*, profiles:author_id(full_name, avatar_url)')
            .eq('id', postId)
            .single();

        if (postError || !postData) {
            console.error("Error fetching post:", postError?.message);
            setLoading(false);
            return;
        }
        setPost(postData as Post);

        const { data: commentsData, error: commentsError } = await supabase
            .from('post_comments')
            .select('*, profiles:author_id(full_name, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        
        if (commentsError) console.error("Error fetching comments:", commentsError);
        else setComments((commentsData as PostComment[]) || []);

        if (currentUser) {
            const { data: likeData, error: likeError } = await supabase.from('post_likes').select('*').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
            if (!likeError) setIsLiked(!!likeData);
            
            const { data: bookmarkData, error: bookmarkError } = await supabase.from('post_bookmarks').select('*').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
            if (!bookmarkError) setIsBookmarked(!!bookmarkData);
        }

        setLoading(false);
    }, [postId, currentUser]);

    useEffect(() => {
        fetchPostAndInteractions();
    }, [fetchPostAndInteractions]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser || !post || !supabase) return;

        const { error } = await supabase.from('post_comments').insert({
            post_id: post.id,
            author_id: currentUser.id,
            comment: newComment.trim(),
        });

        if (error) {
            addToast('Failed to post comment: ' + error.message, 'error');
        } else {
            localStorage.removeItem(`new-comment-content-${post.id}-${currentUser.id}`);
            setNewComment('');
            // The new comment will be added via the real-time subscription.
            // Notify post author if it's not their own post
            if (post.author_id !== currentUser.id) {
                const { error: notificationError } = await supabase.from('notifications').insert({
                    user_id: post.author_id,
                    type: 'comment',
                    message: `${currentUser.full_name || 'Someone'} commented on your post: "${post.title}"`,
                    link: `/blog/${post.id}`,
                    metadata: { postId: post.id, commenterId: currentUser.id }
                });
                if (notificationError) {
                    console.error('Error creating comment notification:', notificationError);
                }
            }
        }
    };
    
    // Real-time subscription for comments
    useEffect(() => {
        if (!supabase || !postId) return;
        const channel = supabase.channel(`post-comments-${postId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` }, async (payload) => {
                const { data, error } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', payload.new.author_id).single();
                if (!error && data) {
                    const newCommentWithProfile = { ...payload.new, profiles: data } as PostComment;
                    setComments(prev => [...prev, newCommentWithProfile]);
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel) };
    }, [supabase, postId]);


    const toggleLike = async () => {
        if (!currentUser || !post || !supabase) return;
        
        // Optimistically update UI
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setPost(p => p ? { ...p, likes_count: p.likes_count + (newIsLiked ? 1 : -1) } : null);

        if (newIsLiked) {
            // Liking
            const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id });
            if (error) {
                addToast('Failed to like post: ' + error.message, 'error');
                // Revert optimistic update
                setIsLiked(false);
                setPost(p => p ? { ...p, likes_count: p.likes_count - 1 } : null);
            } else {
                // Notify post author
                if (post.author_id !== currentUser.id) {
                    const { error: notificationError } = await supabase.from('notifications').insert({
                        user_id: post.author_id,
                        type: 'like',
                        message: `${currentUser.full_name || 'Someone'} liked your post: "${post.title}"`,
                        link: `/blog/${post.id}`,
                        metadata: { postId: post.id, likerId: currentUser.id }
                    });
                    if (notificationError) {
                        console.error('Error creating like notification:', notificationError);
                    }
                }
            }
        } else {
            // Unliking
            const { error } = await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUser.id });
            if (error) {
                addToast('Failed to unlike post: ' + error.message, 'error');
                // Revert optimistic update
                setIsLiked(true);
                setPost(p => p ? { ...p, likes_count: p.likes_count + 1 } : null);
            }
        }
    };

    const toggleBookmark = async () => {
        if (!currentUser || !post || !supabase) return;
        if (isBookmarked) {
            await supabase.from('post_bookmarks').delete().match({ post_id: post.id, user_id: currentUser.id });
            setIsBookmarked(false);
        } else {
            await supabase.from('post_bookmarks').insert({ post_id: post.id, user_id: currentUser.id });
            setIsBookmarked(true);
        }
    };
    
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast('Link copied to clipboard!', 'success');
    };

    if (loading) return <div className="text-center p-8">Loading post...</div>;
    if (!post) return <div className="text-center p-8">Post not found.</div>;

    const defaultImage = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=800&auto=format=fit=crop";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <article>
                <img src={post.image_url || defaultImage} alt={post.title} className="w-full h-64 md:h-96 object-cover rounded-lg" />
                <header className="my-6">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{post.category}</span>
                    <h1 className="text-3xl md:text-4xl font-bold mt-2 text-gray-800 dark:text-white">{post.title}</h1>
                    <div className="flex items-center gap-4 mt-4 text-sm">
                        <Avatar src={post.profiles.avatar_url} alt={post.profiles.full_name || 'Author'} />
                        <div>
                            <p className="font-semibold">{post.profiles.full_name}</p>
                            <p className="text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </header>
                <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }}
                >
                </div>
            </article>

            <div className="flex items-center justify-around p-4 border-y dark:border-gray-700">
                <Button variant="ghost" onClick={toggleLike} className={isLiked ? 'text-red-500' : ''}>
                    <HeartIcon className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">Like ({post.likes_count})</span>
                    <span className="ml-1 sm:hidden">{post.likes_count}</span>
                </Button>
                <Button variant="ghost">
                    <ChatIcon className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">Comment ({comments.length})</span>
                    <span className="ml-1 sm:hidden">{comments.length}</span>
                </Button>
                <Button variant="ghost" onClick={handleShare}>
                    <ShareIcon className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">Share</span>
                </Button>
                <Button variant="ghost" onClick={toggleBookmark} className={isBookmarked ? 'text-primary-500' : ''}>
                    <BookmarkIcon className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">Bookmark</span>
                </Button>
            </div>

            <section>
                <h2 className="text-2xl font-bold mb-4">Comments ({comments.length})</h2>
                <Card>
                    <form onSubmit={handleCommentSubmit} className="flex items-start gap-4">
                        <Avatar src={currentUser?.avatar_url} alt={currentUser?.full_name || 'You'} />
                        <div className="flex-1">
                            <Suspense fallback={<EditorLoadingSkeleton />}>
                                <AutoSaveField
                                    as="textarea"
                                    storageKey={`new-comment-content-${postId}-${currentUser?.id}`}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border-transparent focus:ring-primary-500 focus:border-primary-500"
                                    rows={2}
                                />
                            </Suspense>
                            <Button type="submit" className="mt-2" disabled={!newComment.trim()}>
                                <SendIcon className="w-4 h-4 mr-2" /> Post Comment
                            </Button>
                        </div>
                    </form>
                </Card>
                <div className="space-y-4 mt-6">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-4">
                            <Avatar src={comment.profiles.avatar_url} alt={comment.profiles.full_name || 'User'} />
                            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm">{comment.profiles.full_name}</p>
                                    <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-sm mt-1">{comment.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default BlogPost;
