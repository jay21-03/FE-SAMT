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

export const userGroupApi = {
  async listUsers(query?: UserListQuery) {
    const r = await api.get<UserPage>("/api/users", { params: query })
    return r.data
  },

  async getUser(userId: number) {
    const r = await api.get<UserResponse>(`/api/users/${userId}`)
    return r.data
  },

  async updateUser(userId: number, payload: UpdateUserRequest) {
    const r = await api.put<UserResponse>(`/api/users/${userId}`, payload)
    return r.data
  },

  async getUserGroups(userId: number) {
    const r = await api.get<UserGroupsResponse>(`/api/users/${userId}/groups`)
    return r.data
  },

  async listSemesters() {
    const r = await api.get<Semester[]>("/api/semesters")
    return r.data
  },

  async getSemester(id: number) {
    const r = await api.get<Semester>(`/api/semesters/${id}`)
    return r.data
  },

  async getActiveSemester() {
    const r = await api.get<Semester>("/api/semesters/active")
    return r.data
  },

  async createSemester(payload: CreateSemesterRequest) {
    const r = await api.post<Semester>("/api/semesters", payload)
    return r.data
  },

  async updateSemester(id: number, payload: UpdateSemesterRequest) {
    const r = await api.put<Semester>(`/api/semesters/${id}`, payload)
    return r.data
  },

  async activateSemester(id: number) {
    const r = await api.patch(`/api/semesters/${id}/activate`)
    return r.data
  },

  async listGroups(query?: GroupListQuery) {
    const r = await api.get<GroupPage>("/api/groups", { params: query })
    return r.data
  },

  async getGroup(groupId: number) {
    const r = await api.get<GroupDetail>(`/api/groups/${groupId}`)
    return r.data
  },

  async createGroup(payload: CreateGroupRequest) {
    const r = await api.post<GroupResponse>("/api/groups", payload)
    return r.data
  },

  async updateGroup(groupId: number, payload: UpdateGroupRequest) {
    const r = await api.put<GroupResponse>(`/api/groups/${groupId}`, payload)
    return r.data
  },

  async deleteGroup(groupId: number) {
    const r = await api.delete(`/api/groups/${groupId}`)
    return r.data
  },

  async updateGroupLecturer(groupId: number, payload: UpdateLecturerRequest) {
    const r = await api.patch<GroupResponse>(`/api/groups/${groupId}/lecturer`, payload)
    return r.data
  },

  async getGroupMembers(groupId: number) {
    const r = await api.get<MemberResponse[]>(`/api/groups/${groupId}/members`)
    return r.data
  },

  async addMember(groupId: number, payload: AddMemberRequest) {
    const r = await api.post<MemberResponse>(`/api/groups/${groupId}/members`, payload)
    return r.data
  },

  async removeMember(groupId: number, userId: number) {
    const r = await api.delete(`/api/groups/${groupId}/members/${userId}`)
    return r.data
  },

  async promoteToLeader(groupId: number, userId: number) {
    const r = await api.put<MemberResponse>(`/api/groups/${groupId}/members/${userId}/promote`)
    return r.data
  },

  async demoteToMember(groupId: number, userId: number) {
    const r = await api.put<MemberResponse>(`/api/groups/${groupId}/members/${userId}/demote`)
    return r.data
  },
}
