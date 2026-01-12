
// This is a new file: components/academics/CourseCompanion.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon, XIcon, SendIcon, CloudUploadIcon } from '../ui/Icons';
import Avatar from '../auth/Avatar';
import { useAppContext } from '../../context/AppContext';
import { marked } from 'marked';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

interface CourseCompanionProps {
    allCourses: { id: string; name: string; code: string; materials: { title: string; type: string; }[] }[];
}

const CourseCompanion: React.FC<CourseCompanionProps> = ({ allCourses }) => {
    const { currentUser } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: "Hello! I'm your AI Course Companion. Ask me anything about your course materials, or upload a document to discuss it." }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const findCourseContext = (prompt: string): string => {
        const lowercasedPrompt = prompt.toLowerCase();
        const relevantCourse = allCourses.find(course => 
            lowercasedPrompt.includes(course.name.toLowerCase()) || 
            lowercasedPrompt.includes(course.code.toLowerCase())
        );

        if (!relevantCourse || relevantCourse.materials.length === 0) {
            return "No specific materials found for the requested course. Please check the course name and try again.";
        }

        const materialList = relevantCourse.materials.map(m => `- ${m.title} (${m.type.replace(/_/g, ' ')})`).join('\n');
        return `Course: ${relevantCourse.name} (${relevantCourse.code})\nMaterials:\n${materialList}`;
    };

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
        });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setUserInput(`Summarize the key points of "${file.name}".`);
        }
    };
    
    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setUserInput(''); // Clear prompt when file is removed
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const prompt = userInput.trim();
        if ((!prompt && !selectedFile) || isLoading) return;

        const currentFile = selectedFile;
        // If there's a file but no text, create a default prompt for the message history
        const userMessageText = (currentFile && !prompt) 
            ? `Analyze the attached file: ${currentFile.name}` 
            : prompt;

        const userMessage: ChatMessage = { sender: 'user', text: userMessageText };
        setMessages(prev => [...prev, userMessage]);
        
        setUserInput('');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsLoading(true);

        try {
            const apiBody: any = { userPrompt: userMessageText };

            if (currentFile) {
                const base64Data = await fileToBase64(currentFile);
                apiBody.fileData = base64Data;
                apiBody.mimeType = currentFile.type;
            } else {
                apiBody.courseContext = findCourseContext(prompt);
            }
            
            const response = await fetch('/api/course-companion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get a response from the AI.');
            }

            const { answer } = await response.json();
            setMessages(prev => [...prev, { sender: 'ai', text: answer }]);

        } catch (error: any) {
            let msg = error.message || '';
            // Graceful handling for API key issues
            if (msg.includes("leaked") || msg.includes("PERMISSION_DENIED")) {
                msg = "The AI service is unavailable due to an API Key configuration issue (Key leaked/blocked). Please contact support.";
            }
            setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I encountered an error: ${msg}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-110 z-30"
                aria-label="Open AI Course Companion"
            >
                <ChatIcon className="w-6 h-6" />
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 flex items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-dark rounded-2xl shadow-xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col animate-fade-in-up"
                        style={{ animationDuration: '300ms' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                    <ChatIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI Course Companion</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender === 'ai' && <Avatar src="https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg" alt="AI" size="md" />}
                                    <div
                                        className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                                        }`}
                                    >
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
                                        ></div>
                                    </div>
                                    {msg.sender === 'user' && <Avatar src={currentUser?.avatar_url} alt={currentUser?.full_name || 'You'} size="md" />}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <Avatar src="https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg" alt="AI" size="md" />
                                    <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-none flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {selectedFile && (
                            <div className="px-4 py-2 border-t dark:border-gray-700 flex-shrink-0">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center justify-between text-sm">
                                    <p className="truncate text-gray-700 dark:text-gray-200">
                                        <CloudUploadIcon className="w-4 h-4 inline-block mr-2" />
                                        {selectedFile.name}
                                    </p>
                                    <button onClick={removeSelectedFile} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700 flex-shrink-0 flex items-center gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0">
                                <CloudUploadIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder={selectedFile ? 'Ask a question about your file...' : 'Ask about your course materials...'}
                                className="w-full bg-gray-100 dark:bg-gray-700 border-transparent rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button type="submit" className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 transition-colors flex-shrink-0 disabled:opacity-50" disabled={isLoading || (!userInput.trim() && !selectedFile)}>
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CourseCompanion;
