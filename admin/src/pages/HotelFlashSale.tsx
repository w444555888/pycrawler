import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Image, message, Upload, DatePicker, InputNumber } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '../utils/apiService';
import DynamicFormModal, { FormFieldConfig } from '../component/DynamicFormModal';
import './hotelFlashSale.scss';

const HotelFlashSale = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [hotels, setHotels] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSale, setEditingSale] = useState<any | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(''); // blob
    const [bannerUrl, setBannerUrl] = useState<string>('');   // server URL


    // 取得飯店與活動資料
    const fetchData = async () => {
        setLoading(true);
        const [saleRes, hotelRes] = await Promise.all([
            request('GET', '/hotelFlashSale'),
            request('GET', '/hotels'),
        ]);
        if (saleRes.success) setSales(saleRes.data);
        if (hotelRes.success) setHotels(hotelRes.data);
        setLoading(false);
    };

    const handleHotelChange = async (hotelId: string) => {
        const res = await request('GET', `/rooms/findHotel/${hotelId}`);
        if (res.success) setRooms(res.data);
    };

    const handleAdd = () => {
        setEditingSale(null);
        setPreviewUrl("");
        setBannerUrl('');
        setModalVisible(true);
    };

    const handleEdit = async (record: any) => {

        const saleRes = await request("GET", `/hotelFlashSale/${record._id}`);

        if (!saleRes.success) {
            message.error("讀取活動失敗");
            return;
        }

        const sale = saleRes.data;

        // 取得每日庫存
        const invRes = await request("GET", `/hotelFlashSale/inventory/${record._id}`);
        const inventory = invRes.success ? invRes.data : [];

        // 重新取得該飯店的房型列表
        await handleHotelChange(sale.hotelId._id);

        setEditingSale({
            ...sale,
            hotelId: sale.hotelId._id,
            roomId: sale.roomId._id,
            inventory,
            startTime: dayjs(sale.startTime),
            endTime: dayjs(sale.endTime),
        });

        setPreviewUrl("");
        setBannerUrl(sale.bannerUrl);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        const res = await request('DELETE', `/hotelFlashSale/${id}`);
        if (res.success) {
            message.success('刪除成功');
            fetchData();
        } else {
            message.error('刪除失敗');
        }
    };


    // 更新每日庫存
    const handleInventoryChange = async (date: string, totalRooms: number) => {
        if (!editingSale) return;

        const payload = {
            saleId: editingSale._id,
            date,
            totalRooms,
        };

        const res = await request("PUT", "/hotelFlashSale/inventory", payload);

        if (res.success) {
            message.success("庫存已更新");

            // 立刻更新前端畫面
            setEditingSale((prev: any) => ({
                ...prev,
                inventory: prev.inventory.map((item: any) =>
                    item.date === date ? { ...item, totalRooms } : item
                ),
            }));
        } else {
            message.error("更新庫存失敗");
        }
    };

    const handleUpload = async (file: File) => {
        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);
        const formData = new FormData();

        formData.append('banner', file);
        if (editingSale) {
            formData.append('saleId', editingSale._id);
        }

        const res = await request('POST', '/hotelFlashSale/upload-banner', formData);
        if (res.success) {
            setBannerUrl(res.data.bannerUrl);
            message.success('上傳成功');
        } else {
            message.error('上傳失敗');
        }

        return false;
    };

    const handleSubmit = async (values: any) => {
        let payload = {
            ...values,
            bannerUrl,
        };
        if (editingSale) {
            delete payload.startTime;
            delete payload.endTime;
            delete payload.quantityLimit;
            delete payload.hotelId;
            delete payload.roomId;
        }
        const res = editingSale
            ? await request('PUT', `/hotelFlashSale/${editingSale._id}`, payload)
            : await request('POST', '/hotelFlashSale', payload);

        if (res.success) {
            message.success(editingSale ? '更新成功' : '新增成功');
            setModalVisible(false);
            fetchData();
        } else {
            message.error('操作失敗');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    const isEditing = !!editingSale;
    const fields: FormFieldConfig[] = [
        { name: 'title', label: '活動標題', type: 'input', required: true },
        {
            name: 'hotelId',
            label: '選擇飯店',
            type: 'select',
            required: true,
            readOnly: isEditing,
            options: hotels.map((h) => ({ label: h.name, value: h._id })),
            onChange: handleHotelChange
        },
        {
            name: 'roomId',
            label: '選擇房型',
            type: 'select',
            required: true,
            readOnly: isEditing,
            options: rooms.map((r) => ({ label: r.title, value: r._id })),
        },
        { name: 'basePrice', label: '活動底價（固定售價）', type: 'number', required: true, readOnly: isEditing },
        { name: 'discountRate', label: '折扣（例如 0.8 = 8 折）', type: 'number', required: true },
        { name: 'quantityLimit', label: '每日庫存數量', type: 'number', required: true, readOnly: isEditing },
        { name: 'startTime', label: '開始時間', type: 'date', required: true, readOnly: isEditing },
        { name: 'endTime', label: '結束時間', type: 'date', required: true, readOnly: isEditing },
        {
            name: 'bannerUpload',
            label: '活動圖片',
            type: 'custom',
            customRender: (
                <>
                    <Upload beforeUpload={handleUpload} showUploadList={false}>
                        <Button icon={<UploadOutlined />}>上傳圖片</Button>
                    </Upload>
                    {bannerUrl && (
                        <div className='margin-ten'>
                            <Image
                                src={previewUrl || ( process.env.REACT_APP_API_URL + bannerUrl)}
                                width={200}
                            />
                        </div>
                    )}
                </>
            ),
        },
        { name: 'description', label: '活動描述', type: 'textarea' },
        { name: 'isActive', label: '是否啟用', type: 'switch' },
    ];

    const columns = [
        { title: '活動標題', dataIndex: 'title' },
        {
            title: '封面圖',
            dataIndex: 'bannerUrl',
            render: (url: string) =>
                url ? <Image src={ process.env.REACT_APP_API_URL + url} width={80} /> : <span>無</span>,
        },
        {
            title: '飯店',
            dataIndex: ['hotelId', 'name'],
            render: (_: any, record: any) => record.hotelId?.name || '-',
        },
        {
            title: '房型',
            dataIndex: ['roomId', 'title'],
            render: (_: any, record: any) => record.roomId?.title || '-',
        },
        {
            title: '活動時間',
            render: (_: any, record: any) =>
                `${dayjs(record.startTime).format('YYYY-MM-DD')} ~ ${dayjs(
                    record.endTime
                ).format('YYYY-MM-DD')}`,
        },
        { title: '底價', dataIndex: 'basePrice' },
        { title: '折扣', dataIndex: 'discountRate' },
        { title: '庫存', dataIndex: 'quantityLimit' },
        {
            title: '狀態',
            dataIndex: 'isActive',
            render: (val: boolean) => (val ? '啟用' : '停用'),
        },
        {
            title: '操作',
            render: (_: any, record: any) => (
                <Space>
                    <Button onClick={() => handleEdit(record)}>編輯</Button>
                    <Button danger onClick={() => handleDelete(record._id)}>
                        刪除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="hotels-container">
            <div className="hotels-header">
                <div className="hotels-title">限時搶購活動管理</div>
                <Button type="primary" onClick={handleAdd}>
                    新增活動
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={sales}
                rowKey="_id"
                loading={loading}
                className="hotel-table"
            />

            <DynamicFormModal
                visible={modalVisible}
                title={editingSale ? '編輯活動' : '新增活動'}
                fields={fields}
                initialValues={editingSale}
                onCancel={() => setModalVisible(false)}
                onSubmit={handleSubmit}
            >
                {editingSale && editingSale.inventory && (
                    <div className="inventory-section">
                        <div className="inventory-title">每日庫存管理</div>

                        <Table
                            rowKey="date"
                            dataSource={editingSale.inventory}
                            pagination={false}
                            columns={[
                                {
                                    title: "日期",
                                    dataIndex: "date",
                                },
                                {
                                    title: "總庫存",
                                    dataIndex: "totalRooms",
                                    render: (value, record: any) => (
                                        <InputNumber
                                            min={0}
                                            value={value}
                                            onChange={(val) => handleInventoryChange(record.date, val!)}
                                        />
                                    ),
                                },
                                {
                                    title: "已預訂",
                                    dataIndex: "bookedRooms",
                                },
                            ]}
                        />
                    </div>
                )}
            </DynamicFormModal>
        </div>
    );
};

export default HotelFlashSale;
