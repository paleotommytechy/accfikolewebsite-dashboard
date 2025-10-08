// This is a new file: components/academics/StudyPlanner.tsx
import React, { useState, useRef, useEffect } from 'react';
import { BookOpenIcon, XIcon, SendIcon, SparklesIcon } from '../ui/Icons';
import Avatar from '../auth/Avatar';
import { useAppContext } from '../../context/AppContext';
import { marked } from 'marked';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

interface StudyPlannerProps {
    allCourses: { id: string; name: string; code: string; materials: { title: string; type: string; }[] }[];
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ allCourses }) => {
    const { currentUser } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: "Hello! I'm your AI Study Planner. Tell me which course you're studying for and your test date, and I'll create a schedule for you using the available materials." }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const prompt = userInput.trim();
        if (!prompt || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: prompt };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        const courseContext = findCourseContext(prompt);

        try {
            const response = await fetch('/api/generate-study-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt: prompt, courseContext }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get a response from the AI.');
            }

            const { plan } = await response.json();
            setMessages(prev => [...prev, { sender: 'ai', text: plan }]);

        } catch (error: any) {
            setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I encountered an error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform hover:scale-110 z-30"
                aria-label="Open AI Study Planner"
            >
                <SparklesIcon className="w-6 h-6" />
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
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                                    <BookOpenIcon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI Study Planner</h2>
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
                                            ? 'bg-primary-600 text-white rounded-br-none' 
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

                        <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700 flex-shrink-0 flex items-center gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder="e.g., Help me study for my CHM 101 test next Friday..."
                                className="w-full bg-gray-100 dark:bg-gray-700 border-transparent rounded-full px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button type="submit" className="w-10 h-10 flex items-center justify-center bg-primary-600 text-white rounded-full shadow-sm hover:bg-primary-700 transition-colors flex-shrink-0 disabled:opacity-50" disabled={isLoading || !userInput.trim()}>
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudyPlanner;
