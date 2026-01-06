import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Faculty, Department, Course, CourseMaterial, CourseBorrower, UserCourseMaterial } from '../types';
import { useNotifier } from '../context/NotificationContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PlusIcon, PencilAltIcon, TrashIcon, CheckIcon, XIcon, ExternalLinkIcon } from '../components/ui/Icons';
import Avatar from '../components/auth/Avatar';
import { useAppContext } from '../context/AppContext';

type Tab = 'Pending Uploads' | 'Faculties' | 'Departments' | 'Courses' | 'Materials' | 'Borrowed Courses' | 'User Materials';

const AcademicsManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('Pending Uploads');
    
    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Academics Management</h1>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
                    {(['Pending Uploads', 'Faculties', 'Departments', 'Courses', 'Materials', 'Borrowed Courses', 'User Materials'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div>
                {activeTab === 'Pending Uploads' && <PendingUploadsManager />}
                {activeTab === 'Faculties' && <FacultiesManager />}
                {activeTab === 'Departments' && <DepartmentsManager />}
                {activeTab === 'Courses' && <CoursesManager />}
                {activeTab === 'Materials' && <MaterialsManager />}
                {activeTab === 'Borrowed Courses' && <BorrowedCoursesManager />}
                {activeTab === 'User Materials' && <UserMaterialsManager />}
            </div>
        </div>
    );
};

// --- NEW: Pending Uploads Manager with Edit Capability ---
const PendingUploadsManager: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast } = useNotifier();
    const [uploads, setUploads] = useState<(UserCourseMaterial & { profiles: { full_name: string, avatar_url: string } })[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Edit state
    const [editingUploadId, setEditingUploadId] = useState<string | null>(null);
    const [editedCourseId, setEditedCourseId] = useState<string>('');
    const [editedTitle, setEditedTitle] = useState<string>('');

    const fetchPending = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        // Fetch uploads
        const { data: uploadsData, error: uploadsError } = await supabase
            .from('user_course_materials')
            .select('*, profiles:uploader_id(full_name, avatar_url), courses:course_id(code, name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (uploadsError) addToast(uploadsError.message, 'error');
        else setUploads(uploadsData as any || []);
        
        // Fetch courses for dropdown
        const { data: coursesData } = await supabase.from('courses').select('id, code, name').order('code');
        if (coursesData) setCourses(coursesData);

        setLoading(false);
    }, [addToast]);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const startEditing = (upload: UserCourseMaterial) => {
        setEditingUploadId(upload.id);
        setEditedCourseId(upload.course_id || '');
        setEditedTitle(upload.title);
    };

    const cancelEditing = () => {
        setEditingUploadId(null);
        setEditedCourseId('');
        setEditedTitle('');
    };

    const handleSaveEdit = async (uploadId: string) => {
        if (!supabase) return;
        if (!editedCourseId) {
            addToast('Please select a valid course code.', 'error');
            return;
        }
        
        const { error } = await supabase
            .from('user_course_materials')
            .update({ 
                course_id: editedCourseId, 
                title: editedTitle,
                suggested_course_code: null // Clear suggestion as it's mapped now
            })
            .eq('id', uploadId);

        if (error) {
            addToast('Error updating upload: ' + error.message, 'error');
        } else {
            addToast('Details updated. You can now approve.', 'success');
            cancelEditing();
            fetchPending();
        }
    };

    const handleApprove = async (upload: UserCourseMaterial) => {
        if (!supabase || !currentUser) return;
        
        if (!upload.course_id) {
            addToast('Cannot approve. Please click "Edit Details" to map this to a valid Course Code first.', 'error');
            return;
        }

        setProcessingId(upload.id);
        const reward = upload.material_type === 'past_question' ? 50 : 100;

        try {
            const { error } = await supabase.rpc('approve_material_upload', {
                p_material_id: upload.id,
                p_admin_id: currentUser.id,
                p_coin_reward: reward
            });

            if (error) throw error;

            addToast('Upload approved and coins awarded!', 'success');
            fetchPending();
        } catch (error: any) {
            addToast('Approval failed: ' + error.message, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!supabase) return;
        setProcessingId(id);
        const { error } = await supabase
            .from('user_course_materials')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) addToast(error.message, 'error');
        else {
            addToast('Upload rejected.', 'info');
            fetchPending();
        }
        setProcessingId(null);
    };

    return (
        <Card title="Pending Material Approvals">
            {loading ? <p>Loading pending uploads...</p> : uploads.length === 0 ? <p className="text-center py-8 text-gray-500">No pending uploads.</p> : (
                <ul className="space-y-4">
                    {uploads.map(item => {
                        const isEditing = editingUploadId === item.id;
                        const displayCourseCode = item.courses?.code || item.suggested_course_code || 'Unknown';
                        
                        return (
                            <li key={item.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-col gap-4 border border-gray-200 dark:border-gray-700">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-gray-800 dark:text-white">Edit Details</h4>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                                value={editedTitle}
                                                onChange={e => setEditedTitle(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Map to Course (Required)</label>
                                            <select 
                                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                                value={editedCourseId}
                                                onChange={e => setEditedCourseId(e.target.value)}
                                            >
                                                <option value="">Select a course...</option>
                                                {courses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                                ))}
                                            </select>
                                            {item.suggested_course_code && <p className="text-xs text-orange-500 mt-1">User suggested: {item.suggested_course_code}</p>}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                                            <Button size="sm" onClick={() => handleSaveEdit(item.id)}>Save Changes</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded capitalize ${item.material_type === 'past_question' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                    {item.material_type.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-lg">{item.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Code: <span className={!item.course_id ? "text-red-500 font-bold" : ""}>{displayCourseCode}</span> 
                                                {!item.course_id && " (Not Linked)"} | Session: {item.academic_session || 'N/A'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                <Avatar src={item.profiles.avatar_url} alt="" size="sm" />
                                                <span>Uploaded by {item.profiles.full_name}</span>
                                            </div>
                                            <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline mt-2 text-sm">
                                                <ExternalLinkIcon className="w-4 h-4" /> View File
                                            </a>
                                        </div>
                                        <div className="flex flex-col gap-2 justify-center">
                                            {!item.course_id && (
                                                <div className="text-xs text-red-500 text-center mb-1">
                                                    ⚠️ Map to course to approve
                                                </div>
                                            )}
                                            <div className="flex flex-row sm:flex-col gap-2 justify-center">
                                                <Button size="sm" variant="outline" onClick={() => startEditing(item)}>
                                                    <PencilAltIcon className="w-4 h-4 mr-1" /> Edit Details
                                                </Button>
                                                <Button size="sm" onClick={() => handleApprove(item)} disabled={processingId === item.id || !item.course_id}>
                                                    <CheckIcon className="w-4 h-4 mr-1" /> Approve (+{item.material_type === 'past_question' ? 50 : 100})
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={() => handleReject(item.id)} disabled={processingId === item.id} className="text-red-600 hover:bg-red-50">
                                                    <XIcon className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
};


// Manager Components
const FacultiesManager: React.FC = () => {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [editing, setEditing] = useState<Partial<Faculty> | null>(null);
    const { addToast } = useNotifier();

    const fetchFaculties = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('faculties').select('*').order('name');
        if (error) addToast(error.message, 'error');
        else setFaculties(data || []);
    }, [addToast]);

    useEffect(() => { fetchFaculties(); }, [fetchFaculties]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.name || !supabase) return;
        const { error } = await supabase.from('faculties').upsert(editing);
        if (error) addToast(error.message, 'error');
        else {
            addToast(`Faculty ${editing.id ? 'updated' : 'created'}.`, 'success');
            setEditing(null);
            fetchFaculties();
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('faculties').delete().eq('id', id);
        if (error) {
            if (error.code === '23503') { // foreign key violation
                addToast('Cannot delete faculty. It is currently being used by some departments.', 'error');
            } else {
                addToast(error.message, 'error');
            }
        } else {
            addToast('Faculty deleted.', 'success');
            fetchFaculties();
        }
    };

    return (
        <ManagerUI
            title="Faculties"
            items={faculties}
            editingItem={editing}
            onSetEditing={setEditing}
            onDelete={handleDelete}
            renderItem={item => <p className="truncate">{item.name}</p>}
            renderForm={() => (
                <InputField label="Faculty Name" value={editing?.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} required />
            )}
            onSave={handleSave}
        />
    );
};

const DepartmentsManager: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [editing, setEditing] = useState<Partial<Department> | null>(null);
    const { addToast } = useNotifier();

    const fetchData = useCallback(async () => {
        if (!supabase) return;
        const { data: depts, error: deptError } = await supabase.from('departments').select('*').order('name');
        if (deptError) addToast(deptError.message, 'error');
        else setDepartments(depts || []);

        const { data: facs, error: facError } = await supabase.from('faculties').select('*').order('name');
        if (facError) addToast(facError.message, 'error');
        else setFaculties(facs || []);
    }, [addToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.name || !editing.faculty_id || !supabase) return;
        const { error } = await supabase.from('departments').upsert(editing);
        if (error) addToast(error.message, 'error');
        else {
            addToast(`Department ${editing.id ? 'updated' : 'created'}.`, 'success');
            setEditing(null);
            fetchData();
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (error) {
             if (error.code === '23503') { // Foreign key violation
                addToast('Cannot delete department. It is currently being used by some courses.', 'error');
            } else {
                addToast(error.message, 'error');
            }
        } else { 
            addToast('Department deleted.', 'success'); 
            fetchData(); 
        }
    };

    return (
        <ManagerUI
            title="Departments"
            items={departments}
            editingItem={editing}
            onSetEditing={setEditing}
            onDelete={handleDelete}
            renderItem={item => <p className="truncate">{item.name} <span className="text-xs text-gray-500">({faculties.find(f => f.id === item.faculty_id)?.name})</span></p>}
            renderForm={() => (
                <>
                    <InputField label="Department Name" value={editing?.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} required />
                    <SelectField label="Faculty" value={editing?.faculty_id || ''} onChange={e => setEditing(p => ({ ...p, faculty_id: e.target.value }))} required>
                        <option value="" disabled>Select a faculty</option>
                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </SelectField>
                </>
            )}
            onSave={handleSave}
        />
    );
};

const CoursesManager: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [editing, setEditing] = useState<Partial<Course> | null>(null);
    const { addToast } = useNotifier();

    const fetchData = useCallback(async () => {
        if (!supabase) return;
        const [coursesRes, deptsRes, facsRes] = await Promise.all([
            supabase.from('courses').select('*').order('level, code'),
            supabase.from('departments').select('*').order('name'),
            supabase.from('faculties').select('*').order('name')
        ]);
        if (coursesRes.error) addToast(coursesRes.error.message, 'error'); else setCourses(coursesRes.data || []);
        if (deptsRes.error) addToast(deptsRes.error.message, 'error'); else setDepartments(deptsRes.data || []);
        if (facsRes.error) addToast(facsRes.error.message, 'error'); else setFaculties(facsRes.data || []);
    }, [addToast]);
    
    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.name || !editing.code || !editing.level || !supabase) {
            addToast('Please fill all required fields.', 'error');
            return;
        }

        const dataToSave = { ...editing };
        if (dataToSave.is_general) {
            dataToSave.department_id = null;
            dataToSave.faculty_id = null;
        } else if (dataToSave.faculty_id && !dataToSave.department_id) {
            // It's a faculty course, department_id should be null
            dataToSave.department_id = null;
        }

        const { error } = await supabase.from('courses').upsert(dataToSave);
        if (error) addToast(error.message, 'error');
        else {
            addToast(`Course ${editing.id ? 'updated' : 'created'}.`, 'success');
            setEditing(null);
            fetchData();
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('courses').delete().eq('id', id);
        if (error) {
             if (error.code === '23503') { // Foreign key violation
                addToast('Cannot delete course. It is currently being used by some materials.', 'error');
            } else {
                addToast(error.message, 'error');
            }
        } else { 
            addToast('Course deleted.', 'success'); 
            fetchData(); 
        }
    };
    
    return (
        <ManagerUI
            title="Courses"
            items={courses}
            editingItem={editing}
            onSetEditing={item => setEditing(item || { name: '', code: '', level: 100, is_general: false })}
            onDelete={handleDelete}
            renderItem={item => (
                <div>
                    <p className="font-semibold text-gray-800 dark:text-white truncate">{item.code} - {item.name} ({item.level}L)</p>
                    <p className="text-sm text-gray-500 truncate">
                        {item.is_general ? 'University-wide' : 
                            item.department_id ? departments.find(d => d.id === item.department_id)?.name :
                            item.faculty_id ? `${faculties.find(f => f.id === item.faculty_id)?.name} (Faculty-wide)` : 'N/A'}
                    </p>
                </div>
            )}
            renderForm={() => (
                <>
                    <InputField label="Course Name" value={editing?.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} required />
                    <InputField label="Course Code" value={editing?.code || ''} onChange={e => setEditing(p => ({ ...p, code: e.target.value }))} required />
                    <SelectField label="Level" value={editing?.level || 100} onChange={e => setEditing(p => ({ ...p, level: parseInt(e.target.value) }))} required>
                        {[100, 200, 300, 400, 500].map(l => <option key={l} value={l}>{l} Level</option>)}
                    </SelectField>
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="checkbox" id="is_general" checked={editing?.is_general || false} onChange={e => setEditing(p => ({ ...p, is_general: e.target.checked, faculty_id: null, department_id: null }))} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                        <label htmlFor="is_general" className="text-sm text-gray-700 dark:text-gray-300">University-wide General Course</label>
                    </div>
                    {!editing?.is_general && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <SelectField label="Faculty" value={editing?.faculty_id || ''} onChange={e => setEditing(p => ({ ...p, faculty_id: e.target.value, department_id: null }))} required={!editing?.department_id}>
                                <option value="">Select a faculty...</option>
                                {faculties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </SelectField>
                            <SelectField label="Department (optional)" value={editing?.department_id || ''} onChange={e => setEditing(p => ({ ...p, department_id: e.target.value }))} disabled={!editing?.faculty_id}>
                                <option value="">Select for departmental course...</option>
                                {departments.filter(d=>d.faculty_id === editing?.faculty_id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </SelectField>
                        </div>
                    )}
                </>
            )}
            onSave={handleSave}
        />
    );
};

const MaterialsManager: React.FC = () => {
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [editing, setEditing] = useState<Partial<CourseMaterial> | null>(null);
    const { addToast } = useNotifier();

    const fetchData = useCallback(async () => {
        if (!supabase) return;
        const { data: materialsData, error: materialsError } = await supabase.from('course_materials').select('*').order('title');
        if (materialsError) addToast(materialsError.message, 'error');
        else setMaterials(materialsData || []);
        
        const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*').order('level, code');
        if (coursesError) addToast(coursesError.message, 'error');
        else setCourses(coursesData || []);
    }, [addToast]);
    
    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.title || !editing.url || !editing.type || !editing.course_id || !supabase) {
            addToast('Please fill all required fields.', 'error');
            return;
        }
        const { error } = await supabase.from('course_materials').upsert(editing);
        if (error) addToast(error.message, 'error');
        else {
            addToast(`Material ${editing.id ? 'updated' : 'created'}.`, 'success');
            setEditing(null);
            fetchData();
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('course_materials').delete().eq('id', id);
        if (error) addToast(error.message, 'error');
        else { addToast('Material deleted.', 'success'); fetchData(); }
    };
    
    return (
        <ManagerUI
            title="Materials"
            items={materials}
            editingItem={editing}
            onSetEditing={item => setEditing(item || { title: '', type: 'pdf_link', url: '' })}
            onDelete={handleDelete}
            renderItem={item => (
                <p className="truncate">
                    {item.title}
                    <span className="text-xs text-gray-500 ml-2">
                        ({courses.find(c => c.id === item.course_id)?.code || 'N/A'})
                    </span>
                </p>
            )}
            renderForm={() => (
                <>
                    <SelectField label="Course" value={editing?.course_id || ''} onChange={e => setEditing(p => ({ ...p, course_id: e.target.value }))} required>
                        <option value="" disabled>Select a course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </SelectField>
                    <InputField label="Material Title" value={editing?.title || ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} required />
                    <SelectField label="Material Type" value={editing?.type || 'pdf_link'} onChange={e => setEditing(p => ({ ...p, type: e.target.value as CourseMaterial['type'] }))} required>
                        <option value="pdf_link">PDF Link</option>
                        <option value="drive_folder">Google Drive Folder</option>
                        <option value="video_link">Video Link</option>
                        <option value="text">Text / Notes</option>
                    </SelectField>
                    <InputField label="URL / Link" type="url" value={editing?.url || ''} onChange={e => setEditing(p => ({ ...p, url: e.target.value }))} required />
                    <TextAreaField label="Description (Optional)" value={editing?.description || ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} />
                </>
            )}
            onSave={handleSave}
        />
    );
};

const BorrowedCoursesManager: React.FC = () => {
    const [borrowers, setBorrowers] = useState<CourseBorrower[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [editing, setEditing] = useState<Partial<CourseBorrower> | null>(null);
    const { addToast } = useNotifier();

    const fetchData = useCallback(async () => {
        if (!supabase) return;
        const [borrowersRes, coursesRes, deptsRes] = await Promise.all([
            supabase.from('course_borrowers').select('*'),
            supabase.from('courses').select('*').order('code'),
            supabase.from('departments').select('*').order('name')
        ]);
        if (borrowersRes.error) addToast(borrowersRes.error.message, 'error'); else setBorrowers(borrowersRes.data || []);
        if (coursesRes.error) addToast(coursesRes.error.message, 'error'); else setCourses(coursesRes.data || []);
        if (deptsRes.error) addToast(deptsRes.error.message, 'error'); else setDepartments(deptsRes.data || []);
    }, [addToast]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !editing.course_id || !editing.department_id || !supabase) return;
        const { error } = await supabase.from('course_borrowers').upsert(editing);
        if (error) addToast(error.message, 'error');
        else {
            addToast('Borrowed course relationship saved.', 'success');
            setEditing(null);
            fetchData();
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('course_borrowers').delete().eq('id', id);
        if (error) addToast(error.message, 'error');
        else { addToast('Relationship deleted.', 'success'); fetchData(); }
    };

    return (
        <ManagerUI
            title="Borrowed Courses"
            items={borrowers}
            editingItem={editing}
            onSetEditing={setEditing}
            onDelete={handleDelete}
            renderItem={item => {
                const course = courses.find(c => c.id === item.course_id);
                const department = departments.find(d => d.id === item.department_id);
                return <p className="truncate"><strong>{department?.name || '...'}</strong> borrows <strong>{course?.code || '...'}</strong></p>;
            }}
            renderForm={() => (
                 <>
                    <SelectField label="Department that is borrowing" value={editing?.department_id || ''} onChange={e => setEditing(p => ({ ...p, department_id: e.target.value }))} required>
                        <option value="" disabled>Select a department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </SelectField>
                    <SelectField label="Course to be borrowed" value={editing?.course_id || ''} onChange={e => setEditing(p => ({ ...p, course_id: e.target.value }))} required>
                        <option value="" disabled>Select a course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </SelectField>
                </>
            )}
            onSave={handleSave}
        />
    );
};

const UserMaterialsManager: React.FC = () => {
    const [materials, setMaterials] = useState<(UserCourseMaterial & { courses: { code: string, name: string }, profiles: { full_name: string, avatar_url: string } })[]>([]);
    const { addToast, showConfirm } = useNotifier();

    const fetchMaterials = useCallback(async () => {
        if (!supabase) return;
        // Fetch approved materials only for this view
        const { data, error } = await supabase
            .from('user_course_materials')
            .select('*, courses(code, name), profiles(full_name, avatar_url)')
            .eq('status', 'approved') 
            .order('created_at', { ascending: false });
        if (error) addToast(error.message, 'error');
        else setMaterials(data as any || []);
    }, [addToast]);

    useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

    const handleDelete = (material: typeof materials[0]) => {
        showConfirm(`Are you sure you want to delete "${material.title}"? This will also remove the file from storage.`, async () => {
            if (!supabase) return;
            // 1. Delete from storage
            const { error: storageError } = await supabase.storage.from('academic_uploads').remove([material.file_path]);
            if (storageError) {
                // If it fails (maybe file missing), log but try to delete record anyway
                console.warn('Could not delete file from storage: ', storageError.message);
            }
            // 2. Delete from database
            const { error: dbError } = await supabase.from('user_course_materials').delete().eq('id', material.id);
            if (dbError) addToast('Error deleting database record: ' + dbError.message, 'error');
            else {
                addToast('Material deleted successfully.', 'success');
                fetchMaterials();
            }
        });
    };

    return (
        <Card title="Approved Community Materials">
            {materials.length > 0 ? (
                <ul className="space-y-2">
                    {materials.map(item => (
                        <li key={item.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex-grow w-full min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white truncate">{item.title}</p>
                                <p className="text-sm text-gray-500 truncate">
                                    {item.material_type} | For: {item.courses?.code || 'N/A'} | Uploaded by: {item.profiles?.full_name || '...'}
                                </p>
                            </div>
                            <div className="flex-shrink-0 w-full md:w-auto flex items-center justify-end gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleDelete(item)}>
                                    <TrashIcon className="w-4 h-4 mr-1" /> Delete
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-center text-gray-500 py-4">No approved community materials yet.</p>}
        </Card>
    );
};


// Generic UI Components
interface ManagerUIProps<T extends { id: string; [key: string]: any; }> {
    title: string;
    items: T[];
    editingItem: Partial<T> | null;
    onSetEditing: (item: Partial<T> | null) => void;
    onDelete: (id: string) => void;
    renderItem: (item: T) => React.ReactNode;
    renderForm: () => React.ReactNode;
    onSave: (e: React.FormEvent) => Promise<void>;
}

const ManagerUI = <T extends { id: string; [key: string]: any; }>({ title, items, editingItem, onSetEditing, onDelete, renderItem, renderForm, onSave }: ManagerUIProps<T>) => {
    return (
        <Card title={title}>
            <div className="space-y-4">
                {editingItem ? (
                    <form onSubmit={onSave} className="space-y-4 p-4 mb-4 border dark:border-gray-700 rounded-lg animate-fade-in-up" style={{ animationDuration: '300ms' }}>
                        <h3 className="text-lg font-semibold">{ 'id' in editingItem ? 'Edit' : 'Create' } {title.slice(0, -1)}</h3>
                        {renderForm()}
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="ghost" onClick={() => onSetEditing(null)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                ) : (
                    <Button onClick={() => onSetEditing({})}>
                        <PlusIcon className="w-5 h-5 mr-2" /> Add New {title.slice(0, -1)}
                    </Button>
                )}

                <ul className="space-y-2">
                    {items.map(item => (
                        <li key={item.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex-grow w-full min-w-0">
                                {renderItem(item)}
                            </div>
                            <div className="flex-shrink-0 w-full md:w-auto flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => onSetEditing(item)}>
                                    <PencilAltIcon className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => onDelete(item.id)}>
                                    <TrashIcon className="w-4 h-4 mr-1" /> Delete
                                </Button>
                            </div>
                        </li>
                    ))}
                     {items.length === 0 && !editingItem && <p className="text-center text-gray-500 py-4">No {title.toLowerCase()} found. Add one to get started.</p>}
                </ul>
            </div>
        </Card>
    );
};


const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <select {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
            {children}
        </select>
    </div>
);
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <textarea {...props} rows={3} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);


export default AcademicsManagement;