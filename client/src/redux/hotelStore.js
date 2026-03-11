import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { request } from '../utils/apiService';
import { toast } from 'react-toastify';


export const fetchSingleHotel = createAsyncThunk(
  'hotel/fetchSingleHotel',
  async (searchParams, { rejectWithValue }) => {
    const result = await request('GET', `/hotels/search?${searchParams.toString()}`)
    return result.success ? result.data[0] : rejectWithValue(result.message);
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
        state.currentHotel = action.payload
        state.availableRooms = Array.isArray(action.payload?.availableRooms) ? action.payload.availableRooms : [];
        toast.success('成功獲取飯店資料')
      })
      .addCase(fetchSingleHotel.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || '獲取飯店資料失敗'
        toast.error(action.payload || '獲取飯店資料失敗')
      })
  }
})


export const { setCurrentHotel, setAvailableRooms } = hotelStore.actions;
export default hotelStore.reducer;