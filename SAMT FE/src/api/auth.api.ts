import axiosClient from "./axiosClient";

export const loginApi = (data: { email: string; password: string }) => {
  return axiosClient.post("/auth/login", data);
};

export const getMeApi = () => {
  return axiosClient.get("/auth/me"); // trả về role: ADMIN | LECTURER | STUDENT
};