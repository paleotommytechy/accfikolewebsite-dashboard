import React, { useMemo, useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import Button from '../components/ui/Button';
import { SearchIcon, PencilAltIcon, ChatIcon } from '../components/ui/Icons';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { ChatHistoryItem } from '../types';

const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (date >= startOfToday) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (date >= startOfYesterday) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};


const ChatHistory: React.FC = () => {
    const { currentUser } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [conversations, setConversations] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!supabase || !currentUser) return;
            setLoading(true);
            
            // The user ID is inferred from the authenticated session by Supabase
            const { data, error } = await supabase.rpc('get_chat_history');

            if (error) {
                console.error('Error fetching chat history:', error);
            } else {
                setConversations(data || []);
            }
            setLoading(false);
        };

        fetchChatHistory();
    }, [currentUser]);

    const filteredChats = useMemo(() => {
        if (!searchTerm) return conversations;
        return conversations.filter(chat =>
            chat.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, conversations]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Messages</h1>
                <Button to="/compose">
                    <PencilAltIcon className="w-5 h-5 mr-2" />
                    New Message
                </Button>
            </div>

            <Card className="!p-0">
                <div className="p-4 border-b dark:border-gray-700">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-md pl-10 pr-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading conversations...</div>
                ) : (
                    <ul className="divide-y dark:divide-gray-700">
                        {filteredChats.length > 0 ? (
                            filteredChats.map(chat => (
                                <li key={chat.other_user_id}>
                                    <Link to="#" className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer space-x-4">
                                        <Avatar src={chat.other_user_avatar} alt={chat.other_user_name || 'User'} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-sm truncate">{chat.other_user_name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                    {formatTimestamp(chat.last_message_at)}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-start mt-1">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate pr-4">
                                                    {chat.last_message_text}
                                                </p>
                                                {chat.unread_count > 0 && (
                                                    <span className="flex-shrink-0 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                        {chat.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <ChatIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold mt-4">No Messages Yet</h3>
                                <p className="text-gray-500 mt-2">Start a new conversation to see it here.</p>
                            </div>
                        )}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default ChatHistory;