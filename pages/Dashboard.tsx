
import React, { useState, useEffect } from 'react';
// FIX: Changed to namespace import to fix module resolution issues with react-router-dom.
import * as ReactRouterDOM from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/auth/Avatar';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { TaskAssignment, WeeklyChallenge, UserProfile } from '../types';
import { TrophyIcon } from '../components/ui/Icons';

const ScriptureOfTheDay: React.FC = () => {
    // In a real app, you'd fetch this from a 'scripture_of_the_day' table.
    // We'll keep it static for this example to focus on user-specific data.
    return (
        <Card title="Scripture of the Day" className="bg-primary-600 text-white">
            <blockquote className="text-center">
                <p className="text-lg italic">"For I know the plans I have for you,” declares the LORD, “plans to prosper you and not to harm you, plans to give you hope and a future."</p>
                <footer className="mt-2 text-right font-semibold">Jeremiah 29:11</footer>
            </blockquote>
        </Card>
    );
}

const DailyTasks: React.FC<{tasks: TaskAssignment[]}> = ({tasks}) => (
    <Card title="Today's Tasks">
        <ul className="space-y-3">
            {tasks.map(assignment => (
                <li key={assignment.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div>
                        <p className={`font-medium ${assignment.status === 'done' ? 'line-through text-gray-500' : ''}`}>{assignment.tasks?.title}</p>
                    </div>
                    <input type="checkbox" defaultChecked={assignment.status === 'done'} className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300" disabled/>
                </li>
            ))}
        </ul>
        {tasks.length === 0 && <p className="text-gray-500">No tasks for today. Check back later!</p>}
    </Card>
);

const WeeklyChallengeCard: React.FC<{challenge: WeeklyChallenge | null}> = ({challenge}) => {
    if (!challenge) {
        return (
            <div className="rounded-lg shadow-lg bg-gradient-to-br from-primary-700 to-primary-900 text-white p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
                 <div className="absolute -bottom-10 -right-10 opacity-10">
                    <TrophyIcon className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold">Weekly Challenge</h3>
                    <p className="text-primary-200 mt-2 text-sm opacity-90">No active challenge this week. Check back soon!</p>
                </div>
            </div>
        )
    }

    const daysLeft = challenge.due_date ? (() => {
        const due = new Date(challenge.due_date);
        const today = new Date();
        const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getUTCDate());
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getUTCDate());
        const diffTime = utcDue - utcToday;

        if (diffTime < 0) return 'Ended';
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Ends Today';
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    })() : '';

    return (
        <div className="rounded-lg shadow-lg bg-gradient-to-br from-primary-700 to-primary-900 text-white p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -bottom-10 -right-10 opacity-10">
                <TrophyIcon className="w-48 h-48" />
            </div>
            <div className="relative z-10">
                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <span className="text-sm uppercase font-bold text-primary-300 tracking-wider">Weekly Challenge</span>
                        <h3 className="text-2xl font-bold mt-1">{challenge.title}</h3>
                    </div>
                    <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm p-3 rounded-lg text-center">
                        <p className="font-bold text-2xl text-yellow-300">{challenge.coin_reward}</p>
                        <p className="text-xs uppercase font-semibold">Coins</p>
                    </div>
                </div>
                <p className="text-primary-200 mt-2 text-sm opacity-90 line-clamp-2">{challenge.details}</p>
            </div>
            <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-center gap-4">
                <Button to="/tasks" className="w-full sm:w-auto flex-grow bg-white text-primary-700 font-bold hover:bg-primary-100 !py-3">
                    View Challenge
                </Button>
                {daysLeft && <span className="text-sm font-medium bg-white/20 px-3 py-2 rounded-full flex-shrink-0">{daysLeft}</span>}
            </div>
        </div>
    );
};

const MiniLeaderboard: React.FC<{leaderboard: Partial<UserProfile>[]}> = ({leaderboard}) => {
    const rankColors: { [key: number]: string } = {
        0: 'text-yellow-400',
        1: 'text-slate-400',
        2: 'text-amber-600',
    };

    return (
        <Card title="Leaderboard" action={<ReactRouterDOM.Link to="/leaderboard" className="text-sm text-primary-600 hover:underline">View All</ReactRouterDOM.Link>}>
            <ul className="space-y-3">
                {leaderboard.map((user, index) => (
                    <li key={user.id} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <span className={`text-xl font-bold w-6 text-center ${rankColors[index] ?? 'text-gray-500'}`}>
                            {index + 1}
                        </span>
                        <Avatar src={user.avatar_url} alt={user.full_name || ''} size="md" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate text-gray-800 dark:text-gray-200">{user.full_name}</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">{user.coins} coins</p>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const Dashboard: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<Partial<UserProfile>[]>([]);

  useEffect(() => {
    if (currentUser && supabase) {
      const fetchTaskAssignments = async () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('tasks_assignments')
          .select('*, tasks!inner(*)')
          .eq('assignee_id', currentUser.id)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .eq('tasks.frequency', 'daily')
          .limit(3);
        if (error) {
            console.error('Error fetching tasks', error.message);
        } else {
            setTaskAssignments((data as TaskAssignment[]) || []);
        }
      };

      const fetchChallenge = async () => {
        const today = new Date().toISOString();
        const { data, error } = await supabase
          .from('weekly_challenges')
          .select('*')
          .lte('start_date', today)
          .gte('due_date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
            console.error('Error fetching challenge', error.message);
        } else {
            setChallenge(data);
        }
      };

      const fetchLeaderboard = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, coins')
          .order('coins', { ascending: false })
          .limit(4);
        if (error) console.error('Error fetching leaderboard', error.message);
        else setLeaderboard(data || []);
      };

      fetchTaskAssignments();
      fetchChallenge();
      fetchLeaderboard();
    }
  }, [currentUser]);

  if (isLoading || !currentUser) {
    return <div className="text-center p-8">Loading your dashboard...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content Column */}
      <div className="lg:col-span-2 space-y-6">
        <ScriptureOfTheDay />
        <DailyTasks tasks={taskAssignments} />
      </div>

      {/* Sidebar Column */}
      <div className="lg:col-span-1 space-y-6">
        <Card title="My Progress" className="flex flex-col justify-center items-center text-center">
            <Avatar src={currentUser.avatar_url} alt={currentUser.full_name || 'User Avatar'} size="lg"/>
            <p className="font-bold text-xl mt-2">Level {currentUser.level}</p>
            <p className="text-yellow-500 font-semibold">{currentUser.coins} Coins</p>
            <Button to="/profile" variant="outline" size="sm" className="mt-4">View Profile</Button>
        </Card>
        <WeeklyChallengeCard challenge={challenge} />
        <MiniLeaderboard leaderboard={leaderboard} />
      </div>
    </div>
  );
};

export default Dashboard;
