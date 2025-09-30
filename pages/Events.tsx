

import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { Event } from '../types';
import { ClockIcon, LocationMarkerIcon, CalendarIcon } from '../components/ui/Icons';
import { marked } from 'marked';

// Array of placeholder images for visual variety
const placeholderImages = [
    'https://images.unsplash.com/photo-1519709249794-a957b43a8f15?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582555314816-7581e1a5a9c2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517486808906-6538cb3b8656?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488998427799-e3362cec87c3?q=80&w=800&auto=format&fit=crop'
];

const EventCard: React.FC<{ event: Event; index: number }> = ({ event, index }) => {
    const eventDate = new Date(event.date);
    const day = eventDate.getUTCDate(); // Use UTC to avoid timezone issues
    const month = eventDate.toLocaleString('default', { month: 'short', timeZone: 'UTC' });

    // Use a placeholder image, cycling through the array
    const imageUrl = event.image_url || placeholderImages[index % placeholderImages.length];

    return (
        <div className="bg-white dark:bg-dark rounded-lg shadow-md flex flex-col group overflow-hidden transition-shadow hover:shadow-xl animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="relative">
                <img
                    src={imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-16 h-16 bg-white/90 dark:bg-dark/80 backdrop-blur-sm rounded-lg shadow-lg text-primary-700 dark:text-primary-300 ring-2 ring-white/50">
                    <span className="text-3xl font-bold leading-none">{day}</span>
                    <span className="font-semibold text-sm tracking-wider">{month.toUpperCase()}</span>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">{event.title}</h3>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                     <p className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400"/>
                        <span>{event.time}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <LocationMarkerIcon className="w-4 h-4 text-gray-400" />
                        <span>{event.location}</span>
                    </p>
                </div>
               
                <div 
                  className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 flex-grow mb-5"
                  dangerouslySetInnerHTML={{ __html: marked.parse(event.description) }}
                ></div>
                
                <div className="mt-auto">
                    <Button size="md" className="w-full">RSVP Now</Button>
                </div>
            </div>
        </div>
    );
};

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const { isAdmin, isPro } = useAppContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(5); // Show only the 5 latest/upcoming events
      
      if (error) {
        console.error("Error fetching events", error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Upcoming Events</h1>
             {(isAdmin || isPro) && <Button to="/event-management">Manage Events</Button>}
        </div>
       
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Skeleton Loader */}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-dark rounded-lg shadow-md overflow-hidden animate-pulse">
                        <div className="w-full h-48 bg-gray-300 dark:bg-gray-700"></div>
                        <div className="p-5 space-y-4">
                            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded mt-4"></div>
                        </div>
                    </div>
                ))}
            </div>
        ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                ))}
            </div>
        ) : (
            <Card>
                <div className="text-center py-10">
                    <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold mt-4">No Upcoming Events</h3>
                    <p className="text-gray-500 mt-2">Please check back later for new events!</p>
                </div>
            </Card>
        )}
    </div>
  );
};

export default Events;