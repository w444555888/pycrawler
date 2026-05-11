import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// 导入 slices
import authReducer from "../slices/authSlice";
import userReducer from "../slices/userSlice";
import hotelReducer from "../slices/hotelSlice";
import flightReducer from "../slices/flightSlice";
import orderReducer from "../slices/orderSlice";

// 持久化配置
const userPersistConfig = {
  key: "user",
  storage,
};

const hotelPersistConfig = {
  key: "hotel",
  storage,
  whitelist: [],
};

const flightPersistConfig = {
  key: "flight",
  storage,
  whitelist: ["searchParams"],
};

// 根 reducer
const rootReducer = combineReducers({
  auth: authReducer,
  user: persistReducer(userPersistConfig, userReducer),
  hotel: persistReducer(hotelPersistConfig, hotelReducer),
  flight: persistReducer(flightPersistConfig, flightReducer),
  order: orderReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredActionPaths: ["register", "rehydrate"],
        ignoredPaths: ["persist"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
