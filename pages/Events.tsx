
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockEvents } from '../services/mockData';
import type { Event } from '../types';

const EventItem: React.FC<{ event: Event }> = ({ event }) => {
    const eventDate = new Date(event.date);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('default', { month: 'short' });

    return (
        <Card className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-700 dark:text-primary-300">
                <span className="text-3xl font-bold">{day}</span>
                <span className="font-semibold">{month.toUpperCase()}</span>
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold">{event.title}</h3>
                <p className="text-sm text-gray-500">{event.time} @ {event.location}</p>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{event.description}</p>
            </div>
            <Button size="sm">RSVP</Button>
        </Card>
    );
};

const Events: React.FC = () => {
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Upcoming Events</h1>
             {/* Admin-only button */}
             <Button>Create Event</Button>
        </div>
       
        <div className="space-y-4">
            {mockEvents.map(event => (
                <EventItem key={event.id} event={event} />
            ))}
        </div>
    </div>
  );
};

export default Events;
