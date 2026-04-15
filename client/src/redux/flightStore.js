import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { request } from '../utils/apiService';

// 异步获取航班搜索结果
export const fetchFlights = createAsyncThunk(
  'flight/fetchFlights',
  async ({ params, page = 1 }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      queryParams.append('page', page.toString());
      queryParams.append('limit', '10');

      const result = await request('GET', `/flight/search?${queryParams.toString()}`);
      return result.success ? result.data : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 异步获取机场建议
export const fetchAirportSuggestions = createAsyncThunk(
  'flight/fetchAirportSuggestions',
  async ({ keyword, type, page = 1 }, { rejectWithValue }) => {
    try {
      const result = await request('GET', `/flight/locations/search?keyword=${keyword}&page=${page}&limit=10`);
      return result.success ? { data: result.data, type } : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const flightStore = createSlice({
  name: 'flight',
  initialState: {
    // 搜索参数
    searchParams: {
      departureCity: '',
      departureIata: '',
      arrivalCity: '',
      arrivalIata: '',
      tripType: 'roundtrip',
      departDate: null,
      returnDate: null,
    },

    // 机场建议
    departureSuggestions: {
      items: [],
      loading: false,
      showSuggestions: false,
      keyword: '',
      pagination: { current: 1, total: 0 },
      hasNext: true,
      page: 1
    },

    arrivalSuggestions: {
      items: [],
      loading: false,
      showSuggestions: false,
      keyword: '',
      pagination: { current: 1, total: 0 },
      hasNext: true,
      page: 1
    },

    // 搜索结果
    searchResults: [],
    searchLoading: false,
    searchError: null,

    // 选中的航班（用于预订）
    selectedFlight: null,

    // 分页
    pagination: {
      current: 1,
      total: 0,
      pageSize: 10
    }
  },

  reducers: {
    // 设置出发城市相关
    setDepartureCity: (state, action) => {
      state.searchParams.departureCity = action.payload;
    },

    setDepartureIata: (state, action) => {
      state.searchParams.departureIata = action.payload;
    },

    setShowDepartureSuggestions: (state, action) => {
      state.departureSuggestions.showSuggestions = action.payload;
    },

    // 设置抵达城市相关
    setArrivalCity: (state, action) => {
      state.searchParams.arrivalCity = action.payload;
    },

    setArrivalIata: (state, action) => {
      state.searchParams.arrivalIata = action.payload;
    },

    setShowArrivalSuggestions: (state, action) => {
      state.arrivalSuggestions.showSuggestions = action.payload;
    },

    // 选择航班（保存到Redux和sessionStorage）
    setSelectedFlight: (state, action) => {
      state.selectedFlight = action.payload;
      // 同时保存到sessionStorage避免页面刷新丢失
      try {
        sessionStorage.setItem('selectedFlight', JSON.stringify(action.payload));
      } catch (e) {
        console.warn('无法保存航班信息到sessionStorage:', e);
      }
    },

    // 从sessionStorage恢复航班信息
    restoreSelectedFlight: (state) => {
      try {
        const cached = sessionStorage.getItem('selectedFlight');
        if (cached) {
          state.selectedFlight = JSON.parse(cached);
        }
      } catch (e) {
        console.warn('无法从sessionStorage恢复航班信息:', e);
      }
    },

    // 清除选中的航班
    clearSelectedFlight: (state) => {
      state.selectedFlight = null;
      try {
        sessionStorage.removeItem('selectedFlight');
      } catch (e) {
        console.warn('无法清除sessionStorage中的航班信息:', e);
      }
    },

    // 清除搜索结果
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
      state.pagination = { current: 1, total: 0, pageSize: 10 };
    },

    // 重置所有状态
    resetFlightStore: (state) => {
      Object.assign(state, flightStore.getInitialState());
      // 不清除sessionStorage，保留用户的航班选择
    }
  },

  extraReducers: (builder) => {
    builder
      // 航班搜索
      .addCase(fetchFlights.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(fetchFlights.fulfilled, (state, action) => {
        state.searchLoading = false;
        const newResults = action.payload.items || [];
        const isAppending = action.meta.arg?.append === true;

        if (isAppending) {
          state.searchResults = [...state.searchResults, ...newResults];
        } else {
          state.searchResults = newResults;
        }
        const backendPagination = action.payload.pagination || {};
        state.pagination = {
          current: backendPagination.page || 1,
          total: backendPagination.total || 0,
          pageSize: backendPagination.limit || 10,
          hasNext: backendPagination.hasNext || false
        };
      })
      .addCase(fetchFlights.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || '搜索航班时出错';
      })


      .addCase(fetchAirportSuggestions.pending, (state, action) => {
        const { type } = action.meta.arg;
        if (type === 'departure') {
          state.departureSuggestions.loading = true;
        } else {
          state.arrivalSuggestions.loading = true;
        }
      })
      .addCase(fetchAirportSuggestions.fulfilled, (state, action) => {
        const { type } = action.payload;
        const append = action.meta.arg?.append;
        const newItems = action.payload.data.items || [];
        const backendPagination = action.payload.data.pagination || {};
        if (type === 'departure') {
          state.departureSuggestions.loading = false;
          state.departureSuggestions.items = append
            ? [...state.departureSuggestions.items, ...newItems]
            : newItems;

          state.departureSuggestions.pagination = {
            current: backendPagination.page || 1,
            total: backendPagination.total || 0,
            pageSize: backendPagination.limit || 10,
            hasNext: backendPagination.hasNext || false
          };

          state.departureSuggestions.hasNext = backendPagination.hasNext ?? false;
        } else {
          state.arrivalSuggestions.loading = false;
          state.arrivalSuggestions.items = append
            ? [...state.arrivalSuggestions.items, ...newItems]
            : newItems;
            
          state.arrivalSuggestions.pagination = {
            current: backendPagination.page || 1,
            total: backendPagination.total || 0,
            pageSize: backendPagination.limit || 10,
            hasNext: backendPagination.hasNext || false
          };

          state.arrivalSuggestions.hasNext = backendPagination.hasNext ?? false;
        }
      })
      .addCase(fetchAirportSuggestions.rejected, (state, action) => {
        const { type } = action.meta.arg;
        if (type === 'departure') {
          state.departureSuggestions.loading = false;
        } else {
          state.arrivalSuggestions.loading = false;
        }
        console.error('获取机场建议失败:', action.payload);
      });
  }
});

export const {
  setDepartureCity,
  setDepartureIata,
  setShowDepartureSuggestions,
  setArrivalCity,
  setArrivalIata,
  setShowArrivalSuggestions,
  setSelectedFlight,
  restoreSelectedFlight,
  resetFlightStore
} = flightStore.actions;

export default flightStore.reducer;