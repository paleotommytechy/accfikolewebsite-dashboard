import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Faculty, Department, Course, CourseMaterial, CourseBorrower, UserCourseMaterial } from '../types';
import Card from '../components/ui/Card';
import { BookOpenIcon, ChevronDownIcon, ExternalLinkIcon, ClockIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';
import Button from '../components/ui/Button';
// FIX: Import missing Avatar component to resolve "Cannot find name 'Avatar'" error
import Avatar from '../components/auth/Avatar';
import StudyPlanner from '../components/academics/StudyPlanner';
import CourseCompanion from '../components/academics/CourseCompanion';
import FocusStudyModal from '../components/academics/FocusStudyModal';

const AcademicSkeleton: React.FC = () => (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="border-b dark:border-gray-800 pb-4 last:border-0">
                <div className="h-8 w-1/3 skeleton animate-shimmer rounded-lg mb-4" />
                <div className="pl-6 space-y-3">
                    <div className="h-12 w-full skeleton animate-shimmer rounded-xl" />
                    <div className="h-12 w-5/6 skeleton animate-shimmer rounded-xl opacity-70" />
                </div>
            </div>
        ))}
    </div>
);

interface CollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-5 px-3 text-left font-bold text-lg hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors rounded-xl"
      >
        {title}
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-6 px-3 animate-fade-in-up" style={{animationDuration: '400ms'}}>
          {children}
        </div>
      )}
    </div>
  );
};

