import axiosClient from "./axiosClient";

export const loginApi = (data: { email: string; password: string }) => {
  return axiosClient.post("/auth/login", data);
};

export const registerApi = (data: { email: string; password: string; role: string }) => {
  return axiosClient.post("/auth/register", data);
};

export const getMeApi = () => {
  return axiosClient.get("/auth/me"); // trả về role: ADMIN | LECTURER | STUDENT
};