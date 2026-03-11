import React, { useEffect, useState } from 'react';
import { Table, Space, Button, message, Tag, Popconfirm, Dropdown, Menu } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { request } from '../utils/apiService';
import './orders.scss';

interface OrderType {
  _id: string;
  hotelId: string;
  hotelName?: string;
  roomId: string;
  roomTitle?: string;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  payment: {
    method: string;
    status: string;
    transactionId: string;
  };
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await request('GET', '/order');
    if (res.success && Array.isArray(res.data)) {
      setOrders(res.data.length > 0 ? res.data : []);
    } else {
      message.error(res.message || '獲取訂單列表失敗');
    }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    const res = await request('DELETE', `/order/${id}`);
    if (res.success) {
      message.success('取消訂單成功');
      fetchOrders();
    } else {
      message.error(res.message || '取消訂單失敗');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const res = await request('PUT', `/order/${id}`, { status });
    if (res.success) {
      message.success(`訂單狀態已更新為：${status}`);
      fetchOrders();
    } else {
      message.error(res.message || '更新訂單狀態失敗');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns: ColumnsType<OrderType> = [
    {
      title: '訂單編號',
      dataIndex: '_id',
      key: '_id',
      width: 220,
    },
    {
      title: '飯店名稱', 
      dataIndex: 'hotelName',
      key: 'hotelName',
    },
    {
      title: '飯店 ID',
      dataIndex: 'hotelId',
      key: 'hotelId',
    },
    {
      title: '房型名稱',
      dataIndex: 'roomTitle',
      key: 'roomTitle',
    },
    {
      title: '房型 ID',
      dataIndex: 'roomId',
      key: 'roomId',
    },
    {
      title: '入住日期',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '退房日期',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '總價',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `$${price}`,
    },
    {
      title: '付款方式',
      dataIndex: ['payment', 'method'],
      key: 'paymentMethod',
    },
    {
      title: '付款狀態',
      dataIndex: ['payment', 'status'],
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={status === 'pending' ? 'gold' : 'green'}>{status}</Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'confirmed'
            ? 'green'
            : status === 'cancelled'
              ? 'red'
              : status === 'completed'
                ? 'blue'
                : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const statusMenu = {
          items: [
            { label: '標記為確認', key: 'confirmed' },
            { label: '標記為完成', key: 'completed' },
            { label: '標記為取消', key: 'cancelled' },
          ],
          onClick: ({ key }: { key: string }) => handleUpdateStatus(record._id, key),
        };

        return (
          <Space size="middle">
            <Dropdown menu={statusMenu} trigger={['click']}>
              <Button>修改狀態</Button>
            </Dropdown>

            <Popconfirm
              title="確定要刪除此訂單嗎？"
              onConfirm={() => handleCancel(record._id)}
              okText="確定"
              cancelText="取消"
            >
              <Button danger>刪除</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div className="orders-title">訂單管理</div>
      </div>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        loading={loading}
        locale={{ emptyText: '尚無訂單資料' }}
      />
    </div>
  );
};

export default Orders;
