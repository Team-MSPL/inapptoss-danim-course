import { createSlice } from "@reduxjs/toolkit";

export const travelSlice = createSlice({
  name: "travel",
  initialState: {
    title: "",
    country: null,
  },
  reducers: {
    updateFiled: (state, { payload }) => {
      const { field, value } = payload;
      if (state.hasOwnProperty(field)) {
        state[field] = value;
      }
    },
  },
});

export const travelSliceActions = travelSlice.actions;

export default travelSlice.reducer;
