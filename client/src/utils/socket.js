import { io } from "socket.io-client";


// export const socket = io(process.env.REACT_APP_API_URL, {
//   transports: ["websocket"],  // 優先使用 WebSocket
//   reconnection: true,         // 允許自動重連
//   reconnectionAttempts: 5,    // 最多重試 5 次
//   reconnectionDelay: 2000,    // 每次間隔 2 秒
//   withCredentials: true,      // 搭配後端 CORS 設定
// });


// socket.on("connect", () => {
//   console.log("已連線到 WebSocket:", socket.id);
// });

// socket.on("disconnect", (reason) => {
//   console.warn("WebSocket 已斷線，原因：", reason);
// });

// socket.on("connect_error", (err) => {
//   console.error("WebSocket 連線錯誤：", err.message);
// });

// socket.on("reconnect_attempt", (attempt) => {
//   console.log(`嘗試重新連線第 ${attempt} 次`);
// });

// socket.on("reconnect_failed", () => {
//   console.error("無法重新連線 WebSocket");
// });
