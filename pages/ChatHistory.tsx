
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Avatar from '../components/auth/Avatar';
import { SearchIcon, ChatIcon, MenuIcon, PlusIcon, XIcon, UserIcon, CoinIcon, StarIcon } from '../components/ui/Icons';
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useParams, useNavigate, Outlet } = ReactRouterDOM;
import { useAppContext } from '../context/AppContext';
import type { ChatHistoryItem, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import Button from '../components/ui/Button';

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
    const { currentUser, toggleSidebar } = useAppContext();
    const { addToast, refreshNotifications } = useNotifier();
    const { userId: activeUserId } = useParams();
    const navigate = useNavigate();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [conversations, setConversations] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    const isViewingConversationOnMobile = !!activeUserId;

    const fetchConversations = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_chat_history');
        if (!error) setConversations((data as ChatHistoryItem[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchConversations(); }, [fetchConversations]);

    const filteredChats = useMemo(() => {
        if (!searchTerm) return conversations;
        return conversations.filter(chat => chat.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, conversations]);

    const handleOpenNewChatModal = async () => {
        setIsNewChatModalOpen(true);
        if (allUsers.length === 0) { 
            if (!supabase || !currentUser) return;
            const { data } = await supabase.from('profiles').select('*').neq('id', currentUser.id);
            if (data) setAllUsers(data as UserProfile[]);
        }
    };

    return (
        <div className="bg-chat-light-bg dark:bg-chat-bg text-chat-light-text-primary dark:text-chat-text-primary flex h-full overflow-hidden">
            {/* Contacts Sidebar (Visible on desktop, conditional on mobile) */}
            <div className={`flex flex-col h-full border-r dark:border-gray-800 w-full md:w-[380px] lg:w-[420px] transition-all duration-300 ${isViewingConversationOnMobile ? 'hidden md:flex' : 'flex'}`}>
                <header className="flex items-center justify-between p-3 bg-chat-light-panel dark:bg-chat-panel shadow-sm border-b dark:border-gray-800/50 flex-shrink-0 z-10">
                    <div className="flex items-center">
                        <button onClick={toggleSidebar} className="p-2 -ml-1 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50" aria-label="Open sidebar">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold ml-2">Chats</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={handleOpenNewChatModal} className="p-2 text-primary-600 dark:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors" aria-label="Start new chat">
                            <PlusIcon className="w-6 h-6" />
                        </button>
                        <Avatar src={currentUser?.avatar_url} alt={currentUser?.full_name || 'User'} size="md" className="border-2 border-white dark:border-gray-800 shadow-sm" />
                    </div>
                </header>

                <div className="px-4 py-4 flex-shrink-0">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chat-light-text-secondary dark:text-chat-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-chat-light-panel dark:bg-chat-panel text-chat-light-text-primary dark:text-chat-text-primary placeholder-chat-light-text-secondary dark:placeholder-chat-text-secondary border border-gray-200 dark:border-gray-700/50 rounded-full pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-chat-light-text-secondary dark:text-chat-text-secondary">Loading conversations...</div>
                    ) : (
                        <ul className="px-2">
                            {filteredChats.map(chat => (
                                <li key={chat.other_user_id}>
                                    <div
                                        onClick={() => navigate(`/messages/${chat.other_user_id}`)}
                                        className={`flex items-center p-3 my-1 rounded-xl space-x-3 transition-all duration-200 cursor-pointer ${activeUserId === chat.other_user_id ? 'bg-primary-500 !text-white shadow-lg' : 'hover:bg-gray-200/50 dark:hover:bg-chat-panel/60'}`}
                                    >
                                        <Avatar src={chat.other_user_avatar} alt={chat.other_user_name || 'User'} size="lg" className="!w-12 !h-12" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-sm truncate">{chat.other_user_name}</p>
                                                <p className={`text-[10px] ${activeUserId === chat.other_user_id ? 'text-white/80' : 'text-chat-light-text-secondary dark:text-chat-text-secondary'}`}>
                                                    {formatTimestamp(chat.last_message_at)}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-start mt-0.5">
                                                <p className={`text-xs truncate pr-4 ${activeUserId === chat.other_user_id ? 'text-white/70' : 'text-chat-light-text-secondary dark:text-chat-text-secondary'}`}>
                                                    {chat.last_message_text}
                                                </p>
                                                {chat.unread_count > 0 && activeUserId !== chat.other_user_id && (
                                                    <span className="flex-shrink-0 bg-primary-500 text-white text-[10px] font-black rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center border border-white dark:border-chat-bg">
                                                        {chat.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Conversation Area (Fills remaining width on desktop) */}
            <div className={`flex-grow h-full bg-white dark:bg-chat-bg relative ${!isViewingConversationOnMobile ? 'hidden md:flex' : 'flex'}`}>
                {activeUserId ? (
                    <Outlet />
                ) : (
                    <div className="hidden md:flex flex-col items-center justify-center w-full text-center p-8">
                         <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6">
                            <ChatIcon className="w-12 h-12 text-primary-600" />
                         </div>
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Select a chat to start messaging</h2>
                         <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">Connect with fellow members and share encouragement.</p>
                         <Button onClick={handleOpenNewChatModal} className="mt-8" variant="primary">Start New Chat</Button>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {isNewChatModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsNewChatModalOpen(false)}>
                    <div className="bg-chat-light-panel dark:bg-chat-panel rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700/50 flex-shrink-0">
                            <h2 className="text-xl font-bold">New Message</h2>
                            <button onClick={() => setIsNewChatModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="p-4 border-b dark:border-gray-700/50 flex-shrink-0">
                            <input
                                type="text"
                                placeholder="Search for a member..."
                                value={modalSearchTerm}
                                onChange={e => setModalSearchTerm(e.target.value)}
                                className="w-full bg-chat-light-bg dark:bg-chat-bg border-transparent rounded-full px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {allUsers.filter(u => u.full_name?.toLowerCase().includes(modalSearchTerm.toLowerCase())).map(user => (
                                <Link key={user.id} to={`/messages/${user.id}`} onClick={() => setIsNewChatModalOpen(false)} className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors space-x-4">
                                    <Avatar src={user.avatar_url} alt={user.full_name || user.email} size="md" />
                                    <div><p className="font-bold text-sm">{user.full_name}</p><p className="text-xs opacity-60">{user.fellowship_position || 'Member'}</p></div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHistory;
