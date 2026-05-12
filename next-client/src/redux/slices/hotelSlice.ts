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
  async (params: { hotelId: string; startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const { hotelId, startDate, endDate } = params;
      const queryParams = new URLSearchParams({ hotelId });
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiClient.get(`/hotels/search?${queryParams.toString()}`);
      console.log('[API] Full URL:', `/hotels/search?${queryParams.toString()}`)
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data[0]; 
      }
      return rejectWithValue("Hotel not found");
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
        state.availableRooms = action.payload?.availableRooms || [];
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
