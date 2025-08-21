
import React from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import { useAppContext } from '../context/AppContext';
import { mockLeaderboard, mockMessages } from '../services/mockData';
import type { Message } from '../types';

const Messages: React.FC = () => {
  const { currentUser } = useAppContext();
  
  return (
    <div className="h-full flex flex-col">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Messages</h1>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
            <Card className="md:col-span-1 lg:col-span-1 !p-0 overflow-y-auto">
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="font-semibold">Contacts</h2>
                </div>
                <ul>
                    {mockLeaderboard.filter(u => u.id !== currentUser?.id).map(user => (
                        <li key={user.id} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700">
                            <Avatar src={user.avatar_url} alt={user.name || ''} />
                            <span className="ml-3 font-medium">{user.name}</span>
                        </li>
                    ))}
                </ul>
            </Card>

            <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
                <Card className="flex-1 flex flex-col !p-0">
                    <div className="p-4 border-b dark:border-gray-700 flex items-center space-x-3">
                        <Avatar src={mockLeaderboard[1].avatar_url} alt={mockLeaderboard[1].name || ''} />
                        <h2 className="font-semibold text-lg">{mockLeaderboard[1].name}</h2>
                    </div>

                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                        {mockMessages.map((msg: Message) => (
                            <div key={msg.id} className={`flex items-end gap-3 ${msg.sender_id === currentUser?.id ? 'justify-end' : ''}`}>
                                {msg.sender_id !== currentUser?.id && <Avatar src={msg.sender_avatar} alt={msg.sender_name || ''} size="sm" />}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender_id === currentUser?.id ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                    <p>{msg.text}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">{msg.created_at}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                            <input type="text" placeholder="Type a message..." className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-full px-4 py-2 focus:ring-primary-500 focus:border-primary-500" />
                            <button className="bg-primary-600 text-white p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  );
};

export default Messages;