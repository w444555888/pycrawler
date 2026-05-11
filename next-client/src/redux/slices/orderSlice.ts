import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface OrderState {
  orders: any[];
  currentOrder: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

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
      state.currentOrder = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setOrders,
  setCurrentOrder,
  addOrder,
  clearOrders,
  setLoading,
  setError,
} = orderSlice.actions;
export default orderSlice.reducer;
