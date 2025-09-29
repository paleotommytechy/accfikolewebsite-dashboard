
import React, { useState, useEffect } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM;
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/auth/Avatar';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { TaskAssignment, WeeklyChallenge, UserProfile, Scripture } from '../types';
// FIX: Import missing icons to resolve module export errors.
import { TrophyIcon, StarIcon, CoinIcon, CrownIcon, ClipboardListIcon, CheckIcon, UserIcon, ExternalLinkIcon } from '../components/ui/Icons';

const CompleteProfileCard: React.FC = () => (
    <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Complete Your Profile</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Please update your personal information to get full access to the dashboard and community features.
                </p>
            </div>
            <div className="flex-shrink-0 mt-3 sm:mt-0">
                <Button to="/profile" className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500">
                    Update Profile Now
                </Button>
            </div>
        </div>
    </Card>
);

const ScriptureOfTheDay: React.FC = () => {
    const [scripture, setScripture] = useState<Partial<Scripture> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScripture = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('scripture_of_the_day')
                .select('verse_reference, verse_text')
                .eq('date_for', today)
                .maybeSingle();
            
            if (error) {
                console.error("Error fetching scripture of the day:", error);
            } else {
                setScripture(data);
            }
            setLoading(false);
        };
        fetchScripture();
    }, []);

    const content = () => {
        if (loading) {
            return <p className="text-center italic">Loading scripture...</p>;
        }
        if (scripture) {
            return (
                <blockquote className="text-center">
                    <p className="text-lg italic">"{scripture.verse_text}"</p>
                    <footer className="mt-2 text-right font-semibold">{scripture.verse_reference}</footer>
                </blockquote>
            );
        }
        // Fallback content if nothing is set for the day
        return (
            <blockquote className="text-center">
                <p className="text-lg italic">"For I know the plans I have for you,” declares the LORD, “plans to prosper you and not to harm you, plans to give you hope and a future."</p>
                <footer className="mt-2 text-right font-semibold">Jeremiah 29:11</footer>
            </blockquote>
        );
    };

    return (
        <Card title="Scripture of the Day" className="bg-primary-600 text-white">
            {content()}
        </Card>
    );
}

