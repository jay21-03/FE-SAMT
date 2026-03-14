import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projectConfigApi } from "../api/projectConfigApi"
import type { CreateConfigRequest, UpdateConfigRequest } from "../types/projectConfig"
import { queryKeys } from "./queryKeys"

export const useProjectConfig = (id: string) =>
  useQuery({
    queryKey: queryKeys.projectConfig(id),
    queryFn: () => projectConfigApi.getConfig(id),
    staleTime: 30_000,
  })

export const useProjectConfigByGroup = (groupId: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: queryKeys.projectConfigByGroup(groupId),
    queryFn: () => projectConfigApi.getConfigByGroupId(groupId),
    enabled: (options?.enabled ?? true) && groupId > 0,
    staleTime: 30_000,
  })

export const useCreateProjectConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateConfigRequest) => projectConfigApi.createConfig(payload),
    onSuccess: (data: { data: { groupId: number } }) => {
      qc.invalidateQueries({ queryKey: queryKeys.projectConfigByGroup(data.data.groupId) })
    },
  })
}

export const useUpdateProjectConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateConfigRequest }) =>
      projectConfigApi.updateConfig(id, payload),
    onSuccess: (_data: unknown, vars: { id: string; payload: UpdateConfigRequest }) => {
      qc.invalidateQueries({ queryKey: queryKeys.projectConfig(vars.id) })
    },
  })
}

export const useDeleteProjectConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectConfigApi.deleteConfig(id),
    onSuccess: (_data: unknown, id: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.projectConfig(id) })
    },
  })
}

export const useVerifyProjectConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectConfigApi.verifyConfig(id),
    onSuccess: (_data: unknown, id: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.projectConfig(id) })
    },
  })
}

export const useRestoreProjectConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectConfigApi.restoreConfig(id),
    onSuccess: (_data: unknown, id: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.projectConfig(id) })
    },
  })
}
