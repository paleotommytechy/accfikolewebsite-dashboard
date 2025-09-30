

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';
import type { Event } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CalendarIcon, PencilAltIcon, TrashIcon, PlusIcon, CloudUploadIcon, XIcon } from '../components/ui/Icons';

// Reusable form field components
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <textarea {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);


const EventManagement: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAppContext();
    const { addToast, showConfirm } = useNotifier();

    const fetchEvents = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            addToast('Failed to fetch events: ' + error.message, 'error');
        } else {
            setEvents(data || []);
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    const resetFormState = () => {
        setEditingEvent(null);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setImagePreview(event.image_url || null);
        setImageFile(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !editingEvent || !currentUser) return;

        // Basic validation
        if (!editingEvent.title || !editingEvent.date || !editingEvent.time || !editingEvent.location || !editingEvent.description) {
            addToast('Please fill all required fields.', 'error');
            return;
        }

        let imageUrl = editingEvent.image_url;

        // If a new image file is selected, upload it
        if (imageFile) {
            const filePath = `public/${currentUser.id}/${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('event_images')
                .upload(filePath, imageFile);

            if (uploadError) {
                addToast('Error uploading image: ' + uploadError.message, 'error');
                return;
            }
            
            // If there was an old image for an existing event, delete it
            if (editingEvent.id && editingEvent.image_url) {
                try {
                    const oldFilePath = new URL(editingEvent.image_url).pathname.split('/event_images/')[1];
                    if (oldFilePath) {
                        await supabase.storage.from('event_images').remove([oldFilePath]);
                    }
                } catch (e) {
                    console.error("Could not parse or delete old image:", e);
                }
            }

            const { data } = supabase.storage.from('event_images').getPublicUrl(filePath);
            imageUrl = data.publicUrl;
        }

        const eventData = {
            id: editingEvent.id, // This will be undefined for a new event, which is correct for an insert
            title: editingEvent.title,
            date: editingEvent.date,
            time: editingEvent.time,
            location: editingEvent.location,
            description: editingEvent.description,
            image_url: imageUrl,
        };

        const { error } = await supabase.from('events').upsert(eventData);

        if (error) {
            addToast('Error saving event: ' + error.message, 'error');
        } else {
            addToast(`Event ${editingEvent.id ? 'updated' : 'created'} successfully!`, 'success');
            resetFormState();
            fetchEvents();
        }
    };
    
    const handleDelete = (event: Event) => {
        showConfirm(`Are you sure you want to delete the event "${event.title}"?`, async () => {
            if (!supabase) return;
            // First, delete image from storage if it exists
            if (event.image_url) {
                try {
                     const filePath = new URL(event.image_url).pathname.split('/event_images/')[1];
                     if (filePath) {
                        await supabase.storage.from('event_images').remove([filePath]);
                     }
                } catch(e) {
                    console.error("Could not parse or delete image from storage:", e);
                }
            }
            
            // Then, delete the event record
            const { error } = await supabase.from('events').delete().eq('id', event.id);
            if (error) {
                addToast('Failed to delete event: ' + error.message, 'error');
            } else {
                addToast('Event deleted successfully.', 'success');
                fetchEvents();
            }
        });
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditingEvent(prev => (prev ? { ...prev, [name]: value } : null));
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Event Management</h1>

            {editingEvent ? (
                <Card title={editingEvent.id ? 'Edit Event' : 'Create New Event'}>
                    <form onSubmit={handleSave} className="space-y-4">
                        <InputField label="Event Title" name="title" value={editingEvent.title || ''} onChange={handleInputChange} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Date" name="date" type="date" value={editingEvent.date || ''} onChange={handleInputChange} required />
                            <InputField label="Time" name="time" type="time" value={editingEvent.time || ''} onChange={handleInputChange} required />
                        </div>
                        <InputField label="Location" name="location" value={editingEvent.location || ''} onChange={handleInputChange} required />
                        <TextAreaField label="Description (Markdown supported)" name="description" value={editingEvent.description || ''} onChange={handleInputChange} rows={6} required />
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Event Image</label>
                            {imagePreview && (
                                <div className="relative w-full h-48 mb-2">
                                    <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover rounded-md" />
                                    <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); setEditingEvent(p => ({...p, image_url: undefined})) }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><XIcon className="w-4 h-4" /></button>
                                </div>
                            )}
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-dark rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={resetFormState}>Cancel</Button>
                            <Button type="submit">Save Event</Button>
                        </div>
                    </form>
                </Card>
            ) : (
                 <Button onClick={() => setEditingEvent({})} className="w-full sm:w-auto">
                    <PlusIcon className="w-5 h-5 mr-2" /> Create New Event
                </Button>
            )}

            <Card title="Existing Events">
                 {loading ? (
                    <p className="text-center p-4">Loading events...</p>
                ) : events.length === 0 ? (
                    <div className="text-center p-8">
                        <CalendarIcon className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="mt-4 text-gray-500">No events found. Create one to get started!</p>
                    </div>
                ) : (
                    <>
                        {/* --- DESKTOP TABLE VIEW --- */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-dark divide-y divide-gray-200 dark:divide-gray-700">
                                    {events.map(event => (
                                        <tr key={event.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{event.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(event.date).toLocaleDateString()} at {event.time}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEditClick(event)}><PencilAltIcon className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="secondary" onClick={() => handleDelete(event)}><TrashIcon className="w-4 h-4" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* --- MOBILE CARD VIEW --- */}
                        <div className="block md:hidden">
                            <div className="space-y-4">
                                {events.map(event => (
                                    <div key={event.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white truncate">{event.title}</p>
                                            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                                        </div>
                                        <hr className="my-3 border-gray-200 dark:border-gray-700" />
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => handleEditClick(event)}>
                                                <PencilAltIcon className="w-4 h-4 mr-1" /> Edit
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleDelete(event)}>
                                                <TrashIcon className="w-4 h-4 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default EventManagement;
