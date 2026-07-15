import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { FiCalendar, FiFileText, FiPlus } from 'react-icons/fi';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
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
      setAssignments(assignmentsRes.data);
      setSubmissions(submissionsRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load assignments');
      setLoading(false);
    }
  };

  const isSubmitted = (assignmentId) => {
    return submissions.some(s => s.assignment_id === assignmentId);
  };

  const getSubmission = (assignmentId) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

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
        <h1 className="text-3xl font-bold">Assignments</h1>
        {user?.role === 'admin' && (
          <Link to="/create-assignment" className="btn-primary flex items-center">
            <FiPlus className="mr-2" /> Create Assignment
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="card text-center py-12">
          <FiFileText className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Assignments Yet</h3>
          <p className="text-gray-500">
            {user?.role === 'admin' 
              ? 'Create your first assignment to get started!' 
              : 'Check back later for new assignments'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => {
            const submitted = user?.role === 'student' ? isSubmitted(assignment.id) : false;
            const submission = user?.role === 'student' ? getSubmission(assignment.id) : null;
            const daysLeft = Math.ceil(
              (new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const isOverdue = daysLeft < 0;

            return (
              <div key={assignment.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold">{assignment.title}</h3>
                  {user?.role === 'student' && submitted && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      submission?.status === 'graded'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission?.status === 'graded' ? 'Graded' : 'Submitted'}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {assignment.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <FiCalendar className="mr-2" />
                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                </div>

                {!isOverdue && daysLeft <= 7 && user?.role === 'student' && !submitted && (
                  <div className="text-sm text-orange-600 mb-3">
                    ⚠️ Due in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                  </div>
                )}

                {isOverdue && user?.role === 'student' && !submitted && (
                  <div className="text-sm text-red-600 mb-3">
                    ⚠️ Overdue by {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? 'day' : 'days'}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm font-semibold">
                    Max Marks: {assignment.max_marks}
                  </span>
                  
                  <div className="space-x-2">
                    <Link
                      to={`/assignments/${assignment.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Details
                    </Link>
                    
                    {user?.role === 'student' && !submitted && !isOverdue && (
                      <Link
                        to={`/assignments/${assignment.id}/submit`}
                        className="text-green-600 hover:underline text-sm font-semibold"
                      >
                        Submit →
                      </Link>
                    )}
                    
                    {user?.role === 'admin' && (
                      <Link
                        to={`/assignments/${assignment.id}/submissions`}
                        className="text-purple-600 hover:underline text-sm"
                      >
                        View Submissions
                      </Link>
                    )}
                  </div>
                </div>

                {user?.role === 'student' && submitted && submission?.status === 'graded' && (
                  <div className="mt-3 pt-3 border-t bg-blue-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Your Grade:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {submission.marks}/{assignment.max_marks}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assignments;
