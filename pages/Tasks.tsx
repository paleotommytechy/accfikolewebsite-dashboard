
import React from 'react';
import Card from '../components/ui/Card';
import { mockDailyTasks, mockWeeklyChallenge } from '../services/mockData';

const Tasks: React.FC = () => {
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tasks & Challenges</h1>
        <Card title="Weekly Group Challenge">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 text-6xl">🏆</div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold">{mockWeeklyChallenge.title}</h3>
                    <p className="text-gray-500 mt-1">{mockWeeklyChallenge.description}</p>
                     <div className="mt-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-primary-700 dark:text-white">Progress</span>
                            <span className="text-sm font-medium text-primary-700 dark:text-white">{mockWeeklyChallenge.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                            <div className="bg-primary-600 h-4 rounded-full" style={{width: `${mockWeeklyChallenge.progress}%`}}></div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Ends {mockWeeklyChallenge.end_date} • {mockWeeklyChallenge.total_participants} Participants</div>
                </div>
            </div>
        </Card>

        <Card title="My Daily Tasks">
            <div className="space-y-4">
            {mockDailyTasks.map(task => (
                <div key={task.id} className={`p-4 rounded-lg border ${task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-dark border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className={`font-semibold text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</h4>
                            <p className="text-gray-500 text-sm mt-1">{task.description}</p>
                            <div className="mt-2 text-sm">
                                <span className="font-semibold text-yellow-500">+{task.coins} Coins</span> • <span className="text-gray-400">Due: {task.due_date}</span>
                            </div>
                        </div>
                         <button className={`p-2 rounded-full ${task.status === 'completed' ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                            {task.status === 'completed' ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> :
                                <span className="h-5 w-5 block"></span>
                            }
                         </button>
                    </div>
                </div>
            ))}
            </div>
        </Card>
        {/* Admin section for task assignment could go here, conditionally rendered */}
    </div>
  );
};

export default Tasks;