import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import moment from "moment";
import axiosAuth from "./api";
import { tendencyList } from "../utill/tendency";
import axios from "axios";

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
    season: [0, 0, 0, 0], //계절
    nDay: 0, // 몇박인지 5박6일이면 5
    day: [], //타임테이블 용날짜 리스트
    Place: {
      name: "",
      lat: 0,
      lng: 0,
      category: 4,
      takenTime: 30,
      photo: "",
      formatted_address: "",
    }, //숙소, 필수여행지 구글검색했을때 정보 저장하는용
    accommodations: [], // 숙소리스트
    essentialPlaces: [], //필수여행지 리스트
    distance: 5, //여행반경
    transit: 0, //교통수단 0= 자차 1=대중교통
    tendency: tendencyList.map((item) => {
      return Array(item.list.length).fill(0);
    }), //성향
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
    enrollDayInfo: (state, { payload }) => {
      state.day = payload.day;
      state.nDay = payload.nDay;
      state.accommodations = payload.accommodations;
      state.season = payload.season;
    },
    enrollPlace: (state, { payload }) => {
      state.Place = payload;
    },
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

//장소 정보 얻어오는거
export const googleDetailApi = createAsyncThunk(
  "/googleDetailApi",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axiosGoogle.get(
        `/place/details/json?place_id=${data.placeId}&fields=photos%2Cname%2Crating%2Creviews%2Ceditorial_summary&language=ko&key=AIzaSyA_nsvAajvyiWj-FeJO6u1-yZYsOBkoPOk`
      );
      //제로리절트 처리하기
      return response.data;
    } catch (error: any) {
      throw rejectWithValue(error.code);
    }
  }
);
export const axiosGoogle = axios.create({
  baseURL: "https://maps.googleapis.com/maps/api",
  headers: { "content-type": "application/json" },
});
export const travelSliceActions = travelSlice.actions;

export default travelSlice.reducer;
