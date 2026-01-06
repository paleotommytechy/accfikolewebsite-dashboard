import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { UserProfile } from '../types';
import { CrownIcon, UsersIcon, SparklesIcon, TrendingUpIcon } from '../components/ui/Icons';

interface PodiumItemProps {
  user: { full_name: string | null; avatar_url: string | null; score: number };
  rank: 1 | 2 | 3;
  metricLabel: string;
}

const PodiumItem: React.FC<PodiumItemProps> = ({ user, rank, metricLabel }) => {
  const styles: { [key in 1 | 2 | 3]: {
      podiumHeight: string;
      bgColor: string;
      textColor: string;
      avatarSize: string;
      rankTextSize: string;
      borderColor: string;
      crownSize?: string;
      crownPosition?: string;
  }} = {
    1: {
      podiumHeight: 'h-32 md:h-40',
      bgColor: 'bg-yellow-400',
      textColor: 'text-white',
      avatarSize: 'w-20 h-20 md:w-24 md:h-24',
      rankTextSize: 'text-4xl md:text-5xl',
      borderColor: 'border-yellow-400',
      crownSize: 'w-8 h-8 md:w-10 md:h-10',
      crownPosition: '-top-4 md:-top-5'
    },
    2: {
      podiumHeight: 'h-28 md:h-32',
      bgColor: 'bg-slate-400',
      textColor: 'text-slate-100',
      avatarSize: 'w-16 h-16 md:w-20 md:h-20',
      rankTextSize: 'text-3xl md:text-4xl',
      borderColor: 'border-slate-400'
    },
    3: {
      podiumHeight: 'h-24 md:h-28',
      bgColor: 'bg-amber-600',
      textColor: 'text-amber-100',
      avatarSize: 'w-14 h-14 md:w-16 md:h-16',
      rankTextSize: 'text-2xl md:text-3xl',
      borderColor: 'border-amber-600'
    }
  };

  const { 
    podiumHeight, 
    bgColor, 
    textColor, 
    avatarSize, 
    rankTextSize, 
    borderColor,
    crownSize,
    crownPosition
  } = styles[rank];

  const animationDelays = { 1: '0ms', 2: '100ms', 3: '200ms' };

  return (
    <div className="flex flex-col items-center w-1/3 animate-fade-in-up" style={{ animationDelay: animationDelays[rank] }}>
      <div className="relative mb-2">
        {rank === 1 && crownSize && crownPosition && (
          <CrownIcon className={`${crownSize} text-yellow-400 absolute ${crownPosition} left-1/2 -translate-x-1/2 z-10`} />
        )}
        <Avatar src={user.avatar_url} alt={user.full_name || ''} className={`border-4 ${borderColor} shadow-lg ${avatarSize}`} />
      </div>
      <h3 className="font-bold text-center text-sm md:text-base truncate w-full px-1">{user.full_name}</h3>
      <p className="text-yellow-500 dark:text-yellow-400 font-semibold text-xs md:text-sm">{user.score} {metricLabel}</p>
      <div className={`mt-2 w-full ${podiumHeight} ${bgColor} rounded-t-lg flex items-center justify-center`}>
        <span className={`${rankTextSize} font-black ${textColor}`}>{rank}</span>
      </div>
    </div>
  );
};

// Generic Leaderboard Entry Type
interface LeaderboardEntry {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    score: number;
    subtext?: string;
}

