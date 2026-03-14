import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { createWaxReceive, listWaxReceives } from "../api/mgmt";

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.vendor?.[0] ||
  "Request failed";

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
      });
  },
});

export default waxReceiveSlice.reducer;
