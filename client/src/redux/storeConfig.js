import { configureStore, combineReducers } from '@reduxjs/toolkit'
import userReducer from './userStore'
import hotelReducer from './hotelStore'
import flightReducer from './flightStore'   
import orderReducer from './orderStore'      

import storage from 'redux-persist/lib/storage' 
import { persistReducer, persistStore } from 'redux-persist'

const userPersistConfig = {
  key: 'user',
  storage,
}

const flightPersistConfig = {
  key: 'flight',
  storage,
  whitelist: ['searchParams'], 
}

const hotelPersistConfig = {
  key: 'hotel',
  storage,
  whitelist: [],  
}

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  hotel: persistReducer(hotelPersistConfig, hotelReducer),
  flight: persistReducer(flightPersistConfig, flightReducer), 
  order: orderReducer, // 订单状态不持久化
})

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  // 瀏覽器安裝Redux DevTools(查看狀態管理)
  
  // 優化middleware配置
  // Redux序列化检查：state和action必须可被JSON.stringify()转换
  // 不可序列化的类型：function、Promise、Date、class实例等
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略redux-persist的action，因为包含function引用等不可序列化数据
        // persist/PERSIST: 初始化持久化时的action，包含register函数
        // persist/REHYDRATE: 从localStorage恢复数据时的action，包含rehydrate函数  
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // 忽略state中redux-persist添加的内部元数据
        ignoredPaths: ['_persist'],
      },
    }),
})

export const persistor = persistStore(store)
export default store