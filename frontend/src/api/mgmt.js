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

const isFormData = (payload) => payload instanceof FormData;

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

export const listVendorModels = async (options = {}) => {
  const params = {};
  if (options.vendorId) {
    params.vendor = options.vendorId;
  }
  const { data } = await mgmtApi.get("/vendor-models/", { params });
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

export const listVendorLists = async () => {
  const { data } = await mgmtApi.get("/vendor-lists/");
  return data;
};

export const createVendorList = async (payload) => {
  const { data } = await mgmtApi.post("/vendor-lists/", payload);
  return data;
};

export const updateVendorList = async ({ id, payload }) => {
  const { data } = await mgmtApi.patch(`/vendor-lists/${id}/`, payload);
  return data;
};

export const deleteVendorList = async (id) => {
  await mgmtApi.delete(`/vendor-lists/${id}/`);
  return id;
};

export const listVendorListHistory = async (id) => {
  const { data } = await mgmtApi.get(`/vendor-lists/${id}/history/`);
  return data;
};

export const listWaxReceives = async () => {
  const { data } = await mgmtApi.get("/wax-receives/");
  return data;
};

export const createWaxReceive = async (payload) => {
  const { data } = await mgmtApi.post("/wax-receives/", payload);
  return data;
};

export const updateWaxReceive = async ({ id, payload }) => {
  const { data } = await mgmtApi.patch(`/wax-receives/${id}/`, payload);
  return data;
};

export const deleteWaxReceive = async (id) => {
  await mgmtApi.delete(`/wax-receives/${id}/`);
  return id;
};

export const listWaxReceiveHistory = async (id) => {
  const { data } = await mgmtApi.get(`/wax-receives/${id}/history/`);
  return data;
};

export const listWaxReceiveLines = async (waxReceiveId) => {
  const { data } = await mgmtApi.get("/wax-receive-lines/", {
    params: { wax_receive: waxReceiveId },
  });
  return data;
};

export const createWaxReceiveLine = async (payload) => {
  const config = isFormData(payload)
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined;
  const { data } = await mgmtApi.post("/wax-receive-lines/", payload, config);
  return data;
};

export const updateWaxReceiveLine = async ({ id, payload }) => {
  const config = isFormData(payload)
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined;
  const { data } = await mgmtApi.patch(`/wax-receive-lines/${id}/`, payload, config);
  return data;
};

export const deleteWaxReceiveLine = async (id) => {
  await mgmtApi.delete(`/wax-receive-lines/${id}/`);
  return id;
};

export const listWaxReceiveLineHistory = async (id) => {
  const { data } = await mgmtApi.get(`/wax-receive-lines/${id}/history/`);
  return data;
};

export const listIssueMasters = async () => {
  const { data } = await mgmtApi.get("/issue-masters/");
  return data;
};

export const createIssueMaster = async (payload) => {
  const { data } = await mgmtApi.post("/issue-masters/", payload);
  return data;
};

export const updateIssueMaster = async ({ id, payload }) => {
  const { data } = await mgmtApi.patch(`/issue-masters/${id}/`, payload);
  return data;
};

export const deleteIssueMaster = async (id) => {
  await mgmtApi.delete(`/issue-masters/${id}/`);
  return id;
};

export const listIssueMasterHistory = async (id) => {
  const { data } = await mgmtApi.get(`/issue-masters/${id}/history/`);
  return data;
};

export const listStockManagement = async () => {
  const { data } = await mgmtApi.get("/stock-management/");
  return data;
};

export const listStockInDetails = async (id) => {
  const { data } = await mgmtApi.get(`/stock-management/${id}/in_details/`);
  return data;
};

export const listDeletedRecords = async (modelName) => {
  const params = {};
  if (modelName) {
    params.model = modelName;
  }
  const { data } = await mgmtApi.get("/deleted-records/", { params });
  return data;
};

export const recoverDeletedRecord = async (id) => {
  const { data } = await mgmtApi.post(`/deleted-records/${id}/recover/`);
  return data;
};

export const deleteDeletedRecord = async (id) => {
  await mgmtApi.delete(`/deleted-records/${id}/`);
  return id;
};
