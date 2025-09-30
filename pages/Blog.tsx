import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Post } from '../types';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import { BookOpenIcon, ChatIcon, HeartIcon } from '../components/ui/Icons';

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const excerpt = post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');
    const defaultImage = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=800&auto=format&fit=crop";

    return (
        <Link to={`/blog/${post.id}`} className="block group">
            <Card className="flex flex-col h-full !p-0 overflow-hidden transition-shadow hover:shadow-xl">
                <img src={post.image_url || defaultImage} alt={post.title} className="w-full h-48 object-cover" />
                <div className="p-5 flex flex-col flex-grow">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{post.category}</span>
                    <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-white group-hover:text-primary-600">{post.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex-grow">{excerpt}</p>
                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar src={post.profiles.avatar_url} alt={post.profiles.full_name || 'Author'} size="sm" />
                            <div>
                                <p className="text-sm font-semibold">{post.profiles.full_name}</p>
                                <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                             <span className="flex items-center gap-1"><HeartIcon className="w-4 h-4" /> {post.likes_count}</span>
                             <span className="flex items-center gap-1"><ChatIcon className="w-4 h-4" /> {post.comments_count}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
};

const Blog: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!supabase) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles:author_id(full_name, avatar_url)')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching posts:", error.message);
            } else {
                setPosts((data as Post[]) || []);
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Fellowship Blog</h1>
            
            {loading ? (
                <div className="text-center p-8">Loading posts...</div>
            ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="text-center py-12">
                        <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold mt-4">No Posts Yet</h3>
                        <p className="text-gray-500 mt-2">Check back soon for devotionals, teachings, and more!</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Blog;