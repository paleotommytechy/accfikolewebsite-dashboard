import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import type { WeeklyChallenge, TaskAssignment, WeeklyParticipant } from '../types';
// FIX: Import TrophyIcon to resolve module export error.
import { TrophyIcon } from '../components/ui/Icons';

type TxStatus = 'pending' | 'approved' | 'rejected' | null;

const WeeklyGroupChallenge: React.FC<{
    challenge: WeeklyChallenge | null,
    participant: WeeklyParticipant | null,
    txStatus: TxStatus,
    onJoin: () => void,
    onProgress: () => void,
}> = ({ challenge, participant, txStatus, onJoin, onProgress }) => {
    
    if (!challenge) {
        return (
            <Card>
                <div className="text-center p-4">
                    <h3 className="text-lg font-semibold">Weekly Group Challenge</h3>
                    <p className="text-gray-500 mt-2">No active challenge this week. Check back soon!</p>
                </div>
            </Card>
        );
    }
    
    const progress = participant ? participant.progress : 0;
    const isCompleted = progress >= 100;

    const daysLeft = challenge.due_date ? (() => {
        const due = new Date(challenge.due_date);
        const today = new Date();
        // Adjust for timezone offset to compare dates correctly by using UTC
        const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getUTCDate());
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getUTCDate());
        const diffTime = utcDue - utcToday;

        if (diffTime < 0) return 'Ended';
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Ends Today';
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    })() : '';

    return (
        <div className="rounded-lg shadow-lg bg-gradient-to-br from-primary-700 to-primary-900 text-white p-6 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-10">
                <TrophyIcon className="w-48 h-48" />
            </div>
            <div className="relative z-10">
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex-1">
                        <span className="text-sm uppercase font-bold text-primary-300 tracking-wider">Weekly Challenge</span>
                        <h3 className="text-2xl font-bold mt-1">{challenge.title}</h3>
                        <p className="text-primary-200 mt-2 text-sm opacity-90">{challenge.details}</p>
                    </div>

                    <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm p-3 rounded-lg text-center">
                        <p className="font-bold text-2xl text-yellow-300">{challenge.coin_reward}</p>
                        <p className="text-xs uppercase font-semibold">Coins</p>
                    </div>
                </div>

                <div className="mt-6">
                    {participant ? (
                         <>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold">Your Progress</span>
                                {daysLeft && <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">{daysLeft}</span>}
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-5 relative">
                                <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-5 rounded-full flex items-center justify-center transition-all duration-500" style={{ width: `${progress}%` }}>
                                     <span className="font-bold text-xs text-primary-800">{progress}%</span>
                                </div>
                            </div>
                             <div className="mt-4">
                                {isCompleted ? (
                                    <div className={`text-center font-semibold py-3 px-4 rounded-lg ${
                                        txStatus === 'approved' ? 'bg-green-500/30 text-green-100' : 
                                        txStatus === 'rejected' ? 'bg-red-500/30 text-red-100' : 'bg-white/20'
                                    }`}>
                                        {txStatus === 'approved' && "Challenge approved! Your reward has been sent."}
                                        {txStatus === 'rejected' && "Your submission has been rejected."}
                                        {txStatus === 'pending' && "Challenge completed! Your reward is pending approval."}
                                        {!txStatus && "Challenge completed! Processing reward..."}
                                    </div>
                                ) : (
                                    <Button onClick={onProgress} className="w-full bg-white text-primary-700 font-bold hover:bg-primary-100 !py-3">
                                        Log Progress
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                         <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                            <Button onClick={onJoin} className="w-full sm:w-auto flex-grow bg-white text-primary-700 font-bold hover:bg-primary-100 !py-3">
                                Join Challenge
                            </Button>
                            {daysLeft && <span className="text-sm font-medium bg-white/20 px-3 py-2 rounded-full">{daysLeft}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MyDailyTasks: React.FC<{
    tasks: TaskAssignment[],
    onToggle: (assignment: TaskAssignment, currentStatus: 'assigned' | 'done') => void
}> = ({ tasks, onToggle }) => {
    return (
        <Card title="My Daily Tasks">
            <div className="space-y-4">
            {tasks.length > 0 ? tasks.map(assignment => (
                <div key={assignment.id} className={`p-4 rounded-lg border ${assignment.status === 'done' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-dark border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className={`font-semibold text-lg ${assignment.status === 'done' ? 'line-through text-gray-500' : ''}`}>{assignment.tasks?.title}</h4>
                            <p className="text-gray-500 text-sm mt-1">{assignment.tasks?.details}</p>
                            {assignment.tasks?.coin_reward && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-semibold">{assignment.tasks.coin_reward} Coins</p>}
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className={`text-xs font-bold uppercase ${assignment.status === 'done' ? 'text-green-500' : 'text-yellow-500'}`}>
                                {assignment.status === 'done' ? 'Completed' : 'Pending'}
                            </span>
                            <button onClick={() => onToggle(assignment, assignment.status)} className={`p-2 rounded-full ${assignment.status === 'done' ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                                {assignment.status === 'done' ? 
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> :
                                    <span className="h-5 w-5 block"></span>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )) : <p className="text-gray-500">No daily tasks assigned for today. Great job!</p>}
            </div>
        </Card>
    );
};

const Tasks: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();
    const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
    const [participant, setParticipant] = useState<WeeklyParticipant | null>(null);
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [challengeTxStatus, setChallengeTxStatus] = useState<TxStatus>(null);

    const fetchData = async () => {
        if (!supabase || !currentUser) return;
        
        // Fetch current challenge
        const today = new Date().toISOString();
        const { data: challengeData, error: challengeError } = await supabase
            .from('weekly_challenges')
            .select('*')
            .lte('start_date', today)
            .gte('due_date', today)
            .order('created_at', { ascending: false })
            .limit(1).maybeSingle();
        if (challengeError) console.error("Error fetching challenge", challengeError);
        else setChallenge(challengeData);

        if (challengeData) {
            // Fetch participation status
            const { data: participantData, error: participantError } = await supabase
                .from('weekly_participants')
                .select('*')
                .eq('challenge_id', challengeData.id)
                .eq('user_id', currentUser.id)
                .maybeSingle();
            if (participantError) console.error("Error fetching participation", participantError);
            else setParticipant(participantData);

             // Fetch transaction status for the challenge
            const { data: txData, error: txError } = await supabase
                .from('coin_transactions')
                .select('status')
                .eq('user_id', currentUser.id)
                .eq('source_type', 'challenge')
                .eq('source_id', challengeData.id)
                .maybeSingle();
            
            if (txError) console.error("Error fetching challenge transaction status", txError);
            else if (txData) {
                setChallengeTxStatus(txData.status as TxStatus);
            } else {
                setChallengeTxStatus(null);
            }
        } else {
            setParticipant(null);
            setChallengeTxStatus(null);
        }

        // Fetch daily task assignments for today
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date();
        todayEnd.setHours(23,59,59,999);
        
        const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('tasks_assignments')
            .select('*, tasks(*)')
            .eq('assignee_id', currentUser.id)
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString())
            .eq('tasks.frequency', 'daily');

        if (assignmentsError) console.error("Error fetching task assignments", assignmentsError);
        else setAssignments(assignmentsData as TaskAssignment[] || []);
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const createCoinTransaction = async (
        sourceType: 'task' | 'challenge',
        sourceId: string,
        coinAmount: number | null | undefined
    ) => {
        if (!supabase || !currentUser) {
            console.error("User or Supabase client not available.");
            return;
        }

        // Strict validation
        if (typeof coinAmount !== 'number' || coinAmount <= 0) {
            console.log(`No coin reward for this ${sourceType} or amount is invalid.`);
            return;
        }
        if (!sourceId) {
            console.error(`Missing source ID for ${sourceType} transaction.`);
            return;
        }

        // Check if a transaction for this source already exists to prevent duplicates.
        const { data: existingTx, error: checkError } = await supabase
            .from('coin_transactions')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('source_type', sourceType)
            .eq('source_id', sourceId)
            .limit(1)
            .single();

        // .single() throws an error if no row is found (PGRST116), which is expected.
        // We only care about other errors.
        if (checkError && checkError.code !== 'PGRST116') {
             addToast('Error checking for existing transaction: ' + checkError.message, 'error');
             return;
        }
        if (existingTx) {
            console.log(`Transaction for this ${sourceType} already exists.`);
            return; // Silently exit if transaction exists
        }
        
        const { error: txError } = await supabase.from('coin_transactions').insert({
            user_id: currentUser.id,
            source_type: sourceType,
            source_id: sourceId,
            coin_amount: coinAmount,
            status: 'pending',
        });

        if (txError) {
            addToast("Error creating coin transaction: " + txError.message, 'error');
        } else {
            const message = sourceType === 'task' 
                ? "Task complete! Reward is pending approval." 
                : "Challenge complete! Reward is pending approval.";
            addToast(message, 'success');
        }
    };

    const handleJoinChallenge = async () => {
        if (!supabase || !currentUser || !challenge) return;
        const { error } = await supabase.from('weekly_participants').insert({
            challenge_id: challenge.id,
            user_id: currentUser.id,
        });
        if (error) addToast("Error joining challenge: " + error.message, 'error');
        else {
            addToast("Successfully joined the challenge!", 'success');
            fetchData();
        }
    };

    const handleChallengeProgress = async () => {
        if (!supabase || !currentUser || !participant) return;

        const newProgress = Math.min(100, participant.progress + 10); // Increment by 10%
        const { error } = await supabase.from('weekly_participants')
            .update({ progress: newProgress })
            .eq('id', participant.id);
        
        if (error) {
            addToast("Error updating progress: " + error.message, 'error');
        } else {
            // If progress reaches 100 and it's the first time, create transaction
            if (newProgress >= 100 && participant.progress < 100 && challenge) {
                await createCoinTransaction('challenge', challenge.id, challenge.coin_reward);
            }
            fetchData();
        }
    };
    
    const handleToggleTask = async (assignment: TaskAssignment, currentStatus: 'assigned' | 'done') => {
        if (!supabase || !currentUser) return;
        const newStatus = currentStatus === 'assigned' ? 'done' : 'assigned';
        
        const { error } = await supabase
            .from('tasks_assignments')
            .update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null })
            .eq('id', assignment.id);
            
        if (error) {
            addToast("Error updating task: " + error.message, 'error');
        } else {
            // Create a pending coin transaction if task is completed
            if (newStatus === 'done' && assignment.tasks) {
                 await createCoinTransaction('task', assignment.task_id, assignment.tasks.coin_reward);
            }
            fetchData();
        }
    };

  return (
    <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Tasks & Challenges</h1>
        <WeeklyGroupChallenge 
            challenge={challenge} 
            participant={participant} 
            txStatus={challengeTxStatus}
            onJoin={handleJoinChallenge} 
            onProgress={handleChallengeProgress} 
        />
        <MyDailyTasks tasks={assignments} onToggle={handleToggleTask} />
    </div>
  );
};

export default Tasks;