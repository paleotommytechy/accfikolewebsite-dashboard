import React, { useMemo, useState, useEffect } from 'react';
import Avatar from '../components/auth/Avatar';
import { SearchIcon, UserIcon, UsersIcon, ChatIcon } from '../components/ui/Icons';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { ChatHistoryItem } from '../types';
import { mockChatHistory } from '../services/mockData';

const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (date >= startOfToday) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

const ChatHistory: React.FC = () => {
    const { currentUser } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [conversations, setConversations] = useState<ChatHistoryItem[]>(mockChatHistory);
    const [loading, setLoading] = useState(false);

    const filteredChats = useMemo(() => {
        if (!searchTerm) return conversations;
        return conversations.filter(chat =>
            chat.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, conversations]);

    return (
        <div className="bg-chat-light-bg text-chat-light-text-primary flex flex-col -m-4 sm:-m-6 lg:-m-8 h-[calc(100vh_-_4rem)]">
            {/* Header */}
            <header className="flex items-center justify-between p-4 flex-shrink-0 border-b border-gray-200">
                <Avatar src={currentUser?.avatar_url} alt={currentUser?.full_name || 'User'} size="md" />
                <h1 className="text-2xl font-bold flex-1 text-center">Chats</h1>
                <div className="w-10 h-10"></div> {/* Placeholder to keep title centered */}
            </header>

            {/* Search */}
            <div className="px-4 py-4 flex-shrink-0">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chat-light-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-chat-light-bg text-chat-light-text-primary placeholder-chat-light-text-secondary border-none rounded-full pl-11 pr-4 py-3 shadow-neumorphic-light-inset focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-grow overflow-y-auto">
                {loading ? (
                    <div className="text-center py-10 text-chat-light-text-secondary">Loading conversations...</div>
                ) : (
                    <ul className="px-2">
                        {filteredChats.length > 0 ? (
                            filteredChats.map(chat => (
                                <li key={chat.other_user_id}>
                                    <Link to={`/messages/${chat.other_user_id}`} className="flex items-center p-3 my-2 hover:bg-white rounded-xl space-x-4 transition-colors duration-200">
                                        <div className="relative">
                                            <Avatar src={chat.other_user_avatar} alt={chat.other_user_name || 'User'} size="lg" className="!w-14 !h-14"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-base truncate text-chat-light-text-primary">{chat.other_user_name}</p>
                                                <p className="text-xs text-chat-light-text-secondary flex-shrink-0">
                                                    {formatTimestamp(chat.last_message_at)}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-start mt-1">
                                                <p className="text-sm text-chat-light-text-secondary truncate pr-4">
                                                    {chat.last_message_text}
                                                </p>
                                                {chat.unread_count > 0 && (
                                                    <span className="flex-shrink-0 bg-primary-500 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
                                                        {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        ) : (
                             <div className="text-center py-20 px-4">
                                <ChatIcon className="w-16 h-16 mx-auto text-gray-300" />
                                <h3 className="text-lg font-semibold mt-4 text-chat-light-text-primary">No Messages Yet</h3>
                                <p className="text-chat-light-text-secondary mt-2">Start a new conversation to see it here.</p>
                            </div>
                        )}
                    </ul>
                )}
            </div>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="flex-shrink-0 p-3 md:hidden">
                 <div className="flex justify-around items-center bg-chat-light-bg p-2 rounded-full shadow-neumorphic-light-raised">
                    <button className="p-3 text-primary-500"><ChatIcon className="w-7 h-7" /></button>
                    <button className="p-3 text-chat-light-text-secondary"><UserIcon className="w-7 h-7" /></button>
                    <button className="p-3 text-chat-light-text-secondary"><UsersIcon className="w-7 h-7" /></button>
                 </div>
            </nav>
        </div>
    );
};

export default ChatHistory;