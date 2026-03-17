import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { userGroupApi } from "../api/userGroupApi"
import type {
  AddMemberRequest,
  CreateGroupRequest,
  CreateSemesterRequest,
  GroupListQuery,
  UpdateGroupRequest,
  UpdateLecturerRequest,
  UpdateSemesterRequest,
  UpdateUserRequest,
  UserListQuery,
} from "../types/userGroup"
import { queryKeys } from "./queryKeys"

const retryUnlessForbidden = (failureCount: number, error: any) => {
  const status = error?.response?.status
  if (status === 403) return false
  return failureCount < 2
}

export const useUsers = (
  query?: UserListQuery,
  options?: { enabled?: boolean; retry?: boolean }
) =>
  useQuery({
    queryKey: queryKeys.users(query),
    queryFn: () => userGroupApi.listUsers(query),
    enabled: options?.enabled ?? true,
    retry: options?.retry === false ? false : retryUnlessForbidden,
  })

export const useUser = (userId: number) =>
  useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => userGroupApi.getUser(userId),
    enabled: userId > 0,
  })

export const useUserGroups = (userId: number) =>
  useQuery({
    queryKey: queryKeys.userGroups(userId),
    queryFn: () => userGroupApi.getUserGroups(userId),
    enabled: userId > 0,
  })

export const useGroups = (query?: GroupListQuery, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: queryKeys.groups(query),
    queryFn: () => userGroupApi.listGroups(query),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  })

export const useGroup = (groupId: number) =>
  useQuery({
    queryKey: queryKeys.group(groupId),
    queryFn: () => userGroupApi.getGroup(groupId),
    enabled: groupId > 0,
  })

export const useGroupMembers = (groupId: number) =>
  useQuery({
    queryKey: queryKeys.groupMembers(groupId),
    queryFn: () => userGroupApi.getGroupMembers(groupId),
    enabled: groupId > 0,
  })

export const useSemesters = () =>
  useQuery({
    queryKey: queryKeys.semesters,
    queryFn: () => userGroupApi.listSemesters(),
    staleTime: 300_000,
  })

export const useActiveSemester = () =>
  useQuery({
    queryKey: queryKeys.activeSemester,
    queryFn: () => userGroupApi.getActiveSemester(),
    staleTime: 300_000,
  })

export const useSemesterByCode = (code: string) =>
  useQuery({
    queryKey: ["semester", "code", code],
    queryFn: () => userGroupApi.getSemesterByCode(code),
    enabled: code.trim().length > 0,
    staleTime: 300_000,
  })

export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UpdateUserRequest }) =>
      userGroupApi.updateUser(userId, payload),
    onSuccess: (_data: unknown, vars: { userId: number; payload: UpdateUserRequest }) => {
      qc.invalidateQueries({ queryKey: queryKeys.user(vars.userId) })
      qc.invalidateQueries({ queryKey: queryKeys.users() })
    },
  })
}

export const useCreateSemester = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSemesterRequest) => userGroupApi.createSemester(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.semesters }),
  })
}

export const useUpdateSemester = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSemesterRequest }) =>
      userGroupApi.updateSemester(id, payload),
    onSuccess: (_data: unknown, vars: { id: number; payload: UpdateSemesterRequest }) => {
      qc.invalidateQueries({ queryKey: queryKeys.semester(vars.id) })
      qc.invalidateQueries({ queryKey: queryKeys.semesters })
    },
  })
}

export const useCreateGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGroupRequest) => userGroupApi.createGroup(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.groups() }),
  })
}

export const useUpdateGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: UpdateGroupRequest }) =>
      userGroupApi.updateGroup(groupId, payload),
    onSuccess: (_data: unknown, vars: { groupId: number; payload: UpdateGroupRequest }) => {
      qc.invalidateQueries({ queryKey: queryKeys.group(vars.groupId) })
      qc.invalidateQueries({ queryKey: queryKeys.groups() })
    },
  })
}

export const useUpdateGroupLecturer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: UpdateLecturerRequest }) =>
      userGroupApi.updateGroupLecturer(groupId, payload),
    onSuccess: (_data: unknown, vars: { groupId: number; payload: UpdateLecturerRequest }) => {
      qc.invalidateQueries({ queryKey: queryKeys.group(vars.groupId) })
      qc.invalidateQueries({ queryKey: queryKeys.groups() })
    },
  })
}

export const useAddMember = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: AddMemberRequest }) =>
      userGroupApi.addMember(groupId, payload),
    onSuccess: (_data: unknown, vars: { groupId: number; payload: AddMemberRequest }) => {
      qc.invalidateQueries({ queryKey: queryKeys.group(vars.groupId) })
      qc.invalidateQueries({ queryKey: queryKeys.groupMembers(vars.groupId) })
    },
  })
}

export const useRemoveMember = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      userGroupApi.removeMember(groupId, userId),
    onSuccess: (_data: unknown, vars: { groupId: number; userId: number }) => {
      qc.invalidateQueries({ queryKey: queryKeys.group(vars.groupId) })
      qc.invalidateQueries({ queryKey: queryKeys.groupMembers(vars.groupId) })
    },
  })
}