const Leaderboard: React.FC = () => {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overall' | 'giants' | 'pillars'>('overall');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
      if (!supabase) return;
      setLoading(true);
      
      let fetchedData: LeaderboardEntry[] = [];

      if (activeTab === 'overall') {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, coins, level')
            .order('coins', { ascending: false })
            .limit(50);
          
          if (!error && profiles) {
              fetchedData = profiles.map(p => ({
                  id: p.id,
                  full_name: p.full_name,
                  avatar_url: p.avatar_url,
                  score: p.coins,
                  subtext: `Level ${p.level}`
              }));
          }
      } else if (activeTab === 'pillars') {
          // Using RPC for pillars (upload counts)
          const { data: pillars, error } = await supabase.rpc('get_community_pillars_leaderboard');
          if (!error && pillars) {
              fetchedData = pillars.map((p: any) => ({
                  id: p.user_id,
                  full_name: p.full_name,
                  avatar_url: p.avatar_url,
                  score: p.upload_count,
                  subtext: 'uploads'
              }));
          }
      } else if (activeTab === 'giants') {
          // Using RPC for giants (quiz scores)
          const { data: giants, error } = await supabase.rpc('get_academic_giants_leaderboard');
          if (!error && giants) {
              fetchedData = giants.map((g: any) => ({
                  id: g.user_id,
                  full_name: g.full_name,
                  avatar_url: g.avatar_url,
                  score: g.total_score, // This RPC should return total correct answers
                  subtext: `${g.quizzes_taken} quizzes`
              }));
          }
      }

      setData(fetchedData);
      setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  const topThree = data.slice(0, 3);
  const restOfLeaderboard = data.slice(3);

  const mobileRankStyles: { [key: number]: { bg: string; text: string; border: string; crown?: boolean } } = {
    1: { 
        bg: 'bg-yellow-50 dark:bg-yellow-500/10', 
        text: 'text-yellow-600 dark:text-yellow-400', 
        border: 'border-yellow-400 dark:border-yellow-500', 
        crown: true 
    },
    2: { 
        bg: 'bg-slate-50 dark:bg-slate-500/10', 
        text: 'text-slate-600 dark:text-slate-400', 
        border: 'border-slate-400 dark:border-slate-500' 
    },
    3: { 
        bg: 'bg-amber-50 dark:bg-amber-700/10', 
        text: 'text-amber-700 dark:text-amber-500', 
        border: 'border-amber-600 dark:border-amber-700' 
    },
  };

  const metricLabel = activeTab === 'overall' ? 'coins' : activeTab === 'pillars' ? 'uploads' : 'points';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Leaderboard</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overall')}
              className={`${activeTab === 'overall' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <TrendingUpIcon className="w-5 h-5"/> Overall
            </button>
            <button
              onClick={() => setActiveTab('giants')}
              className={`${activeTab === 'giants' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <SparklesIcon className="w-5 h-5"/> Academic Giants
            </button>
            <button
              onClick={() => setActiveTab('pillars')}
              className={`${activeTab === 'pillars' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <UsersIcon className="w-5 h-5"/> Community Pillars
            </button>
          </nav>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>
      ) : data.length > 0 ? (
        <Card className="!p-0 overflow-hidden">
            {/* --- DESKTOP PODIUM --- */}
            <div className="hidden sm:flex justify-center items-end gap-1 px-1 pt-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-secondary dark:to-gray-800 min-h-[320px] md:min-h-[350px]">
                {topThree[1] && <PodiumItem user={topThree[1]} rank={2} metricLabel={metricLabel} />}
                {topThree[0] && <PodiumItem user={topThree[0]} rank={1} metricLabel={metricLabel} />}
                {topThree[2] && <PodiumItem user={topThree[2]} rank={3} metricLabel={metricLabel} />}
            </div>
            
            {/* --- MOBILE PODIUM --- */}
            <div className="block sm:hidden p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-lg font-bold text-center mb-2 text-gray-800 dark:text-gray-200">Top 3 Champions</h2>
                 {topThree.map((user, index) => {
                    const rank = (index + 1) as 1 | 2 | 3;
                    const style = mobileRankStyles[rank];
                    return (
                        <div key={user.id} className={`flex items-center gap-4 p-3 rounded-lg border-2 animate-fade-in-up ${style.bg} ${style.border}`} style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="relative flex items-center justify-center w-8">
                                <span className={`text-xl font-bold ${style.text}`}>
                                    {rank}
                                </span>
                                {style.crown && (
                                    <CrownIcon className="w-5 h-5 text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" />
                                )}
                            </div>
                            <Avatar src={user.avatar_url} alt={user.full_name || ''} size="md" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate text-gray-800 dark:text-gray-200">{user.full_name}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-yellow-600 dark:text-yellow-500">
                                    {user.score}
                                </p>
                                <p className="text-xs text-gray-500">{metricLabel}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
      ) : (
          <div className="text-center p-8 text-gray-500">No data available for this leaderboard yet.</div>
      )}

      {restOfLeaderboard.length > 0 && (
          <Card title="All Rankings">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th scope="col" className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Details</th>
                    <th scope="col" className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{metricLabel}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark divide-y divide-gray-200 dark:divide-gray-700">
                  {restOfLeaderboard.map((person, index) => (
                    <tr key={person.id} className={`${person.id === currentUser?.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>
                      <td className="px-2 sm:px-3 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-500">{index + 4}</div>
                      </td>
                      <td className="px-2 sm:px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Avatar src={person.avatar_url} alt={person.full_name || ''} size="sm" />
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {person.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                            {person.subtext}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {person.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
      )}
    </div>
  );
};

export default Leaderboard;