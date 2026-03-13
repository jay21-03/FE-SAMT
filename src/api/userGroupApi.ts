import type {
  AddMemberRequest,
  CreateGroupRequest,
  CreateSemesterRequest,
  GroupDetail,
  GroupPage,
  GroupResponse,
  GroupListQuery,
  MemberResponse,
  Semester,
  UpdateGroupRequest,
  UpdateLecturerRequest,
  UpdateSemesterRequest,
  UpdateUserRequest,
  UserGroupsResponse,
  UserListQuery,
  UserPage,
  UserResponse,
} from "../types/userGroup"
import { api } from "./apiClient"

function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  return entries.length ? Object.fromEntries(entries) : undefined
}

function unwrapData<T>(payload: any): T {
  return (payload && payload.data ? payload.data : payload) as T
}

export const userGroupApi = {
  async listUsers(query?: UserListQuery) {
    const { search: _search, ...rest } = query ?? {}
    const r = await api.get<UserPage>("/api/users", { params: cleanParams(rest) })
    return unwrapData<UserPage>(r.data)
  },

  async getUser(userId: number) {
    const r = await api.get<UserResponse>(`/api/users/${userId}`)
    return unwrapData<UserResponse>(r.data)
  },

  async updateUser(userId: number, payload: UpdateUserRequest) {
    const r = await api.put<UserResponse>(`/api/users/${userId}`, payload)
    return unwrapData<UserResponse>(r.data)
  },

  async getUserGroups(userId: number) {
    const r = await api.get<UserGroupsResponse>(`/api/users/${userId}/groups`)
    return unwrapData<UserGroupsResponse>(r.data)
  },

  async listSemesters() {
    const r = await api.get<Semester[]>("/api/semesters")
    return unwrapData<Semester[]>(r.data)
  },

  async getSemester(id: number) {
    const r = await api.get<Semester>(`/api/semesters/${id}`)
    return unwrapData<Semester>(r.data)
  },

  async getActiveSemester() {
    const r = await api.get<Semester>("/api/semesters/active")
    return unwrapData<Semester>(r.data)
  },

  async createSemester(payload: CreateSemesterRequest) {
    const r = await api.post<Semester>("/api/semesters", payload)
    return unwrapData<Semester>(r.data)
  },

  async updateSemester(id: number, payload: UpdateSemesterRequest) {
    const r = await api.put<Semester>(`/api/semesters/${id}`, payload)
    return unwrapData<Semester>(r.data)
  },

  async activateSemester(id: number) {
    const r = await api.patch(`/api/semesters/${id}/activate`)
    return unwrapData<Record<string, unknown>>(r.data)
  },

  async listGroups(query?: GroupListQuery) {
    const { search: _search, ...rest } = query ?? {}
    const r = await api.get<GroupPage>("/api/groups", { params: cleanParams(rest) })
    return unwrapData<GroupPage>(r.data)
  },

  async getGroup(groupId: number) {
    const r = await api.get<GroupDetail>(`/api/groups/${groupId}`)
    return unwrapData<GroupDetail>(r.data)
  },

  async createGroup(payload: CreateGroupRequest) {
    const r = await api.post<GroupResponse>("/api/groups", payload)
    return unwrapData<GroupResponse>(r.data)
  },

  async updateGroup(groupId: number, payload: UpdateGroupRequest) {
    const r = await api.put<GroupResponse>(`/api/groups/${groupId}`, payload)
    return unwrapData<GroupResponse>(r.data)
  },

  async deleteGroup(groupId: number) {
    const r = await api.delete(`/api/groups/${groupId}`)
    return unwrapData<Record<string, unknown>>(r.data)
  },

  async updateGroupLecturer(groupId: number, payload: UpdateLecturerRequest) {
    const r = await api.patch<GroupResponse>(`/api/groups/${groupId}/lecturer`, payload)
    return unwrapData<GroupResponse>(r.data)
  },

  async getGroupMembers(groupId: number) {
    const r = await api.get<MemberResponse[]>(`/api/groups/${groupId}/members`)
    return unwrapData<MemberResponse[]>(r.data)
  },

  async addMember(groupId: number, payload: AddMemberRequest) {
    const r = await api.post<MemberResponse>(`/api/groups/${groupId}/members`, payload)
    return unwrapData<MemberResponse>(r.data)
  },

  async removeMember(groupId: number, userId: number) {
    const r = await api.delete(`/api/groups/${groupId}/members/${userId}`)
    return unwrapData<Record<string, unknown>>(r.data)
  },

  async promoteToLeader(groupId: number, userId: number) {
    const r = await api.put<MemberResponse>(`/api/groups/${groupId}/members/${userId}/promote`)
    return unwrapData<MemberResponse>(r.data)
  },

  async demoteToMember(groupId: number, userId: number) {
    const r = await api.put<MemberResponse>(`/api/groups/${groupId}/members/${userId}/demote`)
    return unwrapData<MemberResponse>(r.data)
  },
}
