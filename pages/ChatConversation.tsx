import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Avatar from '../components/auth/Avatar';
import { ArrowLeftIcon, PhoneIcon, EmojiIcon, PaperclipIcon, CameraIcon, MicrophoneIcon } from '../components/ui/Icons';
import type { Message, UserProfile } from '../types';
import { mockMessages } from '../services/mockData';

const ChatConversation: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { currentUser } = useAppContext();
    const [otherUser, setOtherUser] = useState<Partial<UserProfile> | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Mock data loading
        setOtherUser({
            id: 'user-2',
            full_name: 'Michael Chen',
            avatar_url: 'https://picsum.photos/seed/michael/100',
        });
        setMessages(mockMessages);
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !userId) return;

        const messageToSend: Message = {
            id: `msg-${Date.now()}`,
            sender_id: currentUser.id,
            receiver_id: userId,
            text: newMessage.trim(),
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, messageToSend]);
        setNewMessage('');
    };
    
    const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <div className="bg-chat-light-bg text-chat-light-text-primary flex flex-col -m-4 sm:-m-6 lg:-m-8 h-[calc(100vh_-_4rem)]">
            {/* Header */}
            <header className="flex items-center p-3 bg-chat-light-panel shadow-sm flex-shrink-0 z-10">
                <Link to="/messages" className="p-2 text-chat-light-text-secondary rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <Avatar src={otherUser?.avatar_url} alt={otherUser?.full_name || ''} size="md" className="mx-3" />
                <div className="flex-1">
                    <h2 className="font-bold text-lg text-chat-light-text-primary">{otherUser?.full_name || '...'}</h2>
                    <p className="text-sm text-green-500">Online</p>
                </div>
                <button className="p-3 text-chat-light-text-secondary rounded-full hover:bg-gray-100">
                    <PhoneIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Messages Area */}
            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                <div className="text-center my-4">
                    <span className="bg-white text-chat-light-text-secondary text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Today</span>
                </div>
                {messages.map(msg => {
                    const isSent = msg.sender_id === currentUser?.id;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            {!isSent && <Avatar src={otherUser?.avatar_url} alt={otherUser?.full_name || ''} size="sm" className="mb-2" />}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${isSent ? 'bg-primary-500 text-white rounded-br-none' : 'bg-white text-chat-light-text-primary rounded-bl-none shadow-sm'}`}>
                                <p className="text-sm break-words">{msg.text}</p>
                                <p className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-chat-light-text-secondary'} text-right`}>{formatTime(msg.created_at)}</p>
                            </div>
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 flex-shrink-0 bg-chat-light-bg">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-chat-light-panel p-2 rounded-full shadow-neumorphic-light-inset">
                    <button type="button" className="p-2 text-chat-light-text-secondary hover:text-primary-500"><EmojiIcon className="w-6 h-6" /></button>
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        className="flex-grow bg-transparent text-chat-light-text-primary placeholder-chat-light-text-secondary border-none focus:ring-0"
                    />
                    <button type="button" className="p-2 text-chat-light-text-secondary hover:text-primary-500"><PaperclipIcon className="w-6 h-6" /></button>
                    <button type="button" className="p-2 text-chat-light-text-secondary hover:text-primary-500"><CameraIcon className="w-6 h-6" /></button>
                    <button type="submit" className="w-12 h-12 flex items-center justify-center bg-primary-500 text-white rounded-full shadow-neumorphic-light-raised-sm hover:bg-primary-600 transition-colors">
                        <MicrophoneIcon className="w-6 h-6" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatConversation;