import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { FiFileText, FiSend } from 'react-icons/fi';

const SubmitAssignment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [formData, setFormData] = useState({
    submission_text: '',
    file_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${id}`);
      setAssignment(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load assignment');
      navigate('/assignments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.submission_text.trim()) {
      toast.error('Please enter your submission');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/submissions', {
        assignment_id: id,
        submission_text: formData.submission_text,
        file_url: formData.file_url || null
      });
      toast.success('Assignment submitted successfully!');
      navigate('/assignments');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit assignment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (user?.role !== 'student') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only students can submit assignments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Submit Assignment</h1>
      <p className="text-gray-600 mb-8">Submit your work for: {assignment.title}</p>

      <div className="card mb-6 bg-blue-50">
        <h3 className="font-semibold text-lg mb-2">Assignment Details</h3>
        <p className="text-gray-700 mb-3">{assignment.description}</p>
        <div className="flex justify-between text-sm">
          <span>Max Marks: <strong>{assignment.max_marks}</strong></span>
          <span>Due: <strong>{new Date(assignment.due_date).toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFileText className="inline mr-1" /> Your Submission *
            </label>
            <textarea
              className="input-field"
              rows="10"
              value={formData.submission_text}
              onChange={(e) => setFormData({ ...formData, submission_text: e.target.value })}
              placeholder="Write your answer here..."
              required
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              {formData.submission_text.length} characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File URL (Optional)
            </label>
            <input
              type="url"
              className="input-field"
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              placeholder="https://drive.google.com/... or similar"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload your file to Google Drive, Dropbox, or similar and paste the link here
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={submitting}
            >
              <FiSend className="mr-2" />
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/assignments')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitAssignment;
