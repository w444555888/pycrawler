import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Button, Space, Modal, message, Row, Col, Card, Select, Divider } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import './map.scss';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

interface RouteInfo {
  distance: number;
  duration: number;
  summary: string;
  startName?: string;
  endName?: string;
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

// 路由組件 - 處理導航路線顯示
interface RoutingProps {
  start?: L.LatLng;
  end?: L.LatLng;
  onRouteFound?: (routes: RouteInfo[]) => void;
  selectedRouteIndex?: number;
}

// 路由顯示組件：在地圖上繪製從 start 到 end 的路線，並傳回路線信息（距離、時間等）
const RoutingComponent: React.FC<RoutingProps> = ({ start, end, onRouteFound, selectedRouteIndex = 0 }) => {
  // 從 react-leaflet 獲取當前地圖實例（MapContainer 會自動提供）
  const map = useMap();
  // Ref 用來存儲 Leaflet 的路由控制對象，避免組件重新渲染時重複創建
  const routingControlRef = React.useRef<any>(null);
  // Ref 用來存儲最新的 onRouteFound 回調函數
  const onRouteFoundRef = React.useRef(onRouteFound);
  // Ref 用來存儲路由計算完成事件的處理函數
  const handleRouteFoundRef = React.useRef<any>(null);
  // Ref 用來存儲所有路線
  const allRoutesRef = React.useRef<any[]>([]);

  // 同步 onRouteFound 回調到 ref
  React.useEffect(() => {
    onRouteFoundRef.current = onRouteFound;
  }, [onRouteFound]);

  // 第二個 useEffect：負責地圖路由的主要邏輯
  useEffect(() => {
    if (!map || !start || !end) {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);     
        routingControlRef.current = null;                
      }
      return;                                  
    }

    // 當起點或終點改變時，需要先移除之前的路由，再創建新的
    if (routingControlRef.current) {
      // 移除之前的事件監聽器
      if (handleRouteFoundRef.current) {
        routingControlRef.current.off('routesfound', handleRouteFoundRef.current);
      }
      // 從地圖移除舊的路由控制對象（包括路線視覺效果）
      map.removeControl(routingControlRef.current);
    }

    // 使用 Leaflet Routing Machine 插件
    routingControlRef.current = L.Routing.control({
      // 設定路由的起點和終點
      waypoints: [
        L.latLng(start.lat, start.lng),                   
        L.latLng(end.lat, end.lng)                        
      ],
      // 設定路由規劃服務：使用免費的 OSRM（Open Source Routing Machine）
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      lineOptions: {
        styles: [{ 
          color: '#3388ff',                             
          opacity: 0.7,                                  
          weight: 5                                       
        }],
        extendToWaypoints: true,                         
        missingRouteTolerance: 0                    
      },
      showAlternatives: true,
      altLineOptions: {
        styles: [
          { color: 'black', opacity: 0.15, weight: 9 },
          { color: 'white', opacity: 0.8, weight: 6 },
          { color: '#ff9800', opacity: 0.8, weight: 3, dashArray: '5,10' }
        ]
      },
      
      show: true,                                        
      addWaypoints: false,                           
      routeWhileDragging: false,                     
      waypointNameFallback: function(index: number) {
        return '點 ' + index;                             
      }
    } as any).addTo(map);                          


    handleRouteFoundRef.current = (e: any) => {
      if (e.routes && e.routes.length > 0 && onRouteFoundRef.current) {
        // 保存所有路線對象用於後續交互
        allRoutesRef.current = e.routes;
        
        // 處理所有替代路線
        const allRoutesInfo: RouteInfo[] = e.routes.map((route: any, index: number) => {
          const distance = (route.summary.totalDistance / 1000).toFixed(2);
          const duration = Math.round(route.summary.totalTime / 60);
          const startName = e.waypoints[0]?.name || '';
          const endName = e.waypoints[1]?.name || '';
          
          return {
            distance: parseFloat(distance),
            duration: duration,
            summary: `${distance}km, 約${duration}分鐘`,
            startName,
            endName
          };
        });
        
        onRouteFoundRef.current(allRoutesInfo);
      }
    };

    routingControlRef.current.on('routesfound', handleRouteFoundRef.current);

    return () => {
      if (routingControlRef.current && handleRouteFoundRef.current) {
        routingControlRef.current.off('routesfound', handleRouteFoundRef.current);
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
        handleRouteFoundRef.current = null;
      }
    };
  }, [map, start?.lat, start?.lng, end?.lat, end?.lng]);

  // 監聽 selectedRouteIndex 變化，更新地圖顯示和樣式
  useEffect(() => {
    if (routingControlRef.current && allRoutesRef.current && selectedRouteIndex < allRoutesRef.current.length) {
      try {
        // 重新排列路線：把選中的路線放在第一位作為主線，其他的作為替代線
        const reorderedRoutes = allRoutesRef.current.slice(); // 複製陣列
        const selectedRoute = reorderedRoutes.splice(selectedRouteIndex, 1)[0];
        reorderedRoutes.unshift(selectedRoute);
        
        // 呼叫 setAlternatives，這樣選中的路線就會以主線樣式顯示
        routingControlRef.current.setAlternatives(reorderedRoutes);
      } catch (error) {
        console.warn('Failed to update route display:', error);
      }
    }
  }, [selectedRouteIndex]);

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
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.0330, 121.5654]); // 台灣中心
  
  // 叫車導航相關狀態
  const [routeMode, setRouteMode] = useState(false);
  const [routeStart, setRouteStart] = useState<L.LatLng | null>(null);
  const [routeEnd, setRouteEnd] = useState<L.LatLng | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [startLocationName, setStartLocationName] = useState<string>('');
  const [endLocationName, setEndLocationName] = useState<string>('');
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

  // 處理地圖點擊 - 選擇路由起點和終點
  const handleLocationSelect = (latlng: L.LatLng) => {
    if (routeMode) {
      if (!routeStart) {
        setRouteStart(latlng);
        message.success('已設定出發地點，請點擊選擇目的地');
      } else if (!routeEnd) {
        setRouteEnd(latlng);
        message.success('已設定目的地，路線計算中...');
      }
    }
  };



  // 啟動叫車導航模式
  const handleStartNavigation = () => {
    setRouteMode(true);
    setRouteStart(null);
    setRouteEnd(null);
    setRouteInfo(null);
    message.info('導航模式已啟動，請點擊地圖選擇出發地點和目的地');
  };

  // 重置路由
  const handleResetRoute = () => {
    setRouteMode(false);
    setRouteStart(null);
    setRouteEnd(null);
    setRouteInfo(null);
    setEstimatedFare(0);
    setStartLocationName('');
    setEndLocationName('');
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    message.success('路由已重置');
  };

  // 計算車費
  const calculateEstimatedFare = (distance: number) => {
    // base count $70 + distance fare $5/km
    const baseFare = 70;
    const distanceFare = distance * 5;
    return baseFare + distanceFare;
  };

  // 處理路由找到事件
  const handleRouteFound = (routes: RouteInfo[]) => {
    setAllRoutes(routes);
    setSelectedRouteIndex(0);
    
    if (routes.length > 0) {
      const selectedRoute = routes[0];
      setRouteInfo(selectedRoute);
      setStartLocationName(selectedRoute.startName || '');
      setEndLocationName(selectedRoute.endName || '');
      const fare = calculateEstimatedFare(selectedRoute.distance);
      setEstimatedFare(fare);
      message.success(`路線已計算: ${selectedRoute.summary} (${routes.length > 1 ? `共${routes.length}條` : '唯一'}路線)`);
    }
  };

  return (
    <div className="map-page">

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
              minZoom={2}
              maxZoom={19}
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
              
              {/* 路由導航組件 */}
              {routeMode && routeStart && routeEnd && (
                <RoutingComponent 
                  start={routeStart} 
                  end={routeEnd}
                  onRouteFound={handleRouteFound}
                  selectedRouteIndex={selectedRouteIndex}
                />
              )}

              {/* 路由模式：顯示起點和終點 */}
              {routeMode && routeStart && (
                <Marker position={[routeStart.lat, routeStart.lng]}>
                  <Popup>出發地點</Popup>
                </Marker>
              )}
              {routeMode && routeEnd && (
                <Marker position={[routeEnd.lat, routeEnd.lng]}>
                  <Popup>目的地</Popup>
                </Marker>
              )}
            </MapContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 啟動導航按鈕 */}
          {!routeMode && (
            <Button 
              type="primary" 
              size="large"
              block
              icon={<CarOutlined />}
              onClick={handleStartNavigation}
              style={{ marginBottom: '20px' }}
            >
              啟動叫車導航
            </Button>
          )}

          {/* 叫車導航面板 */}
          {routeMode && (
            <Card title={<><CarOutlined /> 叫車導航</>} style={{ marginBottom: '20px' }} className="navigation-card">
              <div className="route-status">
                <p className="status-item">
                  出發地點：{startLocationName || (routeStart ? `${routeStart.lat.toFixed(4)}, ${routeStart.lng.toFixed(4)}` : '未設定')}
                </p>
                <p className="status-item">
                  目的地：{endLocationName || (routeEnd ? `${routeEnd.lat.toFixed(4)}, ${routeEnd.lng.toFixed(4)}` : '未設定')}
                </p>
              </div>

              {routeInfo && (
                <>
                  <Divider />
                  
                  {/* 替代路線選擇 */}
                  {allRoutes.length > 1 && (
                    <div className="alternative-routes">
                      <p className="alternative-routes-title">
                        選擇路線 ({allRoutes.length} 條可用)
                      </p>
                      {allRoutes.map((route, index) => (
                        <div
                          key={index}
                          className={`route-option ${index === selectedRouteIndex ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRouteIndex(index);
                            setRouteInfo(route);
                            const fare = calculateEstimatedFare(route.distance);
                            setEstimatedFare(fare);
                            message.info(`已選擇路線 ${index + 1}`);
                          }}
                        >
                          <div className="route-option-header">
                            <span>路線 {index + 1}</span>
                            <span className="route-option-time">預計 {route.duration} 分鐘</span>
                          </div>
                          <div className="route-option-details">
                            距離: {route.distance} km
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Divider />
                  
                  <div className="route-info">
                    <div className="info-item">
                      <span className="label">距離：</span>
                      <span className="value">{routeInfo.distance} km</span>
                    </div>
                    <div className="info-item">
                      <span className="label">預計時間：</span>
                      <span className="value">{routeInfo.duration} 分鐘</span>
                    </div>
                    <div className="info-item">
                      <span className="label">預估車費：</span>
                      <span className="value fare">NT${estimatedFare.toFixed(0)}</span>
                    </div>
                  </div>

                  <Divider />
                  <div className="vehicle-options">
                    <div className="vehicle-item">
                      <span className="vehicle-name">經濟車</span>
                      <span className="vehicle-price">NT${(estimatedFare * 1).toFixed(0)}</span>
                    </div>
                    <div className="vehicle-item">
                      <span className="vehicle-name">舒適車</span>
                      <span className="vehicle-price">NT${(estimatedFare * 1.3).toFixed(0)}</span>
                    </div>
                    <div className="vehicle-item">
                      <span className="vehicle-name">高級車</span>
                      <span className="vehicle-price">NT${(estimatedFare * 1.8).toFixed(0)}</span>
                    </div>
                  </div>

                  <Divider />
                  <Space style={{ width: '100%' }}>
                    <Button type="primary" block>
                      確認叫車
                    </Button>
                    <Button block onClick={handleResetRoute}>
                      重新選擇
                    </Button>
                  </Space>
                </>
              )}

              {!routeInfo && (
                <p className="placeholder-text">
                  {routeStart && !routeEnd ? '請在地圖上點擊選擇目的地' : '請在地圖上點擊選擇出發地點'}
                </p>
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Map;
