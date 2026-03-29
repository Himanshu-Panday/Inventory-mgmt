import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createIssueMaster,
  deleteIssueMaster,
  listIssueMasters,
  updateIssueMaster,
} from "../api/mgmt";

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.item?.[0]) return data.item[0];
  if (data?.size?.[0]) return data.size[0];
  if (data && typeof data === "object") {
    try {
      return JSON.stringify(data);
    } catch {
      return "Request failed";
    }
  }
  return error?.message || "Request failed";
};

export const fetchIssueMasters = createAsyncThunk("issueMaster/fetchAll", async (_, thunkApi) => {
  try {
    return await listIssueMasters();
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const addIssueMaster = createAsyncThunk("issueMaster/add", async (payload, thunkApi) => {
  try {
    return await createIssueMaster(payload);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const editIssueMaster = createAsyncThunk(
  "issueMaster/edit",
  async ({ id, payload }, thunkApi) => {
    try {
      return await updateIssueMaster({ id, payload });
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const removeIssueMaster = createAsyncThunk(
  "issueMaster/remove",
  async (id, thunkApi) => {
    try {
      await deleteIssueMaster(id);
      return id;
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error));
    }
  },
);

const issueMasterSlice = createSlice({
  name: "issueMaster",
  initialState: {
    records: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIssueMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssueMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchIssueMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addIssueMaster.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addIssueMaster.fulfilled, (state, action) => {
        state.submitting = false;
        state.records.push(action.payload);
      })
      .addCase(addIssueMaster.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(editIssueMaster.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(editIssueMaster.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.map((record) =>
          record.id === action.payload.id ? action.payload : record,
        );
      })
      .addCase(editIssueMaster.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(removeIssueMaster.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(removeIssueMaster.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.filter((record) => record.id !== action.payload);
      })
      .addCase(removeIssueMaster.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export default issueMasterSlice.reducer;
