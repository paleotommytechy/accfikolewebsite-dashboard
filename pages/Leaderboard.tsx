import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Avatar from '../components/auth/Avatar';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { UserProfile } from '../types';

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
        .limit(20);
      
      if(error) console.error('Error fetching leaderboard:', error);
      else setLeaderboard(data || []);
    };
    fetchLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Leaderboard</h1>
      <Card>
        {leaderboard.length > 0 && (
          <div className="flex justify-center items-end gap-4 md:gap-8 p-4 border-b dark:border-gray-700">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="text-center">
                <Avatar src={topThree[1].avatar_url} alt={topThree[1].full_name || ''} size="lg" className="border-4 border-gray-400" />
                <h3 className="font-bold mt-2">{topThree[1].full_name}</h3>
                <p className="text-gray-500 text-sm">{topThree[1].coins} coins</p>
                <div className="bg-gray-300 dark:bg-gray-600 rounded-t-lg h-24 mt-2 p-2 flex items-center justify-center font-black text-3xl text-gray-600 dark:text-gray-300">2</div>
              </div>
            )}
            {/* 1st Place */}
            {topThree[0] && (
              <div className="text-center">
                <Avatar src={topThree[0].avatar_url} alt={topThree[0].full_name || ''} size="xl" className="border-4 border-yellow-400" />
                <h3 className="font-bold mt-2 text-lg">{topThree[0].full_name}</h3>
                <p className="text-yellow-500 text-sm font-semibold">{topThree[0].coins} coins</p>
                <div className="bg-yellow-400 dark:bg-yellow-500 rounded-t-lg h-32 mt-2 p-2 flex items-center justify-center font-black text-4xl text-white">1</div>
              </div>
            )}
            {/* 3rd Place */}
            {topThree[2] && (
              <div className="text-center">
                <Avatar src={topThree[2].avatar_url} alt={topThree[2].full_name || ''} size="lg" className="border-4 border-yellow-700" />
                <h3 className="font-bold mt-2">{topThree[2].full_name}</h3>
                <p className="text-gray-500 text-sm">{topThree[2].coins} coins</p>
                <div className="bg-yellow-700 dark:bg-yellow-800 rounded-t-lg h-20 mt-2 p-2 flex items-center justify-center font-black text-3xl text-yellow-200">3</div>
              </div>
            )}
          </div>
        )}
        <div className="flow-root">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {rest.map((person, index) => (
              <li key={person.id} className={`py-3 sm:py-4 ${person.id === currentUser?.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}>
                <div className="flex items-center space-x-4 px-4">
                  <div className="w-6 text-center text-gray-500 font-bold">{index + 4}</div>
                  <div className="flex-shrink-0">
                    <Avatar src={person.avatar_url} alt={person.full_name || ''} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {person.full_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      Level {person.level}
                    </p>
                  </div>
                  <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                    {person.coins} coins
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Leaderboard;