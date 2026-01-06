import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Faculty, Department, Course, CourseMaterial, CourseBorrower, UserCourseMaterial } from '../types';
import Card from '../components/ui/Card';
import { BookOpenIcon, ChevronDownIcon, ExternalLinkIcon, SparklesIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';
import Button from '../components/ui/Button';
import StudyPlanner from '../components/academics/StudyPlanner';
import CourseCompanion from '../components/academics/CourseCompanion';
import MaterialQuizModal from '../components/academics/MaterialQuizModal';

// Reusable Collapsible Component for nesting sections
interface CollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b dark:border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 px-2 text-left font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {title}
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-4 px-2 animate-fade-in-up" style={{animationDuration: '300ms'}}>
          {children}
        </div>
      )}
    </div>
  );
};

// Component to render a list of courses, grouped by level
const CourseLevelGroup: React.FC<{ 
    coursesByLevel: Record<number, (Course & { materials: CourseMaterial[], userMaterials: UserCourseMaterial[], isBorrowed?: boolean })[]>,
    onQuizStart: (material: UserCourseMaterial) => void 
}> = ({ coursesByLevel, onQuizStart }) => (
    <div className="pl-4">
        {Object.entries(coursesByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, coursesInLevel]) => (
            <Collapsible key={level} title={<span className="text-base font-medium">{level} Level</span>}>
                <div className="pl-4 space-y-4">
                    {(coursesInLevel as (Course & { materials: CourseMaterial[], userMaterials: UserCourseMaterial[], isBorrowed?: boolean })[]).map(course => (
                        <div key={course.id} className="pt-2">
                            <h4 className="font-semibold">{course.code} - {course.name} {course.isBorrowed && <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">Borrowed</span>}</h4>
                            
                            {course.materials.length > 0 && (
                                <>
                                    <h5 className="text-sm font-semibold mt-2 text-gray-600 dark:text-gray-400">Official Materials</h5>
                                    <ul className="pl-4 mt-2 space-y-2">
                                        {course.materials.map(mat => (
                                            <li key={mat.id}>
                                                <a href={mat.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-600 hover:underline">
                                                    <ExternalLinkIcon className="w-4 h-4" />
                                                    <span>{mat.title} ({mat.type.replace(/_/g, ' ')})</span>
                                                </a>
                                                {mat.description && <p className="text-xs text-gray-500 pl-6">{mat.description}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {course.userMaterials.length > 0 && (
                                <>
                                    <h5 className="text-sm font-semibold mt-3 text-gray-600 dark:text-gray-400">Community Materials</h5>
                                    <ul className="pl-4 mt-2 space-y-2">
                                        {course.userMaterials.map(um => (
                                            <li key={um.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                                <div>
                                                    <a href={um.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline font-medium">
                                                        <ExternalLinkIcon className="w-4 h-4" />
                                                        <span>{um.title}</span>
                                                    </a>
                                                    <p className="text-xs text-gray-500">
                                                        By {um.profiles?.full_name || 'Member'}
                                                    </p>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => onQuizStart(um)} className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
                                                    <SparklesIcon className="w-3 h-3 mr-1" /> Quiz Me
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {course.materials.length === 0 && course.userMaterials.length === 0 && (
                                <p className="text-xs text-gray-500 italic pl-4 mt-2">No materials uploaded yet.</p>
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
    
    // Quiz State
    const [selectedMaterialForQuiz, setSelectedMaterialForQuiz] = useState<UserCourseMaterial | null>(null);

    const fetchAllData = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [facultyRes, departmentRes, courseRes, materialRes, userMaterialRes, borrowerRes] = await Promise.all([
                supabase.from('faculties').select('*').order('name'),
                supabase.from('departments').select('*').order('name'),
                supabase.from('courses').select('*').order('level, code'),
                supabase.from('course_materials').select('*').order('title'),
                // Filter user materials to only approved ones for public view
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


    if (loading) {
        return <div className="text-center p-8">Loading academic resources...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Academics Roadmap</h1>

            <Card>
                {Object.keys(universityCoursesByLevel).length === 0 && groupedFaculties.length === 0 ? (
                    <div className="text-center py-10">
                        <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold mt-4">No Resources Available</h3>
                        <p className="text-gray-500 mt-2">Academic materials have not been uploaded yet. Please check back later.</p>
                    </div>
                ) : (
                    <>
                        {Object.keys(universityCoursesByLevel).length > 0 && (
                            <Collapsible title="University General Courses" defaultOpen>
                               <CourseLevelGroup coursesByLevel={universityCoursesByLevel} onQuizStart={setSelectedMaterialForQuiz} />
                            </Collapsible>
                        )}

                        {groupedFaculties.map(faculty => (
                            <Collapsible key={faculty.id} title={faculty.name}>
                                <div className="pl-4 space-y-2">
                                    {Object.keys(faculty.facultyCoursesByLevel).length > 0 && (
                                        <Collapsible title={<span className="text-base">Faculty-Wide Courses</span>}>
                                            <CourseLevelGroup coursesByLevel={faculty.facultyCoursesByLevel} onQuizStart={setSelectedMaterialForQuiz} />
                                        </Collapsible>
                                    )}
                                    {faculty.departments.map(dept => (
                                        <Collapsible key={dept.id} title={<span className="text-base">{dept.name}</span>}>
                                            <CourseLevelGroup coursesByLevel={dept.coursesByLevel} onQuizStart={setSelectedMaterialForQuiz} />
                                        </Collapsible>
                                    ))}
                                </div>
                            </Collapsible>
                        ))}
                    </>
                )}
            </Card>
            
            <StudyPlanner allCourses={allCoursesForPlanner} />
            <CourseCompanion allCourses={allCoursesForPlanner} />
            
            {selectedMaterialForQuiz && (
                <MaterialQuizModal 
                    material={selectedMaterialForQuiz} 
                    onClose={() => setSelectedMaterialForQuiz(null)} 
                />
            )}
        </div>
    );
};

export default Academics;