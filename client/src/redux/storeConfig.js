/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2024-07-18 22:29:14
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2024-07-18 22:29:24
 * @FilePath: \my-app\src\redux\storeConfig.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import userReducer from './userStore'
import hotelReducer from './hotelStore'

import storage from 'redux-persist/lib/storage' // 使用 localStorage
import { persistReducer, persistStore } from 'redux-persist'


const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // 持久化 user reducer
}

const rootReducer = combineReducers({
  user: userReducer,
  hotel: hotelReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
  // 瀏覽器安裝Redux DevTools(查看狀態管理)
})

export const persistor = persistStore(store)
export default store