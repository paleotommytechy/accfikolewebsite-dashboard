import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Task, Challenge, UserProfile, PrayerRequest } from '../types';

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

const DailyTasks: React.FC<{tasks: Task[]}> = ({tasks}) => (
    <Card title="Today's Tasks">
        <ul className="space-y-3">
            {tasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div>
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                        <p className="text-sm text-gray-500">{task.coins} coins</p>
                    </div>
                    <input type="checkbox" defaultChecked={task.status === 'completed'} className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300"/>
                </li>
            ))}
        </ul>
        {tasks.length === 0 && <p className="text-gray-500">No tasks for today. Check back later!</p>}
    </Card>
);

const WeeklyChallenge: React.FC<{challenge: Challenge | null}> = ({challenge}) => (
    <Card title="Weekly Challenge">
        {challenge ? (
            <>
                <h4 className="font-semibold text-lg">{challenge.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 my-4">
                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${challenge.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span>{challenge.progress}% complete</span>
                    <span>Ends {challenge.end_date}</span>
                </div>
            </>
        ) : <p className="text-gray-500">No active challenge this week.</p>}
    </Card>
);

const MiniLeaderboard: React.FC<{leaderboard: Partial<UserProfile>[]}> = ({leaderboard}) => (
    <Card title="Leaderboard" action={<a href="#/leaderboard" className="text-sm text-primary-600 hover:underline">View All</a>}>
        <ul className="space-y-4">
            {leaderboard.map((user, index) => (
                <li key={user.id} className="flex items-center">
                    <span className="text-lg font-bold w-6">{index + 1}</span>
                    <Avatar src={user.avatar_url} alt={user.full_name || ''} size="md" className="mx-3" />
                    <div className="flex-1">
                        <p className="font-semibold">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.coins} coins</p>
                    </div>
                </li>
            ))}
        </ul>
    </Card>
);

const PrayerRequestsWidget: React.FC<{requests: PrayerRequest[]}> = ({requests}) => (
    <Card title="Prayer Wall" action={<a href="#/prayer-requests" className="text-sm text-primary-600 hover:underline">View All</a>}>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {requests.map(req => (
                 <div key={req.id} className="flex items-start space-x-3">
                    <Avatar src={req.author_avatar} alt={req.author_name} size="md"/>
                    <div>
                        <p className="font-semibold text-sm">{req.author_name}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{req.request}</p>
                    </div>
                 </div>
            ))}
             {requests.length === 0 && <p className="text-gray-500 text-sm">No prayer requests yet.</p>}
        </div>
    </Card>
);


const Dashboard: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<Partial<UserProfile>[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);

  useEffect(() => {
    if (currentUser && supabase) {
      // Fetch tasks assigned to the current user
      const fetchTasks = async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', currentUser.id)
          .limit(3);
        if (error) {
            // Gracefully handle if table/column doesn't exist (common during setup)
            if (error.code === '42P01' || error.code === '42703') {
                console.warn('Warning: Tasks table or assigned_to column not found. Using empty list for tasks.');
                setTasks([]);
            } else {
                console.error('Error fetching tasks', error.message);
            }
        } else {
            setTasks(data || []);
        }
      };

      // Fetch the current weekly challenge
      const fetchChallenge = async () => {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
             // Gracefully handle if table doesn't exist
            if (error.code === '42P01') {
                console.warn('Warning: Challenges table not found. Weekly challenge will not be displayed.');
                setChallenge(null);
            } else {
                console.error('Error fetching challenge', error.message);
            }
        } else {
            setChallenge(data);
        }
      };

      // Fetch top 4 users for the leaderboard
      const fetchLeaderboard = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, coins')
          .order('coins', { ascending: false })
          .limit(4);
        if (error) console.error('Error fetching leaderboard', error.message);
        else setLeaderboard(data || []);
      };

      // Fetch recent prayer requests
      const fetchPrayerRequests = async () => {
          const { data, error } = await supabase
            .from('prayer_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
          if (error) console.error('Error fetching prayer requests', error.message);
          else {
            setPrayerRequests(data || []);
          }
      }

      fetchTasks();
      fetchChallenge();
      fetchLeaderboard();
      fetchPrayerRequests();
    }
  }, [currentUser]);

  if (isLoading || !currentUser) {
    return <div className="text-center p-8">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
              <ScriptureOfTheDay />
          </div>
          <Card title="My Progress" className="flex flex-col justify-center items-center text-center">
              <Avatar src={currentUser.avatar_url} alt={currentUser.full_name || 'User Avatar'} size="lg"/>
              <p className="font-bold text-xl mt-2">Level {currentUser.level}</p>
              <p className="text-yellow-500 font-semibold">{currentUser.coins} Coins</p>
              <Button href="#/profile" variant="outline" size="sm" className="mt-4">View Profile</Button>
          </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <DailyTasks tasks={tasks} />
            <WeeklyChallenge challenge={challenge} />
        </div>
        <div className="space-y-6">
            <MiniLeaderboard leaderboard={leaderboard} />
            <PrayerRequestsWidget requests={prayerRequests}/>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;