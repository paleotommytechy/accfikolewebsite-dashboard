import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Avatar from '../components/auth/Avatar';
import { SearchIcon, ChatIcon, MenuIcon, PlusIcon, XIcon, UserIcon, CoinIcon, StarIcon, PhoneIcon, UsersIcon } from '../components/ui/Icons';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useParams, useNavigate } = ReactRouterDOM;
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

// --- User Profile Modal Component ---
interface UserProfileModalProps {
    user: UserProfile | null;
    isLoading: boolean;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isLoading, onClose }) => {
    const navigate = useNavigate();
    
    // The presence of the user object (even empty during load) controls visibility
    if (!user) { 
        return null;
    }

    const handleSendMessage = () => {
        if (user) {
            navigate(`/messages/${user.id}`);
            onClose();
        }
    };
    
    const handleViewProfile = () => {
        if (user) {
            navigate(`/profile/${user.id}`);
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up"
            style={{ animationDuration: '200ms' }}
            onClick={onClose}
        >
            <div 
                className="bg-light dark:bg-dark rounded-2xl shadow-xl max-w-sm w-full relative" 
                onClick={e => e.stopPropagation()}
            >
                {isLoading ? (
                    <div className="h-96 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <>
                        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close user profile modal">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div className="h-24 bg-primary-500 rounded-t-2xl"></div>
                        <div className="p-6 text-center -mt-16">
                            <Avatar src={user.avatar_url} alt={user.full_name || ''} size="xl" className="mx-auto border-4 border-light dark:border-dark" />
                            <h2 className="text-2xl font-bold text-secondary dark:text-light mt-4">{user.full_name}</h2>
                            <p className="text-base text-gray-500 dark:text-gray-400">{user.fellowship_position || 'Member'}</p>
                            
                            <div className="mt-6 flex justify-around text-center border-t border-b py-4 dark:border-gray-700">
                                <div>
                                    <StarIcon className="w-6 h-6 mx-auto text-yellow-500" />
                                    <p className="font-bold text-lg mt-1">{user.level}</p>
                                    <p className="text-xs uppercase font-semibold text-gray-500">Level</p>
                                </div>
                                <div>
                                    <CoinIcon className="w-6 h-6 mx-auto text-yellow-500" />
                                    <p className="font-bold text-lg mt-1">{user.coins}</p>
                                    <p className="text-xs uppercase font-semibold text-gray-500">Coins</p>
                                </div>
                                 {user.department && (
                                     <div>
                                         <UsersIcon className="w-6 h-6 mx-auto text-gray-500" />
                                         <p className="font-bold text-sm mt-1 truncate max-w-[80px]">{user.department}</p>
                                         <p className="text-xs uppercase font-semibold text-gray-500">Dept</p>
                                     </div>
                                 )}
                            </div>

                            {user.whatsapp && (
                                <div className="mt-4 text-left">
                                    <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600">
                                        <PhoneIcon className="w-5 h-5" />
                                        <span>{user.whatsapp}</span>
                                    </a>
                                </div>
                            )}

                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button onClick={handleSendMessage} variant="primary" className="w-full">
                                    <ChatIcon className="w-5 h-5 mr-2" /> Message
                                </Button>
                                <Button onClick={handleViewProfile} variant="outline" className="w-full">
                                    <UserIcon className="w-5 h-5 mr-2" /> View Profile
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const ChatHistory: React.FC = () => {
    const { currentUser, toggleSidebar } = useAppContext();
    const { addToast, refreshNotifications } = useNotifier();
    const { userId: activeUserId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [conversations, setConversations] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State for the "New Chat" modal
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    // State for the profile modal
    const [selectedUserForModal, setSelectedUserForModal] = useState<UserProfile | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);


    const fetchConversations = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_chat_history');
        if (error) {
            console.error('Error fetching chat history:', error);
        } else {
            setConversations((data as ChatHistoryItem[]) || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (!supabase || !currentUser) return;

        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
            }, 
            (payload) => {
                // Refetch the whole list to get updated counts and last messages
                fetchConversations();
                refreshNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, currentUser, fetchConversations, refreshNotifications]);

    const filteredChats = useMemo(() => {
        if (!searchTerm) return conversations;
        return conversations.filter(chat =>
            chat.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, conversations]);

    const handleOpenNewChatModal = async () => {
        setIsNewChatModalOpen(true);
        // Fetch users only once
        if (allUsers.length === 0) { 
            setLoadingUsers(true);
            if (!supabase || !currentUser) return;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', currentUser.id); // Exclude the current user from the list
            
            if (error) {
                console.error("Error fetching users for new chat:", error);
            } else {
                setAllUsers((data as UserProfile[]) || []);
            }
            setLoadingUsers(false);
        }
    };

    const handleCloseNewChatModal = () => {
        setIsNewChatModalOpen(false);
        setModalSearchTerm(''); // Reset search on close
    };

    const filteredUsersForModal = useMemo(() => {
        if (!modalSearchTerm) return allUsers;
        return allUsers.filter(user =>
            user.full_name?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(modalSearchTerm.toLowerCase())
        );
    }, [modalSearchTerm, allUsers]);

    const handleAvatarClick = async (userId: string) => {
        if (!supabase) return;
        setIsModalLoading(true);
        setSelectedUserForModal({} as UserProfile); // Open modal with loader
        
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error) throw error;
            if (data) {
                setSelectedUserForModal(data as UserProfile);
            }
        } catch (error: any) {
            addToast('Could not load user profile.', 'error');
            setSelectedUserForModal(null); // Close on error
        } finally {
            setIsModalLoading(false);
        }
    };


    return (
        <div className="bg-chat-light-bg dark:bg-chat-bg text-chat-light-text-primary dark:text-chat-text-primary flex flex-col h-full relative">
            {/* Main Layout */}
            <div className="flex flex-col h-full">
                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-chat-light-panel dark:bg-chat-panel shadow-sm flex-shrink-0 z-10">
                    <div className="flex items-center">
                        <button onClick={toggleSidebar} className="text-chat-light-text-secondary dark:text-chat-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md">
                            <MenuIcon />
                        </button>
                        <h1 className="text-xl font-bold ml-4">Chats</h1>
                    </div>
                    <Avatar src={currentUser?.avatar_url} alt={currentUser?.full_name || 'User'} size="md" />
                </header>

                {/* Search */}
                <div className="px-4 py-4 flex-shrink-0">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chat-light-text-secondary dark:text-chat-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-chat-light-panel dark:bg-chat-panel text-chat-light-text-primary dark:text-chat-text-primary placeholder-chat-light-text-secondary dark:placeholder-chat-text-secondary border border-gray-200 dark:border-gray-700/50 rounded-full pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-grow overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-10 text-chat-light-text-secondary dark:text-chat-text-secondary">Loading conversations...</div>
                    ) : (
                        <ul className="px-2">
                            {filteredChats.length > 0 ? (
                                filteredChats.map(chat => (
                                    <li key={chat.other_user_id}>
                                        <div
                                            onClick={() => navigate(`/messages/${chat.other_user_id}`)}
                                            className={`flex items-center p-3 my-1 rounded-xl space-x-4 transition-colors duration-200 cursor-pointer ${activeUserId === chat.other_user_id ? 'bg-primary-50 dark:bg-primary-900/40' : 'hover:bg-gray-200/50 dark:hover:bg-chat-panel/60'}`}
                                            aria-current={activeUserId === chat.other_user_id ? 'page' : undefined}
                                        >
                                            <div
                                                className="relative z-10 group"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAvatarClick(chat.other_user_id);
                                                }}
                                            >
                                                <Avatar src={chat.other_user_avatar} alt={chat.other_user_name || 'User'} size="lg" className="!w-14 !h-14 transition-transform group-hover:scale-110" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold text-base truncate text-chat-light-text-primary dark:text-chat-text-primary">{chat.other_user_name}</p>
                                                    <p className="text-xs text-chat-light-text-secondary dark:text-chat-text-secondary flex-shrink-0">
                                                        {formatTimestamp(chat.last_message_at)}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-start mt-1">
                                                    <p className="text-sm text-chat-light-text-secondary dark:text-chat-text-secondary truncate pr-4">
                                                        {chat.last_message_text}
                                                    </p>
                                                    {chat.unread_count > 0 && (
                                                        <span className="flex-shrink-0 bg-primary-500 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
                                                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <div className="text-center py-20 px-4">
                                    <ChatIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                                    <h3 className="text-lg font-semibold mt-4 text-chat-light-text-primary dark:text-chat-text-primary">No Messages Yet</h3>
                                    <p className="text-chat-light-text-secondary dark:text-chat-text-secondary mt-2">Tap the '+' button to start a new conversation.</p>
                                </div>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleOpenNewChatModal}
                className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform hover:scale-110"
                aria-label="Start new chat"
            >
                <PlusIcon className="w-6 h-6" />
            </button>

            {/* New Chat Modal */}
            {isNewChatModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up"
                    style={{ animationDuration: '200ms' }}
                    onClick={handleCloseNewChatModal}
                >
                    <div 
                        className="bg-chat-light-panel dark:bg-chat-panel rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
                            <h2 className="text-xl font-bold">Start a New Chat</h2>
                            <button onClick={handleCloseNewChatModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        {/* Modal Search */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
                             <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chat-light-text-secondary dark:text-chat-text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Search for a member..."
                                    value={modalSearchTerm}
                                    onChange={e => setModalSearchTerm(e.target.value)}
                                    className="w-full bg-chat-light-bg dark:bg-chat-bg text-chat-light-text-primary dark:text-chat-text-primary placeholder-chat-light-text-secondary dark:placeholder-chat-text-secondary border border-gray-200 dark:border-gray-700/50 rounded-full pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        {/* Modal User List */}
                        <div className="flex-1 overflow-y-auto">
                            {loadingUsers ? (
                                <p className="text-center p-8 text-chat-light-text-secondary dark:text-chat-text-secondary">Loading members...</p>
                            ) : (
                                <ul>
                                    {filteredUsersForModal.length > 0 ? (
                                        filteredUsersForModal.map(user => (
                                            <li key={user.id}>
                                                <Link 
                                                    to={`/messages/${user.id}`} 
                                                    onClick={handleCloseNewChatModal} 
                                                    className="flex items-center p-3 hover:bg-gray-200/50 dark:hover:bg-chat-bg/60 space-x-4 transition-colors"
                                                >
                                                    <Avatar src={user.avatar_url} alt={user.full_name || user.email} size="md" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm">{user.full_name}</p>
                                                        <p className="text-xs text-chat-light-text-secondary dark:text-chat-text-secondary">{user.fellowship_position || 'Member'}</p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-center p-8 text-chat-light-text-secondary dark:text-chat-text-secondary">No members found.</p>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <UserProfileModal 
                user={selectedUserForModal} 
                isLoading={isModalLoading}
                onClose={() => setSelectedUserForModal(null)} 
            />
        </div>
    );
};

export default ChatHistory;