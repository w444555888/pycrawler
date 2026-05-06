import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Button, Space, Table, Modal, Input, message, Row, Col, Card } from 'antd';
import { DeleteOutlined, ClearOutlined, EnvironmentOutlined } from '@ant-design/icons';
import './map.scss';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

interface LocationMarker {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  timestamp: number;
}

const MapResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, [map]);
  return null;
};

// 點擊地圖添加標記
const ClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onLocationSelect(e.latlng);
    }
  });
  return null;
};

const Map: React.FC = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [markerName, setMarkerName] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.0330, 121.5654]); // 台灣中心
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');
  const [searchPlace, setSearchPlace] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

  // 處理地圖點擊
  const handleLocationSelect = (latlng: L.LatLng) => {
    setSelectedLocation(latlng);
    setIsModalVisible(true);
    setMarkerName('');
  };

  // 保存標記
  const handleSaveMarker = () => {
    if (selectedLocation) {
      const newMarker: LocationMarker = {
        id: Date.now().toString(),
        lat: parseFloat(selectedLocation.lat.toFixed(6)),
        lng: parseFloat(selectedLocation.lng.toFixed(6)),
        name: markerName || `標記 ${markers.length + 1}`,
        timestamp: Date.now()
      };
      setMarkers([...markers, newMarker]);
      setIsModalVisible(false);
      setSelectedLocation(null);
      message.success('標記已保存');
    }
  };

  // 刪除標記
  const handleDeleteMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
    message.success('標記已刪除');
  };

  // 清空所有標記
  const handleClearAll = () => {
    Modal.confirm({
      title: '確認清空',
      content: '確定要刪除所有標記嗎？',
      okText: '確認',
      cancelText: '取消',
      onOk() {
        setMarkers([]);
        message.success('所有標記已清空');
      }
    });
  };

  // 搜尋座標並移動地圖
  const handleSearchLocation = () => {
    const lat = parseFloat(searchLat);
    const lng = parseFloat(searchLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      message.error('請輸入有效的經緯度');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      message.error('經緯度超出範圍');
      return;
    }

    setMapCenter([lat, lng]);
    message.success('地圖已移動到指定位置');
  };

  // 搜尋地點名稱
  const handleSearchPlace = async () => {
    if (!searchPlace.trim()) {
      message.error('請輸入地點名稱');
      return;
    }

    setIsSearchingPlace(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchPlace)}&format=json&limit=10`
      );
      const data = await response.json();
      
      if (data.length === 0) {
        message.warning('找不到該地點');
        setSearchResults([]);
        return;
      }

      setSearchResults(data);
      message.success(`找到 ${data.length} 個結果`);
    } catch (error) {
      message.error('搜尋失敗，請重試');
      console.error(error);
    } finally {
      setIsSearchingPlace(false);
    }
  };

  // 選擇搜尋結果並移動地圖
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCenter([lat, lng]);
    setSearchPlace('');
    setSearchResults([]);
    message.success(`已移動到 ${result.display_name}`);
  };

  // 複製坐標到剪貼板
  const handleCopyCoords = (lat: number, lng: number) => {
    const coords = `${lat}, ${lng}`;
    navigator.clipboard.writeText(coords).then(() => {
      message.success('座標已複製');
    });
  };

  const columns = [
    {
      title: '標記名稱',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '緯度',
      dataIndex: 'lat',
      key: 'lat'
    },
    {
      title: '經度',
      dataIndex: 'lng',
      key: 'lng'
    },
    {
      title: '時間',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString('zh-TW')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: LocationMarker) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleCopyCoords(record.lat, record.lng)}
          >
            複製
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMarker(record.id)}
          >
            刪除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="map-page">
      {/* 地點名稱搜尋 */}
      <Row gutter={16} className="map-search-row">
        <Col xs={24} sm={12} md={12}>
          <Input
            placeholder="輸入地點名稱 (例: 重慶、台北、東京)"
            value={searchPlace}
            onChange={(e) => setSearchPlace(e.target.value)}
            onPressEnter={handleSearchPlace}
          />
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Button 
            type="primary" 
            block 
            onClick={handleSearchPlace}
            loading={isSearchingPlace}
          >
            <EnvironmentOutlined /> 搜尋地點
          </Button>
        </Col>
      </Row>

      {/* 搜尋結果列表 */}
      {searchResults.length > 0 && (
        <Card 
          className="search-results-card"
          title={`搜尋結果 (${searchResults.length})`}
        >
          {searchResults.map((result, index) => (
            <div
              key={index}
              className={`search-result-item ${index < searchResults.length - 1 ? 'has-border' : ''}`}
              onClick={() => handleSelectSearchResult(result)}
            >
              <div className="result-name">
                {result.name}
              </div>
              <div className="result-address">
                {result.display_name}
              </div>
              <div className="result-coords">
                緯度: {parseFloat(result.lat).toFixed(6)}, 經度: {parseFloat(result.lon).toFixed(6)}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* 經緯度搜尋 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="輸入緯度"
            value={searchLat}
            onChange={(e) => setSearchLat(e.target.value)}
            type="number"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="輸入經度"
            value={searchLng}
            onChange={(e) => setSearchLng(e.target.value)}
            type="number"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Button type="primary" block onClick={handleSearchLocation}>
            <EnvironmentOutlined /> 搜尋位置
          </Button>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Button danger block icon={<ClearOutlined />} onClick={handleClearAll}>
            清空所有標記
          </Button>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card 
            title="互動地圖" 
            className="map-card"
            bodyStyle={{ padding: 0, height: '600px' }}
          >
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              key={mapCenter.toString()}
              className="map-container"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapResizeFix />
              <ClickHandler onLocationSelect={handleLocationSelect} />

              {/* 顯示所有標記 */}
              {markers.map(marker => (
                <Marker key={marker.id} position={[marker.lat, marker.lng]}>
                  <Popup>
                    <div>
                      <strong>{marker.name}</strong>
                      <br />
                      {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                      <br />
                      {new Date(marker.timestamp).toLocaleString('zh-TW')}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* 顯示當前選中位置 */}
              {selectedLocation && (
                <CircleMarker
                  center={selectedLocation}
                  radius={8}
                  fillColor="blue"
                  color="blue"
                  weight={2}
                  opacity={1}
                  fillOpacity={0.4}
                />
              )}
            </MapContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 當前座標信息 */}
          {selectedLocation && (
            <Card title="當前位置" style={{ marginBottom: '20px' }}>
              <p>
                <strong>緯度：</strong> {selectedLocation.lat.toFixed(6)}
              </p>
              <p>
                <strong>經度：</strong> {selectedLocation.lng.toFixed(6)}
              </p>
              <Input
                placeholder="輸入標記名稱（可選）"
                value={markerName}
                onChange={(e) => setMarkerName(e.target.value)}
                className="marker-name-input"
              />
              <Space className="location-actions">
                <Button
                  type="primary"
                  block
                  onClick={handleSaveMarker}
                >
                  保存標記
                </Button>
                <Button
                  block
                  onClick={() => {
                    setSelectedLocation(null);
                    setIsModalVisible(false);
                  }}
                >
                  取消
                </Button>
              </Space>
            </Card>
          )}

          {/* 標記列表 */}
          <Card title={`已保存標記 (${markers.length})`}>
            {markers.length === 0 ? (
              <p className="empty-message">點擊地圖添加標記</p>
            ) : (
              <div className="marker-list">
                {markers.map(marker => (
                  <div key={marker.id} className="marker-item">
                    <div className="marker-info">
                      <strong>{marker.name}</strong>
                      <br />
                      <small>{marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}</small>
                    </div>
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteMarker(marker.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 詳細表格視圖 */}
      {markers.length > 0 && (
        <Card title="標記詳細信息" className="detail-table-card">
          <Table
            columns={columns}
            dataSource={markers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      <Modal
        title="保存標記"
        open={isModalVisible}
        onOk={handleSaveMarker}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedLocation(null);
        }}
      >
        {selectedLocation && (
          <div>
            <p>
              <strong>緯度：</strong> {selectedLocation.lat.toFixed(6)}
            </p>
            <p>
              <strong>經度：</strong> {selectedLocation.lng.toFixed(6)}
            </p>
            <Input
              placeholder="輸入標記名稱"
              value={markerName}
              onChange={(e) => setMarkerName(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Map;
