import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createItemModel,
  deleteItemModel,
  listItemModels,
  updateItemModel,
} from "../api/mgmt";

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.name?.[0] ||
  "Request failed";

export const fetchItems = createAsyncThunk("itemMaster/fetchAll", async (_, thunkApi) => {
  try {
    return await listItemModels();
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const addItem = createAsyncThunk("itemMaster/add", async (payload, thunkApi) => {
  try {
    return await createItemModel(payload);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const editItem = createAsyncThunk("itemMaster/edit", async ({ id, payload }, thunkApi) => {
  try {
    return await updateItemModel({ id, payload });
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const removeItem = createAsyncThunk("itemMaster/remove", async (id, thunkApi) => {
  try {
    await deleteItemModel(id);
    return id;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

const itemMasterSlice = createSlice({
  name: "itemMaster",
  initialState: {
    records: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addItem.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addItem.fulfilled, (state, action) => {
        state.submitting = false;
        state.records.push(action.payload);
      })
      .addCase(addItem.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(editItem.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(editItem.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.map((record) =>
          record.id === action.payload.id ? action.payload : record,
        );
      })
      .addCase(editItem.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(removeItem.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        state.submitting = false;
        state.records = state.records.filter((record) => record.id !== action.payload);
      })
      .addCase(removeItem.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export default itemMasterSlice.reducer;