const CourseLevelGroup: React.FC<{ 
    coursesByLevel: Record<number, (Course & { materials: CourseMaterial[], userMaterials: UserCourseMaterial[], isBorrowed?: boolean })[]>,
    onStudyStart: (material: UserCourseMaterial) => void 
}> = ({ coursesByLevel, onStudyStart }) => (
    <div className="pl-4 space-y-2">
        {Object.entries(coursesByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, coursesInLevel]) => (
            <Collapsible key={level} title={<span className="text-base font-black text-primary-600 dark:text-primary-400 tracking-tight">{level} Level</span>}>
                <div className="pl-4 space-y-6">
                    {(coursesInLevel as (Course & { materials: CourseMaterial[], userMaterials: UserCourseMaterial[], isBorrowed?: boolean })[]).map(course => (
                        <div key={course.id} className="pt-2">
                            <h4 className="font-black text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
                                {course.code} - {course.name} 
                                {course.isBorrowed && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Borrowed</span>}
                            </h4>
                            
                            {course.materials.length > 0 && (
                                <div className="mt-3">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">University Source</h5>
                                    <ul className="space-y-2">
                                        {course.materials.map(mat => (
                                            <li key={mat.id} className="group">
                                                <a href={mat.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:bg-primary-50 hover:border-primary-200 dark:hover:bg-primary-900/10">
                                                    <ExternalLinkIcon className="w-5 h-5 text-primary-500" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block truncate">{mat.title}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{mat.type.replace(/_/g, ' ')}</span>
                                                    </div>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(course.userMaterials.length > 0 || course.materials.length > 0) ? (
                                <div className="mt-4">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Fellowship Archive</h5>
                                    <ul className="space-y-3">
                                        {course.userMaterials.map(um => (
                                            <li key={um.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                                                <div className="flex-1 min-w-0">
                                                    <a href={um.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-black text-sm">
                                                        <ExternalLinkIcon className="w-4 h-4" />
                                                        <span className="truncate">{um.title}</span>
                                                    </a>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Avatar src={um.profiles?.avatar_url} alt="" size="sm" className="!w-5 !h-5" />
                                                        <span className="text-xs font-bold text-gray-400">{um.profiles?.full_name || 'Member'}</span>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => onStudyStart(um)} className="text-[10px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 rounded-full px-4 border-none shadow-none">
                                                    <ClockIcon className="w-3.5 h-3.5 mr-1.5" /> Focus Mode
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-xs font-bold text-gray-400 italic mt-4 pl-1">No materials currently in vault.</p>
                            )}
                        </div>
                    ))}
                </div>
            </Collapsible>
        ))}
    </div>
);

const Academics: React.FC = () => {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [userMaterials, setUserMaterials] = useState<UserCourseMaterial[]>([]);
    const [courseBorrowers, setCourseBorrowers] = useState<CourseBorrower[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedMaterialForStudy, setSelectedMaterialForStudy] = useState<UserCourseMaterial | null>(null);

    const fetchAllData = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [facultyRes, departmentRes, courseRes, materialRes, userMaterialRes, borrowerRes] = await Promise.all([
                supabase.from('faculties').select('*').order('name'),
                supabase.from('departments').select('*').order('name'),
                supabase.from('courses').select('*').order('level, code'),
                supabase.from('course_materials').select('*').order('title'),
                supabase.from('user_course_materials').select('*, profiles:uploader_id(full_name, avatar_url)').eq('status', 'approved').order('created_at', { ascending: false }),
                supabase.from('course_borrowers').select('*')
            ]);

            if (facultyRes.error) throw facultyRes.error;
            if (departmentRes.error) throw departmentRes.error;
            if (courseRes.error) throw courseRes.error;
            if (materialRes.error) throw materialRes.error;
            if (userMaterialRes.error) throw userMaterialRes.error;
            if (borrowerRes.error) throw borrowerRes.error;

            setFaculties(facultyRes.data || []);
            setDepartments(departmentRes.data || []);
            setCourses(courseRes.data || []);
            setMaterials(materialRes.data || []);
            setUserMaterials((userMaterialRes.data as UserCourseMaterial[]) || []);
            setCourseBorrowers(borrowerRes.data || []);
        } catch (error: any) {
            console.error("Error fetching academic data:", error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const { universityCoursesByLevel, groupedFaculties, allCoursesForPlanner } = useMemo(() => {
        const coursesWithMaterials = courses.map(course => ({
            ...course,
            materials: materials.filter(m => m.course_id === course.id),
            userMaterials: userMaterials.filter(um => um.course_id === course.id),
        }));
        
        const allCoursesForPlanner = courses.map(course => ({
            id: course.id,
            name: course.name,
            code: course.code,
            materials: [
                ...materials.filter(m => m.course_id === course.id).map(m => ({ title: m.title, type: m.type })),
                ...userMaterials.filter(um => um.course_id === course.id).map(um => ({ title: um.title, type: 'User Upload' }))
            ]
        }));

        const uniCourses = coursesWithMaterials.filter(c => c.is_general && !c.faculty_id && !c.department_id);
        const uniCoursesByLevel = uniCourses.reduce((acc, course) => {
            const level = course.level;
            if (!acc[level]) acc[level] = [];
            acc[level].push(course);
            return acc;
        }, {} as Record<number, (Course & { materials: CourseMaterial[], userMaterials: UserCourseMaterial[] })[]>);
        
        const facs = faculties.map(faculty => {
            const facGeneralCourses = coursesWithMaterials.filter(c => c.faculty_id === faculty.id && !c.department_id);
            const facCoursesByLevel = facGeneralCourses.reduce((acc, course) => {
                const level = course.level;
                if (!acc[level]) acc[level] = [];
                acc[level].push(course);
                return acc;
            }, {} as Record<number, (Course & { materials: CourseMaterial[], userMaterials: UserCourseMaterial[] })[]>);

            const depts = departments.filter(d => d.faculty_id === faculty.id).map(dept => {
                const departmentalCourses = coursesWithMaterials.filter(c => c.department_id === dept.id);
                const borrowedCourseIds = new Set(courseBorrowers.filter(b => b.department_id === dept.id).map(b => b.course_id));
                const borrowedCourses = coursesWithMaterials.filter(c => borrowedCourseIds.has(c.id));
                
                const allDeptCourses = [...departmentalCourses, ...borrowedCourses];
                const deptCoursesByLevel = allDeptCourses.reduce((acc, course) => {
                    const level = course.level;
                    if (!acc[level]) acc[level] = [];
                    const courseWithFlag = { ...course, isBorrowed: borrowedCourseIds.has(course.id) };
                    acc[level].push(courseWithFlag);
                    return acc;
                }, {} as Record<number, (Course & { materials: CourseMaterial[], userMaterials: UserCourseMaterial[], isBorrowed: boolean })[]>);

                return { ...dept, coursesByLevel: deptCoursesByLevel };
            });
            return { ...faculty, facultyCoursesByLevel: facCoursesByLevel, departments: depts };
        });

        return { universityCoursesByLevel: uniCoursesByLevel, groupedFaculties: facs, allCoursesForPlanner };

    }, [faculties, departments, courses, materials, userMaterials, courseBorrowers]);


    return (
        <div className="space-y-10">
            <header className="animate-fade-in-up">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Academic Roadmap</h1>
                <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-xs">Curated Faculty & Departmental Vaults</p>
            </header>

            <Card className="!p-0 border-none shadow-soft overflow-hidden">
                {loading ? (
                    <div className="p-8"><AcademicSkeleton /></div>
                ) : (Object.keys(universityCoursesByLevel).length === 0 && groupedFaculties.length === 0) ? (
                    <div className="text-center py-20">
                        <BookOpenIcon className="w-20 h-20 mx-auto text-gray-200 dark:text-gray-700" />
                        <h3 className="text-xl font-black mt-4 text-gray-400">Roadmap Currently Empty</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Check back after materials are uploaded</p>
                    </div>
                ) : (
                    <div className="divide-y border-t border-gray-100 dark:border-gray-800">
                        {Object.keys(universityCoursesByLevel).length > 0 && (
                            <Collapsible title={<span className="flex items-center gap-2 font-black"><BookOpenIcon className="w-5 h-5 text-primary-500" /> University Wide</span>} defaultOpen>
                               <CourseLevelGroup coursesByLevel={universityCoursesByLevel} onStudyStart={setSelectedMaterialForStudy} />
                            </Collapsible>
                        )}

                        {groupedFaculties.map(faculty => (
                            <Collapsible key={faculty.id} title={<span className="font-black">{faculty.name}</span>}>
                                <div className="pl-4 space-y-1">
                                    {Object.keys(faculty.facultyCoursesByLevel).length > 0 && (
                                        <Collapsible title={<span className="text-base font-bold text-gray-500">General Faculty</span>}>
                                            <CourseLevelGroup coursesByLevel={faculty.facultyCoursesByLevel} onStudyStart={setSelectedMaterialForStudy} />
                                        </Collapsible>
                                    )}
                                    {faculty.departments.map(dept => (
                                        <Collapsible key={dept.id} title={<span className="text-base font-bold text-gray-500">{dept.name}</span>}>
                                            <CourseLevelGroup coursesByLevel={dept.coursesByLevel} onStudyStart={setSelectedMaterialForStudy} />
                                        </Collapsible>
                                    ))}
                                </div>
                            </Collapsible>
                        ))}
                    </div>
                )}
            </Card>
            
            <StudyPlanner allCourses={allCoursesForPlanner} />
            <CourseCompanion allCourses={allCoursesForPlanner} />
            
            {selectedMaterialForStudy && (
                <FocusStudyModal 
                    material={selectedMaterialForStudy} 
                    onClose={() => setSelectedMaterialForStudy(null)} 
                />
            )}
        </div>
    );
};

export default Academics;