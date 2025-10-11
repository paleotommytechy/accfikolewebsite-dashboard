
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Post } from '../types';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import { BookOpenIcon, ChatIcon, HeartIcon, SearchIcon, ChevronDownIcon } from '../components/ui/Icons';
import Button from '../components/ui/Button';

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const excerpt = post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');
    const defaultImage = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=800&auto=format=fit=crop";

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
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);

    const POSTS_PER_PAGE = 6;

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

    const processedPosts = useMemo(() => {
        let filtered = posts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        switch (sortOption) {
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'title-asc':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filtered.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'author-asc':
                filtered.sort((a, b) => (a.profiles.full_name || '').localeCompare(b.profiles.full_name || ''));
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }

        return filtered;
    }, [posts, searchTerm, sortOption]);

    const paginatedPosts = useMemo(() => {
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        return processedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
    }, [processedPosts, currentPage]);
    
    const totalPages = Math.ceil(processedPosts.length / POSTS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Fellowship Blog</h1>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-white dark:bg-dark border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                </div>
                <div className="relative">
                    <select
                        value={sortOption}
                        onChange={e => { setSortOption(e.target.value); setCurrentPage(1); }}
                        className="w-full sm:w-auto appearance-none bg-white dark:bg-dark border border-gray-300 dark:border-gray-700 rounded-lg pl-4 pr-10 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                        <option value="newest">Sort by: Newest</option>
                        <option value="oldest">Sort by: Oldest</option>
                        <option value="title-asc">Sort by: Title (A-Z)</option>
                        <option value="title-desc">Sort by: Title (Z-A)</option>
                        <option value="author-asc">Sort by: Author (A-Z)</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <div className="text-center p-8">Loading posts...</div>
            ) : paginatedPosts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedPosts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="!px-3 !py-1"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <Card>
                    <div className="text-center py-12">
                        <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold mt-4">No Posts Found</h3>
                        <p className="text-gray-500 mt-2">Your search didn't match any posts. Try a different term.</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Blog;
