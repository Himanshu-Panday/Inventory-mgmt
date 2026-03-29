import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createVendorList,
  deleteVendorList,
  listVendorLists,
  updateVendorList,
} from "../api/mgmt";

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.vendor_name?.[0]) return data.vendor_name[0];
  if (data && typeof data === "object") {
    try {
      return JSON.stringify(data);
    } catch {
      return "Request failed";
    }
  }
  return error?.message || "Request failed";
};

export const fetchVendors = createAsyncThunk("vendorMaster/fetchAll", async (_, thunkApi) => {
  try {
    return await listVendorLists();
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const addVendor = createAsyncThunk("vendorMaster/add", async (payload, thunkApi) => {
  try {
    return await createVendorList(payload);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const editVendor = createAsyncThunk(
  "vendorMaster/edit",
  async ({ id, payload }, thunkApi) => {
    try {
      return await updateVendorList({ id, payload });
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const removeVendor = createAsyncThunk("vendorMaster/remove", async (id, thunkApi) => {
  try {
    await deleteVendorList(id);
    return id;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

const vendorMasterSlice = createSlice({
  name: "vendorMaster",
  initialState: {
    records: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addVendor.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.submitting = false;
        state.records.push(action.payload);
      })
      .addCase(addVendor.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(editVendor.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(editVendor.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.map((record) =>
          record.id === action.payload.id ? action.payload : record,
        );
      })
      .addCase(editVendor.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(removeVendor.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(removeVendor.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.filter((record) => record.id !== action.payload);
      })
      .addCase(removeVendor.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export default vendorMasterSlice.reducer;
