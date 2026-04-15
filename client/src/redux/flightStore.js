import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { request } from "../utils/apiService";

// 异步获取航班搜索结果
export const fetchFlights = createAsyncThunk(
  "flight/fetchFlights",
  async ({ params, page = 1, append = false }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ""
        ) {
          queryParams.append(key, params[key]);
        }
      });

      queryParams.append("page", page);
      queryParams.append("limit", "10");

      const result = await request(
        "GET",
        `/flight/search?${queryParams.toString()}`,
      );

      return result.success
        ? {
            ...result.data,
            append,
            page,
          }
        : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// 异步获取机场建议
export const fetchAirportSuggestions = createAsyncThunk(
  "flight/fetchAirportSuggestions",
  async ({ keyword, type, page = 1, append = false }, { rejectWithValue }) => {
    try {
      const result = await request(
        "GET",
        `/flight/locations/search?keyword=${keyword}&page=${page}&limit=10`,
      );
      return result.success
        ? { data: result.data, type, append, page }
        : rejectWithValue(result.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const flightStore = createSlice({
  name: "flight",
  initialState: {
    /* =========================
    search params
    ========================= */
    searchParams: {
      departureCity: "",
      departureIata: "",
      arrivalCity: "",
      arrivalIata: "",
      tripType: "roundtrip",
      departDate: null,
      returnDate: null,
    },

    /* =========================
    flights
    ========================= */
    searchResults: [],
    searchLoading: false,
    searchError: null,

    pagination: {
      current: 1,
      total: 0,
      pageSize: 10,
      hasNext: true,
    },

    /* =========================
    suggestions
    ========================= */
    departureSuggestions: {
      items: [],
      loading: false,
      page: 1,
      hasNext: true,
      showSuggestions: false,
    },

    arrivalSuggestions: {
      items: [],
      loading: false,
      page: 1,
      hasNext: true,
      showSuggestions: false,
    },

    /* =========================
    selected flight
    ========================= */
    selectedFlight: null,
  },

  reducers: {
    /* =========================
    search params
    ========================= */
    setDepartureCity: (state, action) => {
      state.searchParams.departureCity = action.payload;
    },

    setDepartureIata: (state, action) => {
      state.searchParams.departureIata = action.payload;
    },

    setArrivalCity: (state, action) => {
      state.searchParams.arrivalCity = action.payload;
    },

    setArrivalIata: (state, action) => {
      state.searchParams.arrivalIata = action.payload;
    },

    setShowDepartureSuggestions: (state, action) => {
      state.departureSuggestions.showSuggestions = action.payload;
    },

    setShowArrivalSuggestions: (state, action) => {
      state.arrivalSuggestions.showSuggestions = action.payload;
    },

    /* =========================
    selected flight
    ========================= */
    setSelectedFlight: (state, action) => {
      state.selectedFlight = action.payload;

      try {
        sessionStorage.setItem(
          "selectedFlight",
          JSON.stringify(action.payload),
        );
      } catch (e) {
        console.warn("sessionStorage error:", e);
      }
    },

    restoreSelectedFlight: (state) => {
      try {
        const cached = sessionStorage.getItem("selectedFlight");
        if (cached) {
          state.selectedFlight = JSON.parse(cached);
        }
      } catch (e) {
        console.warn("restore error:", e);
      }
    },

    clearSelectedFlight: (state) => {
      state.selectedFlight = null;
      sessionStorage.removeItem("selectedFlight");
    },

    resetFlightStore: (state) => {
      Object.assign(state, flightStore.getInitialState());
    },
  },

  extraReducers: (builder) => {
    /* =========================================================
    flights
    ========================================================= */
    builder
      .addCase(fetchFlights.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })

      .addCase(fetchFlights.fulfilled, (state, action) => {
        state.searchLoading = false;

        const { items = [], pagination = {}, append } = action.payload;

        state.searchResults = append
          ? [...state.searchResults, ...items]
          : items;

        state.pagination = {
          current: pagination.page || action.payload.page,
          total: pagination.total || 0,
          pageSize: pagination.limit || 10,
          hasNext: pagination.hasNext ?? false,
        };
      })

      .addCase(fetchFlights.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || "error";
      });

    /* =========================================================
     suggestions
    ========================================================= */
    builder
      .addCase(fetchAirportSuggestions.pending, (state, action) => {
        const { type } = action.meta.arg;

        if (type === "departure") {
          state.departureSuggestions.loading = true;
        } else {
          state.arrivalSuggestions.loading = true;
        }
      })

      .addCase(fetchAirportSuggestions.fulfilled, (state, action) => {
        const { type } = action.payload;
        const { data, page, append } = action.payload;

        const target =
          type === "departure"
            ? state.departureSuggestions
            : state.arrivalSuggestions;

        target.items = append
          ? [...target.items, ...(data.items || [])]
          : data.items || [];

        target.page = page;
        target.hasNext = data.pagination?.hasNext ?? false;
        target.loading = false;
      })

      .addCase(fetchAirportSuggestions.rejected, (state, action) => {
        const { type } = action.meta.arg || {};

        if (type === "departure") {
          state.departureSuggestions.loading = false;
        } else {
          state.arrivalSuggestions.loading = false;
        }
      });
  },
});

export const {
  setDepartureCity,
  setDepartureIata,
  setArrivalCity,
  setArrivalIata,
  setShowDepartureSuggestions,
  setShowArrivalSuggestions,
  setSelectedFlight,
  restoreSelectedFlight,
  clearSelectedFlight,
  resetFlightStore,
} = flightStore.actions;

export default flightStore.reducer;
