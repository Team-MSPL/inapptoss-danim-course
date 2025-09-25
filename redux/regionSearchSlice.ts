import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  initialRegionSearchState,
  RegionSearchRequest,
  RegionRecommendation,
} from './type/regionSearchSlice.types';

// 비동기 thunk: 여행 지역 추천 API 호출
export const fetchRegionRecommendations = createAsyncThunk<
  RegionRecommendation[], // 반환 타입
  RegionSearchRequest // 요청 타입
>('regionSearch/fetchRegionRecommendations', async (requestData, { rejectWithValue }) => {
  try {
    const response = await axios.post('<databaseURL>/regionSearch/run', requestData, {
      headers: {
        'Content-Type': 'application/json',
        // JWT 토큰 필요시 아래처럼 추가
        // 'Authorization': `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    // 실제 axios 에러 타입에 맞게 처리
    return rejectWithValue({ code: error.response?.status, message: error.message });
  }
});

const regionSearchSlice = createSlice({
  name: 'regionSearch',
  initialState: initialRegionSearchState,
  reducers: {
    setRequest(state, action: PayloadAction<RegionSearchRequest>) {
      state.request = action.payload;
    },
    setPopularSensitivity(state, action: PayloadAction<number>) {
      state.request.popularSensitivity = action.payload;
    },
    setRecentPosition(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.request.recentPosition = action.payload;
    },
    reset(state) {
      Object.assign(state, initialRegionSearchState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegionRecommendations.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(
        fetchRegionRecommendations.fulfilled,
        (state, action: PayloadAction<RegionRecommendation[]>) => {
          state.response = action.payload;
          state.loading = false;
        },
      )
      .addCase(fetchRegionRecommendations.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const regionSearchActions = regionSearchSlice.actions;
export default regionSearchSlice.reducer;
