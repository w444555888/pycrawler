import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { request } from '../utils/apiService';

// 异步获取用户所有订单
export const fetchUserOrders = createAsyncThunk(
  'order/fetchUserOrders',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await request('GET', `/users/${userId}`);
      return result.success ? result.data : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const orderStore = createSlice({
  name: 'order',
  initialState: {
    // 酒店草稿訂單（待支付状態）
    draftHotelOrder: null,
    
    // 酒店訂單数据（供 Personal.jsx 使用）
    hotelOrders: [],
    orders: [],
    flightOrders: [],
    flashSaleOrders: [],
    
    // 数据获取状態
    loading: false,
    error: null
  },
  
  reducers: {
    // 设置草稿酒店订单（从Hotel页面跳转时使用）
    setDraftHotelOrder: (state, action) => {
      state.draftHotelOrder = {
        ...action.payload,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟过期
      };
      // 保存到sessionStorage避免页面刷新丢失
      try {
        sessionStorage.setItem('draftHotelOrder', JSON.stringify(state.draftHotelOrder));
      } catch (e) {
        console.warn('无法保存草稿订单到sessionStorage:', e);
      }
    },
    

    // 从sessionStorage恢复草稿订单
    restoreDraftOrders: (state) => {
      try {
        const hotelDraft = sessionStorage.getItem('draftHotelOrder');
        if (hotelDraft) {
          const parsed = JSON.parse(hotelDraft);
          // 检查是否过期（30分钟）
          if (new Date(parsed.expiresAt) > new Date()) {
            state.draftHotelOrder = parsed;
          } else {
            sessionStorage.removeItem('draftHotelOrder');
          }
        }
      } catch (e) {
        console.warn('无法恢复草稿订单:', e);
      }
    },
    // 清除草稿订单
    clearDraftHotelOrder: (state) => {
      state.draftHotelOrder = null;
      try {
        sessionStorage.removeItem('draftHotelOrder');
      } catch (e) {
        console.warn('无法清除草稿酒店订单:', e);
      }
    }
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        const userData = action.payload;
        state.hotelOrders = userData.allOrder || [];
        state.orders = userData.allOrder || [];
        state.flightOrders = userData.flightOrders || [];
        state.flashSaleOrders = userData.flashSaleOrders || [];
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '獲取訂單列表失敗';
      })
  }
});

export const {
  setDraftHotelOrder,
  restoreDraftOrders,
  clearDraftHotelOrder
} = orderStore.actions;

export default orderStore.reducer;