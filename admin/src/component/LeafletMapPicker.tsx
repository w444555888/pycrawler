import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const ResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize(); // 強制刷新尺寸
    }, 0);
  }, []);
  return null;
};


// 點地圖時更新座標
const LocationMarker = ({ position, setPosition }: { position: any; setPosition: any }) => {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setPosition(e.latlng);
    }
  });
  return position ? <Marker position={position} /> : null;
};

const LeafletMapPicker = ({ value, onChange }: {
  value: { lat: number; lng: number };
  onChange: (val: { lat: number; lng: number }) => void;
}) => {
  const [position, setPosition] = useState(value);

  useEffect(() => {
    if (position) onChange(position);
  }, [position]);

  return (
    <MapContainer center={position} zoom={15} style={{ height: 300, width: '100%' }}>
      <ResizeFix />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker position={position} setPosition={setPosition} />
    </MapContainer>
  );
};

export default LeafletMapPicker;
