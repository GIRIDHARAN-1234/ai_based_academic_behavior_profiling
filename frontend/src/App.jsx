import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

// Student
import StudentDashboard from "./pages/student/Dashboard";
import StudentTests from "./pages/student/Tests";
import TakeTest from "./pages/student/TakeTest";
import StudentResults from "./pages/student/Results";
import StudentProfile from "./pages/student/Profile";

// Faculty
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyStudents from "./pages/faculty/Students";
import CreateTest from "./pages/faculty/CreateTest";
import AssignTest from "./pages/faculty/AssignTest";
import FacultyAnalytics from "./pages/faculty/Analytics";
import CreateStudent from "./pages/faculty/CreateStudent";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/UserManagement";
import AdminAnalytics from "./pages/admin/Analytics";

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={user ? `/${user.role}` : "/login"} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/tests" element={<ProtectedRoute role="student"><StudentTests /></ProtectedRoute>} />
          <Route path="/student/tests/:testId" element={<ProtectedRoute role="student"><TakeTest /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute role="student"><StudentResults /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />

          {/* Faculty Routes */}
          <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/faculty/create-students" element={<ProtectedRoute role="faculty"><CreateStudent /></ProtectedRoute>} />
          <Route path="/faculty/students" element={<ProtectedRoute role="faculty"><FacultyStudents /></ProtectedRoute>} />
          <Route path="/faculty/create-test" element={<ProtectedRoute role="faculty"><CreateTest /></ProtectedRoute>} />
          <Route path="/faculty/assign-test" element={<ProtectedRoute role="faculty"><AssignTest /></ProtectedRoute>} />
          <Route path="/faculty/analytics" element={<ProtectedRoute role="faculty"><FacultyAnalytics /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#f1f5f9", borderRadius: "12px" } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
