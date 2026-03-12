import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { LoginRequest, RegisterRequest } from "../types/auth"
import type { UpdateProfileRequest } from "../types/identity"
import { authApi } from "../api/authApi"
import { queryKeys } from "./queryKeys"

export const useLogin = () =>
  useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
  })

export const useRegister = () =>
  useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
  })

export const useLogout = () =>
  useMutation({
    mutationFn: () => authApi.logout(),
  })

export const useProfile = () =>
  useQuery({
    queryKey: queryKeys.authSession,
    queryFn: () => authApi.getProfile(),
  })

export const useUpdateProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => authApi.updateProfile(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.authSession }),
  })
}
