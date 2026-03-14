import { configureStore } from "@reduxjs/toolkit";

import itemMasterReducer from "./itemMasterSlice";
import sizeMasterReducer from "./sizeMasterSlice";
import vendorMasterReducer from "./vendorMasterSlice";
import waxReceiveReducer from "./waxReceiveSlice";
import issueMasterReducer from "./issueMasterSlice";

export const store = configureStore({
  reducer: {
    itemMaster: itemMasterReducer,
    sizeMaster: sizeMasterReducer,
    vendorMaster: vendorMasterReducer,
    waxReceive: waxReceiveReducer,
    issueMaster: issueMasterReducer,
  },
});
