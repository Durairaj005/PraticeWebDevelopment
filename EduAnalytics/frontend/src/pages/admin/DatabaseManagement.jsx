import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { FaUpload, FaFileAlt, FaCheckCircle, FaDatabase, FaCalendarAlt, FaExclamationTriangle, FaSpinner, FaLink, FaTrash, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function DatabaseManagement() {
  const { token: authToken } = useAuth();
  const [liveDataStatus, setLiveDataStatus] = useState(null);
  const [dataCount, setDataCount] = useState({ students: 0, marks: 0 });
  // Present Batch (2024) State
  const [filePresent, setFilePresent] = useState(null);
  const [uploadingPresent, setUploadingPresent] = useState(false);
  const [uploadSuccessPresent, setUploadSuccessPresent] = useState(false);
  const [csvDataPresent, setCsvDataPresent] = useState(null);
  const [parseErrorPresent, setParseErrorPresent] = useState(null);

  // Past Batch (2023) State
  const [filePast, setFilePast] = useState(null);
  const [uploadingPast, setUploadingPast] = useState(false);
  const [uploadSuccessPast, setUploadSuccessPast] = useState(false);
  const [csvDataPast, setCsvDataPast] = useState(null);
  const [parseErrorPast, setParseErrorPast] = useState(null);

  // Manage Database Modal State
  const [showManageModal, setShowManageModal] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchForDelete, setSelectedBatchForDelete] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [deleteBatchMessage, setDeleteBatchMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check live data status on mount and after uploads
  const checkLiveDataStatus = async () => {
    try {
      const token = authToken || localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      // Try to check for actual data from all batches
      let totalStudents = 0;
      let totalMarks = 0;

      // Check multiple batches
      for (const batchYear of ['2025', '2023', '2024']) {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/admin/all-students?batch_year=${batchYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            const studentCount = data.students ? data.students.length : 0;
            totalStudents += studentCount;
            totalMarks += studentCount > 0 ? studentCount * 5 : 0; // 5 subjects
          }
        } catch (err) {
          console.error(`Error checking batch ${batchYear}:`, err);
        }
      }
      
      console.log(`[Data Status] Total Students: ${totalStudents}, Total Marks: ${totalMarks}`);
      setDataCount({ students: totalStudents, marks: totalMarks });
      setLiveDataStatus(totalStudents > 0 ? 'live' : 'empty');
    } catch (error) {
      console.error('Error checking data status:', error);
      setLiveDataStatus('error');
    }
  };

  // Check data on component mount
  useEffect(() => {
    checkLiveDataStatus();
  }, []);

  const parseCSV = (text) => {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        }
        
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }

      return { headers, data, rowCount: data.length };
    } catch (error) {
      throw new Error(`CSV Parse Error: ${error.message}`);
    }
  };

  // Present Batch (2024) Handlers
  const handleFileChangePresent = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setParseErrorPresent('Please select a valid CSV file');
      return;
    }

    setFilePresent(selectedFile);
    setUploadSuccessPresent(false);
    setParseErrorPresent(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = parseCSV(event.target.result);
        setCsvDataPresent(parsedData);
        setParseErrorPresent(null);
      } catch (error) {
        setParseErrorPresent(error.message);
        setCsvDataPresent(null);
      }
    };
    reader.onerror = () => {
      setParseErrorPresent('Failed to read file');
    };
    reader.readAsText(selectedFile);
  };

  const handleUploadPresent = async () => {
    if (!filePresent || !csvDataPresent) return;
    
    setUploadingPresent(true);
    try {
      // Debug: Check all possible token sources
      const contextToken = authToken;
      const storageToken = localStorage.getItem('token');
      const token = contextToken || storageToken;
      
      console.log('🔍 Token Debug:');
      console.log('  Context Token:', contextToken ? contextToken.substring(0, 30) + '...' : 'NULL');
      console.log('  Storage Token:', storageToken ? storageToken.substring(0, 30) + '...' : 'NULL');
      console.log('  Using Token:', token ? token.substring(0, 30) + '...' : 'NULL');
      
      if (!token) {
        console.error('❌ NO TOKEN FOUND');
        setParseErrorPresent('❌ No authentication token. Please log in using Google OAuth first.');
        setUploadingPresent(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', filePresent);
      formData.append('batch_year', '2024');

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      console.log('🔐 Sending request with headers:', {
        Authorization: `Bearer ${token.substring(0, 30)}...`,
        method: 'POST',
        endpoint: 'http://localhost:8000/api/v1/admin/csv-upload'
      });

      const response = await fetch('http://localhost:8000/api/v1/admin/csv-upload', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (response.ok) {
        console.log('✅ Upload successful!');
        setUploadingPresent(false);
        setUploadSuccessPresent(true);
        setFilePresent(null);
        setCsvDataPresent(null);
        // Refresh data status after upload
        setTimeout(() => {
          checkLiveDataStatus();
          setUploadSuccessPresent(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ Upload failed with status:', response.status);
        console.error('Error response:', errorData);
        setParseErrorPresent(`Error (${response.status}): ${errorData.detail || 'Upload failed'}`);
        setUploadingPresent(false);
      }
    } catch (error) {
      console.error('❌ Request error:', error);
      setUploadingPresent(false);
      setParseErrorPresent('Upload failed: ' + error.message);
    }
  };

  // Past Batch (2023) Handlers
  const handleFileChangePast = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setParseErrorPast('Please select a valid CSV file');
      return;
    }

    setFilePast(selectedFile);
    setUploadSuccessPast(false);
    setParseErrorPast(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = parseCSV(event.target.result);
        setCsvDataPast(parsedData);
        setParseErrorPast(null);
      } catch (error) {
        setParseErrorPast(error.message);
        setCsvDataPast(null);
      }
    };
    reader.onerror = () => {
      setParseErrorPast('Failed to read file');
    };
    reader.readAsText(selectedFile);
  };

  const handleUploadPast = async () => {
    if (!filePast || !csvDataPast) return;
    
    setUploadingPast(true);
    try {
      // Debug: Check all possible token sources
      const contextToken = authToken;
      const storageToken = localStorage.getItem('token');
      const token = contextToken || storageToken;
      
      console.log('🔍 Token Debug:');
      console.log('  Context Token:', contextToken ? contextToken.substring(0, 30) + '...' : 'NULL');
      console.log('  Storage Token:', storageToken ? storageToken.substring(0, 30) + '...' : 'NULL');
      console.log('  Using Token:', token ? token.substring(0, 30) + '...' : 'NULL');
      
      if (!token) {
        console.error('❌ NO TOKEN FOUND');
        setParseErrorPast('❌ No authentication token. Please log in using Google OAuth first.');
        setUploadingPast(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', filePast);
      formData.append('batch_year', '2023');

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      console.log('🔐 Sending request with headers:', {
        Authorization: `Bearer ${token.substring(0, 30)}...`,
        method: 'POST',
        endpoint: 'http://localhost:8000/api/v1/admin/csv-upload'
      });

      const response = await fetch('http://localhost:8000/api/v1/admin/csv-upload', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (response.ok) {
        console.log('✅ Upload successful!');
        setUploadingPast(false);
        setUploadSuccessPast(true);
        setFilePast(null);
        setCsvDataPast(null);
        // Refresh data status after upload
        setTimeout(() => {
          checkLiveDataStatus();
          setUploadSuccessPast(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ Upload failed with status:', response.status);
        console.error('Error response:', errorData);
        setParseErrorPast(`Error (${response.status}): ${errorData.detail || 'Upload failed'}`);
        setUploadingPast(false);
      }
    } catch (error) {
      console.error('❌ Request error:', error);
      setUploadingPast(false);
      setParseErrorPast('Upload failed: ' + error.message);
    }
  };

  // ========== MANAGE DATABASE MODAL HANDLERS ==========
  
  // Fetch all batches
  const handleOpenManageModal = async () => {
    setShowManageModal(true);
    setLoadingBatches(true);
    setDeleteBatchMessage(null);
    
    try {
      const token = authToken || localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/admin/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      } else {
        setDeleteBatchMessage({ type: 'error', text: 'Failed to load batches' });
      }
    } catch (error) {
      setDeleteBatchMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoadingBatches(false);
    }
  };

  // Handle batch deletion
  const handleConfirmDeleteBatch = async () => {
    if (!selectedBatchForDelete) return;
    
    setDeletingBatch(true);
    const token = authToken || localStorage.getItem('token');
    
    try {
      // Send batch_year as query parameter
      const batchYear = selectedBatchForDelete.batch_year;
      const response = await fetch(`http://localhost:8000/api/v1/admin/delete-last-upload?batch_year=${batchYear}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDeleteBatchMessage({ 
          type: 'success', 
          text: `✅ Deleted ${selectedBatchForDelete.batch_year}: ${data.deleted_students} students, ${data.deleted_marks} marks` 
        });
        
        // Refresh batches list and live data after deletion completes
        setTimeout(() => {
          checkLiveDataStatus();
          handleOpenManageModal();
          setSelectedBatchForDelete(null);
          setShowDeleteConfirm(false);
        }, 1500);
      } else {
        setDeleteBatchMessage({ type: 'error', text: data.message || 'Delete failed' });
      }
    } catch (error) {
      setDeleteBatchMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setDeletingBatch(false);
    }
  };

  const closeManageModal = () => {
    setShowManageModal(false);
    setSelectedBatchForDelete(null);
    setShowDeleteConfirm(false);
    setDeleteBatchMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Admin', role: 'Administrator' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={true} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">📊 Batch Data Upload</h1>
            <p className="text-sm sm:text-base text-gray-400">Upload student marks for Past and Present batches separately</p>
            
            {/* Manage Database Button */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleOpenManageModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 transition-all duration-200 hover:border-red-400"
              >
                <FaDatabase className="text-lg" />
                <span className="font-semibold">🗑️ Manage & Clean Database</span>
              </button>
            </div>
          </div>

          {/* LIVE DATA STATUS INDICATOR */}
          <div className="mb-6 p-4 rounded-lg border" style={{
            backgroundColor: liveDataStatus === 'live' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            borderColor: liveDataStatus === 'live' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'
          }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: liveDataStatus === 'live' ? '#22c55e' : '#eab308',
                animation: liveDataStatus === 'live' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
              }}></div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{
                  color: liveDataStatus === 'live' ? '#22c55e' : '#eab308'
                }}>
                  {liveDataStatus === 'live' ? '✅ Live Data Active' : '⚠️ Demo Data Mode'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {liveDataStatus === 'live' 
                    ? `${dataCount.students} students with ${dataCount.marks} marks uploaded`
                    : 'No student data uploaded yet. Upload CSV files to activate live mode.'}
                </p>
              </div>
              <button
                onClick={checkLiveDataStatus}
                className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-gray-300 transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PRESENT BATCH (2024) UPLOAD */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-400" /> Present Batch
              </h2>
              
              {/* Error Display */}
              {parseErrorPresent && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2"
                >
                  <FaExclamationTriangle className="text-red-400 text-lg flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-semibold text-sm">Error</h4>
                    <p className="text-xs text-red-300">{parseErrorPresent}</p>
                  </div>
                </motion.div>
              )}

              {/* Success Message */}
              {uploadSuccessPresent && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4"
                >
                  <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <FaCheckCircle /> Batch 2024 Uploaded Successfully!
                  </h4>
                  <p className="text-sm text-gray-300">{csvDataPresent?.rowCount} rows imported</p>
                </motion.div>
              )}

              {/* CSV Validation Preview */}
              {csvDataPresent && !parseErrorPresent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4"
                >
                  <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                    <FaCheckCircle /> CSV Validated
                  </h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>📊 Columns: {csvDataPresent.headers.length}</p>
                    <p>👥 Students: {csvDataPresent.rowCount}</p>
                  </div>
                </motion.div>
              )}

              {/* File Upload Area */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="border-2 border-dashed border-blue-400/30 rounded-lg p-6 text-center hover:border-blue-400/60 transition-all mb-4"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <FaFileAlt className="text-4xl text-blue-400 mx-auto mb-3" />
                </motion.div>
                
                {uploadSuccessPresent ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400"
                  >
                    <FaCheckCircle className="text-3xl mx-auto mb-2" />
                    <p className="font-semibold">Upload Complete!</p>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-white mb-2">
                      {filePresent ? filePresent.name : 'Choose CSV File'}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3">
                      {filePresent ? csvDataPresent?.rowCount + ' rows' : 'Current batch data'}
                    </p>
                    
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChangePresent}
                      className="hidden"
                      id="csv-upload-present"
                    />
                    <label
                      htmlFor="csv-upload-present"
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition transform hover:scale-105"
                    >
                      Choose File
                    </label>
                  </>
                )}
              </motion.div>

              {/* Upload Button */}
              {filePresent && csvDataPresent && !parseErrorPresent && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleUploadPresent}
                  disabled={uploadingPresent}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingPresent ? (
                    <>
                      <FaSpinner className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload /> Upload Batch 2024
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>

            {/* PAST BATCH (2023) UPLOAD */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-purple-400" /> Past Batch
              </h2>
              
              {/* Error Display */}
              {parseErrorPast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2"
                >
                  <FaExclamationTriangle className="text-red-400 text-lg flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-semibold text-sm">Error</h4>
                    <p className="text-xs text-red-300">{parseErrorPast}</p>
                  </div>
                </motion.div>
              )}

              {/* Success Message */}
              {uploadSuccessPast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4"
                >
                  <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <FaCheckCircle /> Batch 2023 Uploaded Successfully!
                  </h4>
                  <p className="text-sm text-gray-300">{csvDataPast?.rowCount} rows imported</p>
                </motion.div>
              )}

              {/* CSV Validation Preview */}
              {csvDataPast && !parseErrorPast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4"
                >
                  <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                    <FaCheckCircle /> CSV Validated
                  </h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>📊 Columns: {csvDataPast.headers.length}</p>
                    <p>👥 Students: {csvDataPast.rowCount}</p>
                  </div>
                </motion.div>
              )}

              {/* File Upload Area */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="border-2 border-dashed border-purple-400/30 rounded-lg p-6 text-center hover:border-purple-400/60 transition-all mb-4"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <FaFileAlt className="text-4xl text-purple-400 mx-auto mb-3" />
                </motion.div>
                
                {uploadSuccessPast ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400"
                  >
                    <FaCheckCircle className="text-3xl mx-auto mb-2" />
                    <p className="font-semibold">Upload Complete!</p>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-white mb-2">
                      {filePast ? filePast.name : 'Choose CSV File'}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3">
                      {filePast ? csvDataPast?.rowCount + ' rows' : 'Past batch data'}
                    </p>
                    
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChangePast}
                      className="hidden"
                      id="csv-upload-past"
                    />
                    <label
                      htmlFor="csv-upload-past"
                      className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition transform hover:scale-105"
                    >
                      Choose File
                    </label>
                  </>
                )}
              </motion.div>

              {/* Upload Button */}
              {filePast && csvDataPast && !parseErrorPast && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleUploadPast}
                  disabled={uploadingPast}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingPast ? (
                    <>
                      <FaSpinner className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload /> Upload Batch 2023
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* CSV Format Guide */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">📋 CSV Format Guide</h3>
            
            <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-300 space-y-2">
              <p><span className="text-green-400 font-semibold">✅ Required Columns:</span></p>
              <p className="ml-4 font-mono text-xs">Register_No, Student_Name, Email, Batch_Year, Semester, Subject_Name, CA1, CA2, CA3, Semester_Marks, Date_of_Birth</p>
              
              <p className="mt-3"><span className="text-yellow-400 font-semibold">⚠️ Important:</span></p>
              <ul className="ml-4 list-disc space-y-1 text-xs">
                <li>DOB Format: DD-MM-YYYY (e.g., 15-03-2005)</li>
                <li>Marks Range: 0-100</li>
                <li>Batch_Year: 2024 for Present, 2023 for Past</li>
                <li>All fields required except CA3 (can be empty)</li>
              </ul>
            </div>
          </motion.div>

          {/* MANAGE DATABASE MODAL */}
          {showManageModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gray-900/50">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaDatabase className="text-blue-400" />
                    Manage Batch Database
                  </h2>
                  <button
                    onClick={closeManageModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <FaTimes className="text-gray-400 text-lg" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Messages */}
                  {deleteBatchMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm font-semibold ${
                      deleteBatchMessage.type === 'success' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {deleteBatchMessage.text}
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingBatches ? (
                    <div className="flex items-center justify-center py-8">
                      <FaSpinner className="text-2xl text-blue-400 animate-spin" />
                      <span className="ml-3 text-gray-300">Loading batches...</span>
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No batches found in database</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Batches Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-4 py-3 text-gray-400 font-semibold">Batch Year</th>
                              <th className="px-4 py-3 text-gray-400 font-semibold">Students</th>
                              <th className="px-4 py-3 text-gray-400 font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batches.map((batch) => (
                              <tr key={batch.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="px-4 py-3 text-white font-semibold">
                                  Batch {batch.batch_year}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                                    {batch.total_students}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => {
                                      setSelectedBatchForDelete(batch);
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="px-3 py-1 rounded text-xs font-semibold bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 transition flex items-center gap-1"
                                  >
                                    <FaTrash className="text-xs" />
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Info Box */}
                      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-300">
                        <p className="font-semibold mb-1">⚠️ Warning:</p>
                        <p>Deleting a batch will permanently remove all student data and marks for that batch. This action cannot be undone.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && selectedBatchForDelete && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gray-800 border border-red-500/50 rounded-lg shadow-xl w-full max-w-md p-6"
                    >
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <FaExclamationTriangle className="text-red-500" />
                        Confirm Delete?
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Are you sure you want to delete <span className="font-bold text-red-400">Batch {selectedBatchForDelete.batch_year}</span> with <span className="font-bold">{selectedBatchForDelete.total_students}</span> students?
                      </p>
                      <p className="text-sm text-yellow-300 mb-6">
                        This will also delete all {selectedBatchForDelete.total_students * 5} marks associated with this batch.
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deletingBatch}
                          className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmDeleteBatch}
                          disabled={deletingBatch}
                          className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {deletingBatch ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <FaTrash />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
