import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import LecturerDashboard from "../pages/LecturerDashboard";
import LecturerTasks from "../pages/LecturerTasks";
import LecturerGithubStats from "../pages/LecturerGithubStats";
import LecturerGrading from "../pages/LecturerGrading";
import StudentDashboard from "../pages/StudentDashboard";
import StudentStats from "../pages/StudentStats";
import UserProfile from "../pages/UserProfile";
import UserManagement from "../pages/UserManagement";
import SemesterManagement from "../pages/SemesterManagement";
import AuditLogs from "../pages/AuditLogs";
import GroupList from "../pages/GroupList";
import GroupDetails from "../pages/GroupDetails";
import ProjectConfig from "../pages/ProjectConfig";
import SystemConfig from "../pages/SystemConfig";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Dashboards */}
      <Route
        path="/app/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/lecturer/groups/list"
        element={
          <ProtectedRoute allowedRoles={["LECTURER"]}>
            <LecturerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/lecturer/tasks"
        element={
          <ProtectedRoute allowedRoles={["LECTURER"]}>
            <LecturerTasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/lecturer/github-stats"
        element={
          <ProtectedRoute allowedRoles={["LECTURER"]}>
            <LecturerGithubStats />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/lecturer/grading"
        element={
          <ProtectedRoute allowedRoles={["LECTURER"]}>
            <LecturerGrading />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/student/profile/me"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/student/stats"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentStats />
          </ProtectedRoute>
        }
      />

      {/* Profile (all roles) */}
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "LECTURER", "STUDENT"]}>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/app/admin/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/admin/semesters"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <SemesterManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/admin/system-config"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <SystemConfig />
          </ProtectedRoute>
        }
      />

      {/* Groups / Projects */}
      <Route
        path="/app/groups"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "LECTURER", "STUDENT"]}>
            <GroupList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/groups/:groupId"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "LECTURER", "STUDENT"]}>
            <GroupDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/groups/:groupId/config"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "STUDENT"]}>
            <ProjectConfig />
          </ProtectedRoute>
        }
      />

      {/* 404 - Not Found */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}