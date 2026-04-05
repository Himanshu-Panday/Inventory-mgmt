import axios from "axios";

const API_ROOT =
  import.meta.env.VITE_API_BASE_URL || window.location.origin;

const API_BASE_URL = `${API_ROOT}/api/auth`;

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser";

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const setAuthHeader = (token) => {
  if (token) {
    authApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete authApi.defaults.headers.common.Authorization;
  }
};

export const loadStoredSession = () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  const user = userJson ? JSON.parse(userJson) : null;

  setAuthHeader(accessToken);

  return {
    accessToken,
    refreshToken,
    user,
  };
};

export const storeSession = ({ access, refresh, user }) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthHeader(access);
};

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setAuthHeader(null);
};

export const loginRequest = async ({ email, password }) => {
  const { data } = await authApi.post("/login/", { email, password });
  storeSession(data);
  return data;
};

export const getMeRequest = async () => {
  const { data } = await authApi.get("/me/");
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  return data;
};

export const refreshTokenRequest = async () => {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) return null;

  const { data } = await refreshClient.post("/token/refresh/", { refresh });
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  setAuthHeader(data.access);
  return data.access;
};

export const listUsersRequest = async () => {
  const { data } = await authApi.get("/users/");
  return data;
};

export const createUserRequest = async (payload) => {
  const { data } = await authApi.post("/users/", payload);
  return data;
};

export const updateUserRequest = async ({ id, payload }) => {
  const { data } = await authApi.patch(`/users/${id}/`, payload);
  return data;
};

export const deleteUserRequest = async (id) => {
  await authApi.delete(`/users/${id}/`);
  return id;
};

export const listMasterOptionsRequest = async () => {
  const { data } = await authApi.get("/masters/");
  return data;
};

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url?.includes("/login/") ||
      originalRequest.url?.includes("/token/refresh/")
    ) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const newAccess = await refreshTokenRequest();

      if (!newAccess) {
        clearSession();
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return authApi(originalRequest);
    } catch (refreshError) {
      clearSession();
      return Promise.reject(refreshError);
    }
  },
);
