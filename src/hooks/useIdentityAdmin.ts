import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { identityAdminApi } from "../api/identityAdminApi"
import type { AdminCreateUserRequest, AuditQuery, ExternalAccountsRequest } from "../types/identity"
import { queryKeys } from "./queryKeys"

export const useSecurityEvents = (query?: AuditQuery) =>
  useQuery({
    queryKey: queryKeys.auditSecurity(query),
    queryFn: () => identityAdminApi.getSecurityEvents(query),
    staleTime: 15_000,
  })

export const useAuditRange = (query?: AuditQuery) =>
  useQuery({
    queryKey: queryKeys.auditRange(query),
    queryFn: () => identityAdminApi.getAuditByRange(query),
    staleTime: 15_000,
  })

export const useCreateAdminUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminCreateUserRequest) => identityAdminApi.createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers() }),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => identityAdminApi.deleteUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers() }),
  })
}

export const useRestoreUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => identityAdminApi.restoreUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers() }),
  })
}

export const useLockUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason?: string }) =>
      identityAdminApi.lockUser(userId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers() }),
  })
}

export const useUnlockUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => identityAdminApi.unlockUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers() }),
  })
}

export const useUpdateExternalAccounts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: ExternalAccountsRequest }) =>
      identityAdminApi.updateExternalAccounts(userId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers() }),
  })
}
