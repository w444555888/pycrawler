import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/utils/api/client";

interface FlightState {
  searchResults: any[];
  selectedFlight: any | null;
  searchParams: {
    departureCity: string;
    arrivalCity: string;
    departureIata: string;
    arrivalIata: string;
  };
  departureSuggestions: {
    items: any[];
    showSuggestions: boolean;
    loading: boolean;
    page: number;
    hasNext: boolean;
  };
  arrivalSuggestions: {
    items: any[];
    showSuggestions: boolean;
    loading: boolean;
    page: number;
    hasNext: boolean;
  };
  searchLoading: boolean;
  pagination: any;
  loading: boolean;
  error: string | null;
}

const initialState: FlightState = {
  searchResults: [],
  selectedFlight: null,
  searchParams: {
    departureCity: "",
    arrivalCity: "",
    departureIata: "",
    arrivalIata: "",
  },
  departureSuggestions: {
    items: [],
    showSuggestions: false,
    loading: false,
    page: 1,
    hasNext: false,
  },
  arrivalSuggestions: {
    items: [],
    showSuggestions: false,
    loading: false,
    page: 1,
    hasNext: false,
  },
  searchLoading: false,
  pagination: {},
  loading: false,
  error: null,
};

// 异步 thunks
export const fetchFlights = createAsyncThunk(
  "flight/fetchFlights",
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/flight/search", { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch flights");
    }
  }
);

export const fetchAirportSuggestions = createAsyncThunk(
  "flight/fetchAirportSuggestions",
  async (searchTerm: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/flight/airports", { params: { search: searchTerm } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch suggestions");
    }
  }
);

export const flightSlice = createSlice({
  name: "flight",
  initialState,
  reducers: {
    setSearchParams: (state, action: PayloadAction<any>) => {
      state.searchParams = action.payload;
    },
    setSelectedFlight: (state, action: PayloadAction<any>) => {
      state.selectedFlight = action.payload;
    },
    restoreSelectedFlight: (state) => {
      state.selectedFlight = null;
    },
    setDepartureCity: (state, action: PayloadAction<string>) => {
      state.searchParams.departureCity = action.payload;
    },
    setArrivalCity: (state, action: PayloadAction<string>) => {
      state.searchParams.arrivalCity = action.payload;
    },
    setDepartureIata: (state, action: PayloadAction<string>) => {
      state.searchParams.departureIata = action.payload;
    },
    setArrivalIata: (state, action: PayloadAction<string>) => {
      state.searchParams.arrivalIata = action.payload;
    },
    setShowDepartureSuggestions: (state, action: PayloadAction<boolean>) => {
      state.departureSuggestions.showSuggestions = action.payload;
    },
    setShowArrivalSuggestions: (state, action: PayloadAction<boolean>) => {
      state.arrivalSuggestions.showSuggestions = action.payload;
    },
    clearFlightData: (state) => {
      state.searchResults = [];
      state.selectedFlight = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetFlightStore: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlights.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(fetchFlights.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload?.data || [];
        state.pagination = action.payload?.pagination || {};
      })
      .addCase(fetchFlights.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAirportSuggestions.pending, (state) => {
        state.departureSuggestions.loading = true;
      })
      .addCase(fetchAirportSuggestions.fulfilled, (state, action) => {
        state.departureSuggestions.loading = false;
        state.departureSuggestions.items = action.payload?.data || [];
      })
      .addCase(fetchAirportSuggestions.rejected, (state, action) => {
        state.departureSuggestions.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSearchParams,
  setSelectedFlight,
  restoreSelectedFlight,
  setDepartureCity,
  setArrivalCity,
  setDepartureIata,
  setArrivalIata,
  setShowDepartureSuggestions,
  setShowArrivalSuggestions,
  clearFlightData,
  clearError,
  resetFlightStore,
} = flightSlice.actions;

export default flightSlice.reducer;
