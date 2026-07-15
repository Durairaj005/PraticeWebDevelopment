import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCheckCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Assignment Submission Portal
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A modern platform for teachers to create assignments and students to submit their work
          </p>
          {!user && (
            <div className="space-x-4">
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card text-center">
            <FiCheckCircle className="text-5xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Assignment Management</h3>
            <p className="text-gray-600">
              Teachers can create and manage assignments, students can submit their work easily
            </p>
          </div>
          
          <div className="card text-center">
            <FiUsers className="text-5xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
            <p className="text-gray-600">
              Separate dashboards for teachers and students with appropriate features for each
            </p>
          </div>
          
          <div className="card text-center">
            <FiTrendingUp className="text-5xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
            <p className="text-gray-600">
              Track progress with interactive charts and comprehensive statistics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
