
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAppContext } from '../../context/AppContext';
import { useNotifier } from '../../context/NotificationContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { XIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon, PencilAltIcon, PaperclipIcon, ArrowLeftIcon, ArrowUpIcon, ClockIcon, FireIcon } from '../ui/Icons';
import { GoogleGenAI, Type } from "@google/genai";
import { UserCourseMaterial, MaterialQuizQuestion } from '../../types';
import { marked } from 'marked';
import { PDFDocument } from 'pdf-lib';
import { useNavigate } from 'react-router-dom';

interface MaterialQuizModalProps {
    material: UserCourseMaterial;
    onClose: () => void;
}

type InputMode = 'document' | 'manual';

const MaterialQuizModal: React.FC<MaterialQuizModalProps> = ({ material, onClose }) => {
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();
    const navigate = useNavigate();
    
    // UI States
    const [activeMode, setActiveMode] = useState<InputMode>('document');
    const [manualText, setManualText] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [loadingStage, setLoadingStage] = useState(''); // "Downloading...", "Slicing PDF...", "AI Thinking..."

    // Quiz Logic States
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<MaterialQuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    
    // Track user answers: index -> option index selected. -1 means unanswered.
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    
    const [isFinished, setIsFinished] = useState(false);
    const [quizId, setQuizId] = useState<string | null>(null);
    const [finalScore, setFinalScore] = useState(0);
    
    // Tips State
    const [tips, setTips] = useState<string | null>(null);
    const [generatingTips, setGeneratingTips] = useState(false);

    useEffect(() => {
        checkAndLoadQuiz();
    }, [material.id]);

    const checkAndLoadQuiz = async () => {
        if (!supabase) return;
        setLoading(true);

        const { data: existingQuiz } = await supabase
            .from('material_quizzes')
            .select('id')
            .eq('material_id', material.id)
            .order('created_at', { ascending: false }) // Get the latest if multiple
            .limit(1)
            .maybeSingle();

        if (existingQuiz) {
            setQuizId(existingQuiz.id);
            const { data: questions } = await supabase
                .from('material_quiz_questions')
                .select('*')
                .eq('quiz_id', existingQuiz.id);
            
            if (questions && questions.length > 0) {
                setQuizQuestions(questions);
                setUserAnswers(new Array(questions.length).fill(-1));
            }
            setLoading(false);
        } else {
            setLoading(false);
        }
    };

    const handleResetForNewQuiz = () => {
        setIsFinished(false);
        setQuizQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
        setFinalScore(0);
        setQuizId(null);
        // We keep manualText and customTopic so they can tweak them
    };

    /**
     * Helper: Slices large PDFs to the first 7 pages to save tokens and time.
     */
    const getOptimizedFileBlob = async (): Promise<{ data: string, mimeType: string }> => {
        setLoadingStage('Downloading file...');
        const path = material.file_path || new URL(material.file_url).pathname.split('/academic_uploads/')[1];
        
        const { data: fileBlob, error } = await supabase!.storage
            .from('academic_uploads')
            .download(path);

        if (error || !fileBlob) throw new Error("Could not download file.");

        // If it's not a PDF, just return base64
        if (fileBlob.type !== 'application/pdf') {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(fileBlob);
                reader.onload = () => resolve({
                    data: (reader.result as string).split(',')[1],
                    mimeType: fileBlob.type
                });
            });
        }

        // If it IS a PDF, Slice it using pdf-lib
        setLoadingStage('Optimizing PDF...');
        try {
            const arrayBuffer = await fileBlob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            // If small enough, just send original
            if (pageCount <= 7) {
                const base64Original = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(fileBlob);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                });
                return { data: base64Original, mimeType: 'application/pdf' };
            }

            // Create new PDF with first 7 pages
            const newPdf = await PDFDocument.create();
            // Get indices [0, 1, ... 6]
            const pageIndices = Array.from({ length: 7 }, (_, i) => i);
            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach((page) => newPdf.addPage(page));
            
            const pdfBytes = await newPdf.save();
            
            // Convert Uint8Array to Base64 manually to avoid stack overflow on large files
            let binary = '';
            const len = pdfBytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(pdfBytes[i]);
            }
            const base64Slice = btoa(binary);
            
            return { data: base64Slice, mimeType: 'application/pdf' };

        } catch (e) {
            console.error("PDF Slicing failed, falling back to full file", e);
            // Fallback to full file if slicing fails
            const base64Fallback = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(fileBlob);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
            });
            return { data: base64Fallback, mimeType: 'application/pdf' };
        }
    };

    const generateTips = async () => {
        if (!currentUser) return;
        setGeneratingTips(true);
        setLoadingStage('AI Thinking...');
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("AI key missing");
            const ai = new GoogleGenAI({ apiKey });

            let prompt = '';
            let contents: any;
            
            const topicFocus = customTopic ? `Focus specifically on: "${customTopic}".` : '';

            if (activeMode === 'manual') {
                if(!manualText.trim()) {
                    addToast("Please paste some content first.", "error");
                    setGeneratingTips(false);
                    return;
                }
                prompt = `Role: Academic Coach. Context: ${material.courses?.code || 'Course'} - ${material.title}. ${topicFocus} Content: "${manualText.substring(0, 10000)}...". Task: Provide 3-5 high-impact study tips for an exam based on this content. Highlight pitfalls. Format: Markdown bullets.`;
                contents = prompt;
            } else {
                const fileData = await getOptimizedFileBlob();
                setLoadingStage('Generating Tips...');
                prompt = `Role: Academic Coach. Context: ${material.courses?.code} - ${material.title}. ${topicFocus} Task: Analyze the first few pages of this document. Provide 3-5 specific study tips to pass an exam on this topic. Format: Markdown bullets.`;
                contents = {
                    parts: [
                        { inlineData: fileData },
                        { text: prompt }
                    ]
                };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
            });

            setTips(response.text || "No tips generated.");
        } catch (error: any) {
            console.error("Error generating tips:", error);
            addToast("Could not generate tips. Try 'Paste Content' mode if the file is too large.", "error");
        } finally {
            setGeneratingTips(false);
            setLoadingStage('');
        }
    };

    const generateQuiz = async () => {
        if (!currentUser || !supabase) return;
        setGenerating(true);
        
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("AI key missing");
            const ai = new GoogleGenAI({ apiKey });

            const topicFocus = customTopic ? `IMPORTANT: Focus the questions specifically on the topic: "${customTopic}".` : '';
            const systemPrompt = `Role: Examiner. Task: Create 5 multiple-choice questions based on the provided content. ${topicFocus} Output: JSON Array only. Schema: [{question_text: string, options: string[], correct_option_index: number}].`;
            
            let contents: any;

            if (activeMode === 'manual') {
                 if(!manualText.trim()) {
                    addToast("Please paste content to generate a quiz.", "error");
                    setGenerating(false);
                    return;
                }
                setLoadingStage('Generating Questions...');
                contents = `${systemPrompt}\n\nContent:\n${manualText.substring(0, 15000)}`; // Text limit
            } else {
                const fileData = await getOptimizedFileBlob();
                setLoadingStage('Analyzing & Generating...');
                contents = {
                    parts: [
                        { inlineData: fileData },
                        { text: systemPrompt }
                    ]
                };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question_text: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correct_option_index: { type: Type.INTEGER }
                            }
                        }
                    }
                }
            });

            const generatedQuestions = JSON.parse(response.text || '[]');
            if (generatedQuestions.length === 0) throw new Error("AI returned no questions.");

            // Save to DB
            const { data: newQuiz, error: insertQuizError } = await supabase
                .from('material_quizzes')
                .insert({ material_id: material.id, created_by: currentUser.id })
                .select()
                .single();

            if (insertQuizError) throw insertQuizError;
            setQuizId(newQuiz.id);

            const questionsPayload = generatedQuestions.map((q: any) => ({
                quiz_id: newQuiz.id,
                question_text: q.question_text,
                options: q.options,
                correct_option_index: q.correct_option_index
            }));

            const { data: savedQuestions, error: insertQError } = await supabase
                .from('material_quiz_questions')
                .insert(questionsPayload)
                .select();

            if (insertQError) throw insertQError;

            setQuizQuestions(savedQuestions as MaterialQuizQuestion[]);
            setUserAnswers(new Array(savedQuestions.length).fill(-1));

        } catch (error: any) {
            console.error("Quiz generation error:", error);
            addToast(`Generation failed. Try 'Paste Content' mode. Error: ${error.message}`, 'error');
        } finally {
            setGenerating(false);
            setLoadingStage('');
        }
    };

    const handleOptionSelect = (optionIndex: number) => {
        // Only update if not already answered (prevent changing answer after revealing)
        if (userAnswers[currentQuestionIndex] !== -1) return;

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateScoreAndFinish();
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateScoreAndFinish = async () => {
        const score = userAnswers.reduce((acc, answer, index) => {
            return answer === quizQuestions[index].correct_option_index ? acc + 1 : acc;
        }, 0);
        
        setFinalScore(score);
        setIsFinished(true);

        if (!currentUser || !supabase || !quizId) return;

        await supabase.from('material_quiz_attempts').insert({
            quiz_id: quizId,
            user_id: currentUser.id,
            score: score,
            total_questions: quizQuestions.length
        });
        
        if (score === quizQuestions.length) {
             await supabase.from('coin_transactions').insert({
                user_id: currentUser.id,
                source_type: 'task',
                source_id: quizId,
                coin_amount: 10,
                status: 'approved',
                reason: `Perfect score on ${material.title} quiz`
            });
            await supabase.rpc('increment_coins', { amount: 10, user_id: currentUser.id });
            addToast("Perfect Score! You earned 10 coins.", 'success');
        }
    };

    // Calculate percentage for dopamine button condition
    const scorePercentage = quizQuestions.length > 0 ? finalScore / quizQuestions.length : 0;
    const showDopamineButton = scorePercentage > 0.6; // > 60% (e.g. 3/5 is 0.6, so > 0.6 is 4/5 or 5/5... wait, user said > 3/5. 4/5 is 0.8. Let's make it >= 0.6 to include 3/5 if that's the intent, or > 0.6 for strictly more than 3)
    // "score more than 3/5" usually implies 4 or 5. 
    // 3/5 = 60%. > 60% means 4/5 (80%) or 5/5 (100%).
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
            <Card className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto flex flex-col transition-all duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Genius Quiz</h2>
                    <p className="text-sm text-gray-500 truncate">{material.title}</p>
                </div>

                {loading ? (
                    <div className="py-10 text-center">Loading...</div>
                ) : !quizQuestions.length ? (
                    <div className="space-y-4">
                        {/* Input Mode Tabs */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button 
                                onClick={() => setActiveMode('document')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeMode === 'document' ? 'bg-white dark:bg-gray-600 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <PaperclipIcon className="w-4 h-4 inline mr-1" /> From Document
                            </button>
                            <button 
                                onClick={() => setActiveMode('manual')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeMode === 'manual' ? 'bg-white dark:bg-gray-600 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <PencilAltIcon className="w-4 h-4 inline mr-1" /> Paste Content
                            </button>
                        </div>

                        {activeMode === 'document' ? (
                            <div className="text-center py-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    AI will analyze the <strong>first 7 pages</strong> of your file to generate content instantly.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <textarea 
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500"
                                    rows={6}
                                    placeholder="Paste specific text, notes, or questions here if the file is too large or not readable..."
                                    value={manualText}
                                    onChange={e => setManualText(e.target.value)}
                                />
                            </div>
                        )}
                        
                        {/* New Topic Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specific Topic / Focus (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Thermodynamics, Chapter 3, Verbs..."
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            {/* Tips Button */}
                            <Button 
                                onClick={generateTips} 
                                disabled={generatingTips || generating} 
                                variant="outline" 
                                className="flex-1"
                            >
                                {generatingTips ? (
                                    <span>{loadingStage || 'Thinking...'}</span>
                                ) : (
                                    <><LightBulbIcon className="w-4 h-4 mr-2" /> Get Tips</>
                                )}
                            </Button>

                            {/* Quiz Button */}
                            <Button 
                                onClick={generateQuiz} 
                                disabled={generating || generatingTips} 
                                className="flex-1"
                            >
                                {generating ? (
                                    <span className="flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4 animate-spin" /> {loadingStage || 'Generating...'}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4" /> Create Quiz
                                    </span>
                                )}
                            </Button>
                        </div>

                        {/* Display Tips if generated */}
                        {tips && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-left animate-fade-in-up">
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                                    <LightBulbIcon className="w-4 h-4" /> Exam Strategy
                                </h4>
                                <div 
                                    className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200"
                                    dangerouslySetInnerHTML={{ __html: marked.parse(tips) }}
                                ></div>
                            </div>
                        )}
                    </div>
                ) : isFinished ? (
                    <div className="py-8 text-center space-y-4 animate-fade-in-up">
                        {finalScore === quizQuestions.length ? (
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircleIcon className="w-16 h-16 text-green-600" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-4xl font-bold text-yellow-600">{finalScore}</span>
                            </div>
                        )}
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">You scored {finalScore}/{quizQuestions.length}</h3>
                        <p className="text-gray-500 text-lg">
                            {finalScore === quizQuestions.length ? "You're an Academic Giant! Perfect score." : "Good effort! Keep studying."}
                        </p>
                        
                        <div className="flex flex-col gap-3 mt-6">
                            {showDopamineButton && (
                                <Button 
                                    onClick={() => { onClose(); navigate('/game'); }} 
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-none shadow-lg transform hover:scale-105 transition-all"
                                >
                                    <FireIcon className="w-5 h-5 mr-2" />
                                    Level Up Dopamine (Play Game)
                                </Button>
                            )}
                            
                            <Button onClick={handleResetForNewQuiz} className="w-full py-3" variant="outline">
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Generate New Quiz
                            </Button>
                            <Button onClick={onClose} className="w-full py-3">Close</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                            <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                            ></div>
                        </div>

                        <div key={currentQuestionIndex} className="animate-fade-in-up">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                            <h3 className="text-lg font-semibold mt-2 mb-4 leading-relaxed">{quizQuestions[currentQuestionIndex].question_text}</h3>

                            <div className="space-y-3">
                                {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                                    let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 transform active:scale-[0.98] ";
                                    const isCorrect = idx === quizQuestions[currentQuestionIndex].correct_option_index;
                                    const userSelected = userAnswers[currentQuestionIndex] === idx;
                                    const hasAnswered = userAnswers[currentQuestionIndex] !== -1;

                                    if (hasAnswered) {
                                        if (isCorrect) btnClass += "bg-green-100 border-green-500 text-green-900 dark:bg-green-900/40 dark:border-green-500 dark:text-green-100";
                                        else if (userSelected) btnClass += "bg-red-100 border-red-500 text-red-900 dark:bg-red-900/40 dark:border-red-500 dark:text-red-100";
                                        else btnClass += "border-gray-200 dark:border-gray-700 opacity-60";
                                    } else {
                                        btnClass += "border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20";
                                    }

                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleOptionSelect(idx)}
                                            disabled={hasAnswered}
                                            className={btnClass}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm sm:text-base">{option}</span>
                                                {hasAnswered && isCorrect && <CheckCircleIcon className="w-6 h-6 text-green-600 animate-pulse" />}
                                                {hasAnswered && userSelected && !isCorrect && <XCircleIcon className="w-6 h-6 text-red-600" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                            <Button 
                                variant="ghost" 
                                onClick={handlePrev} 
                                disabled={currentQuestionIndex === 0}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeftIcon className="w-5 h-5 mr-1" /> Previous
                            </Button>
                            
                            <Button 
                                onClick={handleNext} 
                                disabled={userAnswers[currentQuestionIndex] === -1}
                                className="px-6"
                            >
                                {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'} 
                                {currentQuestionIndex !== quizQuestions.length - 1 && <span className="ml-2">→</span>}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MaterialQuizModal;
