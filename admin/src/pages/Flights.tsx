import React from 'react';
import { Empty, Alert } from 'antd';
import './flights.scss';
 
const Flights: React.FC = () => {
    return (
        <div className="flights-container">
            <div className="flights-header">
                <div className="flights-title">航班管理</div>
            </div>

            <Alert
                message="提示"
                description="航班數據已遷移至 Amadeus API，不再在本系統中管理。如需查看或管理機票訂單，請前往「機票訂單」頁面。"
                type="info"
                showIcon
                className="flights-alert"
            />

            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="航班管理已停用 - 使用 Amadeus API 實時數據"
            />
        </div>
    );
};

export default Flights;

