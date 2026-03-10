import axios from "axios";

const API_ROOT = import.meta.env.VITE_API_ROOT || "http://127.0.0.1:8000";
const MGMT_BASE_URL = `${API_ROOT}/api/mgmt`;
const AUTH_BASE_URL = `${API_ROOT}/api/auth`;
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const mgmtApi = axios.create({
  baseURL: MGMT_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const setAuthHeader = (token) => {
  if (token) {
    mgmtApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete mgmtApi.defaults.headers.common.Authorization;
  }
};

const getStoredTokens = () => ({
  access: localStorage.getItem(ACCESS_TOKEN_KEY),
  refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
});

const refreshAccessToken = async () => {
  const { refresh } = getStoredTokens();
  if (!refresh) return null;

  const { data } = await refreshClient.post("/token/refresh/", { refresh });
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  setAuthHeader(data.access);
  return data.access;
};

const setupAuth = () => {
  const { access } = getStoredTokens();
  setAuthHeader(access);
};

setupAuth();

mgmtApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (
      !originalRequest ||
      error?.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const newAccess = await refreshAccessToken();
      if (!newAccess) return Promise.reject(error);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return mgmtApi(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return Promise.reject(refreshError);
    }
  },
);

export const listSizeModels = async () => {
  const { data } = await mgmtApi.get("/size-models/");
  return data;
};

export const createSizeModel = async (payload) => {
  const { data } = await mgmtApi.post("/size-models/", payload);
  return data;
};

export const updateSizeModel = async ({ id, payload }) => {
  const { data } = await mgmtApi.patch(`/size-models/${id}/`, payload);
  return data;
};

export const deleteSizeModel = async (id) => {
  await mgmtApi.delete(`/size-models/${id}/`);
  return id;
};

export const listSizeModelHistory = async (id) => {
  const { data } = await mgmtApi.get(`/size-models/${id}/history/`);
  return data;
};

export const listItemModels = async () => {
  const { data } = await mgmtApi.get("/item-models/");
  return data;
};

export const createItemModel = async (payload) => {
  const { data } = await mgmtApi.post("/item-models/", payload);
  return data;
};

export const updateItemModel = async ({ id, payload }) => {
  const { data } = await mgmtApi.patch(`/item-models/${id}/`, payload);
  return data;
};

export const deleteItemModel = async (id) => {
  await mgmtApi.delete(`/item-models/${id}/`);
  return id;
};

export const listItemModelHistory = async (id) => {
  const { data } = await mgmtApi.get(`/item-models/${id}/history/`);
  return data;
};

export const listVendorModels = async () => {
  const { data } = await mgmtApi.get("/vendor-models/");
  return data;
};

export const createVendorModel = async (payload) => {
  const { data } = await mgmtApi.post("/vendor-models/", payload);
  return data;
};

export const updateVendorModel = async ({ id, payload }) => {
  const { data } = await mgmtApi.patch(`/vendor-models/${id}/`, payload);
  return data;
};

export const deleteVendorModel = async (id) => {
  await mgmtApi.delete(`/vendor-models/${id}/`);
  return id;
};

export const listVendorModelHistory = async (id) => {
  const { data } = await mgmtApi.get(`/vendor-models/${id}/history/`);
  return data;
};
