import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import StudentLogin from '../pages/auth/StudentLogin';
import AdminLogin from '../pages/auth/AdminLogin';
import StudentDashboard from '../pages/student/StudentDashboard';
import MyAnalytics from '../pages/student/MyAnalytics';
import ClassPerformance from '../pages/student/ClassPerformance';
import Leaderboard from '../pages/student/Leaderboard';
import DatabaseManagement from '../pages/admin/DatabaseManagement';
import StudentComparison from '../pages/admin/StudentComparison';
import BatchComparison from '../pages/admin/BatchComparison';
import MarksEditDashboard from '../pages/admin/MarksEditDashboard';
import NotFound from '../pages/NotFound';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/auth/student-login" element={<StudentLogin />} />
    <Route path="/auth/admin-login" element={<AdminLogin />} />
    
    {/* Student Routes */}
    <Route path="/student/dashboard" element={<StudentDashboard />} />
    <Route path="/student/analytics" element={<MyAnalytics />} />
    <Route path="/student/class-performance" element={<ClassPerformance />} />
    <Route path="/student/leaderboard" element={<Leaderboard />} />
    
    {/* Admin Routes */}
    <Route path="/admin/dashboard" element={<DatabaseManagement />} />
    <Route path="/admin/database" element={<DatabaseManagement />} />
    <Route path="/admin/marks-edit" element={<MarksEditDashboard />} />
    <Route path="/admin/comparison" element={<StudentComparison />} />
    <Route path="/admin/batch-comparison" element={<BatchComparison />} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
