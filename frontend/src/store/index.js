import { configureStore } from "@reduxjs/toolkit";

import itemMasterReducer from "./itemMasterSlice";
import sizeMasterReducer from "./sizeMasterSlice";
import vendorMasterReducer from "./vendorMasterSlice";

export const store = configureStore({
  reducer: {
    itemMaster: itemMasterReducer,
    sizeMaster: sizeMasterReducer,
    vendorMaster: vendorMasterReducer,
  },
});
