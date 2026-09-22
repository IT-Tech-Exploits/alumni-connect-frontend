import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

// Pages
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DashboardPage from "./pages/DashboardPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import AlumniDashboardPage from "./pages/alumni/AlumniDashboardPage";
import JobsPage from "./pages/JobsPage";
import EventsPage from "./pages/EventsPage";
import FeedPage from "./pages/FeedPage";
import MessagingPage from "./pages/MessagingPage";
import ProfilePage from "./pages/ProfilePage";
import FindMentorPage from "./pages/FindMentorPage";
import GroupsPage from "./pages/GroupsPage";
import AlumniDirectoryPage from "./pages/student/AlumniDirectoryPage";
import AlumniStudentsPage from "./pages/alumni/AlumniStudentsPage";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminAlumniRosterPage from "./pages/admin/AdminAlumniRosterPage";
import ManageJobs from "./pages/admin/ManageJobs";
import ManageEvents from "./pages/admin/ManageEvents";
import ManageDepartments from "./pages/admin/ManageDepartments";
import NotificationsPage from "./pages/NotificationsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminAcademicsPage from "./pages/admin/AdminAcademicsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import TwoFactorPage from "./pages/TwoFactorPage";

// ── Guards ──────────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#1e3a6e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// ── App ─────────────────────────────────────────────────────────────────────

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />

    <Route
      path="/login"
      element={
        <GuestRoute>
          <LoginPage />
        </GuestRoute>
      }
    />

    <Route
      path="/register"
      element={
        <GuestRoute>
          <RegisterPage />
        </GuestRoute>
      }
    />

    <Route
      path="/forgot-password"
      element={
        <GuestRoute>
          <ForgotPasswordPage />
        </GuestRoute>
      }
    />

    <Route
      path="/reset-password"
      element={
        <GuestRoute>
          <ResetPasswordPage />
        </GuestRoute>
      }
    />

    <Route
      path="/admin/login"
      element={
        <GuestRoute>
          <AdminLoginPage />
        </GuestRoute>
      }
    />

    <Route
      path="/verify-email"
      element={
        <GuestRoute>
          <VerifyEmailPage />
        </GuestRoute>
      }
    />

    <Route
      path="/verify-2fa"
      element={
        <GuestRoute>
          <TwoFactorPage />
        </GuestRoute>
      }
    />

    <Route
      path="/change-password"
      element={
        <ProtectedRoute>
          <ChangePasswordPage />
        </ProtectedRoute>
      }
    />

    {/* Role redirect */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />

    {/* Student */}
    <Route
      path="/student/dashboard"
      element={
        <ProtectedRoute>
          <StudentDashboardPage />
        </ProtectedRoute>
      }
    />

    {/* Alumni */}
    <Route
      path="/alumni/dashboard"
      element={
        <ProtectedRoute>
          <AlumniDashboardPage />
        </ProtectedRoute>
      }
    />

    {/* Shared (student + alumni) */}
    <Route
      path="/feed"
      element={
        <ProtectedRoute>
          <FeedPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/jobs"
      element={
        <ProtectedRoute>
          <JobsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/events"
      element={
        <ProtectedRoute>
          <EventsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/messages"
      element={
        <ProtectedRoute>
          <MessagingPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/mentors"
      element={
        <ProtectedRoute>
          <FindMentorPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/groups"
      element={
        <ProtectedRoute>
          <GroupsPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/alumni"
      element={
        <ProtectedRoute>
          <AlumniDirectoryPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/students"
      element={
        <ProtectedRoute>
          <AlumniStudentsPage />
        </ProtectedRoute>
      }
    />

    {/* Admin */}
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <AdminRoute>
          <ManageUsers />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/departments"
      element={
        <AdminRoute>
          <ManageDepartments />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/jobs"
      element={
        <AdminRoute>
          <ManageJobs />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/events"
      element={
        <AdminRoute>
          <ManageEvents />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/analytics"
      element={
        <AdminRoute>
          <AdminAnalyticsPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/academic"
      element={
        <AdminRoute>
          <AdminAcademicsPage />
        </AdminRoute>
      }
    />
      <Route
        path="/admin/alumni-roster"
        element={
        <AdminRoute>
            <AdminAlumniRosterPage />
        </AdminRoute>
      }
/>
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile/:userId"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      }
    />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
