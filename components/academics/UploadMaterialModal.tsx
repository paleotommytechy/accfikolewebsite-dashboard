import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAppContext } from '../../context/AppContext';
import { useNotifier } from '../../context/NotificationContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CloudUploadIcon, XIcon, CheckCircleIcon, SparklesIcon } from '../ui/Icons';
import { GoogleGenAI, Type } from "@google/genai";

interface UploadMaterialModalProps {
    onClose: () => void;
}

const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({ onClose }) => {
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();
    
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Form fields
    const [courseCode, setCourseCode] = useState('');
    const [title, setTitle] = useState('');
    const [materialType, setMaterialType] = useState<'past_question' | 'lecture_note' | 'other'>('past_question');
    const [session, setSession] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- State Persistence: Load ---
    useEffect(() => {
        const savedCode = localStorage.getItem('upload_courseCode');
        const savedTitle = localStorage.getItem('upload_title');
        const savedType = localStorage.getItem('upload_materialType');
        const savedSession = localStorage.getItem('upload_session');

        if (savedCode) setCourseCode(savedCode);
        if (savedTitle) setTitle(savedTitle);
        if (savedType) setMaterialType(savedType as any);
        if (savedSession) setSession(savedSession);
        else setSession('2023/2024'); 
    }, []);

    // --- State Persistence: Save ---
    useEffect(() => { localStorage.setItem('upload_courseCode', courseCode); }, [courseCode]);
    useEffect(() => { localStorage.setItem('upload_title', title); }, [title]);
    useEffect(() => { localStorage.setItem('upload_materialType', materialType); }, [materialType]);
    useEffect(() => { localStorage.setItem('upload_session', session); }, [session]);

    const clearPersistedState = () => {
        localStorage.removeItem('upload_courseCode');
        localStorage.removeItem('upload_title');
        localStorage.removeItem('upload_materialType');
        localStorage.removeItem('upload_session');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            
            // Create preview if image
            if (selectedFile.type.startsWith('image/')) {
                const previewUrl = URL.createObjectURL(selectedFile);
                setPreview(previewUrl);
                
                // Trigger AI analysis for images
                await analyzeImage(selectedFile);
            } else {
                setPreview(null);
            }
        }
    };

    const analyzeImage = async (imageFile: File) => {
        try {
            setAnalyzing(true);
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("AI key missing");

            const ai = new GoogleGenAI({ apiKey });
            
            // Convert file to base64
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
            });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: imageFile.type, data: base64Data } },
                        { text: "Extract the academic course code (e.g., GST 101, MTH 202), the academic session/year (e.g. 2023/2024), and a suitable title for this document. If it looks like a Past Question, title it 'Past Question [Year]'. If it looks like a note, title it 'Lecture Note [Topic]'. Return JSON." }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            courseCode: { type: Type.STRING },
                            session: { type: Type.STRING },
                            title: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['past_question', 'lecture_note', 'other'] }
                        }
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                if (data.courseCode) setCourseCode(data.courseCode);
                if (data.session) setSession(data.session);
                if (data.title) setTitle(data.title);
                if (data.type) setMaterialType(data.type as any);
                addToast("AI auto-filled details from your image!", "success");
            }

        } catch (error) {
            console.error("AI Analysis failed", error);
            // Non-blocking error
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !currentUser || !supabase || !courseCode) {
            addToast("Please fill in all required fields and attach a file.", "error");
            return;
        }

        setUploading(true);
        try {
            // 1. Try to find Course ID, but proceed if not found
            let courseId = null;
            let suggestedCode = null;

            const { data: existingCourse } = await supabase
                .from('courses')
                .select('id')
                .ilike('code', courseCode.trim())
                .maybeSingle();
            
            if (existingCourse) {
                courseId = existingCourse.id;
            } else {
                // Store manual input
                suggestedCode = courseCode.trim();
            }

            // 2. Upload File
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('academic_uploads') 
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('academic_uploads').getPublicUrl(fileName);

            // 3. Insert Record
            const { error: insertError } = await supabase.from('user_course_materials').insert({
                uploader_id: currentUser.id,
                course_id: courseId,
                suggested_course_code: suggestedCode,
                title: title,
                file_url: urlData.publicUrl,
                file_path: fileName, 
                status: 'pending',
                material_type: materialType,
                academic_session: session,
                description: `Uploaded via CrowdSource feature.`
            });

            if (insertError) throw insertError;

            addToast("Upload successful! You'll receive coins once approved.", "success");
            clearPersistedState();
            onClose();

        } catch (error: any) {
            console.error("Upload failed", error);
            addToast(`Upload failed: ${error.message}`, "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
            <Card className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                        <CloudUploadIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload & Earn</h2>
                    <p className="text-sm text-gray-500">Help your fellowship members by uploading Past Questions or Notes.</p>
                    <div className="flex justify-center gap-4 mt-2 text-xs font-bold">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">PQ = 50 Coins</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Notes = 100 Coins</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* File Drop Area */}
                    <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 hover:border-primary-500'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf" />
                        
                        {file ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                                <CheckCircleIcon className="w-5 h-5" />
                                <span className="truncate max-w-[200px]">{file.name}</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-primary-600 font-medium">Click to upload file</p>
                                <p className="text-xs text-gray-500">Images (PNG, JPG) or PDF</p>
                            </div>
                        )}
                    </div>

                    {analyzing && (
                        <div className="flex items-center gap-2 text-xs text-primary-600 animate-pulse justify-center">
                            <SparklesIcon className="w-4 h-4" />
                            <span>AI is analyzing your file to auto-fill details...</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Material Type</label>
                        <select 
                            value={materialType} 
                            onChange={(e) => setMaterialType(e.target.value as any)}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
                        >
                            <option value="past_question">Past Question (PQ)</option>
                            <option value="lecture_note">Lecture Note</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Course Code (e.g. GST 101)</label>
                        <input 
                            type="text" 
                            value={courseCode} 
                            onChange={(e) => setCourseCode(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
                            placeholder="Exact course code"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
                            placeholder="e.g. 2023 First Semester Exam"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Session / Year</label>
                        <input 
                            type="text" 
                            value={session} 
                            onChange={(e) => setSession(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
                            placeholder="e.g. 2023/2024"
                        />
                    </div>

                    <Button type="submit" disabled={uploading || analyzing} className="w-full py-3">
                        {uploading ? 'Uploading...' : 'Submit for Approval'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default UploadMaterialModal;