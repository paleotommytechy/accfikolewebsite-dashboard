
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Post } from '../types';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import { BookOpenIcon, ChatIcon, HeartIcon, SearchIcon, ChevronDownIcon } from '../components/ui/Icons';
import Button from '../components/ui/Button';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const excerpt = post.content.substring(0, 120) + (post.content.length > 120 ? '...' : '');
    const defaultImage = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=800&auto=format&fit=crop";

    return (
        <Link to={`/blog/${post.id}/${slugify(post.title)}`} className="block group">
            <Card className="flex flex-col h-full !p-0 overflow-hidden transition-all duration-300 hover:-translate-y-2 !border-none !shadow-xl group-hover:ring-2 group-hover:ring-primary-500/20">
                <div className="relative h-56 overflow-hidden">
                    <img src={post.image_url || defaultImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4">
                        <span className="bg-white/90 dark:bg-dark/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-primary-600 px-3 py-1.5 rounded-full shadow-sm">
                            {post.category}
                        </span>
                    </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-black leading-tight text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{post.title}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3 flex-grow line-clamp-3">{excerpt}</p>
                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar src={post.profiles.avatar_url} alt={post.profiles.full_name || 'Author'} size="sm" className="!w-8 !h-8 border-2 border-white dark:border-gray-800 shadow-sm" />
                            <div>
                                <p className="text-[11px] font-black text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{post.profiles.full_name}</p>
                                <p className="text-[10px] font-bold text-gray-400">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-black text-gray-400">
                             <span className="flex items-center gap-1.5"><HeartIcon className="w-3.5 h-3.5" /> {post.likes_count}</span>
                             <span className="flex items-center gap-1.5"><ChatIcon className="w-3.5 h-3.5" /> {post.comments_count}</span>
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
        <div className="space-y-10 animate-fade-in-up">
            <header>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Fellowship Blog</h1>
                <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-xs">Stories, Devotionals & Updates</p>
            </header>
            
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-dark p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-50 dark:bg-secondary border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none font-medium"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <select
                        value={sortOption}
                        onChange={e => { setSortOption(e.target.value); setCurrentPage(1); }}
                        className="w-full appearance-none bg-gray-50 dark:bg-secondary border-none rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none font-black text-gray-600 dark:text-gray-300"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-dark rounded-3xl h-[400px] skeleton animate-shimmer" />
                    ))}
                </div>
            ) : paginatedPosts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paginatedPosts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-12 pb-10">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === page ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-dark text-gray-400 hover:bg-gray-100'}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <Card className="text-center py-20 !border-none !shadow-none">
                    <BookOpenIcon className="w-20 h-20 mx-auto text-gray-200 dark:text-gray-700" />
                    <h3 className="text-xl font-black mt-6 text-gray-400">No Articles Found</h3>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Try adjusting your search criteria</p>
                </Card>
            )}
        </div>
    );
};

export default Blog;
