import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import axiosAuth from "./api";

interface InquiryState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: InquiryState = {
  loading: false,
  error: null,
  success: false,
};

const inquirySlice = createSlice({
  name: 'inquiry',
  initialState,
  reducers: {
    resetInquiryState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postInquiry.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(postInquiry.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(postInquiry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 1대 1 문의 하기
export const postInquiry = createAsyncThunk(
  '/inquiry/inquiry',
  async (data: { userName: string; inquire: string }, { rejectWithValue }) => {
    try {
      const response = await axiosAuth.post('/inquiry/inquiry', data);
      // 서버가 201 : "문의 완료." 를 반환
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const { resetInquiryState } = inquirySlice.actions;
export default inquirySlice.reducer;