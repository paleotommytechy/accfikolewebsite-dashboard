import React, { useState, useEffect, useRef, FormEvent } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, Link, useNavigate } = ReactRouterDOM;
import { useAppContext } from '../context/AppContext';
import Avatar from '../components/auth/Avatar';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, PhoneIcon, VideoCameraIcon, InformationCircleIcon, EmojiIcon, PaperclipIcon, CameraIcon, MicrophoneIcon, SendIcon, XIcon, StopIcon, UserIcon, CoinIcon, StarIcon, UsersIcon, ChatIcon } from '../components/ui/Icons';
import type { Message, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';


// --- User Profile Modal Component ---
interface UserProfileModalProps {
    user: Partial<UserProfile> | null;
    isLoading: boolean;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isLoading, onClose }) => {
    const navigate = useNavigate();

    const handleSendMessage = () => {
        if (user?.id) {
            navigate(`/messages/${user.id}`);
            onClose();
        }
    };
    
    const handleViewProfile = () => {
        if (user?.id) {
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
                {isLoading || !user ? (
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


const ChatConversation: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { currentUser } = useAppContext();
    const { addToast, refreshNotifications } = useNotifier();
    const [otherUser, setOtherUser] = useState<Partial<UserProfile> | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Voice Note State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingIntervalRef = useRef<number | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [newMessage]);
    
    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


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
                const isRelevant =
                    (newMessagePayload.sender_id === currentUser.id && newMessagePayload.recipient_id === userId) ||
                    (newMessagePayload.sender_id === userId && newMessagePayload.recipient_id === currentUser.id);
    
                if (isRelevant) {
                    setMessages((prevMessages) => {
                        if (prevMessages.some((m) => m.id === newMessagePayload.id)) {
                            return prevMessages;
                        }
                        return [...prevMessages, newMessagePayload];
                    });
    
                    refreshNotifications();
                    
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
        setTimeout(() => scrollToBottom(), 100);
    }, [messages]);


    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !userId || !supabase) return;
        const textToSend = newMessage.trim();
        setNewMessage('');
        setShowEmojiPicker(false);

        try {
            const { error } = await supabase.from('messages').insert({
                sender_id: currentUser.id,
                recipient_id: userId,
                text: textToSend,
                message_type: 'text',
            });

            if (error) throw error;

        } catch (error: any) {
            console.error("Error sending message:", error);
            addToast(`Failed to send message: ${error.message || 'An unknown error occurred.'}`, 'error');
            setNewMessage(textToSend); 
        }
    };
    
    const sendMediaMessage = async (url: string, type: 'audio') => {
        if (!currentUser || !userId || !supabase) return;

        try {
            const { error } = await supabase.from('messages').insert({
                sender_id: currentUser.id,
                recipient_id: userId,
                message_type: type,
                media_url: url,
            });

            if (error) throw error;

        } catch (error: any) {
            addToast(`Failed to send ${type} message: ${error.message || 'An unknown error occurred.'}`, 'error');
        }
    };
    
    // --- Icon Click Handlers ---
    const handleVoiceCall = () => addToast('Voice call feature is not yet implemented.', 'info');
    const handleVideoCall = () => addToast('Video call feature coming soon!', 'info');
    const handleCamera = () => addToast('Camera feature is not yet implemented.', 'info');
    
    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            addToast(`Attaching files is a work in progress.`, 'info');
            e.target.value = '';
        }
    };
    
    const handleToggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            setIsRecording(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                const audioChunks: Blob[] = [];

                recorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    // Only upload and send if duration is at least 1 second
                    if (recordingTime >= 1) {
                         const filePath = `audio/${currentUser?.id}/${Date.now()}.webm`;
                        
                        addToast('Uploading voice note...', 'info');
                        const { error: uploadError } = await supabase.storage
                            .from('chat_media') // Make sure this bucket exists with public access
                            .upload(filePath, audioBlob);

                        if (uploadError) {
                            throw uploadError;
                        }

                        const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(filePath);

                        if(publicUrl) {
                            await sendMediaMessage(publicUrl, 'audio');
                        }
                    }
                    // Clean up stream tracks
                    stream.getTracks().forEach(track => track.stop());
                    setRecordingTime(0);
                };

                recorder.start();
                setIsRecording(true);
                setRecordingTime(0);
                recordingIntervalRef.current = window.setInterval(() => {
                    setRecordingTime(prevTime => prevTime + 1);
                }, 1000);

            } catch (err) {
                console.error("Error accessing microphone:", err);
                addToast('Microphone access denied. Please enable it in your browser settings.', 'error');
            }
        }
    };

    const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

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
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg text-chat-light-text-primary dark:text-chat-text-primary truncate">{otherUser?.full_name || '...'}</h2>
                    <p className="text-sm text-green-500">Online</p>
                </div>
                <button onClick={handleVoiceCall} className="p-3 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <PhoneIcon className="w-6 h-6" />
                </button>
                 <button onClick={handleVideoCall} className="p-3 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <VideoCameraIcon className="w-6 h-6" />
                </button>
                 <button onClick={() => setIsInfoModalOpen(true)} className="p-3 text-chat-light-text-secondary dark:text-chat-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
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
                                {msg.message_type === 'audio' && msg.media_url ? (
                                    <audio controls src={msg.media_url} className="w-full h-10" />
                                ) : (
                                    <p className="text-sm break-words">{msg.text}</p>
                                )}
                                <p className={`text-xs mt-1 ${isSent ? 'text-slate-600 dark:text-chat-text-secondary' : 'text-chat-light-text-secondary dark:text-chat-text-secondary'} text-right`}>{formatTime(msg.created_at)}</p>
                            </div>
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-2 sm:p-4 flex-shrink-0 bg-chat-light-panel dark:bg-chat-bg border-t border-gray-200 dark:border-transparent relative">
                 {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-24 right-4 z-20">
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-chat-light-panel dark:bg-chat-panel p-2 rounded-xl">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                    {!isRecording &&
                        <div className="flex items-center gap-0.5">
                            <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="p-2 text-chat-light-text-secondary dark:text-chat-text-secondary hover:text-primary-500 rounded-full"><EmojiIcon className="w-6 h-6" /></button>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-chat-light-text-secondary dark:text-chat-text-secondary hover:text-primary-500 rounded-full"><PaperclipIcon className="w-6 h-6" /></button>
                            <button type="button" onClick={handleCamera} className="p-2 text-chat-light-text-secondary dark:text-chat-text-secondary hover:text-primary-500 rounded-full"><CameraIcon className="w-6 h-6" /></button>
                        </div>
                    }
                    {isRecording ? (
                        <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl h-[46px]">
                             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                             <span className="font-mono text-red-500 font-semibold">{formatRecordingTime(recordingTime)}</span>
                        </div>
                    ) : (
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
                    )}
                     {newMessage.trim() ? (
                        <button type="submit" className="w-11 h-11 flex items-center justify-center bg-primary-500 text-white rounded-full shadow-sm hover:bg-primary-600 transition-colors flex-shrink-0">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button type="button" onClick={handleToggleRecording} className={`w-11 h-11 flex items-center justify-center text-white rounded-full shadow-sm transition-colors flex-shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600'}`}>
                           {isRecording ? <StopIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                        </button>
                    )}
                </form>
            </footer>

             {/* User Info Modal */}
            {isInfoModalOpen && (
                <UserProfileModal 
                    user={otherUser} 
                    isLoading={!otherUser}
                    onClose={() => setIsInfoModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default ChatConversation;