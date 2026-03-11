import React, { useEffect, useState } from 'react';
import { Table, Space, Button, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { request } from '../utils/apiService';
import DynamicFormModal, { FormFieldConfig } from '../component/DynamicFormModal';
import dayjs from '../utils/dayjs-config';
import { getTimeZoneByCity } from '../utils/getTimeZoneByCity';
import './flights.scss';

interface FlightSchedule {
  _id: string;
  departureDate: string;
  arrivalDate: string;
  availableSeats: {
    ECONOMY?: number;
    BUSINESS?: number;
    FIRST?: number;
  };
}

interface CabinClass {
  category: 'ECONOMY' | 'BUSINESS' | 'FIRST';
  basePrice: number;
  totalSeats: number;
  bookedSeats?: number;
}

interface FlightType {
  _id: string;
  flightNumber: string;
  route: {
    departureCity: string;
    arrivalCity: string;
    flightDuration: number;
  };
  cabinClasses: CabinClass[];
  schedules: FlightSchedule[];
}

const Flights: React.FC = () => {
  const [flights, setFlights] = useState<FlightType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFlight, setEditingFlight] = useState<FlightType | null>(null);

  const fetchFlights = async () => {
    setLoading(true);
    const res = await request('GET', '/flight');
    if (res.success && Array.isArray(res.data)) {
      setFlights(res.data);
    } else {
      message.error(res.message || '獲取航班失敗');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const res = await request('DELETE', `/flight/${id}`);
    if (res.success) {
      message.success('刪除航班成功');
      fetchFlights();
    } else {
      message.error(res.message || '刪除航班失敗');
    }
    setLoading(false);
  };


  const handleSubmit = async (values: any) => {
    const cabinClasses = [
      { category: 'ECONOMY', totalSeats: values.seatsECONOMY, basePrice: values.priceECONOMY },
      { category: 'BUSINESS', totalSeats: values.seatsBUSINESS, basePrice: values.priceBUSINESS },
      { category: 'FIRST', totalSeats: values.seatsFIRST, basePrice: values.priceFIRST },
    ].filter(c => c.totalSeats > 0);

    const schedules = [
      {
        departureDate: values.departureDate,
        availableSeats: {
          ECONOMY: values.seatsECONOMY,
          BUSINESS: values.seatsBUSINESS,
          FIRST: values.seatsFIRST,
        },
      },
    ];

    let body: any;

    if (!editingFlight) {
      // 新增航班
      body = {
        flightNumber: values.flightNumber,
        route: {
          departureCity: values.departureCity,
          arrivalCity: values.arrivalCity,
          flightDuration: values.flightDuration,
        },
        cabinClasses,
        schedules,
      };
      const res = await request('POST', '/flight', body);
      if (res.success) {
        message.success('新增航班成功');
        setModalVisible(false);
        fetchFlights();
      } else {
        message.error(res.message || '新增航班失敗');
      }
    } else {
      // 編輯航班
      body = {
        flightNumber: values.flightNumber,
        route: {
          departureCity: values.departureCity,
          arrivalCity: values.arrivalCity,
          flightDuration: values.flightDuration,
        },
        cabinClasses: editingFlight.cabinClasses.map(c => {
          const updated = cabinClasses.find(cc => cc.category === c.category);
          return {
            ...c,
            totalSeats: updated?.totalSeats ?? c.totalSeats,
            basePrice: updated?.basePrice ?? c.basePrice,
          };
        }),
        schedules: editingFlight.schedules.map(s => ({
          ...s,
          departureDate: values.departureDate,
          availableSeats: {
            ECONOMY: values.seatsECONOMY,
            BUSINESS: values.seatsBUSINESS,
            FIRST: values.seatsFIRST,
          },
        })),
      };
      const res = await request('PUT', `/flight/${editingFlight._id}`, body);
      if (res.success) {
        message.success('編輯航班成功');
        setModalVisible(false);
        setEditingFlight(null);
        fetchFlights();
      } else {
        message.error(res.message || '編輯航班失敗');
      }
    }
  };


  const handleEdit = (flight: FlightType) => {
    setEditingFlight(flight);
    setModalVisible(true);
  };


  const columns: ColumnsType<FlightType> = [
    { title: '航班號', dataIndex: 'flightNumber', key: 'flightNumber' },
    {
      title: '航線', key: 'route', render: (_, record) => `${record.route.departureCity} → ${record.route.arrivalCity}`,
    },
    {
      title: '飛行時間', key: 'flightDuration', render: (_, record) => `${record.route.flightDuration} 分鐘`,
    },
    {
      title: '出發時間', key: 'departureDate', render: (_, record) => {
        const tz = getTimeZoneByCity(record.route.departureCity);
        return record.schedules[0]
          ? dayjs.utc(record.schedules[0].departureDate).tz(tz).format('YYYY-MM-DD HH:mm(z)')
          : '-';
      },
    },
    {
      title: '到達時間', key: 'arrivalDate', render: (_, record) => {
        const tz = getTimeZoneByCity(record.route.arrivalCity);
        return record.schedules[0]
          ? dayjs.utc(record.schedules[0].arrivalDate).tz(tz).format('YYYY-MM-DD HH:mm(z)')
          : '-';
      },
    },
    {
      title: '經濟艙', key: 'economy', render: (_, record) => record.schedules[0]?.availableSeats?.ECONOMY ?? '-',
    },
    {
      title: '商務艙', key: 'business', render: (_, record) => record.schedules[0]?.availableSeats?.BUSINESS ?? '-',
    },
    {
      title: '頭等艙', key: 'first', render: (_, record) => record.schedules[0]?.availableSeats?.FIRST ?? '-',
    },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>編輯</Button>
          <Button danger onClick={() => handleDelete(record._id)}>刪除</Button>
        </Space>
      ),
    },
  ];

  const fields: FormFieldConfig[] = [
    { name: 'flightNumber', label: '航班號', type: 'input', required: true },
    { name: 'departureCity', label: '出發城市', type: 'input', required: true },
    { name: 'arrivalCity', label: '到達城市', type: 'input', required: true },
    { name: 'flightDuration', label: '飛行時間（分鐘）', type: 'number', readOnly: true, placeholder: '自動計算(不填寫)' },
    { name: 'departureDate', label: '出發時間', type: 'time', timeFormat: 'datetime', required: true },
    { name: 'seatsECONOMY', label: '經濟艙座位', type: 'number', required: true },
    { name: 'seatsBUSINESS', label: '商務艙座位', type: 'number' },
    { name: 'seatsFIRST', label: '頭等艙座位', type: 'number' },
    { name: 'priceECONOMY', label: '經濟艙價格', type: 'number', required: true },
    { name: 'priceBUSINESS', label: '商務艙價格', type: 'number' },
    { name: 'priceFIRST', label: '頭等艙價格', type: 'number' },
  ];

  const initialValues = editingFlight
    ? {
      flightNumber: editingFlight.flightNumber,
      departureCity: editingFlight.route.departureCity,
      arrivalCity: editingFlight.route.arrivalCity,
      flightDuration: editingFlight.route.flightDuration,
      departureDate: dayjs(editingFlight.schedules[0]?.departureDate),
      seatsECONOMY: editingFlight.schedules[0]?.availableSeats?.ECONOMY ?? 0,
      priceECONOMY: editingFlight.cabinClasses.find(c => c.category === 'ECONOMY')?.basePrice ?? 1000,
      seatsBUSINESS: editingFlight.schedules[0]?.availableSeats?.BUSINESS ?? 0,
      priceBUSINESS: editingFlight.cabinClasses.find(c => c.category === 'BUSINESS')?.basePrice ?? 2000,
      seatsFIRST: editingFlight.schedules[0]?.availableSeats?.FIRST ?? 0,
      priceFIRST: editingFlight.cabinClasses.find(c => c.category === 'FIRST')?.basePrice ?? 3000,
    }
    : undefined;

  useEffect(() => {
    fetchFlights();
  }, []);

  return (
    <div className="flights-container">
      <div className="flights-header">
        <div className="flights-title">航班管理</div>
        <Button type="primary" onClick={() => setModalVisible(true)}>新增航班</Button>
      </div>

      <Table
        columns={columns}
        dataSource={flights}
        rowKey="_id"
        loading={loading}
        locale={{ emptyText: <Empty description="尚無航班資料" /> }}
      />

      <DynamicFormModal
        visible={modalVisible}
        title={editingFlight ? '編輯航班' : '新增航班'}
        fields={fields}
        initialValues={initialValues}
        onCancel={() => {
          setModalVisible(false);
          setEditingFlight(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Flights;
