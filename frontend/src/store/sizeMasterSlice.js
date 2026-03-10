import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createSizeModel,
  deleteSizeModel,
  listSizeModels,
  updateSizeModel,
} from "../api/mgmt";

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.name?.[0] ||
  "Request failed";

export const fetchSizes = createAsyncThunk("sizeMaster/fetchAll", async (_, thunkApi) => {
  try {
    return await listSizeModels();
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const addSize = createAsyncThunk("sizeMaster/add", async (payload, thunkApi) => {
  try {
    return await createSizeModel(payload);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const editSize = createAsyncThunk("sizeMaster/edit", async ({ id, payload }, thunkApi) => {
  try {
    return await updateSizeModel({ id, payload });
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const removeSize = createAsyncThunk("sizeMaster/remove", async (id, thunkApi) => {
  try {
    await deleteSizeModel(id);
    return id;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

const sizeMasterSlice = createSlice({
  name: "sizeMaster",
  initialState: {
    records: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSizes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSizes.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchSizes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addSize.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addSize.fulfilled, (state, action) => {
        state.submitting = false;
        state.records.push(action.payload);
      })
      .addCase(addSize.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(editSize.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(editSize.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.map((record) =>
          record.id === action.payload.id ? action.payload : record,
        );
      })
      .addCase(editSize.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(removeSize.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(removeSize.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.filter((record) => record.id !== action.payload);
      })
      .addCase(removeSize.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export default sizeMasterSlice.reducer;
