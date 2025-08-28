import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import moment from "moment";
import axiosAuth from "./api";
import axios from "axios";
import { useDistance } from "../hooks/useDistance";
const tendencyList = [
  {
    list: [
      "나홀로",
      "연인과",
      "친구와",
      "가족과",
      "효도",
      "자녀와",
      "반려동물과",
    ],
  },
  {
    list: [
      "힐링",
      "활동적인",
      "배움이 있는",
      "맛있는",
      "교통이 편한",
      "알뜰한",
    ],
  },
  {
    list: ["드라이브", "산책", "이색체험", "레저 스포츠", "쇼핑", "시티투어"],
  },
  {
    list: ["바다", "산", "공원", "사진 명소", "실내여행지", "문화시설"],
  },
  {
    list: ["전통", "유적지", "성지", "사찰", "박물관"],
  },
];
export const travelSlice = createSlice({
  name: "travel",
  initialState: {
    travelName: "",
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
    bandwidth: true,
    popular: 5,
    regionInfo: { name: "", photo: "", lat: 0, lng: 0 },

    presetTendencyList: [],
    presetDatas: [[[]]], //프리셋 저장하는곳
    timetable: [[]], // 타임테이블
    enoughPlace: false,
    autoRecommendFlag: false,
    travelId: "",
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
    enrollTendency: (state, { payload }) => {
      state.tendency = payload;
    },
    enrollTransit: (state, { payload }) => {
      state.transit = payload;
    },
    enrollBandwidth: (state, { payload }) => {
      state.bandwidth = payload;
    },
    enrollTravelName: (state, { payload }) => {
      state.travelName = payload;
    },
    selectRegion: (state, { payload }) => {
      state.region = payload;
    },
    setAutoRecommendFlag: (state, { payload }) => {
      state.autoRecommendFlag = payload;
    },
    enrollTimetable: (state, { payload }) => {
      state.timetable = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getRegionInfo.fulfilled, (state, { payload }) => {
      state.regionInfo.name = payload.name;
      state.regionInfo.photo = Array.isArray(payload.photo)
        ? payload.photo[0]
        : payload.photo;
      state.regionInfo.lat = payload.latitude;
      state.regionInfo.lng = payload.longitude;
    });
    builder.addCase(getOneTravelCourse.fulfilled, (state, { payload }) => {
      state.day = payload.day;
      state.nDay = payload.nDay - 1;
      state.region = payload.region;
      state.timetable = payload.timetable;
      state.transit = payload.transit;
      state.tendency = payload.tendency;
      state.travelId = payload._id;
      state.travelName = payload.travelName;
    });
    builder.addCase(getTravelAi.fulfilled, (state, { payload }) => {
      console.log(payload.data.resultData);
      let updateItem = [
        [...Array(payload.data?.resultData.length - 1)].map(() => []),
      ];
      payload.data?.resultData.forEach((timeTable, tIndex) => {
        let copy = [...Array(timeTable.length)].map(() => []);
        timeTable.forEach((item, idx) => {
          let time = 6;
          let dinnerTime = [22, 29];
          let lunchTime = [8, 15];
          let lunch = false;
          let dinner = false;
          const updateItem = {
            name: "", //넣을거
            lat: 0,
            lng: 0,
            category: 0, //넣을거
            x: idx,
            y: 0, //넣을거
            id: 0, //넣을거
            takenTime: 0, //넣을거
          };
          item.some((value, index) => {
            if (index == 0) {
              if (idx == 0) {
                time =
                  (state.timeLimitArray[0] - 6) * 2 +
                  state.minuteLimitArray[0] / 30;
              } else if (copy[idx - 1].at(-1)?.category == 4) {
                copy[idx].push({
                  ...copy[idx - 1].at(-1),
                  y: 0,
                  takenTime: 150,
                  x: idx,
                });
              }
            }
            if (
              time >= lunchTime[0] &&
              time <= lunchTime[1] &&
              lunch == false
            ) {
              copy[idx].push({
                ...updateItem,
                name: "점심 추천",
                y: time,
                takenTime: 60,
                id: idx + index + "점심 추천" + value.lat.toFixed(5),
                category: 1,
                lat: value.lat,
                lng: value.lng,
                photo: "",
                key: idx + index + "점심 추천" + value.lat.toFixed(5),
              });
              lunch = true;
              time += 3;
            }
            if (
              time >= dinnerTime[0] &&
              time <= dinnerTime[1] &&
              dinner == false
            ) {
              copy[idx].push({
                ...updateItem,
                name: "저녁 추천",
                y: time,
                takenTime: 60,
                id: idx + index + "저녁 추천" + value.lat.toFixed(5),
                category: 1,
                lat: value.lat,
                lng: value.lng,
                photo: "",
                key: idx + index + "저녁 추천" + value.lat.toFixed(5),
              });
              dinner = true;
              time += 3;
            }
            if (value.category != 4) {
              if (
                idx == timeTable.length - 1 &&
                time + value.takenTime / 30 >=
                  (state.timeLimitArray[1] - 6) * 2 +
                    state.minuteLimitArray[1] / 30
              ) {
                if (
                  time >=
                  (state.timeLimitArray[1] - 6) * 2 +
                    state.minuteLimitArray[1] / 30
                )
                  return true;
                copy[idx].push({
                  ...value,
                  x: idx,
                  y: time,
                  id: idx + index + value?.name + value.lat.toFixed(5),
                  key: idx + index + value?.name + value.lat.toFixed(5),
                  takenTime:
                    ((state.timeLimitArray[1] - 6) * 2 +
                      state.minuteLimitArray[1] / 30 -
                      time) *
                    30,
                });
                return true;
              } else {
                copy[idx].push({
                  ...value,
                  x: idx,
                  y: time,
                  id: idx + index + value?.name + value.lat.toFixed(5),
                  key: idx + index + value?.name + value.lat.toFixed(5),
                });
                time += value.takenTime / 30;
                let bandwidthTime = state.bandwidth ? 1 : 0;
                let calMoveTime = Math.ceil(
                  useDistance({
                    departure: {
                      lat:
                        copy[idx].at(
                          copy[idx].at(-2)?.name?.includes("추천") ? -3 : -2
                        )?.lat ?? value?.lat,
                      lng:
                        copy[idx].at(
                          copy[idx].at(-2)?.name?.includes("추천") ? -3 : -2
                        )?.lng ?? value?.lng,
                    },
                    arrival: { lat: value?.lat, lng: value?.lng },
                  })
                );
                console.log(calMoveTime);
                index != item.length - 1 &&
                  (time +=
                    calMoveTime <= 10
                      ? 1
                      : calMoveTime <= 20
                      ? 2
                      : calMoveTime <= 50
                      ? 3
                      : 4 + bandwidthTime);
              }
            }
            if (
              index == item.length - 1 &&
              idx != timeTable.length - 1 &&
              value.category != 4
            ) {
              copy[idx].push({
                ...updateItem,
                name: "숙소 추천",
                y: 36,
                //y: time < 36 ? 36 : time,
                takenTime: time < 36 ? 360 : (48 - time) * 30,

                id: idx + index + "숙소 추천" + value.lat.toFixed(5),
                key: idx + index + "숙소 추천" + value.lat.toFixed(5),
                category: 4,
                lat: value.lat,
                lng: value.lng,
                photo: "",
              });
            } else if (value.category == 4 && index == item.length - 1) {
              //copy[idx].pop();
              copy[idx].push({
                ...value,
                y: 36,
                //y: time < 36 ? 36 : time,
                takenTime: time < 36 ? 360 : (48 - time) * 30,
                id: idx + index + value?.name + value.lat.toFixed(5),
                key: idx + index + value?.name + value.lat.toFixed(5),
                category: 4,
                lat: value.lat,
                lng: value.lng,
                photo: "",
              });
            }
          });
        });
        updateItem[tIndex] = copy;
        // updateItem.push(copy);
      });
      state.presetDatas = updateItem;
      state.presetTendencyList = payload.data.bestPointList;
      // state.presetDatas = payload.data.resultData;
      state.enoughPlace = payload.data.enoughPlace;
    });
  },
});
//여행 코스 추천 ai
export const getTravelAi = createAsyncThunk(
  "/getTravelAi",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosAuth.post(`/ai/run`, data, {
        timeout: 60000,
      });
      return response.data;
    } catch (error: any) {
      throw rejectWithValue(error.code);
    }
  }
);
export const socialConnect = createAsyncThunk(
  "/user/signUpAndIn",
  async (data, thunkAPI) => {
    try {
      const response = await axiosAuth.post("/user/signUpAndIn", {
        userName: "테스트용",
        userProfileImage: "https://danim.me/square_logo.png",
        userToken: "000476.1231223.0625",
        loginProvider: "toss",
        signUpFlag: true,
        fcmToken: "",
        version: 2,
      });
      let userData = { ...response.data, userIdToken: data.userToken };
      //성공했을때
      if (response.status != 202) {
        axiosAuth.defaults.headers.Authorization = `Bearer ${userData.userJwtToken}`;
        // thunkAPI.dispatch(userSliceActions.setUserInfo(userData));
        if (response.status == 203) {
          // thunkAPI.dispatch(userSliceActions.setReLogin(true));
        }
        //axiosAuth.defaults.headers.Authorization = `Bearer ${userData.userJwtToken}`;
      }
      return response;
    } catch (error) {
      throw thunkAPI.rejectWithValue(error);
    }
  }
);

