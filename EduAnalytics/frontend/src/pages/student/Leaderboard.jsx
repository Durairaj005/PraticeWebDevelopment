import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StudentCard from '../../components/cards/StudentCard';
import { FaTrophy, FaMedal } from 'react-icons/fa';

export default function Leaderboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topStudents, setTopStudents] = useState([]);
  const [semesterTopStudents, setSemesterTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentBatch, setStudentBatch] = useState(null);
  const [semesterPublished, setSemesterPublished] = useState(false);

  useEffect(() => {
    const fetchTopStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No token found');
          setLoading(false);
          return;
        }

        // First, get the current student's information to determine their batch
        console.log('Fetching current student batch info...');
        const studentRes = await fetch(
          `http://localhost:8000/api/v1/student/dashboard`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!studentRes.ok) {
          console.error('Failed to fetch student info - status:', studentRes.status);
          setLoading(false);
          return;
        }

        const studentData = await studentRes.json();
        const studentBatchYear = studentData.batch_year;
        console.log('Current student batch:', studentBatchYear);
        setStudentBatch(studentBatchYear);
        
        // Check if semester is published
        setSemesterPublished(studentData.sem_published || false);

        // Now fetch all students from the same batch
        console.log('Fetching leaderboard for batch:', studentBatchYear);
        
        const response = await fetch(
          `http://localhost:8000/api/v1/admin/all-students?batch_year=${studentBatchYear}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) {
          console.error('Failed to fetch students - status:', response.status);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Students fetched from batch', studentBatchYear + ':', data.total);
        
        if (!data.students || data.students.length === 0) {
          console.log('No students found for batch', studentBatchYear);
          setTopStudents([]);
          setLoading(false);
          return;
        }
        
        // Fetch marks and dashboard for each student to get real averages and ranks
        const studentsWithData = await Promise.all(
          (data.students || []).map(async (student) => {
            try {
              const marksRes = await fetch(
                `http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              
              if (marksRes.ok) {
                const marksData = await marksRes.json();
                console.log(`Marks for ${student.name}:`, marksData.marks?.length || 0, 'subjects');
                
                if (marksData.marks && marksData.marks.length > 0) {
                  const marks = marksData.marks;
                  
                  // Calculate CA averages per subject
                  let totalCAAvg = 0;
                  let caSubjectCount = 0;
                  
                  // Calculate Semester averages per subject
                  let totalSemesterAvg = 0;
                  let semesterSubjectCount = 0;
                  
                  marks.forEach(mark => {
                    // CA calculation
                    const ca_values = [mark.ca1, mark.ca2, mark.ca3].filter(v => v != null);
                    if (ca_values.length > 0) {
                      const subjectCAAvg = ca_values.reduce((a, b) => a + b) / ca_values.length;
                      totalCAAvg += subjectCAAvg;
                      caSubjectCount++;
                    }
                    
                    // Semester calculation - only count non-zero semester marks
                    if (mark.semester_marks != null && mark.semester_marks > 0) {
                      totalSemesterAvg += mark.semester_marks;
                      semesterSubjectCount++;
                    }
                  });
                  
                  if (caSubjectCount > 0) {
                    // Calculate CA average across all subjects
                    const caAverage = totalCAAvg / caSubjectCount;
                    
                    // Calculate Semester average if available
                    const semesterAverage = semesterSubjectCount > 0 ? totalSemesterAvg / semesterSubjectCount : 0;
                    
                    console.log(`${student.name}: CA Average=${caAverage.toFixed(2)}, Semester=${semesterAverage.toFixed(2)}`);
                    
                    return {
                      ...student,
                      name: student.name,
                      registerNo: student.register_no,
                      caAverage: Math.round(caAverage * 100) / 100,
                      semesterAverage: Math.round(semesterAverage * 100) / 100,
                      hasSemesterMarks: semesterSubjectCount > 0
                    };
                  }
                }
              }
              
              return {
                ...student,
                name: student.name,
                registerNo: student.register_no,
                caAverage: 0,
                semesterAverage: 0,
                hasSemesterMarks: false
              };
            } catch (err) {
              console.error(`Error fetching marks for student ${student.student_id}:`, err);
              return {
                ...student,
                name: student.name,
                registerNo: student.register_no,
                caAverage: 0,
                semesterAverage: 0,
                hasSemesterMarks: false
              };
            }
          })
        );
        
        console.log('Students with data:', studentsWithData.length);
        
        // Sort by CA average (descending) and take top 10
        const sortedCA = studentsWithData
          .sort((a, b) => b.caAverage - a.caAverage)
          .slice(0, 10);
        
        // Sort by Semester average (descending) and take top 10
        const sortedSemester = studentsWithData
          .filter(s => s.hasSemesterMarks)
          .sort((a, b) => b.semesterAverage - a.semesterAverage)
          .slice(0, 10);
        
        console.log('Top CA students from batch', studentBatchYear + ':', sortedCA.length);
        console.log('Top Semester students from batch', studentBatchYear + ':', sortedSemester.length);
        
        setTopStudents(sortedCA);
        setSemesterTopStudents(sortedSemester);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setTopStudents([]);
        setSemesterTopStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopStudents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Mark Johnson', role: 'Student' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={false} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6">
          {/* CA Leaderboard - Always Visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <FaTrophy className="text-3xl sm:text-4xl text-yellow-400" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">CA Leaderboard</h1>
                <p className="text-sm sm:text-base text-gray-400">
                  {studentBatch ? `Top performers in Batch ${studentBatch}` : 'Top performers'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading leaderboard...</p>
                </div>
              ) : topStudents.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 p-8">
                  <p className="text-gray-400">No student data available yet</p>
                </div>
              ) : (
                topStudents.map((student, index) => (
                  <StudentCard 
                    key={student.registerNo}
                    student={student}
                    rank={index + 1}
                    type="ca"
                  />
                ))
              )}
            </div>
          </motion.div>

          {/* Semester Leaderboard - Conditional */}
          {semesterPublished ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-6 flex items-center gap-3">
                <FaMedal className="text-3xl sm:text-4xl text-blue-400" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Semester Leaderboard</h1>
                  <p className="text-sm sm:text-base text-gray-400">
                    {studentBatch ? `Top semester performers in Batch ${studentBatch}` : 'Top semester performers'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {semesterTopStudents.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 p-8">
                    <p className="text-gray-400">No semester data available for this batch yet</p>
                  </div>
                ) : (
                  semesterTopStudents.map((student, index) => (
                    <StudentCard 
                      key={student.registerNo}
                      student={student}
                      rank={index + 1}
                      type="semester"
                    />
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-500/10 backdrop-blur-sm rounded-xl border-2 border-blue-500/30 p-8 mt-8"
            >
              <div className="text-center">
                <FaMedal className="text-6xl text-blue-400 mb-4 mx-auto opacity-70" />
                <h3 className="text-2xl font-bold text-blue-300 mb-2">📊 Semester Leaderboard Coming Soon</h3>
                <p className="text-blue-200 mb-2">Semester examination results haven't been published yet.</p>
                <p className="text-blue-300 text-sm">Once semester results are published, you'll see:</p>
                <ul className="text-blue-200 text-sm mt-3 space-y-1">
                  <li>✓ Top performing students based on semester marks</li>
                  <li>✓ Semester rankings by batch</li>
                  <li>✓ Comparison with CA performance</li>
                </ul>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
