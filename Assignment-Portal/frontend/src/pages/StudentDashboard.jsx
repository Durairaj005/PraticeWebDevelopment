import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { FiFileText, FiCheckCircle, FiClock, FiAward } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completed: 0,
    pending: 0,
    averageGrade: 0
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
      const completedCount = submissionData.length;
      const gradedSubmissions = submissionData.filter(s => s.status === 'graded' && s.marks !== null);
      const avgGrade = gradedSubmissions.length > 0
        ? (gradedSubmissions.reduce((sum, s) => sum + s.marks, 0) / gradedSubmissions.length).toFixed(1)
        : 0;

      setStats({
        totalAssignments: assignmentData.length,
        completed: completedCount,
        pending: assignmentData.length - completedCount,
        averageGrade: avgGrade
      });

      setLoading(false);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const performanceData = submissions
    .filter(s => s.status === 'graded' && s.marks !== null)
    .slice(-5)
    .map((submission, index) => {
      const assignment = assignments.find(a => a.id === submission.assignment_id);
      return {
        name: `Assignment ${index + 1}`,
        marks: submission.marks,
        maxMarks: assignment?.max_marks || 100
      };
    });

  const upcomingAssignments = assignments
    .filter(a => {
      const isSubmitted = submissions.some(s => s.assignment_id === a.id);
      return !isSubmitted && new Date(a.due_date) > new Date();
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

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
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>
        <Link to="/assignments" className="btn-primary">
          View All Assignments
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
              <p className="text-green-100 text-sm">Completed</p>
              <h3 className="text-3xl font-bold mt-1">{stats.completed}</h3>
            </div>
            <FiCheckCircle className="text-5xl opacity-20" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending</p>
              <h3 className="text-3xl font-bold mt-1">{stats.pending}</h3>
            </div>
            <FiClock className="text-5xl opacity-20" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Average Grade</p>
              <h3 className="text-3xl font-bold mt-1">{stats.averageGrade}%</h3>
            </div>
            <FiAward className="text-5xl opacity-20" />
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4">Your Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="marks" stroke="#3b82f6" strokeWidth={2} name="Your Score" />
              <Line type="monotone" dataKey="maxMarks" stroke="#10b981" strokeWidth={2} name="Max Marks" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Upcoming Assignments</h3>
          {upcomingAssignments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => {
                const daysLeft = Math.ceil(
                  (new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={assignment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold">{assignment.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Due in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                    </p>
                    <Link 
                      to={`/assignments/${assignment.id}`}
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      View Details →
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming assignments</p>
          )}
        </div>

        {/* Recent Grades */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Recent Grades</h3>
          {submissions.filter(s => s.status === 'graded').length > 0 ? (
            <div className="space-y-4">
              {submissions
                .filter(s => s.status === 'graded')
                .slice(0, 5)
                .map((submission) => {
                  const assignment = assignments.find(a => a.id === submission.assignment_id);
                  const percentage = assignment ? (submission.marks / assignment.max_marks) * 100 : 0;
                  return (
                    <div key={submission.id} className="border-b pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{assignment?.title || 'N/A'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Graded on {new Date(submission.graded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {submission.marks}/{assignment?.max_marks || 100}
                          </p>
                          <p className="text-sm text-gray-600">{percentage.toFixed(0)}%</p>
                        </div>
                      </div>
                      {submission.feedback && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{submission.feedback}"
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500">No graded assignments yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
