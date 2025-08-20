
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { useAppContext } from '../context/AppContext';
import { mockDailyTasks, mockWeeklyChallenge, mockLeaderboard, mockPrayerRequests } from '../services/mockData';
import { Task, Challenge } from '../types';

const ScriptureOfTheDay: React.FC = () => (
    <Card title="Scripture of the Day" className="bg-primary-600 text-white">
        <blockquote className="text-center">
            <p className="text-lg italic">"For I know the plans I have for you,” declares the LORD, “plans to prosper you and not to harm you, plans to give you hope and a future."</p>
            <footer className="mt-2 text-right font-semibold">Jeremiah 29:11</footer>
        </blockquote>
    </Card>
);

const DailyTasks: React.FC<{tasks: Task[]}> = ({tasks}) => (
    <Card title="Today's Tasks">
        <ul className="space-y-3">
            {tasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div>
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                        <p className="text-sm text-gray-500">{task.coins} coins</p>
                    </div>
                    <input type="checkbox" checked={task.status === 'completed'} className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300"/>
                </li>
            ))}
        </ul>
    </Card>
);

const WeeklyChallenge: React.FC<{challenge: Challenge}> = ({challenge}) => (
    <Card title="Weekly Challenge">
        <h4 className="font-semibold text-lg">{challenge.title}</h4>
        <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 my-4">
            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${challenge.progress}%` }}></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
            <span>{challenge.progress}% complete</span>
            <span>{challenge.endDate}</span>
        </div>
    </Card>
);

const MiniLeaderboard: React.FC = () => (
    <Card title="Leaderboard" action={<a href="#/leaderboard" className="text-sm text-primary-600 hover:underline">View All</a>}>
        <ul className="space-y-4">
            {mockLeaderboard.slice(0, 4).map((user, index) => (
                <li key={user.id} className="flex items-center">
                    <span className="text-lg font-bold w-6">{index + 1}</span>
                    <Avatar src={user.avatarUrl} alt={user.name} size="md" className="mx-3" />
                    <div className="flex-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.coins} coins</p>
                    </div>
                </li>
            ))}
        </ul>
    </Card>
);

const PrayerRequestsWidget: React.FC = () => (
    <Card title="Prayer Wall" action={<a href="#/prayer-requests" className="text-sm text-primary-600 hover:underline">View All</a>}>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {mockPrayerRequests.slice(0,3).map(req => (
                 <div key={req.id} className="flex items-start space-x-3">
                    <Avatar src={req.authorAvatar} alt={req.author} size="md"/>
                    <div>
                        <p className="font-semibold text-sm">{req.author}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{req.request}</p>
                    </div>
                 </div>
            ))}
        </div>
    </Card>
);


const Dashboard: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();

  if (isLoading || !currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
              <ScriptureOfTheDay />
          </div>
          <Card title="My Progress" className="flex flex-col justify-center items-center text-center">
              <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="lg"/>
              <p className="font-bold text-xl mt-2">Level {currentUser.level}</p>
              <p className="text-yellow-500 font-semibold">{currentUser.coins} Coins</p>
              <Button variant="outline" size="sm" className="mt-4">View Profile</Button>
          </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <DailyTasks tasks={mockDailyTasks} />
            <WeeklyChallenge challenge={mockWeeklyChallenge} />
        </div>
        <div className="space-y-6">
            <MiniLeaderboard />
            <PrayerRequestsWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
