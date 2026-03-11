import React, { useEffect, useState } from "react";
import { Table, message, Popconfirm, Button } from "antd";
import { request } from "../utils/apiService";
import "./subscribeList.scss";

const SubscribeList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSubscribe = async () => {
    const res = await request("GET", "/subscribe", {}, setLoading);
    if (res.success) {
      setList(res.data);
    } else {
      message.error(res.message || "取得訂閱列表失敗");
    }
  };

  useEffect(() => {
    fetchSubscribe();
  }, []);

  const handleDelete = async (id) => {
    const res = await request("DELETE", `/subscribe/${id}`, {}, setLoading);
    if (res.success) {
      message.success("訂閱已刪除");
      fetchSubscribe();
    } else {
      message.error("刪除失敗");
    }
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "訂閱時間",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="確定要刪除嗎？"
          onConfirm={() => handleDelete(record._id)}
        >
          <Button danger>刪除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="subscribe-page">
      <h2 className="title">訂閱管理</h2>
      <Table
        rowKey="_id"
        dataSource={list}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default SubscribeList;
