import React, { useEffect, useState } from 'react';
import { Table, Space, Button, Image, message, Modal, Select, InputNumber, Input, Checkbox, Form, DatePicker } from 'antd';
import { CoffeeOutlined, CarOutlined, ShoppingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { request } from '../utils/apiService';
import DynamicFormModal, { FormFieldConfig } from '../component/DynamicFormModal';
import DynamicFormList from '../component/DynamicFormList';
import PricingFormList from '../component/PricingFormList';
import './hotels.scss';

const Hotels = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any | null>(null);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [roomEditModalVisible, setRoomEditModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [roomList, setRoomList] = useState<any[]>([]);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [_, forceUpdate] = useState({});
  const [roomForm] = Form.useForm();
  const [hotelForm] = Form.useForm();
  const [mapCoord, setMapCoord] = useState<{ lat: number, lng: number }>({
    lat: 10.2899,
    lng: 103.9840
  });

  // 房間庫存顯示
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [editingInventory, setEditingInventory] = useState<Record<string, number>>({});
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  // 新增庫存欄位 
  const [newDate, setNewDate] = useState('');
  const [newTotal, setNewTotal] = useState<number>(0);


  const hotelFields: FormFieldConfig[] = [
    { name: 'name', label: '飯店名稱', type: 'input', required: true },
    { name: 'city', label: '城市', type: 'input', required: true },
    {
      name: 'type', label: '類型', type: 'select', required: true, options: [
        { label: '飯店', value: 'hotel' },
        { label: '公寓', value: 'apartment' },
        { label: '民宿', value: 'guesthouse' },
        { label: 'Villa', value: 'villa' },
        { label: '背包客棧', value: 'hostel' },
        { label: '汽車旅館', value: 'motel' },
        { label: '膠囊旅館', value: 'capsule' },
        { label: '渡假村', value: 'resort' }
      ]
    },
    { name: 'address', label: '地址', type: 'input', required: true },
    { name: 'cheapestPrice', label: '最低價格', type: 'number', required: true },
    { name: 'photos', label: '照片 (逗號分隔)', type: 'input', required: true },
    { name: 'title', label: '標題', type: 'input', required: true },
    { name: 'desc', label: '描述', type: 'textarea', required: true },
    { name: 'checkInTime', label: '入住時間', type: 'time', timeFormat: 'timeOnly', required: true },
    { name: 'checkOutTime', label: '退房時間', type: 'time', timeFormat: 'timeOnly', required: true },
    { name: 'email', label: '聯絡信箱', type: 'input', required: true },
    { name: 'phone', label: '聯絡電話', type: 'input', required: true },
    { name: 'nearbyAttractions', label: '附近景點 (逗號分隔)', type: 'input', required: true },
    {
      name: 'facilities',
      label: '設施',
      type: 'checkboxGroup',
      options: [
        { label: 'Wi-Fi', value: 'wifi' },
        { label: '停車場', value: 'parking' },
        { label: '游泳池', value: 'pool' },
        { label: '健身房', value: 'gym' },
        { label: 'SPA', value: 'spa' },
        { label: '餐廳', value: 'restaurant' },
        { label: '酒吧', value: 'bar' }
      ]
    },
    { name: ['coordinates', 'latitude'], label: '緯度', type: 'number', required: true },
    { name: ['coordinates', 'longitude'], label: '經度', type: 'number', required: true },
    { name: 'coordinates', label: '地圖選擇座標', type: 'map', required: true}
  ];

  const roomFields: FormFieldConfig[] = [
    { name: 'title', label: '房型名稱', type: 'input', required: true },
    {
      name: 'roomType', label: '房型類型', type: 'select', required: true,
      options: [
        { label: '單人房', value: 'Single Room' },
        { label: '雙人房', value: 'Double Room' },
        { label: '雙床房', value: 'Twin Room' },
        { label: '家庭房', value: 'Family Room' },
        { label: '豪華房', value: 'Deluxe Room' }
      ]
    },
    { name: 'maxPeople', label: '可住人數', type: 'number', required: true },
    { name: 'desc', label: '設施（以逗號分隔）', type: 'textarea', required: true },
    {
      name: 'service', label: '服務項目', type: 'custom',
      customRender: (
        <>
          <Checkbox.Group className="vertical-checkbox-group">
            <Checkbox value="breakfast">含早餐</Checkbox>
            <Checkbox value="dinner">含晚餐</Checkbox>
            <Checkbox value="parking">提供停車</Checkbox>
          </Checkbox.Group>
        </>
      )
    },
    {
      name: 'paymentOptions', label: '付款方式', type: 'custom',
      customRender: (
        <DynamicFormList
          name="paymentOptions"
          fields={[
            {
              name: 'type', label: '付款類型', type: 'select', required: true, options: [
                { label: '信用卡', value: 'credit_card' },
                { label: 'PayPal', value: 'paypal' },
                { label: '銀行轉帳', value: 'bank_transfer' },
                { label: '現場付款', value: 'on_site_payment' }
              ]
            },
            { name: 'description', label: '付款描述', type: 'input', required: true },
            { name: 'refundable', label: '可退款', type: 'checkbox' }
          ]}
        />
      )
    },
    {
      name: 'pricing',
      label: '平日價格',
      type: 'custom',
      customRender: <PricingFormList form={roomForm} />
    },
    {
      name: 'holidays', label: '特殊節日價格', type: 'custom',
      customRender: (
        <DynamicFormList
          name="holidays"
          fields={[
            { name: 'date', label: '日期（YYYY-MM-DD）', type: 'input', required: true },
            { name: 'price', label: '價格', type: 'number', required: true }
          ]}
        />
      )
    }
  ];



  const handleSubmitRoom = async (values: any) => {
    const payload = {
      ...values,
      hotelId: editingHotelId,
      desc: values.desc.split(',').map((s: string) => s.trim()),
      service: (values.service || []).reduce((acc: any, key: string) => {
        acc[key] = true;
        return acc;
      }, {}),
    };
    const res = editingRoom ? await request('PUT', `/rooms/${editingRoom._id}`, payload) : await request('POST', '/rooms', payload);
    if (res.success) {
      message.success(editingRoom ? '房型編輯成功' : '房型新增成功');
      setRoomEditModalVisible(false);
      handleViewRooms(editingHotelId!);
    }
  };


  const handleViewRooms = async (hotelId: string) => {
    const res = await request('GET', `/rooms/findHotel/${hotelId}`);
    if (res.success) {
      setEditingHotelId(hotelId);
      setRoomList(res.data);
      setRoomModalVisible(true);
    }
  };

  // 查看指定房型的庫存
  const handleViewInventory = async (room: any) => {
    try {
      setSelectedRoom(room);
      const res = await request('GET', `/rooms/findHotel/${editingHotelId}`);
      if (!res.success) throw new Error('查詢庫存失敗');
      const updatedRoom = res.data.find((r: any) => r._id === room._id);

      setInventoryData(updatedRoom.inventory);
      setInventoryModalVisible(true);
    } catch (err) {
      console.error('取得房型庫存錯誤:', err);
      message.error('無法取得最新庫存資料');
    }
  };


  // 儲存修改後的庫存
  const handleSaveInventory = async () => {
    const updates = Object.entries(editingInventory).map(([date, totalRooms]) => ({
      roomId: selectedRoom._id,
      date,
      totalRooms,
    }));

    if (updates.length === 0) {
      message.info('沒有變更');
      return;
    }

    const res = await request('PUT', '/rooms/updateRoomInventory', { updates });
    if (res.success) {
      message.success('庫存已更新');
      setInventoryModalVisible(false);
      handleViewRooms(editingHotelId!);
    } else {
      message.error(res.message || '更新失敗');
    }
  };


  const handleEditRoom = (room: any) => {
    setEditingRoom({
      ...room,
      desc: room.desc?.join(', '),
      service: Object.entries(room.service || {}).filter(([_, v]) => v).map(([k]) => k)
    });
    setRoomEditModalVisible(true);
  };


  const handleDeleteRoom = async (roomId: string) => {
    const res = await request('DELETE', `/rooms/${roomId}`);
    if (res.success) {
      message.success('房型已刪除');
      handleViewRooms(editingHotelId!);
    } else {
      message.error(res.message || '刪除失敗');
    }
  };

  const handleAddRoom = () => {
    setEditingRoom(undefined);
    roomForm.resetFields();
    setRoomEditModalVisible(true);
  };


  const fetchHotels = async () => {
    setLoading(true);
    const res = await request('GET', '/hotels');
    if (res.success) setHotels(res.data);
    setLoading(false);
  };


  const handleEditHotel = async (id: string) => {
    const res = await request('GET', `/hotels/find/${id}`);
    if (res.success) {
      const h = res.data;
      setEditingHotel({
        ...h,
        checkInTime: dayjs(h.checkInTime, 'HH:mm'),
        checkOutTime: dayjs(h.checkOutTime, 'HH:mm'),
        photos: h.photos.join(','),
        nearbyAttractions: h.nearbyAttractions.join(','),
        facilities: Object.keys(h.facilities).filter(k => h.facilities[k])
      });
      setIsModalVisible(true);
    }
  };

  const handleDeleteHotel = async (hotelId: string) => {
    const res = await request('DELETE', `/hotels/${hotelId}`);
    if (res.success) {
      message.success('飯店已刪除');
      fetchHotels();
    } else {
      message.error(res.message || '刪除失敗');
    }
  };

  const handleAddHotel = () => {
    setEditingHotel(undefined);
    setIsModalVisible(true);
  };

  const handleSubmitHotel = async (values: any) => {
    const payload = {
      ...values,
      checkInTime: values.checkInTime,
      checkOutTime: values.checkOutTime,
      photos: values.photos.split(',').map((s: string) => s.trim()),
      nearbyAttractions: values.nearbyAttractions.split(',').map((s: string) => s.trim()),
      facilities: ['wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 'bar'].reduce((obj, key) => {
        obj[key] = values.facilities?.includes(key);
        return obj;
      }, {} as Record<string, boolean>)
    };
    const res = editingHotel ? await request('PUT', `/hotels/${editingHotel._id}`, payload) : await request('POST', '/hotels', payload);
    if (res.success) {
      message.success(editingHotel ? '編輯飯店成功' : '新增飯店成功');
      setIsModalVisible(false);
      fetchHotels();
    }
  };

  useEffect(() => { fetchHotels(); }, []);

  const columns: ColumnsType<any> = [
    { title: '飯店名稱', dataIndex: 'name', key: 'name' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '類型', dataIndex: 'type', key: 'type' },
    { title: '評分', dataIndex: 'rating', key: 'rating' },
    { title: 'E-mail', dataIndex: 'email', key: 'email' },
    { title: '電話', dataIndex: 'phone', key: 'phone' },
    {
      title: '照片',
      dataIndex: 'photos',
      key: 'photos',
      render: (photos: string[]) => (
        <Image.PreviewGroup>
          <div className='gap8'>
            {photos?.slice(0, 3).map((url, index) => (
              <Image
                key={index}
                src={url}
                width={60}
                height={40}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                preview={{
                  mask: "",
                }}
              />
            ))}
          </div>
        </Image.PreviewGroup>
      )
    },
    { title: '入住時間', dataIndex: 'checkInTime', key: 'checkInTime' },
    { title: '退房時間', dataIndex: 'checkOutTime', key: 'checkOutTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEditHotel(record._id)}>編輯</Button>
          <Button danger onClick={() => handleDeleteHotel(record._id)}>刪除</Button>
          <Button onClick={() => handleViewRooms(record._id)}>查看房型</Button>
        </Space>
      )
    }
  ];

  return (
    <div className="hotels-container">
      <div className="hotels-header">
        <div className="hotels-title">飯店管理</div>
        <Button type="primary" onClick={() => handleAddHotel()}>新增飯店</Button>
      </div>
      <Table columns={columns} dataSource={hotels} rowKey="_id" loading={loading} className="hotel-table" />

      <DynamicFormModal
        visible={isModalVisible}
        title={editingHotel ? '編輯飯店' : '新增飯店'}
        fields={hotelFields}
        initialValues={editingHotel}
        onCancel={() => setIsModalVisible(false)}
        onSubmit={handleSubmitHotel}
        form={hotelForm} // 傳遞外部 form
      />

      <DynamicFormModal
        visible={roomEditModalVisible}
        title={editingRoom ? '編輯房型' : '新增房型'}
        fields={roomFields}
        initialValues={editingRoom}
        onCancel={() => setRoomEditModalVisible(false)}
        onSubmit={handleSubmitRoom}
        form={roomForm} // 傳遞外部 form
      />

      <Modal
        title="房型列表"
        open={roomModalVisible}
        onCancel={() => setRoomModalVisible(false)}
        footer={null}
        width={1000}
      >
        <Button
          type="primary"
          onClick={handleAddRoom}
          className="add-room-btn"
        >
          新增房型
        </Button>
        <Table
          dataSource={roomList}
          rowKey="_id"
          pagination={false}
          columns={[
            { title: '房型名稱', dataIndex: 'title' },
            { title: '可住人數', dataIndex: 'maxPeople' },
            {
              title: '服務項目',
              dataIndex: 'service',
              render: (service: any) => (
                <Space>
                  {service?.breakfast && <CoffeeOutlined title="含早餐" />}
                  {service?.dinner && <ShoppingOutlined title="含晚餐" />}
                  {service?.parking && <CarOutlined title="含停車" />}
                </Space>
              )
            },
            {
              title: '操作',
              render: (_: any, record: any) => (
                <Space>
                  <Button type="link" onClick={() => handleEditRoom(record)}>編輯</Button>
                  <Button onClick={() => handleViewInventory(record)}>查看庫存</Button>
                  <Button danger onClick={() => handleDeleteRoom(record._id)}>刪除</Button>
                </Space>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        title={`庫存管理：${selectedRoom?.title || ''}`}
        open={inventoryModalVisible}
        onCancel={() => setInventoryModalVisible(false)}
        width={750}
        footer={[
          <Button key="cancel" onClick={() => setInventoryModalVisible(false)}>取消</Button>,
          <Button key="save" type="primary" onClick={handleSaveInventory}>儲存變更</Button>,
        ]}
      >
        <Space style={{ marginBottom: 10 }}>
          <DatePicker
            placeholder="選擇日期"
            format="YYYY-MM-DD"
            value={newDate ? dayjs(newDate) : null}
            onChange={(date, dateString) => setNewDate(dateString as string)}
          />
          <InputNumber
            placeholder="房數"
            min={0}
            value={newTotal}
            onChange={(val) => setNewTotal(val ?? 0)}
          />
          <Button
            onClick={() => {
              if (!newDate) return message.warning('請輸入日期');
              if (inventoryData.some(item => item.date === newDate)) {
                return message.warning('該日期已存在');
              }
              setInventoryData(prev => [
                ...prev,
                { date: newDate, totalRooms: newTotal || 0, bookedRooms: 0, remainingRooms: newTotal || 0, missing: true }
              ]);
              setEditingInventory(prev => ({ ...prev, [newDate]: newTotal || 0 }));
              setNewDate('');
              setNewTotal(0);
            }}
          >
            新增日期
          </Button>
        </Space>

        <Table
          rowKey="date"
          pagination={false}
          dataSource={inventoryData}
          columns={[
            { 
              title: '日期',
              dataIndex: 'date', 
              render: (value) => dayjs(value).format('YYYY-MM-DD')
            },
            {
              title: '總房數',
              dataIndex: 'totalRooms',
              render: (value: number, record: any) => (
                <InputNumber
                  min={0}
                  value={editingInventory[record.date] ?? value}
                  onChange={(newValue) => {
                    setEditingInventory((prev) => ({
                      ...prev,
                      [record.date]: newValue ?? value,
                    }));
                  }}
                />
              ),
            },
            { title: '已預訂', dataIndex: 'bookedRooms' },
            { title: '剩餘', dataIndex: 'remainingRooms' },
            {
              title: '狀態',
              render: (record: any) =>
                record.missing
                  ? <span style={{ color: 'gray' }}>缺資料</span>
                  : record.remainingRooms === 0
                    ? <span style={{ color: 'red' }}>滿房</span>
                    : <span style={{ color: 'green' }}>可訂</span>,
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default Hotels;
