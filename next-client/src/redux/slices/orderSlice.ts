import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/utils/api/client";

interface DraftOrder {
  [key: string]: any;
}

interface OrderState {
  orders: any[];
  flightOrders: any[];
  flashSaleOrders: any[];
  currentOrder: any | null;
  draftHotelOrder: DraftOrder | null;
  draftOrders: DraftOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  flightOrders: [],
  flashSaleOrders: [],
  currentOrder: null,
  draftHotelOrder: null,
  draftOrders: [],
  loading: false,
  error: null,
};

// 异步 thunk
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
  }
);

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<any[]>) => {
      state.orders = action.payload;
    },
    setCurrentOrder: (state, action: PayloadAction<any>) => {
      state.currentOrder = action.payload;
    },
    addOrder: (state, action: PayloadAction<any>) => {
      state.orders.push(action.payload);
    },
    clearOrders: (state) => {
      state.orders = [];
      state.flightOrders = [];
      state.flashSaleOrders = [];
      state.currentOrder = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setDraftHotelOrder: (state, action: PayloadAction<DraftOrder | null>) => {
      state.draftHotelOrder = action.payload;
    },
    clearDraftHotelOrder: (state) => {
      state.draftHotelOrder = null;
    },
    restoreDraftOrders: (state, action: PayloadAction<DraftOrder[]>) => {
      state.draftOrders = action.payload;
    },
    clearDraftOrders: (state) => {
      state.draftOrders = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data || {};
        state.orders = data.allOrder || [];
        state.flightOrders = data.allFlightOrder || [];
        state.flashSaleOrders = data.allFlashSaleOrder || [];
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setOrders,
  setCurrentOrder,
  addOrder,
  clearOrders,
  setLoading,
  setError,
  setDraftHotelOrder,
  clearDraftHotelOrder,
  restoreDraftOrders,
  clearDraftOrders,
} = orderSlice.actions;
export default orderSlice.reducer;
