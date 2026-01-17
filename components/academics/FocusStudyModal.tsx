
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNotifier } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { XIcon, ClockIcon, PlayIcon, PauseIcon, CheckCircleIcon, FireIcon, RefreshIcon, PencilAltIcon } from '../ui/Icons';
import { UserCourseMaterial } from '../../types';

const AutoSaveField = lazy(() => import('../ui/AutoSaveField'));

interface FocusStudyModalProps {
    material: UserCourseMaterial;
    onClose: () => void;
}

const SESSION_DURATION = 25 * 60; // 25 minutes
const COIN_REWARD = 10;

const FocusStudyModal: React.FC<FocusStudyModalProps> = ({ material, onClose }) => {
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();
    
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isProcessingReward, setIsProcessingReward] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        let interval: number | null = null;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            setIsCompleted(true);
            if (interval) clearInterval(interval);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => { setTimeLeft(SESSION_DURATION); setIsActive(false); setIsCompleted(false); };

    const handleClaimReward = async () => {
        if (!currentUser || !supabase || isProcessingReward) return;
        setIsProcessingReward(true);
        try {
            const { error } = await supabase.from('coin_transactions').insert({
                user_id: currentUser.id,
                source_type: 'task',
                source_id: material.id,
                coin_amount: COIN_REWARD,
                status: 'pending',
                reason: `Focus Session: ${material.title}`
            });
            if (error) throw error;
            addToast(`Session Complete! +${COIN_REWARD} coins pending.`, 'success');
            onClose();
        } catch (error: any) {
            addToast(error.message, 'error');
            setIsProcessingReward(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = ((SESSION_DURATION - timeLeft) / SESSION_DURATION) * 100;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
            {/* Backdrop Close */}
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <Card className="w-full max-w-lg relative flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden !p-0 z-10 animate-spring-up border-none shadow-2xl">
                {/* Drag Handle for Mobile */}
                <div className="w-14 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-4 sm:hidden"></div>

                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-dark/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-black text-xl tracking-tight">Deep Study</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">{material.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-8 flex flex-col items-center">
                    <div className="relative mb-10">
                        <div className="w-64 h-64 sm:w-72 sm:h-72 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="44%" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                                <circle cx="50%" cy="50%" r="44%" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="600" strokeDashoffset={600 - (600 * progressPercentage / 100)} className="text-primary-500 transition-all duration-1000 ease-linear rounded-full stroke-[round]" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-mono font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">{formatTime(timeLeft)}</span>
                                <div className={`flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {isActive ? <><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Flowing</> : 'Paused'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full max-w-sm justify-center mb-10">
                        {!isCompleted ? (
                            <>
                                <Button onClick={toggleTimer} size="lg" className={`flex-1 rounded-2xl shadow-lg !py-4 ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                                    {isActive ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                                    <span className="ml-2 font-bold">{isActive ? 'Pause' : 'Resume'}</span>
                                </Button>
                                <Button onClick={resetTimer} variant="outline" size="lg" className="px-6 rounded-2xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800"><RefreshIcon className="w-6 h-6" /></Button>
                            </>
                        ) : (
                            <Button onClick={handleClaimReward} size="lg" className="w-full bg-gradient-to-r from-orange-500 to-primary-600 shadow-xl !py-5 rounded-2xl text-lg font-black" disabled={isProcessingReward}>
                                <FireIcon className="w-6 h-6 mr-2" />
                                {isProcessingReward ? 'Processing...' : `Claim ${COIN_REWARD} Coins`}
                            </Button>
                        )}
                    </div>

                    <div className="w-full border-t border-gray-100 dark:border-gray-800 pt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2"><PencilAltIcon className="w-4 h-4" /> Study Notes</h3>
                        </div>
                        <Suspense fallback={<div className="h-32 bg-gray-50 dark:bg-gray-800/50 rounded-2xl animate-pulse"></div>}>
                            <AutoSaveField
                                as="textarea"
                                storageKey={`study-notes-${material.id}`}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Jot down key points here... insights stay saved locally."
                                className="w-full h-40 p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none transition-all placeholder:text-gray-400"
                            />
                        </Suspense>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default FocusStudyModal;
