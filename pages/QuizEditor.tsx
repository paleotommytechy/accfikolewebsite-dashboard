
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Quiz, QuizQuestion, WeeklyChallenge } from '../types';
import { useNotifier } from '../context/NotificationContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, PencilAltIcon, PlusIcon, TrashIcon } from '../components/ui/Icons';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const InputLoadingSkeleton = () => <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;
const EditorLoadingSkeleton = () => <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;

const QuizEditor: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { addToast, showConfirm } = useNotifier();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [challenge, setChallenge] = useState<Partial<WeeklyChallenge> | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [editing, setEditing] = useState<Partial<QuizQuestion> | null>(null);
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctOption, setCorrectOption] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchQuizData = useCallback(async () => {
        if (!supabase || !quizId) return;
        setLoading(true);

        const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();

        if (quizError || !quizData) {
            addToast('Could not find the specified quiz.', 'error');
            navigate('/task-management');
            return;
        }
        
        setQuiz(quizData);

        const { data: challengeData, error: challengeError } = await supabase
            .from('weekly_challenges')
            .select('title')
            .eq('id', quizData.challenge_id)
            .single();
        
        if (challengeError) {
            addToast('Could not find associated challenge.', 'error');
        } else {
            setChallenge(challengeData);
        }

        const { data: questionsData, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('created_at');

        if (questionsError) {
            addToast('Error fetching questions: ' + questionsError.message, 'error');
        } else {
            setQuestions(questionsData || []);
        }

        setLoading(false);
    }, [quizId, addToast, navigate]);

    useEffect(() => {
        fetchQuizData();
    }, [fetchQuizData]);

    const handleEditClick = (q: QuizQuestion) => {
        setEditing(q);
        setOptions(q.options);
        setCorrectOption(q.correct_option_index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearLocalStorageForQuestion = (questionId: string | undefined) => {
        if (!quizId) return;
        const keyId = questionId || 'new';
        localStorage.removeItem(`quiz-question-editor-text-${quizId}-${keyId}`);
        for (let i = 0; i < 4; i++) {
            localStorage.removeItem(`quiz-question-editor-option-${quizId}-${keyId}-${i}`);
        }
    };
    
    const resetForm = () => {
        clearLocalStorageForQuestion(editing?.id);
        setEditing(null);
        setOptions(['', '', '', '']);
        setCorrectOption(0);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.question_text || options.some(opt => !opt.trim()) || !supabase || !quizId) {
            addToast('Please fill all fields for the question and all four options.', 'error');
            return;
        }

        const upsertData: Partial<QuizQuestion> = {
            id: editing.id,
            quiz_id: quizId,
            question_text: editing.question_text,
            options: options,
            correct_option_index: correctOption
        };

        const { error } = await supabase.from('quiz_questions').upsert(upsertData);
        if (error) {
            addToast(error.message, 'error');
        } else {
            addToast(`Question ${editing.id ? 'updated' : 'created'}.`, 'success');
            resetForm();
            fetchQuizData();
        }
    };
    
    const handleDelete = (id: string) => {
        showConfirm('Are you sure you want to delete this question?', async () => {
            if(!supabase) return;
            const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
            if (error) {
                addToast(error.message, 'error');
            } else {
                addToast('Question deleted.', 'success');
                clearLocalStorageForQuestion(id);
                fetchQuizData();
            }
        });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const commonInputProps = {
        className: "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500",
    };

    if (loading || !quiz) {
        return <div className="text-center p-8">Loading Quiz Editor...</div>;
    }

    const storageKeyId = editing?.id || 'new';

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" onClick={() => navigate('/task-management')} className="mb-4">
                    <ArrowLeftIcon className="w-5 h-5 mr-2"/> Back to Task Management
                </Button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{quiz.title}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">Questions for challenge: "{challenge?.title || '...'}"</p>
            </div>

            <Card>
                <form onSubmit={handleSave} className="space-y-4 p-4 mb-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{editing?.id ? 'Edit Question' : 'Add New Question'}</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Question Text</label>
                        <Suspense fallback={<EditorLoadingSkeleton />}>
                            <AutoSaveField {...commonInputProps} as="textarea" value={editing?.question_text || ''} onChange={e => setEditing(p => ({...p, question_text: e.target.value}))} required rows={3} storageKey={`quiz-question-editor-text-${quizId}-${storageKeyId}`} />
                        </Suspense>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i}>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{`Option ${i + 1}`}</label>
                                <Suspense fallback={<InputLoadingSkeleton />}>
                                    <AutoSaveField {...commonInputProps} as="input" value={options[i]} onChange={e => handleOptionChange(i, e.target.value)} required storageKey={`quiz-question-editor-option-${quizId}-${storageKeyId}-${i}`} />
                                </Suspense>
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Correct Answer</label>
                        <div className="flex flex-wrap gap-4">
                            {[0, 1, 2, 3].map(i => (
                                <label key={i} className="flex items-center space-x-2">
                                    <input type="radio" name="correct_option" checked={correctOption === i} onChange={() => setCorrectOption(i)} className="text-primary-600 focus:ring-primary-500" />
                                    <span>Option {i+1}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        {editing && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
                        <Button type="submit">
                            {editing?.id ? 'Save Changes' : <><PlusIcon className="w-5 h-5 mr-2" />Add Question</>}
                        </Button>
                    </div>
                </form>

                <h2 className="text-xl font-semibold px-4">Existing Questions ({questions.length})</h2>
                 <ul className="space-y-2 p-4">
                    {questions.map(q => (
                        <li key={q.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <p className="font-semibold">{q.question_text}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
                                {q.options.map((opt, i) => (
                                     <span key={i} className={`truncate ${i === q.correct_option_index ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                        {i === q.correct_option_index ? '✔ ' : ''}{opt}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2 justify-end mt-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditClick(q)}><PencilAltIcon className="w-4 h-4 mr-1" /> Edit</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDelete(q.id)}><TrashIcon className="w-4 h-4 mr-1" /> Delete</Button>
                            </div>
                        </li>
                    ))}
                    {questions.length === 0 && <p className="text-center text-gray-500 py-4">No questions added yet.</p>}
                </ul>
            </Card>
        </div>
    );
};

export default QuizEditor;
