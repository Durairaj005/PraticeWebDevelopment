import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { FaEdit, FaSearch, FaFilter, FaSave, FaTimes, FaCheckCircle, FaExclamationCircle, FaPlus, FaTrash } from 'react-icons/fa';
import { formatMark } from '../../utils/formatMarks';
import { getGradeFromMarks, getGradeDescription, getGradeColor } from '../../utils/gradeConverter';

export default function MarksEditDashboard() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingMark, setEditingMark] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCA1, setNewSubjectCA1] = useState('');
  const [newSubjectCA2, setNewSubjectCA2] = useState('');
  const [newSubjectCA3, setNewSubjectCA3] = useState('');
  const [newSubjectSemester, setNewSubjectSemester] = useState('');
  const [deletedSubjectName, setDeletedSubjectName] = useState(null);

  // Fetch batches on mount
  useEffect(() => {
    fetchBatches();
  }, []);

  // Fetch students when batch changes (only if batch is selected)
  useEffect(() => {
    if (selectedBatch) {
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudent(null);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/admin/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.batches && data.batches.length > 0) {
        setBatches(data.batches);
        // Do NOT set a default batch - admin must select one
        setSelectedBatch('');
      }
    } catch (err) {
      setError('Failed to fetch batches');
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/all-students?batch_year=${selectedBatch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStudents(data.students || []);
      setSelectedStudent(null);
      setMarks([]);
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarks = async (studentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/students/${studentId}/marks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMarks(data.marks || []);
    } catch (err) {
      setError('Failed to fetch marks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    fetchMarks(student.student_id);
    setEditingMark(null);
    setSaveSuccess(false);
  };

  const handleEditMark = (mark) => {
    setEditingMark({ ...mark });
    setError(null);
  };

  const validateMarks = () => {
    const validateValue = (value) => {
      if (value === null || value === '') return true;
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0 && num <= 100;
    };

    if (!validateValue(editingMark.ca1)) return 'CA1 must be 0-100';
    if (!validateValue(editingMark.ca2)) return 'CA2 must be 0-100';
    if (!validateValue(editingMark.ca3)) return 'CA3 must be 0-100';
    if (!validateValue(editingMark.semester_marks)) return 'Semester marks must be 0-100';
    return null;
  };

  const handleSaveMark = async () => {
    if (!editingMark) return;

    const validationError = validateMarks();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/marks/${editingMark.mark_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ca1: editingMark.ca1 ? parseFloat(editingMark.ca1) : null,
          ca2: editingMark.ca2 ? parseFloat(editingMark.ca2) : null,
          ca3: editingMark.ca3 ? parseFloat(editingMark.ca3) : null,
          semester: editingMark.semester_marks ? parseFloat(editingMark.semester_marks) : null,
          sem_grade: editingMark.sem_grade || null,
          sem_published: editingMark.sem_published || false
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setEditingMark(null);
        fetchMarks(selectedStudent.student_id);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save mark');
      }
    } catch (err) {
      setError('Failed to save mark: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewSubject = async () => {
    // Validate inputs
    if (!newSubjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get batch ID from selected batch
      const batch = batches.find(b => b.batch_year === parseInt(selectedBatch));
      if (!batch) {
        setError('Invalid batch selected');
        return;
      }

      // First, create the subject if it doesn't exist
      const subjectRes = await fetch(`http://localhost:8000/api/v1/admin/batch-subjects/create-subject?subject_name=${newSubjectName}&subject_code=${newSubjectName.substring(0, 3).toUpperCase()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!subjectRes.ok) {
        throw new Error('Failed to create subject');
      }

      const subjectData = await subjectRes.json();
      const newSubjectId = subjectData.id || subjectData.subject_id;

      // Add subject to batch
      const addRes = await fetch(`http://localhost:8000/api/v1/admin/batch-subjects/add-subject?batch_id=${batch.id}&subject_id=${newSubjectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!addRes.ok) {
        throw new Error('Failed to add subject to batch');
      }

      // Add marks for all students in the batch
      const markPromises = students.map(student =>
        fetch(`http://localhost:8000/api/v1/admin/marks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            student_id: student.student_id,
            subject_id: newSubjectId,
            ca1: newSubjectCA1 ? parseFloat(newSubjectCA1) : null,
            ca2: newSubjectCA2 ? parseFloat(newSubjectCA2) : null,
            ca3: newSubjectCA3 ? parseFloat(newSubjectCA3) : null,
            semester: newSubjectSemester ? parseFloat(newSubjectSemester) : null
          })
        })
      );

      await Promise.all(markPromises);

      setSaveSuccess(true);
      setShowAddSubjectModal(false);
      setNewSubjectName('');
      setNewSubjectCA1('');
      setNewSubjectCA2('');
      setNewSubjectCA3('');
      setNewSubjectSemester('');

      // Refresh current student marks if one is selected
      if (selectedStudent) {
        fetchMarks(selectedStudent.student_id);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to add subject: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (markId, subjectId) => {
    // Get the subject name before deletion
    const subjectToDelete = marks.find(m => m.subject_id === subjectId);
    const subjectNameForNotification = subjectToDelete?.subject_name || 'Subject';

    if (!window.confirm(`Delete "${subjectNameForNotification}" from all ${students.length} students in this batch?`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get all students in the current batch
      if (!students || students.length === 0) {
        setError('No students found in this batch');
        return;
      }

      // Delete marks for this subject from ALL students in the batch
      const deletePromises = students.map(async (student) => {
        try {
          // Fetch this student's marks
          const studentMarksRes = await fetch(
            `http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (!studentMarksRes.ok) {
            console.error(`Failed to fetch marks for student ${student.student_id}`);
            return;
          }

          const studentMarksData = await studentMarksRes.json();
          const markToDelete = studentMarksData.marks.find(m => m.subject_id === subjectId);
          
          if (markToDelete) {
            // Delete this specific mark
            const deleteRes = await fetch(
              `http://localhost:8000/api/v1/admin/marks/${markToDelete.mark_id}`,
              {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );

            if (!deleteRes.ok) {
              console.error(`Failed to delete mark ${markToDelete.mark_id} for student ${student.student_id}`);
            }
          }
        } catch (err) {
          console.error(`Error deleting subject for student ${student.student_id}:`, err);
        }
      });

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      // Refresh current student marks if one is selected
      if (selectedStudent) {
        await fetchMarks(selectedStudent.student_id);
      }

      // Show success notification with subject name
      setDeletedSubjectName(subjectNameForNotification);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setDeletedSubjectName(null);
      }, 4000);
    } catch (err) {
      setError('Failed to delete subject: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.register_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Admin', role: 'Administrator' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={true} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">📊 Marks Edit Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-400">Edit student marks by batch → semester → student workflow</p>
          </div>

          {/* Batch Filter and Add Subject Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6"
          >
            <div className="flex justify-between items-end gap-4 flex-col sm:flex-row">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <FaFilter className="text-indigo-400" /> Select Batch Year
                </label>
                <select 
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-white/40 transition"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">Select a batch...</option>
                  {batches.map(batch => (
                    <option key={batch.batch_year} value={batch.batch_year}>
                      📚 Batch {batch.batch_year} • {batch.total_students} students
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedBatch && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddSubjectModal(true)}
                  className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition shadow-lg"
                >
                  <FaPlus /> Add Subject
                </motion.button>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Students List Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6 h-fit lg:sticky lg:top-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaSearch className="text-indigo-400" /> Find Student
              </h2>
              
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 mb-4 bg-gray-800 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <p className="text-center text-gray-400 py-4">Loading students...</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No students found</p>
                ) : (
                  filteredStudents.map(student => (
                    <motion.button
                      key={student.student_id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedStudent?.student_id === student.student_id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-white/10 hover:bg-white/20 text-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">{student.register_no}</div>
                      <div className="text-xs opacity-75 truncate">{student.name}</div>
                      <div className="text-xs opacity-50">📖 {student.total_subjects} subjects</div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>

            {/* Marks Edit Panel */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6"
            >
              {selectedStudent ? (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaEdit className="text-indigo-400" /> Edit Marks
                  </h2>
                  
                  <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <p className="text-white font-semibold">{selectedStudent.register_no}</p>
                    <p className="text-gray-300 text-sm">{selectedStudent.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-gray-400 text-xs">Batch {selectedStudent.batch_year}</p>
                      <motion.div 
                        key={marks.length}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className="text-xs px-3 py-1 bg-indigo-600/50 rounded-full text-indigo-200"
                      >
                        📚 {marks.length} subject{marks.length !== 1 ? 's' : ''}
                      </motion.div>
                    </div>
                  </div>

                  {saveSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2"
                    >
                      <FaCheckCircle /> 
                      {deletedSubjectName 
                        ? `"${deletedSubjectName}" deleted from all students!` 
                        : 'Mark updated successfully!'}
                    </motion.div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2"
                    >
                      <FaExclamationCircle /> {error}
                    </motion.div>
                  )}

                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {marks.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">No marks found for this student</p>
                    ) : editingMark ? (
                      // Edit Mode
                      <motion.div 
                        key={editingMark.mark_id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-indigo-600/20 border-2 border-indigo-500/50 rounded-lg p-5 space-y-4"
                      >
                        {/* Subject Name Field */}
                        <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                          <label className="block text-xs font-medium text-gray-300 mb-2">Subject Name</label>
                          <input
                            type="text"
                            value={editingMark.subject_name || ''}
                            onChange={(e) => setEditingMark({...editingMark, subject_name: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Marks Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2">CA1 (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editingMark.ca1 || ''}
                              onChange={(e) => setEditingMark({...editingMark, ca1: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2">CA2 (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editingMark.ca2 || ''}
                              onChange={(e) => setEditingMark({...editingMark, ca2: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2">CA3 (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editingMark.ca3 || ''}
                              onChange={(e) => setEditingMark({...editingMark, ca3: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2">Semester (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editingMark.semester_marks || ''}
                              onChange={(e) => {
                                const semMarks = e.target.value;
                                const autoGrade = semMarks ? getGradeFromMarks(semMarks) : '';
                                setEditingMark({
                                  ...editingMark, 
                                  semester_marks: semMarks,
                                  sem_grade: autoGrade,
                                  sem_published: !!autoGrade
                                });
                              }}
                              className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Grade Display */}
                        {editingMark.semester_marks && (
                          <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Auto-Calculated Grade</p>
                                <p className={`text-lg font-bold ${getGradeColor(editingMark.sem_grade)}`}>
                                  {editingMark.sem_grade}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {getGradeDescription(editingMark.sem_grade)}
                                </p>
                              </div>
                              <div className="text-right">
                                {editingMark.sem_published ? (
                                  <div className="flex items-center gap-2">
                                    <FaCheckCircle className="text-green-500" />
                                    <span className="text-sm text-green-400 font-semibold">Published</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <FaTimes className="text-gray-500" />
                                    <span className="text-sm text-gray-400">Not Published</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSaveMark}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <FaSave /> Save Changes
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditingMark(null)}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <FaTimes /> Cancel
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      // View Mode - Table Layout with Subject Name Column
                      <div className="space-y-2">
                        {marks.length > 0 ? (
                          marks.map(mark => (
                            <motion.div
                              key={mark.mark_id}
                              initial={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ duration: 0.3 }}
                              className="bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/15 transition"
                            >
                              <div className="grid grid-cols-5 gap-2 items-center text-sm">
                                {/* Subject Name - Editable */}
                                <div className="col-span-1 bg-gray-800/50 rounded p-2 relative group">
                                  <p className="text-white font-semibold truncate">{mark.subject_name}</p>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setEditingMark({...mark, editing: 'subject'});
                                      setError(null);
                                    }}
                                    className="absolute -top-2 -right-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition"
                                  >
                                    ✏️
                                  </motion.button>
                                </div>

                                {/* CA Marks */}
                                <div className="col-span-1 bg-gray-800/50 rounded p-2">
                                  <span className="text-gray-400 text-xs block">CA</span>
                                  <p className="text-white font-bold">{mark.ca1 !== null ? formatMark(mark.ca1) : '-'}/{mark.ca2 !== null ? formatMark(mark.ca2) : '-'}/{mark.ca3 !== null ? formatMark(mark.ca3) : '-'}</p>
                                </div>

                                {/* Semester Marks */}
                                <div className="col-span-1 bg-gray-800/50 rounded p-2">
                                  <span className="text-gray-400 text-xs block">Sem</span>
                                  <p className="text-white font-bold">{mark.semester_marks !== null ? mark.semester_marks : '-'}</p>
                                </div>

                                {/* Grade */}
                                <div className="col-span-1 bg-gray-800/50 rounded p-2">
                                  <span className="text-gray-400 text-xs block">Grade</span>
                                  <p className={`font-bold ${getGradeColor(mark.sem_grade || '')}`}>{mark.sem_grade || '-'}</p>
                                </div>

                                {/* Edit & Delete Buttons */}
                                <div className="col-span-1 flex justify-center gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      handleEditMark(mark);
                                      setError(null);
                                    }}
                                    className="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium flex items-center gap-1 transition"
                                  >
                                    <FaEdit /> Edit
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteSubject(mark.mark_id, mark.subject_id)}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1 transition"
                                  >
                                    <FaTrash /> Delete
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-center text-gray-400 py-8">No marks found for this student</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                  <FaSearch className="text-4xl mb-4 opacity-50" />
                  <p className="text-lg">Select a student to edit marks</p>
                  <p className="text-sm mt-2 opacity-75">Use search to find students quickly</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Add Subject Modal */}
          {showAddSubjectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddSubjectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10 shadow-2xl shadow-indigo-500/20 max-w-md w-full p-6 space-y-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaPlus className="text-green-500" /> Add New Subject
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddSubjectModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <FaTimes className="text-gray-400 text-lg" />
                  </motion.button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2 text-sm"
                  >
                    <FaExclamationCircle /> {error}
                  </motion.div>
                )}

                {/* Form */}
                <div className="space-y-4">
                  {/* Subject Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      📚 Subject Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    />
                  </div>

                  {/* CA Marks */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">CA1 (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={newSubjectCA1}
                        onChange={(e) => setNewSubjectCA1(e.target.value)}
                        placeholder="0-100"
                        className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">CA2 (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={newSubjectCA2}
                        onChange={(e) => setNewSubjectCA2(e.target.value)}
                        placeholder="0-100"
                        className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">CA3 (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={newSubjectCA3}
                        onChange={(e) => setNewSubjectCA3(e.target.value)}
                        placeholder="0-100"
                        className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      />
                    </div>
                  </div>

                  {/* Semester Marks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      📖 Semester Marks (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={newSubjectSemester}
                      onChange={(e) => setNewSubjectSemester(e.target.value)}
                      placeholder="0-100"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    />
                  </div>

                  {/* Info Text */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300 leading-relaxed">
                      ℹ️ <strong>Note:</strong> This subject will be automatically added to all {students.length} students in Batch {selectedBatch}. You can enter marks manually for each student later.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddNewSubject}
                    disabled={loading || !newSubjectName.trim()}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <FaPlus /> {loading ? 'Adding...' : 'Add Subject'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowAddSubjectModal(false);
                      setNewSubjectName('');
                      setNewSubjectCA1('');
                      setNewSubjectCA2('');
                      setNewSubjectCA3('');
                      setNewSubjectSemester('');
                      setError(null);
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <FaTimes /> Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
