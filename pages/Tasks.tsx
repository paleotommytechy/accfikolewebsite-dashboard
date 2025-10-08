import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import type { WeeklyChallenge, TaskAssignment, WeeklyParticipant, Verse, Quiz, QuizQuestion, QuizAttempt } from '../types';
import { TrophyIcon, ClockIcon, GiftIcon, SparklesIcon, UsersIcon, CheckCircleIcon, XCircleIcon, QuestionMarkCircleIcon } from '../components/ui/Icons';
import { versePacks } from '../services/verses';
import Avatar from '../components/auth/Avatar';
import { marked } from 'marked';


type TxStatus = 'pending' | 'approved' | 'rejected' | null;

const AccountabilitySection: React.FC<{ participants: WeeklyParticipant[] }> = ({ participants }) => {
    if (participants.length <= 1) return null; // Don't show if only you are participating

    return (
        <div className="mt-6 border-t border-white/20 pt-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary-300 flex items-center gap-2 mb-3">
                <UsersIcon className="w-5 h-5" />
                Fellowship Members in this Challenge
            </h4>
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {participants.map(p => (
                    <div key={p.user_id} className="flex items-center gap-3">
                        <Avatar src={p.profiles?.avatar_url} alt={p.profiles?.full_name || 'member'} size="sm" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white truncate">{p.profiles?.full_name}</p>
                            <div className="w-full bg-black/20 rounded-full h-1.5 mt-1">
                                <div className="bg-yellow-300 h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-yellow-300">{p.progress}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const WeeklyGroupChallenge: React.FC<{
    challenge: WeeklyChallenge | null,
    participant: WeeklyParticipant | null,
    allParticipants: WeeklyParticipant[],
    txStatus: TxStatus,
    quiz: Quiz | null,
    quizAttempt: QuizAttempt | null,
    onJoin: () => void,
    onStartQuiz: () => void,
}> = ({ challenge, participant, allParticipants, txStatus, quiz, quizAttempt, onJoin, onStartQuiz }) => {
    
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
        const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getUTCDate());
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getUTCDate());
        const diffTime = utcDue - utcToday;

        if (diffTime < 0) return 'Ended';
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Ends Today';
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    })() : '';

    const renderActionButton = () => {
        if (!participant) {
            return (
                 <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                    <Button onClick={onJoin} className="w-full sm:w-auto flex-grow bg-white text-primary-700 font-bold hover:bg-primary-100 !py-3">
                        Join Challenge
                    </Button>
                    {daysLeft && <span className="text-sm font-medium bg-white/20 px-3 py-2 rounded-full">{daysLeft}</span>}
                </div>
            );
        }
    
        if (quiz) {
            // Quiz Flow
            if (quizAttempt?.passed) {
                return (
                    <div className={`text-center font-semibold py-3 px-4 rounded-lg mt-4 ${
                        txStatus === 'approved' ? 'bg-green-500/30 text-green-100' : 
                        txStatus === 'rejected' ? 'bg-red-500/30 text-red-100' : 'bg-white/20'
                    }`}>
                        {txStatus === 'approved' && "Rewards approved!"}
                        {txStatus === 'rejected' && "Submission rejected."}
                        {txStatus === 'pending' && "Quiz passed! Rewards are pending approval."}
                        {!txStatus && "Quiz passed! Processing rewards..."}
                    </div>
                );
            }
    
            if (quizAttempt && !quizAttempt.passed) {
                return (
                    <Button onClick={onStartQuiz} className="w-full bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-300 !py-3 mt-4">
                        <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
                        Retry Quiz
                    </Button>
                );
            }
            
            return (
                <Button onClick={onStartQuiz} className="w-full bg-white text-primary-700 font-bold hover:bg-primary-100 !py-3 mt-4">
                    Done
                </Button>
            );
    
        } else {
             // This handles the case where there is a challenge but no quiz is associated with it in the DB.
            return (
                <div className={`text-center font-semibold py-3 px-4 rounded-lg mt-4 bg-white/20`}>
                    Challenge details are being prepared. Check back soon.
                </div>
            );
        }
    };

    return (
        <div className="rounded-lg shadow-lg bg-gradient-to-br from-primary-700 to-primary-900 text-white p-6 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-10">
                <TrophyIcon className="w-48 h-48" />
            </div>
            <div className="relative z-10">
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex-1 min-w-0">
                        <span className="text-sm uppercase font-bold text-primary-300 tracking-wider">Weekly Challenge</span>
                        <h3 className="text-2xl font-bold mt-1">{challenge.title}</h3>
                        <div
                            className="prose prose-sm prose-invert mt-2 opacity-90 max-w-none"
                            dangerouslySetInnerHTML={{ __html: challenge.details ? marked.parse(challenge.details) : '' }}
                        >
                        </div>
                    </div>

                    <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm p-3 rounded-lg text-center">
                        <p className="font-bold text-2xl text-yellow-300">{challenge.coin_reward}</p>
                        <p className="text-xs uppercase font-semibold">Coins</p>
                    </div>
                </div>

                <div className="mt-6">
                    {participant && isCompleted && (
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
                        </>
                    )}
                    {renderActionButton()}
                </div>
                {participant && <AccountabilitySection participants={allParticipants} />}
            </div>
        </div>
    );
};

const MyTasksComponent: React.FC<{
    tasks: TaskAssignment[],
    onTaskAction: (assignment: TaskAssignment) => void
}> = ({ tasks, onTaskAction }) => {
    return (
        <Card title="Today's Tasks">
            <div className="space-y-4">
            {tasks.length > 0 ? tasks.map(assignment => (
                <div key={assignment.id} className={`p-4 rounded-lg border ${assignment.status === 'done' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-dark border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className={`font-semibold text-lg ${assignment.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                                {assignment.tasks?.title}
                                {assignment.tasks?.time_gate_minutes && assignment.status !== 'done' && <ClockIcon className="w-4 h-4 inline-block ml-2 text-gray-400" />}
                            </h4>
                            <p className="text-gray-500 text-sm mt-1">{assignment.tasks?.details}</p>
                            {assignment.tasks?.coin_reward && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-semibold">{assignment.tasks.coin_reward} Coins</p>}
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className={`text-xs font-bold uppercase ${assignment.status === 'done' ? 'text-green-500' : 'text-yellow-500'}`}>
                                {assignment.status === 'done' ? 'Completed' : 'Pending'}
                            </span>
                            <button onClick={() => onTaskAction(assignment)} className={`p-2 rounded-full ${assignment.status === 'done' ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                                {assignment.status === 'done' ? 
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> :
                                    <span className="h-5 w-5 block"></span>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )) : <p className="text-gray-500">No tasks assigned for today. Great job!</p>}
            </div>
        </Card>
    );
};

// --- Time-gated Task Modal ---
const FocusSessionModal: React.FC<{
    assignment: TaskAssignment,
    onClose: () => void,
    onComplete: (assignment: TaskAssignment, currentStatus: 'assigned' | 'done') => void
}> = ({ assignment, onClose, onComplete }) => {
    const timeInSeconds = (assignment.tasks?.time_gate_minutes || 0) * 60;
    const [timeLeft, setTimeLeft] = useState(timeInSeconds);
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        if (!timerActive || timeLeft <= 0) return;
        const intervalId = setInterval(() => {
            setTimeLeft(t => Math.max(0, t - 1));
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timerActive, timeLeft]);

    const isTimerFinished = timeLeft <= 0;
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleComplete = () => {
        onComplete(assignment, 'assigned');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
            <Card title="Focus Session" className="max-w-lg w-full">
                <div className="text-center">
                    <h3 className="text-xl font-bold">{assignment.tasks?.title}</h3>
                    <p className="text-gray-500 mt-2">{assignment.tasks?.details}</p>

                    <div className="my-8">
                        <p className="text-6xl font-mono font-bold text-primary-600">{formatTime(timeLeft)}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${((timeInSeconds - timeLeft) / timeInSeconds) * 100}%` }}></div>
                        </div>
                    </div>

                    {!timerActive && <Button size="lg" onClick={() => setTimerActive(true)}>Start Timer</Button>}
                    {timerActive && (
                        <Button size="lg" onClick={handleComplete} disabled={!isTimerFinished}>
                            {isTimerFinished ? "I'm Done!" : "In Progress..."}
                        </Button>
                    )}
                </div>
                <div className="text-center mt-4">
                     <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </div>
            </Card>
        </div>
    );
};


// --- Verse Pack Reward Modal ---
const VersePackModal: React.FC<{ verse: Verse, onClose: () => void }> = ({ verse, onClose }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '300ms' }}>
            <div className="w-full max-w-md" style={{ perspective: '1000px' }}>
                <div 
                    className={`relative w-full h-80 transition-transform duration-700`}
                    style={{ transformStyle: 'preserve-3d', transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* Front of the card */}
                    <div 
                        className="absolute w-full h-full bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white cursor-pointer p-6 text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                        onClick={() => setIsRevealed(true)}
                    >
                         <GiftIcon className="w-20 h-20" />
                         <h2 className="text-2xl font-bold mt-4">You earned a Verse Pack!</h2>
                         <p className="opacity-80 mt-2">Tap to open and see today’s encouragement.</p>
                    </div>

                    {/* Back of the card */}
                     <div 
                        className="absolute w-full h-full bg-white dark:bg-dark rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <SparklesIcon className="w-8 h-8 text-yellow-400 mb-4" />
                        <blockquote className="text-center">
                            <p className="text-lg italic text-gray-700 dark:text-gray-200">"{verse.verse_text}"</p>
                            <footer className="mt-4 text-right font-semibold text-primary-600 dark:text-primary-400">{verse.verse_reference}</footer>
                        </blockquote>
                        <Button onClick={onClose} className="mt-8">Collect</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW: Refactored Quiz Modal ---
interface QuizModalProps {
    quiz: Quiz;
    onClose: () => void;
    onComplete: (result: { score: number; passed: boolean; }) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ quiz, onClose, onComplete }) => {
    const { addToast } = useNotifier();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [currentStep, setCurrentStep] = useState(0); 
    const [finalResult, setFinalResult] = useState<{ score: number; passed: boolean } | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!supabase) return;
            setLoading(true);
            const { data, error } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
            if (error) {
                addToast('Failed to load quiz questions.', 'error');
                onClose();
            } else {
                setQuestions(data || []);
                setAnswers(new Array(data.length).fill(null));
            }
            setLoading(false);
        };
        fetchQuestions();
    }, [quiz.id, addToast, onClose]);

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentStep] = optionIndex;
        setAnswers(newAnswers);

        setTimeout(() => {
            const nextStep = currentStep + 1;
            if (nextStep < questions.length) {
                setCurrentStep(nextStep);
            } else {
                // Quiz is finished, calculate and show results
                const score = newAnswers.reduce((acc, answer, index) => {
                    return answer === questions[index].correct_option_index ? acc + 1 : acc;
                }, 0);
                const passed = score >= quiz.pass_threshold;
                setFinalResult({ score, passed });
            }
        }, 300);
    };
    
    const handleModalCloseAndComplete = () => {
        if (finalResult) {
            onComplete(finalResult);
        } else {
            onClose(); // Should not happen, but as a fallback
        }
    };
    
    if (loading) {
        return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><p className="text-white">Loading Quiz...</p></div>
    }

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
            <Card title={quiz.title} className="max-w-lg w-full">
                {finalResult ? (
                    <div className="text-center">
                        {finalResult.passed ? (
                            <>
                                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
                                <h2 className="text-2xl font-bold mt-4">Congratulations!</h2>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">You passed the quiz with a score of {finalResult.score}/{questions.length}.</p>
                                <p className="font-semibold text-lg mt-2">You earned <span className="text-yellow-500">{quiz.coin_reward} coins</span>!</p>
                            </>
                        ) : (
                            <>
                                <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
                                <h2 className="text-2xl font-bold mt-4">Nice Try!</h2>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">You scored {finalResult.score}/{questions.length}. You need {quiz.pass_threshold} correct answers to pass. Keep studying!</p>
                            </>
                        )}
                         <Button onClick={handleModalCloseAndComplete} className="mt-6">Close</Button>
                    </div>
                ) : questions[currentStep] ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Question {currentStep + 1} of {questions.length}</h3>
                            <button onClick={onClose}><XCircleIcon className="w-6 h-6 text-gray-400"/></button>
                        </div>
                        <p className="text-xl my-4">{questions[currentStep].question_text}</p>
                        <div className="space-y-3">
                            {questions[currentStep].options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(index)}
                                    className="w-full text-left p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/40 hover:border-primary-500 transition-colors"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-4">No questions found for this quiz.</div>
                )}
            </Card>
        </div>
    );
};


