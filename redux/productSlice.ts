import { createSlice } from '@reduxjs/toolkit';
import { getProductList } from './travle-slice';

const initialState = {
  productList: [],
  total: 0,
  loading: false,
  error: null,
  sortType: 'recommend',
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setSortType(state, action) {
      state.sortType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProductList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductList.fulfilled, (state, action) => {
        state.loading = false;
        state.productList = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(getProductList.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : '상품을 불러오는데 실패했습니다.';
      });
  },
});

export const { setSortType } = productSlice.actions;
export default productSlice.reducer;
