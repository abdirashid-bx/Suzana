import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import StudentsList from './pages/students/StudentsList';
import StudentForm from './pages/students/StudentForm';
import StudentDetails from './pages/students/StudentDetails';
import StaffList from './pages/staff/StaffList';
import StaffForm from './pages/staff/StaffForm';
import StaffDetails from './pages/staff/StaffDetails';
import GradesList from './pages/grades/GradesList';
import GradeDetails from './pages/grades/GradeDetails';
import SchedulePage from './pages/schedule/SchedulePage';
import AttendancePage from './pages/attendance/AttendancePage';
import FinancePage from './pages/finance/FinancePage';
import UsersPage from './pages/users/UsersPage';

import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Dashboard Route with Redirect for Teachers
const DashboardRoute = () => {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <Navigate to="/grades" replace />;
  }

  return <Dashboard />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardRoute />} />

        {/* Students */}
        <Route path="/students" element={<StudentsList />} />
        <Route path="/students/new" element={<StudentForm />} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/students/:id/edit" element={<StudentForm />} />

        {/* Staff */}
        <Route path="/staff" element={<StaffList />} />
        <Route path="/staff/new" element={<StaffForm />} />
        <Route path="/staff/:id" element={<StaffDetails />} />
        <Route path="/staff/:id/edit" element={<StaffForm />} />

        {/* Grades */}
        <Route path="/grades" element={<GradesList />} />
        <Route path="/grades/:id" element={<GradeDetails />} />

        {/* Schedule */}
        <Route path="/schedule" element={<SchedulePage />} />

        {/* Attendance */}
        <Route path="/attendance" element={<AttendancePage />} />

        {/* Finance */}
        <Route path="/finance" element={<FinancePage />} />

        {/* Users */}
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
