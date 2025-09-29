
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Resource } from '../types';
import { BookOpenIcon, ExternalLinkIcon } from '../components/ui/Icons';

const RESOURCE_CATEGORIES: Resource['category'][] = ['Sermon Notes', 'Bible Studies', 'Leadership Training', 'Worship Guides', 'Other'];

const ResourceCard: React.FC<{ resource: Resource, index: number }> = ({ resource, index }) => {
    const defaultThumbnail = 'https://images.unsplash.com/photo-1543002588-b9b6b622e8af?q=80&w=800&auto=format&fit=crop';
    
    return (
        <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-white dark:bg-dark rounded-lg shadow-md flex flex-col group overflow-hidden transition-shadow hover:shadow-xl animate-fade-in-up" 
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="relative">
                <img
                    src={resource.thumbnail_url || defaultThumbnail}
                    alt={resource.title}
                    className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-0 right-0 m-2 bg-primary-600/90 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                    {resource.category}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white group-hover:text-primary-600 transition-colors">{resource.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow line-clamp-3 mb-4">{resource.description}</p>
                <div className="mt-auto text-sm font-semibold text-primary-600 flex items-center gap-1">
                    View Resource <ExternalLinkIcon className="w-4 h-4" />
                </div>
            </div>
        </a>
    );
};


const ResourceLibrary: React.FC = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    useEffect(() => {
        const fetchResources = async () => {
            if (!supabase) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching resources:", error);
            } else {
                setResources(data || []);
            }
            setLoading(false);
        };
        fetchResources();
    }, []);

    const filteredResources = useMemo(() => {
        if (activeCategory === 'All') {
            return resources;
        }
        return resources.filter(r => r.category === activeCategory);
    }, [resources, activeCategory]);

    const SkeletonCard = () => (
        <div className="bg-white dark:bg-dark rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-40 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Resource Library</h1>
            
            <div className="flex flex-wrap gap-2">
                <Button variant={activeCategory === 'All' ? 'primary' : 'outline'} onClick={() => setActiveCategory('All')}>All</Button>
                {RESOURCE_CATEGORIES.map(category => (
                    <Button key={category} variant={activeCategory === category ? 'primary' : 'outline'} onClick={() => setActiveCategory(category)}>
                        {category}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource, index) => (
                        <ResourceCard key={resource.id} resource={resource} index={index} />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="text-center py-12">
                        <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold mt-4">No Resources Found</h3>
                        <p className="text-gray-500 mt-2">There are no resources available in this category yet. Please check back later!</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ResourceLibrary;