//트립어드바이져 디테일
export const detailTripadvisor = createAsyncThunk(
  "/detailTripadvisor",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axiosTripadvisor.get(
        `${
          data.id
        }/details?key=${"02F5B2FD8DAD4CFBA7C2D77F11FD9BD8"}&&language=ko`
      );
      return response.data;
    } catch (error: any) {
      throw rejectWithValue(error.code);
    }
  }
);

//내 여행 목록 가져오는거
export const getMyTravelList = createAsyncThunk(
  "/getMyTravelList",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosAuth.get(
        `/travelCourse/travelList?userId=${data?.userId}`
      );
      return response.data.travelCourseList;
    } catch (error: any) {
      console.log(error);
      throw rejectWithValue(error.code);
    }
  }
);

//여행 코스 하나 가져오기
export const getOneTravelCourse = createAsyncThunk(
  "/getOneTravelCourse",
  async (data: { travelId: string }, { rejectWithValue }) => {
    try {
      const response = await axiosAuth.get(
        `/travelCourse/getOneTravelCourse?travelId=${data.travelId}`
      );
      return response.data;
    } catch (error: any) {
      throw rejectWithValue(error.code);
    }
  }
);
// 지역 사진 가져오는거
export const getRegionInfo = createAsyncThunk(
  "/place/regionInfo",
  async (data: any, { rejectWithValue }) => {
    try {
      let regionName;
      if (data.region.split(" ")[1] == "전체") {
        regionName = data.region.split(" ")[0];
      } else {
        regionName = data.region;
      }
      if (regionName.includes("제주")) {
        regionName = "제주 전체";
      }
      console.log(regionName, data);
      // regionName = '해외/Japan/간토 (Kanto) !도쿄';
      // console.log(regionName.split(''), regionName.length);
      // console.log('해외/Japan/간토 (Kanto) !도쿄'.split(''), '해외/Japan/간토 (Kanto) !도쿄'.length);
      const response = await axiosAuth.get(
        `/place/regionInfo?region=${regionName}`,
        data
      );
      console.log(response.data, "qwe");
      return response.data;
    } catch (error: any) {
      console.log(error, "cc");
      throw rejectWithValue(error.code);
    }
  }
);

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
export const axiosKakao = axios.create({
  baseURL: "https://dapi.kakao.com/v2/local/search",
  headers: {
    "content-type": "application/json",
    Authorization: `KakaoAK ${"7dcbff3c20877747849dacb808c37bc2"}`,
  },
});
//카카오 식당,카페 등 추천 장소 얻는 거
export const recommendApi = createAsyncThunk(
  "/recommendApi",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axiosKakao.get(
        `/category.json?category_group_code=${data.category}&x=${data.lng}&y=${data.lat}&radius=${data.radius}&sort=accuracy`
      );
      return response.data.documents;
    } catch (error: any) {
      throw rejectWithValue(error.code);
    }
  }
);

export const axiosTripadvisor = axios.create({
  baseURL: "https://api.content.tripadvisor.com/api/v1/location",

  headers: { "content-type": "application/json" },
});

//트립어드바이져 식당,카페 등 추천 장소 얻는 거
export const recommendTripadvisor = createAsyncThunk(
  "/recommendTripadvisor",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axiosTripadvisor.get(
        `/search?key=${"02F5B2FD8DAD4CFBA7C2D77F11FD9BD8"}&searchQuery=${
          data.name
        }&category=${data.category}&latLong=${data.lat}%2C${
          data.lng
        }&language=ko&radius=${data.radius}&radiusUnit=m`
      );
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
