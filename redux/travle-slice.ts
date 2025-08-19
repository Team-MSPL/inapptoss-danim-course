import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import moment from "moment";
import axiosAuth from "./api";

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
    departure: { lat: 0, lng: 0, name: "" },
    departureAirport: { lat: 0, lng: 0, name: "" },
    departureTrain: { lat: 0, lng: 0, name: "" },
    departureSelected: "",
    accommodations: [],
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
    setDeparture: (state, { payload }) => {
      state.departure = payload;
    },
    setDepartureSelected: (state, { payload }) => {
      state.departureSelected = payload;
      let copy = state.accommodations;
      copy[0] =
        payload == ""
          ? {
              lat: 0,
              lng: 0,
              name: "",
              category: 6,
              takenTime: 30,
              photo: "",
            }
          : {
              ...state[payload],
              category: 6,
              takenTime: 30,
              photo: "",
            };
      state.accommodations = copy;
    }, //TODO카테고리
  },
});

//axiosAuth.defaults.headers.Authorization = `Bearer ${userData.userJwtToken}`;

export const handleNearBySearch = createAsyncThunk(
  "/place/nearbysearch",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axiosAuth.get(
        `/place/placeGeoInfo?region=${data.region}&name=${data.name}`
      );
      return response;
    } catch (error: any) {
      throw rejectWithValue(error.code);
    }
  }
);
export const travelSliceActions = travelSlice.actions;

export default travelSlice.reducer;