const DailyTasks: React.FC<{ tasks: TaskAssignment[] }> = ({ tasks }) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    // If there are no tasks, progress is 100% (or complete)
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

    const cardTitle = (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Today's Tasks</h3>
            {totalTasks > 0 && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                    {completedTasks} of {totalTasks} completed
                </span>
            )}
        </div>
    );

    return (
        <Card
            title={cardTitle}
            action={<Link to="/tasks" className="text-sm font-semibold text-primary-600 hover:underline">View All</Link>}
        >
            <div className="space-y-3">
                {tasks.length > 0 && tasks.map(assignment => (
                    <div key={assignment.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark/50">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${assignment.status === 'done' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-primary-100 dark:bg-primary-900/50'}`}>
                            <ClipboardListIcon className={`w-5 h-5 ${assignment.status === 'done' ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-gray-800 dark:text-gray-200 truncate ${assignment.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                                {assignment.tasks?.title}
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-500 font-medium flex items-center gap-1 mt-1">
                                <CoinIcon className="w-3 h-3" /> {assignment.tasks?.coin_reward || 0} Coins
                            </p>
                        </div>
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${assignment.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {assignment.status === 'done' && <CheckIcon className="w-4 h-4 text-white" />}
                        </div>
                    </div>
                ))}
            </div>

            {totalTasks > 0 && (
                <div className="mt-5">
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            )}

            {tasks.length === 0 && (
                <div className="text-center py-6">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-full">
                        <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="mt-4 font-semibold text-gray-800 dark:text-gray-200">All Done for Today!</h4>
                    <p className="text-sm text-gray-500 mt-1">You've completed all your tasks. Great job!</p>
                </div>
            )}
        </Card>
    );
};

const MyProgressCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  // Mock XP calculation for visual representation
  const xpForNextLevel = 1000;
  const currentXp = user.coins % xpForNextLevel;
  const progressPercentage = (currentXp / xpForNextLevel) * 100;

  return (
    <div className="rounded-lg shadow-lg bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 relative overflow-hidden flex flex-col items-center text-center">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
      <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
      
      <Avatar src={user.avatar_url} alt={user.full_name || 'User Avatar'} size="lg" className="sm:h-24 sm:w-24 border-4 border-white/50 shadow-lg mb-3 relative z-10" />
      <h3 className="text-xl font-bold relative z-10">{user.full_name || 'Member'}</h3>
      
      <div className="flex justify-around w-full my-4 relative z-10">
        <div className="flex flex-col items-center px-2">
          <StarIcon className="w-8 h-8 text-yellow-300" />
          <p className="font-bold text-lg mt-1">{user.level}</p>
          <p className="text-xs uppercase font-semibold opacity-80">Level</p>
        </div>
        <div className="flex flex-col items-center px-2">
          <CoinIcon className="w-8 h-8 text-yellow-300" />
          <p className="font-bold text-lg mt-1">{user.coins}</p>
          <p className="text-xs uppercase font-semibold opacity-80">Coins</p>
        </div>
      </div>
      
      <div className="w-full relative z-10">
        <div className="flex justify-between text-xs font-medium mb-1 opacity-80">
          <span>Progress to Level {user.level + 1}</span>
          <span>{currentXp} / {xpForNextLevel} XP</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2.5">
          <div className="bg-yellow-300 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>
      
      <Button
        to="/profile"
        className="mt-6 w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm relative z-10"
      >
        View Full Profile
      </Button>
    </div>
  );
};

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
    const rankStyles: { [key: number]: { bg: string; text: string; crown?: boolean } } = {
        0: { bg: 'bg-yellow-400/20 dark:bg-yellow-500/10', text: 'text-yellow-500 dark:text-yellow-400', crown: true },
        1: { bg: 'bg-slate-400/20 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
        2: { bg: 'bg-amber-600/20 dark:bg-amber-700/10', text: 'text-amber-700 dark:text-amber-500' },
    };

    return (
        <Card title="Leaderboard" action={<Link to="/leaderboard" className="text-sm font-semibold text-primary-600 hover:underline">View All</Link>}>
            <ul className="space-y-2">
                {leaderboard.map((user, index) => {
                    const style = rankStyles[index];
                    return (
                        <li 
                            key={user.id} 
                            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${style ? style.bg : ''}`}
                        >
                             <div className="relative flex items-center justify-center w-8">
                                <span className={`text-lg font-bold ${style ? style.text : 'text-gray-500 dark:text-gray-400'}`}>
                                    {index + 1}
                                </span>
                                {style?.crown && (
                                    <CrownIcon className="w-5 h-5 text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" />
                                )}
                            </div>
                            <Avatar src={user.avatar_url} alt={user.full_name || ''} size="md" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate text-gray-800 dark:text-gray-200">{user.full_name}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-yellow-600 dark:text-yellow-500">
                                    {user.coins}
                                </p>
                                <p className="text-xs text-gray-500">coins</p>
                            </div>
                        </li>
                    )
                })}
            </ul>
             {leaderboard.length === 0 && <p className="text-center text-gray-500 pt-4">No rankings yet.</p>}
        </Card>
    );
};

const WebsiteCtaCard: React.FC = () => (
    <Card className="bg-gradient-to-r from-secondary to-gray-800 text-white animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <ExternalLinkIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Visit Our Main Website</h3>
                <p className="text-sm text-gray-300 mt-1">
                    Stay connected with the latest news, sermons, and fellowship-wide events.
                </p>
            </div>
            <div className="flex-shrink-0 mt-3 sm:mt-0">
                <Button 
                    href="https://accfikolewebsite.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/90 hover:bg-white text-secondary font-bold focus:ring-white"
                >
                    Visit Site
                </Button>
            </div>
        </div>
    </Card>
);


const Dashboard: React.FC = () => {
  const { currentUser, isLoading, isProfileComplete } = useAppContext();
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
      {!isProfileComplete && <CompleteProfileCard />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <ScriptureOfTheDay />
          <DailyTasks tasks={taskAssignments} />
          <WebsiteCtaCard />
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <MyProgressCard user={currentUser} />
          <WeeklyChallengeCard challenge={challenge} />
          <MiniLeaderboard leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;