
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, Link, useNavigate } = ReactRouterDOM;
import { useAppContext } from '../context/AppContext';
import Avatar from '../components/auth/Avatar';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, InformationCircleIcon, EmojiIcon, PaperclipIcon, SendIcon, XIcon, UserIcon, CoinIcon, StarIcon, UsersIcon, ChatIcon, CopyIcon, TrashIcon, PauseIcon, PlayIcon } from '../components/ui/Icons';
import type { Message, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import EmojiPicker from 'emoji-picker-react';

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const formatTimeValue = (time: number) => {
        if (isNaN(time) || time === Infinity) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const setAudioData = () => { setDuration(audio.duration); setCurrentTime(audio.currentTime); };
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.pause(); else audio.play();
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-3 w-full max-w-[240px] text-white">
            <audio ref={audioRef} src={src} preload="metadata" />
            <button onClick={togglePlayPause} className="bg-white/20 hover:bg-white/40 rounded-full p-2 flex-shrink-0">
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            <div className="flex-grow flex flex-col justify-center gap-1">
                <input type="range" min="0" max={duration || 0} value={currentTime} readOnly className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white" />
                <div className="flex justify-between text-[10px] font-mono opacity-80">
                    <span>{formatTimeValue(currentTime)}</span>
                    <span>{formatTimeValue(duration)}</span>
                </div>
            </div>
        </div>
    );
};

const ChatConversation: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { currentUser } = useAppContext();
    const { addToast, refreshNotifications } = useNotifier();
    const [otherUser, setOtherUser] = useState<Partial<UserProfile> | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight}px`; }
    }, [newMessage]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) setShowEmojiPicker(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!supabase || !currentUser || !userId) return;
            const { data: userData } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (userData) setOtherUser(userData);
            const { data: messageData } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUser.id})`).order('created_at', { ascending: true });
            if (messageData) setMessages(messageData);
            await supabase.rpc('mark_messages_as_read', { p_sender_id: userId });
        };
        fetchInitialData();
    }, [userId, currentUser, addToast]);

    useEffect(() => {
        if (!supabase || !currentUser || !userId) return;
        const channel = supabase.channel(`chat_${[currentUser.id, userId].sort().join('_')}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                 if (payload.eventType === 'INSERT') {
                    const msg = payload.new as Message;
                    if ((msg.sender_id === currentUser.id && msg.recipient_id === userId) || (msg.sender_id === userId && msg.recipient_id === currentUser.id)) {
                        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                        if (msg.sender_id === userId) supabase.rpc('mark_messages_as_read', { p_sender_id: userId });
                        refreshNotifications();
                    }
                }
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [userId, currentUser?.id, supabase, refreshNotifications]);

    useEffect(() => { setTimeout(scrollToBottom, 100); }, [messages]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text || !currentUser || !userId || !supabase) return;
        setNewMessage('');
        try {
            const { error } = await supabase.from('messages').insert({ sender_id: currentUser.id, recipient_id: userId, text: text, message_type: 'text' });
            if (error) throw error;
        } catch (error: any) {
            addToast(`Failed to send: ${error.message}`, 'error');
            setNewMessage(text);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-chat-light-bg dark:bg-chat-bg">
            <header className="flex items-center p-3 bg-chat-light-panel dark:bg-chat-panel shadow-sm border-b dark:border-gray-800/50 flex-shrink-0">
                {/* BACK BUTTON: Hidden on desktop split-pane */}
                <Link to="/messages" className="md:hidden p-2 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <Avatar src={otherUser?.avatar_url} alt={otherUser?.full_name || ''} size="md" className="mx-2" />
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg text-chat-light-text-primary dark:text-chat-text-primary truncate">{otherUser?.full_name || '...'}</h2>
                    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Active Now</p>
                </div>
                <button className="p-2 text-chat-light-text-secondary dark:text-chat-text-secondary"><InformationCircleIcon className="w-6 h-6" /></button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map((msg) => {
                    const isSent = msg.sender_id === currentUser?.id;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            <div className={`max-w-[75%] p-3 rounded-2xl ${isSent ? 'bg-primary-600 text-white rounded-br-none shadow-md' : 'bg-white dark:bg-chat-panel text-gray-800 dark:text-gray-100 shadow-sm border dark:border-gray-800 rounded-bl-none'}`}>
                                {msg.message_type === 'audio' && msg.media_url ? <AudioPlayer src={msg.media_url} /> : <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                <p className={`text-[9px] mt-1 opacity-60 font-bold ${isSent ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-2" />
            </main>

            <footer className="p-3 bg-chat-light-panel dark:bg-chat-panel border-t dark:border-gray-800/50 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-grow flex items-end gap-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl px-2 py-1 border border-gray-200 dark:border-gray-700/50">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-400 hover:text-primary-500 transition-colors">
                            <EmojiIcon className="w-6 h-6" />
                        </button>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            className="flex-grow bg-transparent text-sm border-none focus:ring-0 resize-none py-2 max-h-32 dark:text-white"
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                        />
                        <button type="button" className="p-2 text-gray-400 hover:text-primary-500 transition-colors"><PaperclipIcon className="w-6 h-6" /></button>
                    </div>
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="w-11 h-11 flex items-center justify-center bg-primary-600 text-white rounded-full shadow-lg disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </footer>

            {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-20 left-4 right-4 z-50 shadow-2xl animate-spring-up">
                    <EmojiPicker onEmojiClick={(data) => setNewMessage(prev => prev + data.emoji)} width="100%" theme={currentUser ? 'auto' : 'light'} />
                </div>
            )}
        </div>
    );
};

export default ChatConversation;
