import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Faculty, Department, Course, CourseMaterial, CourseBorrower } from '../types';
import Card from '../components/ui/Card';
import { BookOpenIcon, ChevronDownIcon, ExternalLinkIcon } from '../components/ui/Icons';

const StudyPlanner = lazy(() => import('../components/academics/StudyPlanner'));
const CourseCompanion = lazy(() => import('../components/academics/CourseCompanion'));

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
const CourseLevelGroup: React.FC<{ coursesByLevel: Record<number, (Course & { materials: CourseMaterial[], isBorrowed?: boolean })[]> }> = ({ coursesByLevel }) => (
    <div className="pl-4">
        {Object.entries(coursesByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, coursesInLevel]) => (
            <Collapsible key={level} title={<span className="text-base font-medium">{level} Level</span>}>
                <div className="pl-4 space-y-4">
                    {(coursesInLevel as (Course & { materials: CourseMaterial[], isBorrowed?: boolean })[]).map(course => (
                        <div key={course.id} className="pt-2">
                            <h4 className="font-semibold">{course.code} - {course.name} {course.isBorrowed && <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">Borrowed</span>}</h4>
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
                                {course.materials.length === 0 && <li className="text-xs text-gray-500 italic">No materials uploaded yet.</li>}
                            </ul>
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
    const [courseBorrowers, setCourseBorrowers] = useState<CourseBorrower[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!supabase) return;
            setLoading(true);
            try {
                const [facultyRes, departmentRes, courseRes, materialRes, borrowerRes] = await Promise.all([
                    supabase.from('faculties').select('*').order('name'),
                    supabase.from('departments').select('*').order('name'),
                    supabase.from('courses').select('*').order('level, code'),
                    supabase.from('course_materials').select('*').order('title'),
                    supabase.from('course_borrowers').select('*')
                ]);

                if (facultyRes.error) throw facultyRes.error;
                if (departmentRes.error) throw departmentRes.error;
                if (courseRes.error) throw courseRes.error;
                if (materialRes.error) throw materialRes.error;
                if (borrowerRes.error) throw borrowerRes.error;

                setFaculties(facultyRes.data || []);
                setDepartments(departmentRes.data || []);
                setCourses(courseRes.data || []);
                setMaterials(materialRes.data || []);
                setCourseBorrowers(borrowerRes.data || []);
            } catch (error: any) {
                console.error("Error fetching academic data:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const { universityCoursesByLevel, groupedFaculties, allCoursesForPlanner } = useMemo(() => {
        const coursesWithMaterials = courses.map(course => ({
            ...course,
            materials: materials.filter(m => m.course_id === course.id)
        }));
        
        const allCoursesForPlanner = courses.map(course => ({
            id: course.id,
            name: course.name,
            code: course.code,
            materials: materials
                .filter(m => m.course_id === course.id)
                .map(m => ({ title: m.title, type: m.type }))
        }));

        const uniCourses = coursesWithMaterials.filter(c => c.is_general && !c.faculty_id && !c.department_id);
        const uniCoursesByLevel = uniCourses.reduce((acc, course) => {
            const level = course.level;
            if (!acc[level]) acc[level] = [];
            acc[level].push(course);
            return acc;
        }, {} as Record<number, (Course & { materials: CourseMaterial[] })[]>);
        
        const facs = faculties.map(faculty => {
            const facGeneralCourses = coursesWithMaterials.filter(c => c.faculty_id === faculty.id && !c.department_id);
            const facCoursesByLevel = facGeneralCourses.reduce((acc, course) => {
                const level = course.level;
                if (!acc[level]) acc[level] = [];
                acc[level].push(course);
                return acc;
            }, {} as Record<number, (Course & { materials: CourseMaterial[] })[]>);

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
                }, {} as Record<number, (Course & { materials: CourseMaterial[], isBorrowed: boolean })[]>);

                return { ...dept, coursesByLevel: deptCoursesByLevel };
            });
            return { ...faculty, facultyCoursesByLevel: facCoursesByLevel, departments: depts };
        });

        return { universityCoursesByLevel: uniCoursesByLevel, groupedFaculties: facs, allCoursesForPlanner };

    }, [faculties, departments, courses, materials, courseBorrowers]);


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
                               <CourseLevelGroup coursesByLevel={universityCoursesByLevel} />
                            </Collapsible>
                        )}

                        {groupedFaculties.map(faculty => (
                            <Collapsible key={faculty.id} title={faculty.name}>
                                <div className="pl-4 space-y-2">
                                    {Object.keys(faculty.facultyCoursesByLevel).length > 0 && (
                                        <Collapsible title={<span className="text-base">Faculty-Wide Courses</span>}>
                                            <CourseLevelGroup coursesByLevel={faculty.facultyCoursesByLevel} />
                                        </Collapsible>
                                    )}
                                    {faculty.departments.map(dept => (
                                        <Collapsible key={dept.id} title={<span className="text-base">{dept.name}</span>}>
                                            <CourseLevelGroup coursesByLevel={dept.coursesByLevel} />
                                        </Collapsible>
                                    ))}
                                </div>
                            </Collapsible>
                        ))}
                    </>
                )}
            </Card>
            
            <Suspense fallback={null}>
                <StudyPlanner allCourses={allCoursesForPlanner} />
                <CourseCompanion allCourses={allCoursesForPlanner} />
            </Suspense>
        </div>
    );
};

export default Academics;