import React, { useEffect, useState } from 'react';
import { Table, Space, Button, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { request } from '../utils/apiService';
import DynamicFormModal, { FormFieldConfig } from '../component/DynamicFormModal';
import './users.scss';

interface UserType {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  address?: string;
  phoneNumber?: string;
  realName?: string;
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  
  const openEditModal = (record: UserType) => {
    setEditUser(record);
    setEditVisible(true);
  };


  // 取得所有使用者
  const fetchUsers = async () => {
    const res = await request('GET', '/users', {}, setLoading);
    if (res.success && Array.isArray(res.data)) {
      setUsers(res.data);
    } else {
      message.error(res.message || '獲取用戶列表失敗');
    }
  };

  // 刪除使用者
  const handleDelete = async (id: string) => {
    const res = await request('DELETE', `/users/${id}`);
    if (res.success) {
      message.success('刪除用戶成功');
      fetchUsers();
    } else {
      message.error(res.message || '刪除用戶失敗');
    }
  };

  // 新增使用者
  const handleAddUser = async (values: any) => {
    const res = await request('POST', '/auth/register', values);
    if (res.success) {
      message.success('新增用戶成功');
      setModalVisible(false);
      await fetchUsers();
    } else {
      message.error(res.message || '新增用戶失敗');
    }
  };

  // 編輯使用者
  const handleEditUser = async (values: any) => {
    if (!editUser) return;

    const res = await request('PUT', `/users/${editUser._id}`, values);
    if (res.success) {
      message.success('更新成功');
      setEditVisible(false);
      await fetchUsers();
    } else {
      message.error(res.message || '更新失敗');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const columns: ColumnsType<UserType> = [
    { title: '用戶名', dataIndex: 'username', key: 'username' },
    { title: '郵箱', dataIndex: 'email', key: 'email' },
    {
      title: '管理員',
      dataIndex: 'isAdmin',
      key: 'isAdmin',
      render: (isAdmin: boolean) => (isAdmin ? '是' : '否'),
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => openEditModal(record)}>編輯</Button>
          <Button type="primary" danger onClick={() => handleDelete(record._id)}>刪除</Button>
        </Space>
      ),
    },
  ];

  // 新增用戶欄位
  const userFormFields: FormFieldConfig[] = [
    { name: 'username', label: '用戶名', type: 'input', required: true },
    { name: 'email', label: '郵箱', type: 'input', required: true },
    { name: 'password', label: '密碼', type: 'input', required: true, placeholder: '請輸入密碼' },
    { name: 'isAdmin', label: '管理員', type: 'checkbox' },
    { name: 'address', label: '地址', type: 'input' },
    { name: 'phoneNumber', label: '電話號碼', type: 'input' },
    { name: 'realName', label: '真實姓名', type: 'input' },
  ];

  // 編輯用戶欄位（username & email 不可改）
  const editUserFields: FormFieldConfig[] = [
    { name: 'username', label: '用戶名', type: 'input', readOnly: true },
    { name: 'email', label: '郵箱', type: 'input', readOnly: true },
    { name: 'password', label: '新密碼（可留空）', type: 'input', placeholder: '若不修改密碼請留空' },
    { name: 'isAdmin', label: '管理員', type: 'checkbox' },
    { name: 'address', label: '地址', type: 'input' },
    { name: 'phoneNumber', label: '電話號碼', type: 'input' },
    { name: 'realName', label: '真實姓名', type: 'input' },
  ];

  return (
    <div className="users-container">
      <div className="users-header">
        <div className="users-title">用戶管理</div>
        <Button type="primary" onClick={() => setModalVisible(true)}>新增用戶</Button>
      </div>

      <Table columns={columns} dataSource={users} rowKey="_id" loading={loading} />

      <DynamicFormModal
        visible={modalVisible}
        title="新增用戶"
        fields={userFormFields}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleAddUser}
      />

      <DynamicFormModal
        visible={editVisible}
        title="編輯用戶"
        fields={editUserFields}
        initialValues={editUser || {}}
        onCancel={() => setEditVisible(false)}
        onSubmit={handleEditUser}
      />
    </div>
  );
};

export default Users;
