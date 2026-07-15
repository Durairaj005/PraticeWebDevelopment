import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { FiPlus, FiUsers, FiFileText, FiCheckCircle, FiClock } from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/submissions')
      ]);

      const assignmentData = assignmentsRes.data;
      const submissionData = submissionsRes.data;

      setAssignments(assignmentData);
      setSubmissions(submissionData);

      // Calculate stats
      const uniqueStudents = new Set(submissionData.map(s => s.student_id)).size;
      const pendingCount = submissionData.filter(s => s.status === 'pending').length;

      setStats({
        totalAssignments: assignmentData.length,
        totalSubmissions: submissionData.length,
        pendingReviews: pendingCount,
        totalStudents: uniqueStudents
      });

      setLoading(false);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const submissionStatusData = [
    { name: 'Graded', value: submissions.filter(s => s.status === 'graded').length, color: '#10b981' },
    { name: 'Pending', value: submissions.filter(s => s.status === 'pending').length, color: '#f59e0b' }
  ];

  const assignmentSubmissionData = assignments.slice(0, 5).map(assignment => {
    const assignmentSubmissions = submissions.filter(s => s.assignment_id === assignment.id);
    return {
      name: assignment.title.substring(0, 20) + '...',
      submissions: assignmentSubmissions.length,
      graded: assignmentSubmissions.filter(s => s.status === 'graded').length,
      pending: assignmentSubmissions.filter(s => s.status === 'pending').length
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>
        <Link to="/create-assignment" className="btn-primary flex items-center">
          <FiPlus className="mr-2" /> Create Assignment
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Assignments</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalAssignments}</h3>
            </div>
            <FiFileText className="text-5xl opacity-20" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Submissions</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalSubmissions}</h3>
            </div>
            <FiCheckCircle className="text-5xl opacity-20" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Reviews</p>
              <h3 className="text-3xl font-bold mt-1">{stats.pendingReviews}</h3>
            </div>
            <FiClock className="text-5xl opacity-20" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Students</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalStudents}</h3>
            </div>
            <FiUsers className="text-5xl opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Submission Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={submissionStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {submissionStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Recent Assignments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assignmentSubmissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="graded" fill="#10b981" name="Graded" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Recent Submissions</h3>
          <Link to="/submissions" className="text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.slice(0, 5).map((submission) => {
                const assignment = assignments.find(a => a.id === submission.assignment_id);
                return (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{submission.student_name}</td>
                    <td className="px-6 py-4">{assignment?.title || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        submission.status === 'graded' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/submissions/${submission.id}/grade`}
                        className="text-blue-600 hover:underline"
                      >
                        {submission.status === 'graded' ? 'View' : 'Grade'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
