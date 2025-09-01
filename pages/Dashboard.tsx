
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/auth/Avatar';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { TaskAssignment, WeeklyChallenge, UserProfile } from '../types';

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

const WeeklyChallenge: React.FC<{challenge: WeeklyChallenge | null}> = ({challenge}) => (
    <Card title="Weekly Challenge">
        {challenge ? (
            <>
                <h4 className="font-semibold text-lg">{challenge.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{challenge.details}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                     <Link to="/tasks" className="text-primary-600 hover:underline font-semibold">Join Challenge</Link>
                    {challenge.due_date && <span>Ends {new Date(challenge.due_date).toLocaleDateString()}</span>}
                </div>
            </>
        ) : <p className="text-gray-500">No active challenge this week.</p>}
    </Card>
);

const MiniLeaderboard: React.FC<{leaderboard: Partial<UserProfile>[]}> = ({leaderboard}) => (
    <Card title="Leaderboard" action={<Link to="/leaderboard" className="text-sm text-primary-600 hover:underline">View All</Link>}>
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
              <ScriptureOfTheDay />
          </div>
          <Card title="My Progress" className="flex flex-col justify-center items-center text-center">
              <Avatar src={currentUser.avatar_url} alt={currentUser.full_name || 'User Avatar'} size="lg"/>
              <p className="font-bold text-xl mt-2">Level {currentUser.level}</p>
              <p className="text-yellow-500 font-semibold">{currentUser.coins} Coins</p>
              <Button to="/profile" variant="outline" size="sm" className="mt-4">View Profile</Button>
          </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <DailyTasks tasks={taskAssignments} />
            <WeeklyChallenge challenge={challenge} />
        </div>
        <div className="space-y-6">
            <MiniLeaderboard leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;