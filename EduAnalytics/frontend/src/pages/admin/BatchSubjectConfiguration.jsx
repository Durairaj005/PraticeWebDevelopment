import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { FaPlus, FaTrash, FaEdit, FaCheckCircle } from 'react-icons/fa';

export default function BatchSubjectConfiguration() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [selectedSubjectToAdd, setSelectedSubjectToAdd] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchBatchesAndSubjects();
  }, []);

  const fetchBatchesAndSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      console.log('Token found:', !!token);

      if (!token) {
        setError('No authentication token found. Please login first.');
        setLoading(false);
        return;
      }

      console.log('Fetching batches...');
      const batchRes = await fetch('http://localhost:8000/api/v1/admin/batch-subjects/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Batch response status:', batchRes.status);

      const subjectRes = await fetch('http://localhost:8000/api/v1/admin/batch-subjects/subjects/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Subject response status:', subjectRes.status);

      if (batchRes.ok && subjectRes.ok) {
        const batchData = await batchRes.json();
        const subjectData = await subjectRes.json();
        
        console.log('Batches:', batchData);
        console.log('Subjects:', subjectData);
        
        setBatches(batchData);
        setAllSubjects(subjectData);
        
        if (batchData.length === 0) {
          setError('No batches found in the system. Please create batches first.');
        } else {
          setSelectedBatch(batchData[0]);
          if (batchData[0].semesters && batchData[0].semesters.length > 0) {
            setSelectedSemester(batchData[0].semesters[0]);
          }
        }
      } else {
        let errorMsg = 'Failed to load data';
        try {
          const errorData = await batchRes.json();
          console.log('Error response:', errorData);
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          errorMsg = `Server error: ${batchRes.status} ${batchRes.statusText}`;
        }
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubjectToAdd || !selectedBatch || !selectedSemester) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/batch-subjects/add-subject?batch_id=${selectedBatch.id}&semester_id=${selectedSemester.id}&subject_id=${selectedSubjectToAdd}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowAddModal(false);
        setSelectedSubjectToAdd(null);
        fetchBatchesAndSubjects();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add subject');
      }
    } catch (err) {
      console.error('Error adding subject:', err);
      setError('Error adding subject');
    }
  };

  const handleRemoveSubject = async (batchSubjectId) => {
    if (!window.confirm('Are you sure you want to remove this subject?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/batch-subjects/remove-subject/${batchSubjectId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchBatchesAndSubjects();
      } else {
        setError('Failed to remove subject');
      }
    } catch (err) {
      console.error('Error removing subject:', err);
      setError('Error removing subject');
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName || !newSubjectCode) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/batch-subjects/create-subject?subject_name=${newSubjectName}&subject_code=${newSubjectCode}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Subject "${data.name}" created successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowCreateSubjectModal(false);
        setNewSubjectName('');
        setNewSubjectCode('');
        fetchBatchesAndSubjects();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create subject');
      }
    } catch (err) {
      console.error('Error creating subject:', err);
      setError('Error creating subject');
    }
  };

  const handleEditSubject = async () => {
    if (!newSubjectName || !newSubjectCode) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/batch-subjects/update-subject/${editSubjectId}?subject_name=${newSubjectName}&subject_code=${newSubjectCode}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Subject "${data.name}" updated successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowEditSubjectModal(false);
        setNewSubjectName('');
        setNewSubjectCode('');
        setEditSubjectId(null);
        fetchBatchesAndSubjects();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update subject');
      }
    } catch (err) {
      console.error('Error updating subject:', err);
      setError('Error updating subject');
    }
  };

  const getAvailableSubjectsForBatchSemester = () => {
    if (!selectedSemester) return [];
    const assignedIds = selectedSemester.subjects.map(s => s.id);
    return allSubjects.filter(s => !assignedIds.includes(s.id));
  };

  const openEditModal = (subject) => {
    setEditSubjectId(subject.id);
    setNewSubjectName(subject.name);
    setNewSubjectCode(subject.code);
    setShowEditSubjectModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Admin', role: 'Administrator' }} onMenuToggle={setMobileMenuOpen} />

      <div className="flex">
        <Sidebar isAdmin={true} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">⚙️ Batch-Semester Subject Configuration</h1>
            <p className="text-gray-400">Manage subjects for each batch and semester. Add/Edit/Delete subjects to match your curriculum.</p>
          </motion.div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3"
            >
              <FaCheckCircle className="text-green-400 text-xl" />
              <p className="text-green-300">{successMessage}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Batch List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-fit">
                  <h2 className="text-xl font-bold text-white mb-4">Batches</h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {batches.map(batch => (
                      <motion.button
                        key={batch.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedBatch(batch);
                          if (batch.semesters.length > 0) {
                            setSelectedSemester(batch.semesters[0]);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          selectedBatch?.id === batch.id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                        }`}
                      >
                        <p className="font-semibold">Batch {batch.batch_year}</p>
                        <p className="text-sm opacity-75">{batch.semesters.length} semesters</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Semester List */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                {selectedBatch ? (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-fit">
                    <h2 className="text-xl font-bold text-white mb-4">Semesters</h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedBatch.semesters.map(sem => (
                        <motion.button
                          key={sem.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedSemester(sem)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                            selectedSemester?.id === sem.id
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                          }`}
                        >
                          <p className="font-semibold">Semester {sem.semester_number}</p>
                          <p className="text-sm opacity-75">{sem.academic_year}</p>
                          <p className="text-xs opacity-60">{sem.subjects.length} subjects</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                    <p className="text-gray-400 text-sm">Select a batch first</p>
                  </div>
                )}
              </motion.div>

              {/* Subjects and Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                {selectedBatch && selectedSemester ? (
                  <div className="space-y-6">
                    {/* Semester Info */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            Batch {selectedBatch.batch_year} - Semester {selectedSemester.semester_number}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">{selectedSemester.academic_year}</p>
                          <p className="text-gray-400 text-sm">Total subjects: <span className="text-indigo-400 font-bold">{selectedSemester.subjects.length}</span></p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddModal(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-indigo-500/50 border border-indigo-400/50"
                        >
                          <FaPlus className="text-lg" /> Add Subject
                        </motion.button>
                      </div>
                    </div>

                    {/* Subjects List */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                      <h4 className="text-xl font-bold text-white mb-4">Assigned Subjects</h4>
                      {selectedSemester.subjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                          {selectedSemester.subjects.map(subject => (
                            <motion.div
                              key={subject.batch_subject_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                            >
                              <div>
                                <p className="font-semibold text-white">{subject.name}</p>
                                <p className="text-sm text-gray-400">{subject.code}</p>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => openEditModal(subject)}
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                                >
                                  <FaEdit />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveSubject(subject.batch_subject_id)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                  <FaTrash />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-400 text-sm">No subjects assigned to this batch-semester yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
                    <p className="text-gray-400 text-lg">Select a batch and semester to manage subjects</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Add Subject Modal */}
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-2xl font-bold text-white mb-4">Add Subject</h3>

                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Select Subject</label>
                  <select
                    value={selectedSubjectToAdd || ''}
                    onChange={e => setSelectedSubjectToAdd(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-indigo-500 rounded-lg text-white font-semibold focus:border-purple-500 outline-none transition-all appearance-none cursor-pointer hover:bg-gray-700 focus:ring-2 focus:ring-indigo-500/50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23818cf8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '40px'
                    }}
                  >
                    <option value="" className="bg-gray-800 text-gray-400">Choose a subject...</option>
                    {getAvailableSubjectsForBatchSemester().map(subject => (
                      <option key={subject.id} value={subject.id} className="bg-gray-800 text-white font-semibold py-2">
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddSubject}
                    disabled={!selectedSubjectToAdd}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
                  >
                    Add Subject
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm mb-2">Subject not in the list?</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowAddModal(false);
                      setShowCreateSubjectModal(true);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm"
                  >
                    Create New Subject
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Create Subject Modal */}
          {showCreateSubjectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateSubjectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-2xl font-bold text-white mb-4">Create New Subject</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Subject Name</label>
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={e => setNewSubjectName(e.target.value)}
                      placeholder="e.g., Computer Science"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Subject Code</label>
                    <input
                      type="text"
                      value={newSubjectCode}
                      onChange={e => setNewSubjectCode(e.target.value)}
                      placeholder="e.g., CS101"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateSubject}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Create
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateSubjectModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Edit Subject Modal */}
          {showEditSubjectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditSubjectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-2xl font-bold text-white mb-4">Edit Subject</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Subject Name</label>
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={e => setNewSubjectName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Subject Code</label>
                    <input
                      type="text"
                      value={newSubjectCode}
                      onChange={e => setNewSubjectCode(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEditSubject}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Update
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEditSubjectModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                  >
                    Cancel
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
