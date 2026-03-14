import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { createIssueMaster, listIssueMasters } from "../api/mgmt";

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.item?.[0] ||
  error?.response?.data?.size?.[0] ||
  "Request failed";

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
      });
  },
});

export default issueMasterSlice.reducer;
