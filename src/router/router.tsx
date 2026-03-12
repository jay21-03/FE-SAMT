import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import SemesterManagement from "../pages/admin/SemesterManagement";
import AuditLogs from "../pages/admin/AuditLogs";
import SystemConfig from "../pages/admin/SystemConfig";
import LecturerDashboard from "../pages/lecturer/LecturerDashboard";
import LecturerTasks from "../pages/lecturer/LecturerTasks";
import LecturerGithubStats from "../pages/lecturer/LecturerGithubStats";
import LecturerGrading from "../pages/lecturer/LecturerGrading";
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentStats from "../pages/student/StudentStats";
import StudentPermissions from "../pages/student/StudentPermissions";
import UserProfile from "../pages/shared/UserProfile";
import GroupList from "../pages/shared/GroupList";
import GroupDetails from "../pages/shared/GroupDetails";
import ProjectConfig from "../pages/shared/ProjectConfig";
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

      <Route
        path="/app/student/permissions"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentPermissions />
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