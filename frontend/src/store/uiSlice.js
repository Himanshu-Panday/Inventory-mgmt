import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "activeTab";

const initialState = {
  activeTab: localStorage.getItem(STORAGE_KEY) || "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      localStorage.setItem(STORAGE_KEY, action.payload);
    },
  },
});

export const { setActiveTab } = uiSlice.actions;

export default uiSlice.reducer;
