import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { request } from '../utils/apiService';
import { toast } from 'react-toastify';

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

// 异步创建订单
export const createHotelOrder = createAsyncThunk(
  'order/createHotelOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const result = await request('POST', '/order', orderData);
      return result.success ? result.data : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 异步创建航班订单  
export const createFlightOrder = createAsyncThunk(
  'order/createFlightOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const result = await request('POST', '/flight-order', orderData);
      return result.success ? result.data : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const orderStore = createSlice({
  name: 'order',
  initialState: {
    // 各类订单数据
    hotelOrders: [],
    flightOrders: [],
    flashSaleOrders: [],
    
    // 草稿订单（待支付状态）
    draftHotelOrder: null,
    draftFlightOrder: null,
    
    // 数据获取状态
    loading: false,
    error: null,
    lastUpdated: null,
    
    // 创建订单状态
    creating: false,
    createError: null,
    
    // 订单统计
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0
    }
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
    
    // 设置草稿航班订单（从Flight页面跳转时使用）
    setDraftFlightOrder: (state, action) => {
      state.draftFlightOrder = {
        ...action.payload,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟过期
      };
      // 保存到sessionStorage
      try {
        sessionStorage.setItem('draftFlightOrder', JSON.stringify(state.draftFlightOrder));
      } catch (e) {
        console.warn('无法保存草稿航班订单到sessionStorage:', e);
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
        
        const flightDraft = sessionStorage.getItem('draftFlightOrder');
        if (flightDraft) {
          const parsed = JSON.parse(flightDraft);
          if (new Date(parsed.expiresAt) > new Date()) {
            state.draftFlightOrder = parsed;
          } else {
            sessionStorage.removeItem('draftFlightOrder');
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
    },
    
    clearDraftFlightOrder: (state) => {
      state.draftFlightOrder = null;
      try {
        sessionStorage.removeItem('draftFlightOrder');
      } catch (e) {
        console.warn('无法清除草稿航班订单:', e);
      }
    },
    
    // 直接设置订单数据（避免重复API调用）
    setHotelOrders: (state, action) => {
      state.hotelOrders = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    setFlightOrders: (state, action) => {
      state.flightOrders = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    setFlashSaleOrders: (state, action) => {
      state.flashSaleOrders = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    // 添加新订单到列表顶部
    addHotelOrder: (state, action) => {
      state.hotelOrders.unshift(action.payload);
      state.stats.totalOrders += 1;
      if (action.payload.status === 'pending') {
        state.stats.pendingOrders += 1;
      }
    },
    
    addFlightOrder: (state, action) => {
      state.flightOrders.unshift(action.payload);
      state.stats.totalOrders += 1;
    },
    
    // 更新订单状态
    updateOrderStatus: (state, action) => {
      const { type, orderId, status } = action.payload;
      let orders = [];
      
      if (type === 'hotel') orders = state.hotelOrders;
      else if (type === 'flight') orders = state.flightOrders;
      else if (type === 'flashSale') orders = state.flashSaleOrders;
      
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
      }
    },
    
    // 计算订单统计
    calculateStats: (state) => {
      const allOrders = [
        ...state.hotelOrders,
        ...state.flightOrders,
        ...state.flashSaleOrders
      ];
      
      state.stats = {
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(order => order.status === 'pending').length,
        completedOrders: allOrders.filter(order => order.status === 'completed').length
      };
    },
    
    // 清除错误
    clearError: (state) => {
      state.error = null;
      state.createError = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // 获取用户订单
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.hotelOrders = action.payload.allOrder || [];
        state.flightOrders = action.payload.allFlightOrder || [];
        state.flashSaleOrders = action.payload.allFlashSaleOrder || [];
        state.lastUpdated = new Date().toISOString();
        
        // 计算统计数据
        orderStore.caseReducers.calculateStats(state);
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '获取订单列表失败';
        toast.error(state.error);
      })
      
      // 创建酒店订单
      .addCase(createHotelOrder.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createHotelOrder.fulfilled, (state, action) => {
        state.creating = false;
        // 添加新订单到列表
        state.hotelOrders.unshift(action.payload);
        // 清除草稿订单
        orderStore.caseReducers.clearDraftHotelOrder(state);
        // 重新计算统计
        orderStore.caseReducers.calculateStats(state);
        toast.success('酒店订单创建成功！');
      })
      .addCase(createHotelOrder.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload || '创建酒店订单失败';
        toast.error(state.createError);
      })
      
      // 创建航班订单
      .addCase(createFlightOrder.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createFlightOrder.fulfilled, (state, action) => {
        state.creating = false;
        // 添加新订单到列表
        state.flightOrders.unshift(action.payload);
        // 清除草稿订单
        orderStore.caseReducers.clearDraftFlightOrder(state);
        // 重新计算统计
        orderStore.caseReducers.calculateStats(state);
        toast.success('航班订单创建成功！');
      })
      .addCase(createFlightOrder.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload || '创建航班订单失败';
        toast.error(state.createError);
      });
  }
});

export const {
  setDraftHotelOrder,
  setDraftFlightOrder,
  restoreDraftOrders,
  clearDraftHotelOrder,
  clearDraftFlightOrder,
  setHotelOrders,
  setFlightOrders,
  setFlashSaleOrders,
  addHotelOrder,
  addFlightOrder,
  updateOrderStatus,
  calculateStats,
  clearError
} = orderStore.actions;

export default orderStore.reducer;