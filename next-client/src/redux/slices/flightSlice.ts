import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/utils/api/client";

interface FlightState {
  searchParams: any;
  flights: any[];
  loading: boolean;
  error: string | null;
}

const initialState: FlightState = {
  searchParams: {},
  flights: [],
  loading: false,
  error: null,
};

export const flightSlice = createSlice({
  name: "flight",
  initialState,
  reducers: {
    setSearchParams: (state, action: PayloadAction<any>) => {
      state.searchParams = action.payload;
    },
    setFlights: (state, action: PayloadAction<any[]>) => {
      state.flights = action.payload;
    },
    clearFlightData: (state) => {
      state.flights = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setSearchParams, setFlights, clearFlightData, clearError } =
  flightSlice.actions;
export default flightSlice.reducer;
