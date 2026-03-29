import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { createWaxReceive, deleteWaxReceive, listWaxReceives, updateWaxReceive } from "../api/mgmt";

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.vendor?.[0]) return data.vendor[0];
  if (data && typeof data === "object") {
    try {
      return JSON.stringify(data);
    } catch {
      return "Request failed";
    }
  }
  return error?.message || "Request failed";
};

export const fetchWaxReceives = createAsyncThunk("waxReceive/fetchAll", async (_, thunkApi) => {
  try {
    return await listWaxReceives();
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const addWaxReceive = createAsyncThunk("waxReceive/add", async (payload, thunkApi) => {
  try {
    return await createWaxReceive(payload);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const editWaxReceive = createAsyncThunk(
  "waxReceive/edit",
  async ({ id, payload }, thunkApi) => {
    try {
      return await updateWaxReceive({ id, payload });
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error));
    }
  },
);

export const removeWaxReceive = createAsyncThunk(
  "waxReceive/remove",
  async (id, thunkApi) => {
    try {
      await deleteWaxReceive(id);
      return id;
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error));
    }
  },
);

const waxReceiveSlice = createSlice({
  name: "waxReceive",
  initialState: {
    records: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWaxReceives.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWaxReceives.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchWaxReceives.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addWaxReceive.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addWaxReceive.fulfilled, (state, action) => {
        state.submitting = false;
        state.records.push(action.payload);
      })
      .addCase(addWaxReceive.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(editWaxReceive.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(editWaxReceive.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.map((record) =>
          record.id === action.payload.id ? action.payload : record,
        );
      })
      .addCase(editWaxReceive.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(removeWaxReceive.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(removeWaxReceive.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.filter((record) => record.id !== action.payload);
      })
      .addCase(removeWaxReceive.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export default waxReceiveSlice.reducer;
