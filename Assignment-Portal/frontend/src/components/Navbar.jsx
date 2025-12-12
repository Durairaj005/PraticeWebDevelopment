import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiFileText, FiPlusCircle } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Assignment Portal
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link to="/assignments" className="text-gray-700 hover:text-blue-600 flex items-center">
                  <FiFileText className="mr-1" /> Assignments
                </Link>
                {user.role === 'admin' && (
                  <Link to="/create-assignment" className="text-gray-700 hover:text-blue-600 flex items-center">
                    <FiPlusCircle className="mr-1" /> Create
                  </Link>
                )}
                <Link to="/profile" className="text-gray-700 hover:text-blue-600 flex items-center">
                  <FiUser className="mr-1" /> Profile
                </Link>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {user.role === 'admin' ? 'Admin' : 'Student'}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center text-gray-700 hover:text-red-600"
                >
                  <FiLogOut className="mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
