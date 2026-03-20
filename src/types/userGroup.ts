import type { PageResponse, PageableQuery } from "./common"

export type GroupRole = "LEADER" | "MEMBER"

export interface UserResponse {
  id: number
  email: string
  fullName: string
  status: string
  roles: string[]
  createdAt?: string
}

export interface UpdateUserRequest {
  fullName: string
}

export interface Semester {
  id: number
  semesterCode: string
  semesterName: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSemesterRequest {
  semesterCode: string
  semesterName: string
  startDate: string
  endDate: string
}

export interface UpdateSemesterRequest {
  semesterName?: string
  startDate?: string
  endDate?: string
}

export interface GroupSummary {
  id: number
  groupName: string
  semesterId: number
  semesterCode: string
  lecturerName: string
  memberCount: number
  createdAt?: string
}

export interface LecturerInfo {
  id: number
  fullName: string
  email: string
}

export interface MemberInfo {
  userId: number
  fullName: string
  email?: string | null
  role: GroupRole
  jiraAccountId?: string | null
  githubUsername?: string | null
}

export interface GroupDetail {
  id: number
  groupName: string
  semesterId: number
  semesterCode: string
  lecturer: LecturerInfo
  members: MemberInfo[]
  memberCount: number
}

export interface GroupResponse {
  id: number
  groupName: string
  semesterId: number
  semesterCode: string
  lecturerId: number
  lecturerName: string
}

export interface CreateGroupRequest {
  groupName: string
  semesterId: number
  lecturerId: number
}

export interface UpdateGroupRequest {
  groupName?: string
  lecturerId: number
}

export interface UpdateLecturerRequest {
  lecturerId: number
}

export interface AddMemberRequest {
  userId: number
}

export interface MemberResponse {
  userId: number
  groupId: number
  semesterId: number
  groupRole: GroupRole
  joinedAt: string
  updatedAt: string
}

export interface GroupInfo {
  groupId: number
  groupName: string
  semesterId: number
  semesterCode: string
  role: GroupRole
  lecturerName: string
  createdAt?: string
}

export interface UserGroupsResponse {
  userId: number
  groups: GroupInfo[]
}

export interface UserListQuery extends PageableQuery {
  role?: "ADMIN" | "LECTURER" | "STUDENT"
  status?: string
  search?: string
}

export interface GroupListQuery extends PageableQuery {
  semesterId?: number
  lecturerId?: number
  search?: string
}

export type GroupPage = PageResponse<GroupSummary>
export type UserPage = PageResponse<UserResponse>
