import React, { useEffect, useState } from 'react';
import { Table, Tag, message, Empty, Button, Popconfirm, Descriptions, Drawer } from 'antd';
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

interface FlightInfo {
    flightId: string;
    flightNumber: string;
    airline: string;
    departureAirport: string;
    arrivalAirport: string;
    departureTime: string;
    arrivalTime: string;
    aircraftCode?: string;
    itineraryDuration: string;
    availableSeats: number;
}

interface OrderType {
    id: string;
    orderNumber: string;
    flightInfo: FlightInfo;
    passengerInfo: PassengerInfo[];
    category: 'ECONOMY' | 'BUSINESS' | 'FIRST';
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
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        const res = await request('GET', '/flight/orders');
        if (res.success) {
            setOrders(res.data || []);
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

    const STATUS_COLOR_MAP = {
        PENDING: 'orange',
        PAID: 'green',
        CANCELLED: 'red',
        COMPLETED: 'blue',
    };

    const columns: ColumnsType<OrderType> = [
        {
            title: '訂單號',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            width: 180,
        },
        {
            title: '航班',
            key: 'flightNumber',
            render: (_, record) => (
                <div>
                    <div><strong>{record.flightInfo?.flightNumber}</strong> - {record.flightInfo?.airline}</div>
                    <div className="flight-route">
                        {record.flightInfo?.departureAirport} → {record.flightInfo?.arrivalAirport}
                    </div>
                </div>
            ),
            width: 200,
        },
        {
            title: '艙等',
            dataIndex: 'category',
            key: 'category',
            render: (text) => CATEGORY_MAP[text as keyof typeof CATEGORY_MAP] || text,
            width: 100,
        },
        {
            title: '乘客數',
            key: 'passengerCount',
            render: (_, record) => `${record.passengerInfo?.length || 0} 人`,
            width: 80,
        },
        {
            title: '總金額',
            key: 'totalPrice',
            render: (_, record) => `NT$${record.price?.totalPrice || 0}`,
            width: 100,
        },
        {
            title: '狀態',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={STATUS_COLOR_MAP[status as keyof typeof STATUS_COLOR_MAP] || 'default'}>
                    {status}
                </Tag>
            ),
            width: 100,
        },
        {
            title: '建立時間',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
            width: 160,
        },
        {
            title: '操作',
            key: 'actions',
            render: (_, record) => (
                <div className="actions-column">
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                            setSelectedOrder(record);
                            setDrawerVisible(true);
                        }}
                    >
                        詳情
                    </Button>
                    <Popconfirm
                        title="確定要取消這筆訂單嗎？"
                        onConfirm={() => cancelOrder(record.id)}
                        okText="確定"
                        cancelText="取消"
                        disabled={record.status === 'CANCELLED' || record.status === 'COMPLETED'}
                    >
                        <Button
                            danger
                            size="small"
                            style={{ marginLeft: '8px' }}
                            disabled={record.status === 'CANCELLED' || record.status === 'COMPLETED'}
                        >
                            取消
                        </Button>
                    </Popconfirm>
                </div>
            ),
            width: 160,
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
                rowKey="id"
                loading={loading}
                locale={{ emptyText: <Empty description="尚無訂單" /> }}
                scroll={{ x: 1000 }}
            />

            <Drawer
                title={`訂單詳情 - ${selectedOrder?.orderNumber}`}
                placement="right"
                width={600}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                {selectedOrder && (
                    <div className="order-detail">
                        {/* 訂單基本信息 */}
                        <h3>訂單信息</h3>
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="訂單號">
                                {selectedOrder.orderNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="狀態">
                                <Tag color={STATUS_COLOR_MAP[selectedOrder.status as keyof typeof STATUS_COLOR_MAP]}>
                                    {selectedOrder.status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="用戶ID">
                                {selectedOrder.userId}
                            </Descriptions.Item>
                            <Descriptions.Item label="建立時間">
                                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item label="更新時間">
                                {dayjs(selectedOrder.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* 航班信息 */}
                        <h3 style={{ marginTop: '20px' }}>航班信息</h3>
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="航班號">
                                {selectedOrder.flightInfo?.flightNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="航空公司">
                                {selectedOrder.flightInfo?.airline}
                            </Descriptions.Item>
                            <Descriptions.Item label="路線">
                                {selectedOrder.flightInfo?.departureAirport} → {selectedOrder.flightInfo?.arrivalAirport}
                            </Descriptions.Item>
                            <Descriptions.Item label="出發時間">
                                {dayjs(selectedOrder.flightInfo?.departureTime).format('YYYY-MM-DD HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="到達時間">
                                {dayjs(selectedOrder.flightInfo?.arrivalTime).format('YYYY-MM-DD HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="飛行時長">
                                {selectedOrder.flightInfo?.itineraryDuration}
                            </Descriptions.Item>
                            <Descriptions.Item label="艙等">
                                {CATEGORY_MAP[selectedOrder.category as keyof typeof CATEGORY_MAP]}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* 乘客信息 */}
                        <h3 style={{ marginTop: '20px' }}>乘客信息</h3>
                        {selectedOrder.passengerInfo?.map((p, idx) => (
                            <div key={idx} className="passenger-block">
                                <h4>乘客 {idx + 1}</h4>
                                <Descriptions bordered size="small" column={1}>
                                    <Descriptions.Item label="姓名">
                                        <UserOutlined /> {p.name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="性別">
                                        {p.gender === 1 ? <ManOutlined /> : <WomanOutlined />}
                                        {p.gender === 1 ? '男' : '女'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="生日">
                                        <CalendarOutlined /> {dayjs(p.birthDate).format('YYYY-MM-DD')}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="護照號">
                                        <IdcardOutlined /> {p.passportNumber}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Email">
                                        <MailOutlined /> {p.email || '-'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        ))}

                        {/* 價格信息 */}
                        <h3 style={{ marginTop: '20px' }}>價格信息</h3>
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="基礎價格">
                                NT${selectedOrder.price?.basePrice}
                            </Descriptions.Item>
                            <Descriptions.Item label="稅費">
                                NT${selectedOrder.price?.tax}
                            </Descriptions.Item>
                            <Descriptions.Item label="總價">
                                <strong>NT${selectedOrder.price?.totalPrice}</strong>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default FlightOrders;
