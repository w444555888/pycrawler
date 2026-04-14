
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/**
 * 登入狀態 : login
 * 主題 : theme
 */
const userStore = createSlice({
  name: "user",
  initialState: {
    login: false,
    userInfo: null,
    Hotels: [],
    theme: "light",
    loading: false,
    error: null,
  },
  reducers: {
    // 驗證 cookie 時用
    logIn: (state) => {
      state.login = true;
    },
    // 登入成功
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    logOut: (state) => {
      state.login = false;
      state.userInfo = null;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
  },
});

export const { logIn, setUserInfo, logOut, toggleTheme } = userStore.actions;
export default userStore.reducer;
