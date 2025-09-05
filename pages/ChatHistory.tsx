
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import Button from '../components/ui/Button';
import { SearchIcon, PencilAltIcon } from '../components/ui/Icons';
import { mockChatHistory } from '../services/mockData';
import { Link } from 'react-router-dom';

const ChatHistory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChats = useMemo(() => {
        if (!searchTerm) return mockChatHistory;
        return mockChatHistory.filter(chat =>
            chat.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

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

                <ul className="divide-y dark:divide-gray-700">
                    {filteredChats.map(chat => (
                        <li key={chat.id}>
                            <Link to="#" className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer space-x-4">
                                <Avatar src={chat.avatar} alt={chat.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-sm truncate">{chat.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{chat.timestamp}</p>
                                    </div>
                                    <div className="flex justify-between items-start mt-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate pr-4">{chat.lastMessage}</p>
                                        {chat.unreadCount > 0 && (
                                            <span className="flex-shrink-0 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                    {filteredChats.length === 0 && (
                        <p className="p-6 text-center text-gray-500">No conversations found.</p>
                    )}
                </ul>
            </Card>
        </div>
    );
};

export default ChatHistory;
