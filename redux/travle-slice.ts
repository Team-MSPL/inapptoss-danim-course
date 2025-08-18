import { createSlice } from "@reduxjs/toolkit";
import moment from "moment";

export const travelSlice = createSlice({
  name: "travel",
  initialState: {
    title: "",
    country: null,
    cityIndex: null,
    region: [],
    cityDistance: [],
    selectStartDate: moment().startOf("day").add(12, "hours"),
    selectEndDate: null,
    timeLimitArray: [9, 20],
    minuteLimitArray: [0, 0],
  },
  reducers: {
    updateFiled: (state, { payload }) => {
      const { field, value } = payload;
      if (state.hasOwnProperty(field)) {
        state[field] = value;
      }
    },
    selectPopularity: (state, { payload }) => {
      state.region = payload.region;
      state.cityIndex = payload.cityIndex;
      state.cityDistance = payload.cityDistance;
    },
    firstSelectRegion: (state, { payload }) => {
      state.region = payload.region;
      state.cityDistance = payload.cityDistance;
    },
    setTimeAndMinute: (state, { payload }) => {
      state.timeLimitArray = payload?.time;
      state.minuteLimitArray = payload?.minute;
    },
  },
});

export const travelSliceActions = travelSlice.actions;

export default travelSlice.reducer;
