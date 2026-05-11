import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/utils/api/client";

interface HotelState {
  currentHotel: any | null;
  availableRooms: any[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelState = {
  currentHotel: null,
  availableRooms: [],
  loading: false,
  error: null,
};

export const fetchSingleHotel = createAsyncThunk(
  "hotel/fetchSingleHotel",
  async (searchParams: URLSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/hotels/search?${searchParams.toString()}`);
      return response.data?.data?.[0] || rejectWithValue("Hotel not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

export const hotelSlice = createSlice({
  name: "hotel",
  initialState,
  reducers: {
    setCurrentHotel: (state, action: PayloadAction<any>) => {
      state.currentHotel = action.payload;
    },
    setAvailableRooms: (state, action: PayloadAction<any[]>) => {
      state.availableRooms = action.payload;
    },
    clearHotelData: (state) => {
      state.currentHotel = null;
      state.availableRooms = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSingleHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSingleHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.currentHotel = action.payload;
      })
      .addCase(fetchSingleHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentHotel, setAvailableRooms, clearHotelData, clearError } =
  hotelSlice.actions;
export default hotelSlice.reducer;
