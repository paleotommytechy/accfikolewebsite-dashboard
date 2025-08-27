
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { WeeklyChallenge, TaskAssignment, WeeklyParticipant } from '../types';

const WeeklyGroupChallenge: React.FC<{
    challenge: WeeklyChallenge | null,
    participant: WeeklyParticipant | null,
    onJoin: () => void,
}> = ({ challenge, participant, onJoin }) => {
    if (!challenge) {
        return (
            <Card title="Weekly Group Challenge">
                <p className="text-gray-500">No active challenge this week. Check back soon!</p>
            </Card>
        );
    }
    
    const progress = participant ? participant.progress : 0;

    return (
        <Card title="Weekly Group Challenge">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 text-6xl">🏆</div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold">{challenge.title}</h3>
                    <p className="text-gray-500 mt-1">{challenge.details}</p>
                    {participant ? (
                        <>
                            <div className="mt-4">
                                <div className="flex justify-between mb-1">
                                    <span className="text-base font-medium text-primary-700 dark:text-white">Your Progress</span>
                                    <span className="text-sm font-medium text-primary-700 dark:text-white">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                                    <div className="bg-primary-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </>
                    ) : (
                         <Button onClick={onJoin} className="mt-4">Join Challenge</Button>
                    )}
                    {challenge.due_date && <div className="text-sm text-gray-500 mt-2">Ends {new Date(challenge.due_date).toLocaleDateString()}</div>}
                </div>
            </div>
        </Card>
    );
};

const MyDailyTasks: React.FC<{
    tasks: TaskAssignment[],
    onToggle: (taskId: string, currentStatus: 'assigned' | 'done') => void
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
                            {assignment.tasks?.due_date && <div className="mt-2 text-sm text-gray-400">Due: {new Date(assignment.tasks.due_date).toLocaleDateString()}</div>}
                        </div>
                         <button onClick={() => onToggle(assignment.id, assignment.status)} className={`p-2 rounded-full ${assignment.status === 'done' ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                            {assignment.status === 'done' ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> :
                                <span className="h-5 w-5 block"></span>
                            }
                         </button>
                    </div>
                </div>
            )) : <p className="text-gray-500">No daily tasks assigned. Great job!</p>}
            </div>
        </Card>
    );
};

const Tasks: React.FC = () => {
    const { currentUser } = useAppContext();
    const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
    const [participant, setParticipant] = useState<WeeklyParticipant | null>(null);
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);

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
        }

        // Fetch daily task assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('tasks_assignments')
            .select('*, tasks(*)')
            .eq('assignee_id', currentUser.id)
            .eq('tasks.frequency', 'daily');

        if (assignmentsError) console.error("Error fetching task assignments", assignmentsError);
        else setAssignments(assignmentsData as TaskAssignment[] || []);
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const handleJoinChallenge = async () => {
        if (!supabase || !currentUser || !challenge) return;
        const { error } = await supabase.from('weekly_participants').insert({
            challenge_id: challenge.id,
            user_id: currentUser.id,
        });
        if (error) alert("Error joining challenge: " + error.message);
        else {
            alert("Successfully joined the challenge!");
            fetchData();
        }
    };
    
    const handleToggleTask = async (assignmentId: string, currentStatus: 'assigned' | 'done') => {
        if (!supabase) return;
        const newStatus = currentStatus === 'assigned' ? 'done' : 'assigned';
        const { error } = await supabase
            .from('tasks_assignments')
            .update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null })
            .eq('id', assignmentId);
        if (error) alert("Error updating task: " + error.message);
        else fetchData();
    };

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tasks & Challenges</h1>
        <WeeklyGroupChallenge challenge={challenge} participant={participant} onJoin={handleJoinChallenge} />
        <MyDailyTasks tasks={assignments} onToggle={handleToggleTask} />
    </div>
  );
};

export default Tasks;
