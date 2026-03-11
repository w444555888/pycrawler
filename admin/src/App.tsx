/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2025-06-05 19:39:35
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2025-06-05 20:40:00
 * @FilePath: \my-app\admin\src\App.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, notification } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import './App.css';
import 'leaflet/dist/leaflet.css';


import { checkLogin } from './utils/auth';
import { socket } from "./utils/socket";


import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Hotels from './pages/Hotels';
import Orders from './pages/Orders';
import Flights from './pages/Flights';
import FlightOrders from './pages/FlightOrders';
import HotelFlashSale from './pages/HotelFlashSale';
import HotelFlashSaleOrders from './pages/HotelFlashSaleOrders';
import SubscribeList from './pages/SubscribeList';





const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const user = await checkLogin();
      setIsLogin(!!user);
      setIsLoading(false);
    };
    verify();
  }, []);

  if (isLoading) {
    return (
      <div className="fullscreen-center">
        <Spin size="large" />
      </div>
    );
  }

  return isLogin ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    // 新訂單通知
    socket.on("new-order", (data: any) => {
      api.info({
        message: "新訂單通知",
        description: (
          <div>
            <div>
              <strong>客戶：</strong>
              {data.userName}
            </div>
            <div>
              <strong>飯店：</strong>
              {data.hotelId}
            </div>
            <div>
              <strong>總金額：</strong>${data.totalPrice}
            </div>
          </div>
        ),
        placement: "topRight",
        duration: 5,
      });
    });

    return () => {
      socket.off("new-order");
    };
  }, [api]);

  return (
    <ConfigProvider locale={zhTW}>
      {contextHolder}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          >
            <Route path="users" element={<Users />} />
            <Route path="hotels" element={<Hotels />} />
            <Route path="hotel-flash-sale" element={<HotelFlashSale />} />
            <Route path="flash-sale-orders" element={<HotelFlashSaleOrders />} />
            <Route path="subscribe" element={<SubscribeList />} />
            <Route path="orders" element={<Orders />} />
            <Route path="flights" element={<Flights />} />
            <Route path="flight-orders" element={<FlightOrders />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