const Tasks: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();
    const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
    const [participant, setParticipant] = useState<WeeklyParticipant | null>(null);
    const [allParticipants, setAllParticipants] = useState<WeeklyParticipant[]>([]);
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [challengeTxStatus, setChallengeTxStatus] = useState<TxStatus>(null);
    const [focusSessionTask, setFocusSessionTask] = useState<TaskAssignment | null>(null);
    const [revealedVerse, setRevealedVerse] = useState<Verse | null>(null);

    // New quiz state
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

    const createCoinTransaction = async (
        sourceType: 'task' | 'challenge' | 'quiz',
        sourceId: string,
        coinAmount: number | null | undefined
    ) => {
        if (!supabase || !currentUser) {
            console.error("User or Supabase client not available.");
            return;
        }

        if (typeof coinAmount !== 'number' || coinAmount <= 0) {
            console.log(`No coin reward for this ${sourceType} or amount is invalid.`);
            return;
        }
        if (!sourceId) {
            console.error(`Missing source ID for ${sourceType} transaction.`);
            return;
        }

        const { data: existingTx, error: checkError } = await supabase
            .from('coin_transactions')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('source_type', sourceType)
            .eq('source_id', sourceId)
            .limit(1)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
             addToast('Error checking for existing transaction: ' + checkError.message, 'error');
             return;
        }
        if (existingTx) {
            console.log(`Transaction for this ${sourceType} already exists.`);
            return;
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
            if (sourceType !== 'quiz') { // Quiz has its own toast
                addToast(message, 'success');
            }
        }
    };

    const fetchData = useCallback(async () => {
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
            // Fetch all participants for accountability
            const { data: allParticipantsData, error: allParticipantsError } = await supabase
                .from('weekly_participants')
                .select('*, profiles(full_name, avatar_url)')
                .eq('challenge_id', challengeData.id);

            if(allParticipantsError) console.error("Error fetching all participants", allParticipantsError);
            else setAllParticipants(allParticipantsData as WeeklyParticipant[] || []);
            
            const currentUserParticipant = allParticipantsData?.find(p => p.user_id === currentUser.id) || null;
            setParticipant(currentUserParticipant);

             // Fetch transaction status for the challenge
            const { data: txData, error: txError } = await supabase
                .from('coin_transactions')
                .select('status')
                .eq('user_id', currentUser.id)
                .eq('source_type', 'challenge')
                .eq('source_id', challengeData.id)
                .maybeSingle();
            
            if (txError) console.error("Error fetching challenge transaction status", txError);
            else if (txData) setChallengeTxStatus(txData.status as TxStatus);
            else setChallengeTxStatus(null);
            
            // Fetch quiz and attempt status
            const {data: quizData, error: quizError} = await supabase.from('quizzes').select('*').eq('challenge_id', challengeData.id).maybeSingle();
            if(quizError) console.error('Error fetching quiz', quizError);
            else setQuiz(quizData);

            if(quizData) {
                const {data: attemptData, error: attemptError} = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizData.id).eq('user_id', currentUser.id).maybeSingle();
                if(attemptError && attemptError.code !== 'PGRST116') console.error('Error fetching quiz attempt', attemptError); // Ignore no rows found
                else setQuizAttempt(attemptData);
            } else {
                setQuiz(null);
                setQuizAttempt(null);
            }

        } else {
            setParticipant(null);
            setAllParticipants([]);
            setChallengeTxStatus(null);
            setQuiz(null);
            setQuizAttempt(null);
        }

        // Fetch task assignments for today
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date();
        todayEnd.setHours(23,59,59,999);
        
        const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('tasks_assignments')
            .select('*, tasks(*)')
            .eq('assignee_id', currentUser.id)
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString());

        if (assignmentsError) console.error("Error fetching task assignments", assignmentsError);
        else setAssignments(assignmentsData as TaskAssignment[] || []);
    }, [currentUser, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleQuizCompletion = async (result: { score: number, passed: boolean }) => {
        setIsQuizModalOpen(false);
        if (!currentUser || !supabase || !challenge || !participant || !quiz) return;

        const { score, passed } = result;

        const attemptData = {
            user_id: currentUser.id,
            quiz_id: quiz.id,
            score,
            passed,
        };

        const { error: attemptError } = await supabase
            .from('quiz_attempts')
            .upsert(attemptData, { onConflict: 'user_id,quiz_id' });

        if (attemptError) {
            addToast('Error saving quiz attempt: ' + attemptError.message, 'error');
        } else if (passed) {
            addToast(`Quiz passed! Rewards are being processed.`, 'success');
            
            const { error: progressError } = await supabase.from('weekly_participants')
                .update({ progress: 100 })
                .eq('id', participant.id);
            if(progressError) addToast('Error updating challenge progress.', 'error');

            await createCoinTransaction('quiz', quiz.id, quiz.coin_reward);
            await createCoinTransaction('challenge', challenge.id, challenge.coin_reward);
        } else {
            addToast(`You didn't pass this time. Feel free to try again!`, 'info');
        }
        
        fetchData();
    };
    
    const grantVersePackReward = async () => {
        if (!supabase || !currentUser) return;
        const { data: unlockedData, error: unlockedError } = await supabase
            .from('user_verse_rewards')
            .select('verse_id')
            .eq('user_id', currentUser.id);

        if (unlockedError) {
            console.error('Error fetching unlocked verses', unlockedError);
            return;
        }

        const unlockedVerseIds = new Set(unlockedData.map(r => r.verse_id));
        const availableVerses = versePacks.filter(v => !unlockedVerseIds.has(v.id));

        if (availableVerses.length === 0) {
            addToast("You've collected all available verse packs! Amazing!", 'success');
            return;
        }

        const verseToGrant = availableVerses[Math.floor(Math.random() * availableVerses.length)];
        const { error: insertError } = await supabase
            .from('user_verse_rewards')
            .insert({ user_id: currentUser.id, verse_id: verseToGrant.id });

        if (insertError) {
            console.error('Error granting verse reward', insertError);
        } else {
            setRevealedVerse(verseToGrant);
        }
    }

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
            if (newStatus === 'done' && assignment.tasks) {
                 await createCoinTransaction('task', assignment.task_id, assignment.tasks.coin_reward);
                 
                 const remainingTasks = assignments.filter(a => a.id !== assignment.id && a.status === 'assigned');
                 if (remainingTasks.length === 0) {
                     await grantVersePackReward();
                 }
            }
            fetchData();
        }
    };

    const handleTaskAction = (assignment: TaskAssignment) => {
        if (assignment.tasks?.time_gate_minutes && assignment.status !== 'done') {
            setFocusSessionTask(assignment);
        } else {
            handleToggleTask(assignment, assignment.status);
        }
    };
    

  return (
    <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Tasks & Challenges</h1>
        <WeeklyGroupChallenge 
            challenge={challenge} 
            participant={participant} 
            allParticipants={allParticipants}
            txStatus={challengeTxStatus}
            quiz={quiz}
            quizAttempt={quizAttempt}
            onJoin={handleJoinChallenge} 
            onStartQuiz={() => setIsQuizModalOpen(true)}
        />
        <MyTasksComponent tasks={assignments} onTaskAction={handleTaskAction} />

        {focusSessionTask && (
            <FocusSessionModal 
                assignment={focusSessionTask}
                onClose={() => setFocusSessionTask(null)}
                onComplete={handleToggleTask}
            />
        )}
        {revealedVerse && (
            <VersePackModal
                verse={revealedVerse}
                onClose={() => setRevealedVerse(null)}
            />
        )}
        {isQuizModalOpen && quiz && (
            <QuizModal 
                quiz={quiz}
                onClose={() => setIsQuizModalOpen(false)}
                onComplete={handleQuizCompletion}
            />
        )}
    </div>
  );
};

export default Tasks;