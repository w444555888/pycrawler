import React, { useEffect, useState } from 'react';
import { Table, Tag, message, Empty, Button, Popconfirm } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    IdcardOutlined,
    CalendarOutlined,
    ManOutlined,
    WomanOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { request } from '../utils/apiService';
import './flightOrders.scss';

interface PassengerInfo {
    name: string;
    gender: number;
    birthDate: string;
    passportNumber: string;
    email: string;
}

interface OrderType {
    _id: string;
    orderNumber: string;
    flightId: string;
    category: 'ECONOMY' | 'BUSINESS' | 'FIRST';
    departureDate: string;
    passengerInfo: PassengerInfo[];
    price: {
        basePrice: number;
        tax: number;
        totalPrice: number;
    };
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
    userId: string;
}

const FlightOrders: React.FC = () => {
    const [orders, setOrders] = useState<OrderType[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        const res = await request('GET', '/flight/allOrder');
        if (res.success) {
            setOrders(res.data);
        } else {
            message.warning(res.message || '獲取訂單失敗');
        }
        setLoading(false);
    };


    const cancelOrder = async (orderId: string) => {
        const res = await request('POST', `/flight/orders/${orderId}/cancel`);
        if (res.success) {
            message.success('訂單已取消');
            fetchOrders(); 
        } else {
            message.error(res.message || '取消訂單失敗');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const CATEGORY_MAP = {
        ECONOMY: '經濟艙',
        BUSINESS: '商務艙',
        FIRST: '頭等艙'
    };

    const columns: ColumnsType<OrderType> = [
        {
            title: '訂單號',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
        },
        {
            title: '航班 ID',
            dataIndex: 'flightId',
            key: 'flightId',
        },
        {
            title: '艙等',
            dataIndex: 'category',
            key: 'category',
            render: (text) => CATEGORY_MAP[text as keyof typeof CATEGORY_MAP] || text,
        },
        {
            title: '出發日期',
            dataIndex: 'departureDate',
            key: 'departureDate',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
        },
        {
            title: '乘客資訊',
            key: 'passengerInfo',
            render: (_, record) => (
                <div>
                    {record.passengerInfo.map((p, idx) => (
                        <div key={idx} className="passenger-item">
                            <div><UserOutlined /> 姓名: {p.name}</div>
                            <div><MailOutlined /> Email: {p.email || '-'}</div>
                            <div><IdcardOutlined /> 護照: {p.passportNumber}</div>
                            <div><CalendarOutlined /> 生日: {dayjs(p.birthDate).format('YYYY-MM-DD')}</div>
                            <div>
                                {p.gender === 1 ? <ManOutlined /> : <WomanOutlined />} 性別: {p.gender === 1 ? '男' : '女'}
                            </div>
                            {idx < record.passengerInfo.length - 1 && (
                                <hr className="passenger-divider" />
                            )}
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: '總金額',
            key: 'totalPrice',
            render: (_, record) => `$${record.price.totalPrice}`,
        },
        {
            title: '狀態',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const color = {
                    PENDING: 'orange',
                    PAID: 'green',
                    CANCELLED: 'red',
                    COMPLETED: 'blue',
                }[status] || 'default';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: '建立時間',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '操作',
            key: 'actions',
            render: (_, record) => (
                <div>
                    <Popconfirm
                        title="確定要取消這筆訂單嗎？"
                        onConfirm={() => cancelOrder(record._id)}
                        okText="確定"
                        cancelText="取消"
                        disabled={record.status === 'CANCELLED' || record.status === 'COMPLETED'}
                    >
                        <Button
                            danger
                            size="small"
                            disabled={record.status === 'CANCELLED' || record.status === 'COMPLETED'}
                        >
                            取消訂單
                        </Button>
                    </Popconfirm>
                </div>
            ),
        }
    ];

    return (
        <div className="flight-orders-container">
            <div className="flight-orders-header">
                <div className="flight-orders-title">機票訂單</div>
            </div>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="_id"
                loading={loading}
                locale={{ emptyText: <Empty description="尚無訂單" /> }}
            />
        </div>
    );
};

export default FlightOrders;
