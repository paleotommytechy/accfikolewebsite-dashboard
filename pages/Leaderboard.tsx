
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { UserProfile } from '../types';
import { CrownIcon } from '../components/ui/Icons';

interface PodiumItemProps {
  user: Partial<UserProfile>;
  rank: 1 | 2 | 3;
}

const PodiumItem: React.FC<PodiumItemProps> = ({ user, rank }) => {
  const styles: { [key in 1 | 2 | 3]: {
      podiumHeight: string;
      bgColor: string;
      textColor: string;
      avatarResponsiveClass: string;
      rankTextSize: string;
      borderColor: string;
  }} = {
    1: {
      podiumHeight: 'h-28 sm:h-32 md:h-40',
      bgColor: 'bg-yellow-400',
      textColor: 'text-white',
      avatarResponsiveClass: 'w-20 h-20 md:w-24 md:h-24',
      rankTextSize: 'text-4xl md:text-5xl',
      borderColor: 'border-yellow-400'
    },
    2: {
      podiumHeight: 'h-20 sm:h-24 md:h-32',
      bgColor: 'bg-slate-400',
      textColor: 'text-slate-100',
      avatarResponsiveClass: 'w-16 h-16 md:w-20 md:h-20',
      rankTextSize: 'text-3xl md:text-4xl',
      borderColor: 'border-slate-400'
    },
    3: {
      podiumHeight: 'h-16 sm:h-20 md:h-24',
      bgColor: 'bg-amber-600',
      textColor: 'text-amber-100',
      avatarResponsiveClass: 'w-14 h-14 md:w-16 md:h-16',
      rankTextSize: 'text-2xl md:text-3xl',
      borderColor: 'border-amber-600'
    }
  };

  const { podiumHeight, bgColor, textColor, avatarResponsiveClass, rankTextSize, borderColor } = styles[rank];

  const animationDelays = { 1: '0ms', 2: '100ms', 3: '200ms' };

  return (
    <div className="flex flex-col items-center w-1/3 animate-fade-in-up" style={{ animationDelay: animationDelays[rank] }}>
      <div className="relative mb-2">
        {rank === 1 && (
          <CrownIcon className="w-8 h-8 text-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2 z-10" />
        )}
        <Avatar src={user.avatar_url} alt={user.full_name || ''} className={`border-4 ${borderColor} shadow-lg ${avatarResponsiveClass}`} />
      </div>
      <h3 className="font-bold text-center text-xs sm:text-sm md:text-base truncate w-full px-1">{user.full_name}</h3>
      <p className="text-yellow-500 dark:text-yellow-400 font-semibold text-xs md:text-sm">{user.coins} coins</p>
      <div className={`mt-2 w-full ${podiumHeight} ${bgColor} rounded-t-lg flex items-center justify-center`}>
        <span className={`${rankTextSize} font-black ${textColor}`}>{rank}</span>
      </div>
    </div>
  );
};


const Leaderboard: React.FC = () => {
  const { currentUser } = useAppContext();
  const [leaderboard, setLeaderboard] = useState<Partial<UserProfile>[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, coins, level')
        .order('coins', { ascending: false })
        .limit(50);
      
      if(error) console.error('Error fetching leaderboard:', error);
      else setLeaderboard(data || []);
    };
    fetchLeaderboard();
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Leaderboard</h1>
      
      {leaderboard.length > 0 && (
        <Card className="!p-0 overflow-hidden">
           <div className="flex justify-center items-end gap-1 md:gap-2 px-2 pt-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-secondary dark:to-gray-800 min-h-[300px] md:min-h-[350px]">
                {second && <PodiumItem user={second} rank={2} />}
                {first && <PodiumItem user={first} rank={1} />}
                {third && <PodiumItem user={third} rank={3} />}
            </div>
        </Card>
      )}

      <Card title="All Rankings">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-2 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-2 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th scope="col" className="px-2 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Level</th>
                <th scope="col" className="px-2 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coins</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark divide-y divide-gray-200 dark:divide-gray-700">
              {rest.map((person, index) => (
                <tr key={person.id} className={`${person.id === currentUser?.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>
                  <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-500">{index + 4}</div>
                  </td>
                  <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Avatar src={person.avatar_url} alt={person.full_name || ''} size="sm" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {person.full_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        Level {person.level}
                    </span>
                  </td>
                  <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    {person.coins}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leaderboard.length === 0 && (
          <p className="text-center p-4 text-gray-500">The leaderboard is still being calculated. Check back soon!</p>
        )}
      </Card>
    </div>
  );
};

export default Leaderboard;