import React, { useState, useEffect, useRef, FormEvent } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, Link } = ReactRouterDOM;
import { useAppContext } from '../context/AppContext';
import Avatar from '../components/auth/Avatar';
import { ArrowLeftIcon, PhoneIcon, VideoCameraIcon, InformationCircleIcon, EmojiIcon, PaperclipIcon, CameraIcon, MicrophoneIcon, PaperAirplaneIcon } from '../components/ui/Icons';
import type { Message, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';


const ChatConversation: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { currentUser } = useAppContext();
    const { addToast, refreshNotifications } = useNotifier();
    const [otherUser, setOtherUser] = useState<Partial<UserProfile> | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [newMessage]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!supabase || !currentUser || !userId) return;

            // 1. Fetch other user's profile
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) {
                console.error("Error fetching other user:", userError);
                addToast(`Error fetching user profile: ${userError.message}`, 'error');
            } else {
                setOtherUser(userData);
            }

            // 2. Fetch message history
            const { data: messageData, error: messageError } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUser.id})`)
                .order('created_at', { ascending: true });

            if (messageError) {
                console.error("Error fetching messages:", messageError);
                addToast(`Error fetching messages: ${messageError.message}`, 'error');
            } else {
                setMessages(messageData || []);
            }

            // 3. Mark messages as read
            const { error: rpcError } = await supabase.rpc('mark_messages_as_read', {
                p_sender_id: userId
            });
            if (rpcError) console.error("Error marking messages as read:", rpcError);
        };

        fetchInitialData();
    }, [userId, currentUser, addToast]);

    useEffect(() => {
        if (!supabase || !currentUser || !userId) return;
    
        // Create a unique, consistent channel name for the user pair
        const channelName = `chat_${[currentUser.id, userId].sort().join('_')}`;
        const channel = supabase.channel(channelName);
    
        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            },
            (payload) => {
                const newMessagePayload = payload.new as Message;
    
                // Check if the message belongs to this conversation
                const isRelevant =
                    (newMessagePayload.sender_id === currentUser.id && newMessagePayload.recipient_id === userId) ||
                    (newMessagePayload.sender_id === userId && newMessagePayload.recipient_id === currentUser.id);
    
                if (isRelevant) {
                    // Update state, preventing duplicates
                    setMessages((prevMessages) => {
                        if (prevMessages.some((m) => m.id === newMessagePayload.id)) {
                            return prevMessages;
                        }
                        return [...prevMessages, newMessagePayload];
                    });
    
                    refreshNotifications();
                    
                    // If it's an incoming message, mark it as read
                    if (newMessagePayload.sender_id === userId) {
                        supabase.rpc('mark_messages_as_read', { p_sender_id: userId }).then(({ error }) => {
                            if (error) console.error("Error marking new message as read:", error);
                        });
                    }
                }
            }
        ).subscribe();
    
        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, currentUser?.id, supabase, refreshNotifications]);

    useEffect(() => {
        // Use timeout to allow images to load before scrolling
        setTimeout(() => scrollToBottom(), 100);
    }, [messages]);


    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !userId || !supabase) return;

        const textToSend = newMessage.trim();
        
        // Clear input immediately for better UX
        setNewMessage('');

        const messageToInsert = {
            sender_id: currentUser.id,
            recipient_id: userId,
            text: textToSend,
        };

        const { data: insertedMessage, error } = await supabase
            .from('messages')
            .insert(messageToInsert)
            .select() // Ask Supabase to return the inserted row
            .single(); // We expect only one row back

        if (error) {
            console.error("Error sending message:", error);
            addToast('Failed to send message.', 'error');
            // Restore the message in the input box so the user doesn't lose their text
            setNewMessage(textToSend); 
        } else if (insertedMessage) {
            // The message was successfully saved, now add it to local state.
            // The real-time subscription might also try to add this, but our subscription
            // handler already checks for duplicates, so this is safe.
            setMessages(prevMessages => [...prevMessages, insertedMessage]);
        }
    };
    
    const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Helper to determine message grouping for styling
    const getMessageGroupClass = (index: number) => {
        const currentMsg = messages[index];
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];
        const isSent = currentMsg.sender_id === currentUser?.id;

        const isFirstInGroup = !prevMsg || prevMsg.sender_id !== currentMsg.sender_id;
        const isLastInGroup = !nextMsg || nextMsg.sender_id !== currentMsg.sender_id;

        let classes = '';
        if (isFirstInGroup) classes += ' mt-4';
        if (isLastInGroup) {
            classes += isSent ? ' rounded-br-none' : ' rounded-bl-none';
        } else {
            classes += isSent ? ' rounded-r-lg' : ' rounded-l-lg';
        }
        return classes;
    };


    return (
        <div className="bg-chat-light-bg dark:bg-chat-bg text-chat-light-text-primary dark:text-chat-text-primary flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center p-3 bg-chat-light-panel dark:bg-chat-panel shadow-sm flex-shrink-0 z-10">
                <Link to="/messages" className="p-2 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <Avatar src={otherUser?.avatar_url} alt={otherUser?.full_name || ''} size="md" className="mx-2" />
                <div className="flex-1">
                    <h2 className="font-bold text-lg text-chat-light-text-primary dark:text-chat-text-primary">{otherUser?.full_name || '...'}</h2>
                    <p className="text-sm text-green-500">Online</p>
                </div>
                <button className="p-3 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <PhoneIcon className="w-6 h-6" />
                </button>
                 <button className="p-3 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <VideoCameraIcon className="w-6 h-6" />
                </button>
                 <button className="p-3 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <InformationCircleIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Messages Area */}
            <main className="flex-grow overflow-y-auto p-4 space-y-1">
                <div className="text-center my-4">
                    <span className="bg-white dark:bg-chat-panel text-chat-light-text-secondary dark:text-chat-text-secondary text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Today</span>
                </div>
                {messages.map((msg, index) => {
                    const isSent = msg.sender_id === currentUser?.id;
                    const groupClass = getMessageGroupClass(index);
                    
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
                            {!isSent && !messages[index+1] && <Avatar src={otherUser?.avatar_url} alt={otherUser?.full_name || ''} size="sm" className="mb-2" />}
                            {!isSent && messages[index+1] && messages[index+1]?.sender_id !== msg.sender_id && <Avatar src={otherUser?.avatar_url} alt={otherUser?.full_name || ''} size="sm" className="mb-2" />}
                            {!isSent && messages[index+1] && messages[index+1]?.sender_id === msg.sender_id && <div className="w-8 h-8 flex-shrink-0"></div> }

                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${groupClass} ${isSent ? 'bg-chat-light-bubble-sent dark:bg-chat-bubble-sent text-chat-light-text-primary dark:text-chat-text-primary' : 'bg-chat-light-bubble-received dark:bg-chat-bubble-received text-chat-light-text-primary dark:text-chat-text-primary shadow-sm'}`}>
                                <p className="text-sm break-words">{msg.text}</p>
                                <p className={`text-xs mt-1 ${isSent ? 'text-slate-600 dark:text-chat-text-secondary' : 'text-chat-light-text-secondary dark:text-chat-text-secondary'} text-right`}>{formatTime(msg.created_at)}</p>
                            </div>
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-2 sm:p-4 flex-shrink-0 bg-chat-light-panel dark:bg-chat-bg border-t border-gray-200 dark:border-transparent">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-chat-light-panel dark:bg-chat-panel p-2 rounded-xl">
                    <div className="flex items-center gap-0.5">
                        <button type="button" className="p-2 text-chat-light-text-secondary dark:text-chat-text-secondary hover:text-primary-500 rounded-full"><EmojiIcon className="w-6 h-6" /></button>
                        <button type="button" className="p-2 text-chat-light-text-secondary dark:text-chat-text-secondary hover:text-primary-500 rounded-full"><PaperclipIcon className="w-6 h-6" /></button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Type a message"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        className="flex-grow bg-gray-100 dark:bg-gray-800 text-chat-light-text-primary dark:text-chat-text-primary placeholder-chat-light-text-secondary dark:placeholder-chat-text-secondary border-none focus:ring-0 rounded-2xl resize-none max-h-40 py-2.5 px-4"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />
                    <button type="submit" className="w-11 h-11 flex items-center justify-center bg-primary-500 text-white rounded-full shadow-sm hover:bg-primary-600 transition-colors flex-shrink-0">
                        {newMessage.trim() ? <PaperAirplaneIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-6 h-6" />}
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatConversation;