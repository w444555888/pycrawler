import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/utils/api/client";

interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

interface UserState {
  login: boolean;
  userInfo: UserInfo | null;
  hotels: any[];
  theme: "light" | "dark";
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  login: false,
  userInfo: null,
  hotels: [],
  theme: "light",
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logIn: (state) => {
      state.login = true;
    },
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
      state.login = true;
    },
    logOut: (state) => {
      state.login = false;
      state.userInfo = null;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { logIn, setUserInfo, logOut, toggleTheme, setLoading, setError } =
  userSlice.actions;
export default userSlice.reducer;
