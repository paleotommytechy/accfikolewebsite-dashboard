import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import type { GalleryPost } from '../types';
import { CameraIcon, XIcon, ShareIcon, DownloadIcon, ExternalLinkIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';

const Gallery: React.FC = () => {
    const [posts, setPosts] = useState<GalleryPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!supabase) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('gallery_posts')
                .select('*, profiles:author_id(full_name, avatar_url)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching gallery posts:", error);
            } else {
                setPosts((data as GalleryPost[]) || []);
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const categories = useMemo(() => ['All', ...Array.from(new Set(posts.map(p => p.category)))], [posts]);
    
    const filteredPosts = useMemo(() => {
        if (activeCategory === 'All') {
            return posts;
        }
        return posts.filter(p => p.category === activeCategory);
    }, [posts, activeCategory]);

    const handlePostClick = (post: GalleryPost) => {
        setSelectedPost(post);
    };

    const handleCloseModal = () => {
        setSelectedPost(null);
    };

    const SkeletonCard = () => (
        <div className="w-full h-64 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Media Gallery</h1>
            
            <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                    <Button key={category} variant={activeCategory === category ? 'primary' : 'outline'} onClick={() => setActiveCategory(category)}>
                        {category}
                    </Button>
                ))}
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredPosts.map((post, index) => (
                        <div key={post.id} onClick={() => handlePostClick(post)} className="group cursor-pointer rounded-lg overflow-hidden shadow-md relative animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                            <img src={post.image_urls[0]} alt={post.title} className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-4">
                                <h3 className="text-white font-bold truncate">{post.title}</h3>
                                <span className="text-xs text-gray-300">{post.image_urls.length} photo{post.image_urls.length > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="text-center py-12">
                        <CameraIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold mt-4">No Photos Found</h3>
                        <p className="text-gray-500 mt-2">There are no photos in this category yet. Please check back later!</p>
                    </div>
                </Card>
            )}
            
            {selectedPost && <ImageModal post={selectedPost} onClose={handleCloseModal} />}
        </div>
    );
};


// Modal Component
interface ImageModalProps {
    post: GalleryPost;
    onClose: () => void;
}
const ImageModal: React.FC<ImageModalProps> = ({ post, onClose }) => {
    const { addToast } = useNotifier();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = post.image_urls[currentImageIndex];
        link.download = `${post.title.replace(/\s/g, '_')}_${currentImageIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        const shareData = {
            title: `Check out this photo from ACCF Ikole: ${post.title}`,
            text: `See more from the "${post.category}" event.`,
            url: post.image_urls[currentImageIndex],
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                 navigator.clipboard.writeText(shareData.url);
                 addToast('Image link copied to clipboard!', 'success');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            addToast('Could not share at this time.', 'error');
        }
    };

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % post.image_urls.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + post.image_urls.length) % post.image_urls.length);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }} onClick={onClose}>
            <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-2 right-2 md:top-4 md:right-4 text-white/80 hover:text-white z-20 bg-black/30 rounded-full p-2" aria-label="Close modal">
                    <XIcon className="w-6 h-6" />
                </button>
                
                {/* Image Display */}
                <div className="relative w-full max-w-5xl h-4/5 flex items-center justify-center">
                    <img src={post.image_urls[currentImageIndex]} alt={post.title} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
                </div>
                
                {/* Navigation */}
                {post.image_urls.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 bg-black/30 rounded-full text-2xl font-bold">‹</button>
                        <button onClick={nextImage} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 bg-black/30 rounded-full text-2xl font-bold">›</button>
                    </>
                )}

                {/* Controls and Info */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-5xl p-4 text-white text-center">
                    <p className="font-bold">{post.title}</p>
                    <p className="text-sm opacity-80">{post.category} ({currentImageIndex + 1} / {post.image_urls.length})</p>
                    <div className="mt-4 flex flex-wrap justify-center items-center gap-2 md:gap-4">
                        <Button variant="secondary" onClick={handleShare}><ShareIcon className="w-5 h-5 mr-2"/> Share</Button>
                        <Button variant="secondary" onClick={handleDownload}><DownloadIcon className="w-5 h-5 mr-2"/> Download</Button>
                        {post.more_images_url && (
                             <Button href={post.more_images_url} target="_blank" rel="noopener noreferrer" variant="primary">
                                <ExternalLinkIcon className="w-5 h-5 mr-2"/> View All Images
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gallery;