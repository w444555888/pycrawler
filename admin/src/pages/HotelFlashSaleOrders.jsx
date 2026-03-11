import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import { request } from "../utils/apiService";

const HotelFlashSaleOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    const res = await request("GET", "/hotelFlashSale/order/all", {}, setLoading);
    if (res.success) {
      setOrders(res.data);
    } else {
      message.error(res.message || "取得搶購訂單失敗");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = [
    {
      title: "訂單編號",
      dataIndex: "_id",
      key: "_id",
    },
    {
      title: "活動名稱",
      dataIndex: ["saleId", "title"],
      key: "saleTitle",
      render: (title) => title || "—",
    },
    {
      title: "使用者",
      dataIndex: ["userId", "username"],
      key: "user",
    },
    {
      title: "飯店",
      dataIndex: ["hotelId", "name"],
      key: "hotel",
    },
    {
      title: "房型",
      dataIndex: ["roomId", "title"],
      key: "room",
    },
    {
      title: "日期",
      dataIndex: "date",
      key: "date",
      render: (d) => d,
    },
    {
      title: "原價",
      dataIndex: "basePrice",
      key: "basePrice",
      render: (v) => `$${v}`,
    },
    {
      title: "折扣",
      dataIndex: "discountRate",
      key: "discountRate",
    },
    {
      title: "最終價格",
      dataIndex: "finalPrice",
      key: "finalPrice",
      render: (v) => `$${v}`,
    },
    {
      title: "建立時間",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>限時搶購訂單</h2>
      <Table
        rowKey="_id"
        dataSource={orders}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default HotelFlashSaleOrders;
