import { useMutation } from "@tanstack/react-query"
import type { LoginRequest, RegisterRequest } from "../types/auth"
import { authApi } from "../api/authApi"

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
