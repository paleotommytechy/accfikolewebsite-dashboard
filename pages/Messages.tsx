

import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import Button from '../components/ui/Button';
import {
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    ListIcon,
    PaperAirplaneIcon,
    SearchIcon,
} from '../components/ui/Icons';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';

interface Recipient {
  id: string;
  name: string;
  role: string;
  avatar: string;
  category: 'Executives' | 'Alumni' | 'Pastors' | 'Workers' | 'Members';
}

const categories: Recipient['category'][] = ['Executives', 'Workers', 'Pastors', 'Alumni', 'Members'];

const Messages: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();

    const recipientId = searchParams.get('recipientId');

    const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
    const [loadingRecipients, setLoadingRecipients] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

     useEffect(() => {
        const fetchUsers = async () => {
            if (!supabase) return;
            setLoadingRecipients(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, fellowship_position, avatar_url');
            
            if (error) {
                console.error("Error fetching users for messaging:", error);
                addToast('Failed to load recipients', 'error');
            } else if (data) {
                const categorizedUsers = data.map(p => {
                    let category: Recipient['category'] = 'Members';
                    const position = p.fellowship_position?.toLowerCase();
                    if (position?.includes('president') || position?.includes('coordinator')) {
                        category = 'Executives';
                    } else if (position?.includes('alumni')) {
                        category = 'Alumni';
                    } else if (position?.includes('pastor')) {
                        category = 'Pastors';
                    } else if (position?.includes('worker')) {
                        category = 'Workers';
                    }

                    return {
                        id: p.id,
                        name: p.full_name || p.email,
                        role: p.fellowship_position || 'Member',
                        category: category,
                        avatar: p.avatar_url || ''
                    };
                });
                setAllRecipients(categorizedUsers);
            }
            setLoadingRecipients(false);
        };
        fetchUsers();
    }, [addToast]);

    useEffect(() => {
        if (recipientId && allRecipients.length > 0) {
            const recipient = allRecipients.find(r => r.id === recipientId);
            if (recipient) {
                setSelectedRecipients(new Set([recipientId]));
                setSearchTerm(recipient.name);
            }
        }
    }, [recipientId, allRecipients]);


    const handleSendMessage = async () => {
        if (!supabase || !currentUser || selectedRecipients.size === 0 || !subject || !message) {
            addToast('Please select recipients and fill out the subject and message.', 'error');
            return;
        }

        setIsSending(true);

        const messagesToInsert = Array.from(selectedRecipients).map(recipientId => ({
            sender_id: currentUser.id,
            receiver_id: recipientId,
            text: `Subject: ${subject}\n\n${message}`
        }));
        
        const notificationsToInsert = Array.from(selectedRecipients).map(recipientId => ({
            user_id: recipientId,
            type: 'comment', // Using 'comment' type as it's generic enough for a message
            message: `You have a new message from ${currentUser.full_name || currentUser.email}.`,
            link: '/messages'
        }));

        const { error: msgError } = await supabase.from('messages').insert(messagesToInsert);
        if (msgError) {
            addToast('Failed to send message: ' + msgError.message, 'error');
            setIsSending(false);
            return;
        }
        
        const { error: notifError } = await supabase.from('notifications').insert(notificationsToInsert);
        if (notifError) {
            addToast(`Message sent, but failed to create notification: ${notifError.message}`, 'error');
        } else {
            addToast(`Message sent to ${selectedRecipients.size} recipient(s).`, 'success');
        }

        setSelectedRecipients(new Set());
        setSubject('');
        setMessage('');
        setSearchTerm('');
        setIsSending(false);
    };


    const filteredRecipients = useMemo(() => {
        let recipients = allRecipients;
        if (selectedCategories.length > 0) {
            recipients = recipients.filter(r => selectedCategories.includes(r.category));
        }
        if (searchTerm) {
            recipients = recipients.filter(r =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return recipients;
    }, [selectedCategories, searchTerm, allRecipients]);

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleRecipientToggle = (recipientId: string) => {
        setSelectedRecipients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(recipientId)) {
                newSet.delete(recipientId);
            } else {
                newSet.add(recipientId);
            }
            return newSet;
        });
    };
    
    const handleSelectAllVisible = () => {
        const allVisibleIds = filteredRecipients.map(r => r.id);
        const currentSelection = new Set(selectedRecipients);
        const allVisibleAreSelected = allVisibleIds.every(id => currentSelection.has(id));

        if (allVisibleAreSelected) {
            // Deselect all visible
            allVisibleIds.forEach(id => currentSelection.delete(id));
        } else {
            // Select all visible
            allVisibleIds.forEach(id => currentSelection.add(id));
        }
        setSelectedRecipients(currentSelection);
    };

    const isAllVisibleSelected = filteredRecipients.length > 0 && filteredRecipients.every(r => selectedRecipients.has(r.id));
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Compose Message</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recipient Selection Panel */}
                <Card className="lg:col-span-1 flex flex-col !p-0 lg:max-h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h2 className="font-semibold text-lg">Select Recipients</h2>
                        <p className="text-sm text-gray-500">{selectedRecipients.size} selected</p>
                    </div>
                    <div className="p-4 border-b dark:border-gray-700 space-y-3">
                         <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-md pl-10 pr-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                             <Button
                                size="sm"
                                variant={selectedCategories.length === 0 ? 'primary' : 'outline'}
                                onClick={() => setSelectedCategories([])}
                            >
                                All Members
                            </Button>
                            {categories.map(cat => (
                                <Button
                                    key={cat}
                                    size="sm"
                                    variant={selectedCategories.includes(cat) ? 'primary' : 'outline'}
                                    onClick={() => handleCategoryToggle(cat)}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {loadingRecipients ? (
                            <p className="p-4 text-center text-gray-500">Loading recipients...</p>
                        ) : (
                          <>
                            {filteredRecipients.length > 0 && (
                                <div className="p-4 border-b dark:border-gray-700">
                                    <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isAllVisibleSelected}
                                            onChange={handleSelectAllVisible}
                                            className="rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        <span>Select All Visible</span>
                                    </label>
                                </div>
                            )}
                            <ul className="divide-y dark:divide-gray-700">
                                {filteredRecipients.map(user => (
                                    <li key={user.id}>
                                        <label className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecipients.has(user.id)}
                                                onChange={() => handleRecipientToggle(user.id)}
                                                className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <Avatar src={user.avatar} alt={user.name} size="md" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.role}</p>
                                            </div>
                                        </label>
                                    </li>
                                ))}
                                {filteredRecipients.length === 0 && (
                                    <p className="p-4 text-center text-gray-500">No recipients found.</p>
                                )}
                            </ul>
                          </>
                        )}
                    </div>
                </Card>

                {/* Message Composition Panel */}
                <div className="lg:col-span-2 flex flex-col">
                    <Card className="flex-1 flex flex-col !p-0 lg:h-[calc(100vh-12rem)] min-h-[500px]">
                         <div className="p-4 border-b dark:border-gray-700">
                            <label htmlFor="subject" className="sr-only">Subject</label>
                             <input
                                id="subject"
                                type="text"
                                placeholder="Message Subject"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full text-lg font-semibold bg-transparent border-none focus:ring-0 p-0"
                            />
                        </div>

                        <div className="flex flex-col flex-1">
                             <div className="p-2 border-b dark:border-gray-700 flex items-center space-x-1">
                                <EditorButton icon={<BoldIcon />} />
                                <EditorButton icon={<ItalicIcon />} />
                                <EditorButton icon={<UnderlineIcon />} />
                                <EditorButton icon={<ListIcon />} />
                            </div>
                            <textarea
                                placeholder="Type your message here..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="flex-1 w-full p-4 bg-transparent border-none focus:ring-0 resize-none"
                            ></textarea>
                        </div>

                        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
                            <Button size="lg" disabled={isSending || selectedRecipients.size === 0 || !subject || !message} onClick={handleSendMessage}>
                                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                                {isSending ? 'Sending...' : 'Send Message'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const EditorButton: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
    <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
        {icon}
    </button>
);

export default Messages;