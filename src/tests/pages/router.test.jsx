import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AppRouter from '../../router/router'

vi.mock('../../pages/auth/Login.jsx', () => ({ default: () => <div>Login Page</div> }))
vi.mock('../../pages/auth/Register.jsx', () => ({ default: () => <div>Register Page</div> }))
vi.mock('../../pages/admin/AdminDashboard.jsx', () => ({ default: () => <div>Admin Dashboard</div> }))
vi.mock('../../pages/admin/UserManagement.jsx', () => ({ default: () => <div>User Management</div> }))
vi.mock('../../pages/admin/UserDetail.jsx', () => ({ default: () => <div>User Detail</div> }))
vi.mock('../../pages/admin/SemesterManagement.jsx', () => ({ default: () => <div>Semester Management</div> }))
vi.mock('../../pages/admin/ProjectConfigList.jsx', () => ({ default: () => <div>Project Config List</div> }))
vi.mock('../../pages/admin/AuditLogs.jsx', () => ({ default: () => <div>Audit Logs</div> }))
vi.mock('../../pages/admin/SyncJobs.jsx', () => ({ default: () => <div>Sync Jobs</div> }))
vi.mock('../../pages/lecturer/LecturerDashboard.jsx', () => ({ default: () => <div>Lecturer Dashboard</div> }))
vi.mock('../../pages/lecturer/LecturerTasks.jsx', () => ({ default: () => <div>Lecturer Tasks</div> }))
vi.mock('../../pages/lecturer/LecturerGithubStats.jsx', () => ({ default: () => <div>Lecturer Github Stats</div> }))
vi.mock('../../pages/lecturer/LecturerGrading.jsx', () => ({ default: () => <div>Lecturer Grading</div> }))
vi.mock('../../pages/student/StudentDashboard.jsx', () => ({ default: () => <div>Student Dashboard</div> }))
vi.mock('../../pages/student/StudentStats.jsx', () => ({ default: () => <div>Student Stats</div> }))
vi.mock('../../pages/student/StudentPermissions.jsx', () => ({ default: () => <div>Student Permissions</div> }))
vi.mock('../../pages/shared/UserProfile.jsx', () => ({ default: () => <div>User Profile</div> }))
vi.mock('../../pages/shared/GroupList.jsx', () => ({ default: () => <div>Group List</div> }))
vi.mock('../../pages/shared/GroupDetails.jsx', () => ({ default: () => <div>Group Details</div> }))
vi.mock('../../pages/shared/ProjectConfig.jsx', () => ({ default: () => <div>Project Config</div> }))
vi.mock('../../pages/shared/Reports.jsx', () => ({ default: () => <div>Reports Page</div> }))

function renderRouter(path, role) {
  localStorage.clear()
  if (role) {
    localStorage.setItem('role', role)
  }

  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>,
  )
}

describe('AppRouter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders login route', () => {
    renderRouter('/login')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects root route to login', () => {
    renderRouter('/')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects unknown routes to login', () => {
    renderRouter('/unknown/path')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('blocks protected route when role is missing', () => {
    renderRouter('/app/admin/dashboard')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('blocks protected route when role is not allowed', () => {
    renderRouter('/app/admin/dashboard', 'STUDENT')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders protected admin route for ADMIN role', () => {
    renderRouter('/app/admin/dashboard', 'ADMIN')
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('renders shared reports route for LECTURER role', () => {
    renderRouter('/app/reports', 'LECTURER')
    expect(screen.getByText('Reports Page')).toBeInTheDocument()
  })

  it('renders student route for STUDENT role', () => {
    renderRouter('/app/student/profile/me', 'STUDENT')
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument()
  })
})
