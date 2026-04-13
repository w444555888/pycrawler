import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { request } from '../utils/apiService';


export const fetchSingleHotel = createAsyncThunk(
  'hotel/fetchSingleHotel',
  async (searchParams, { rejectWithValue }) => {
    try {
      const result = await request('GET', `/hotels/search?${searchParams.toString()}`)
      return result.success ? result.data[0] : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message || '網路錯誤');
    }
  }
)


const hotelStore = createSlice({
  name: 'hotel',
  initialState: {
    currentHotel: null,
    availableRooms: [],
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentHotel: (state, action) => {
      state.currentHotel = action.payload
    },
    setAvailableRooms: (state, action) => {
      state.availableRooms = action.payload
    },
    clearHotelData: (state) => {
      state.currentHotel = null
      state.availableRooms = []
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSingleHotel.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSingleHotel.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        state.currentHotel = action.payload
        state.availableRooms = Array.isArray(action.payload?.availableRooms) ? action.payload.availableRooms : []
      })
      .addCase(fetchSingleHotel.rejected, (state, action) => {
        state.loading = false
        state.currentHotel = null
        state.availableRooms = []
        state.error = action.payload || action.error?.message || '獲取飯店資料失敗'
      })
  }
})


export const { setCurrentHotel, setAvailableRooms, clearHotelData, clearError } = hotelStore.actions;
export default hotelStore.reducer;