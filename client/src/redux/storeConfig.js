/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2024-07-18 22:29:14
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2024-07-18 22:29:24
 * @FilePath: \my-app\src\redux\storeConfig.js
 * @Description: Redux Store配置中心 - 优化版本
 */
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import userReducer from './userStore'
import hotelReducer from './hotelStore'
import flightReducer from './flightStore'   
import orderReducer from './orderStore'      

import storage from 'redux-persist/lib/storage' 
import { persistReducer, persistStore } from 'redux-persist'

// 优化持久化配置
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'],  // 保留用户登录状态
}

// 单独配置需要持久化searchParams的store
const flightPersistConfig = {
  key: 'flight',
  storage,
  whitelist: ['searchParams'],  // 只持久化搜索参数，避免缓存过期数据
}

const hotelPersistConfig = {
  key: 'hotel',
  storage,
  whitelist: [],  
}

const rootReducer = combineReducers({
  user: userReducer,
  hotel: persistReducer(hotelPersistConfig, hotelReducer),
  flight: persistReducer(flightPersistConfig, flightReducer), 
  order: orderReducer, // 订单状态不持久化，使用sessionStorage
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
  // 瀏覽器安裝Redux DevTools(查看狀態管理)
  
  // 优化middleware配置
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['_persist'],
      },
    }),
})

export const persistor = persistStore(store)
export default store