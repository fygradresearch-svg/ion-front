'use client';

import { MapContainer, TileLayer, Popup, CircleMarker, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Alerta } from '@/types';
import ImageCarousel from './ImageCarousel';

function MapController({ center, zoom }: { center: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapContent({ data, selectedDept, targetCoords, userPosition }: any) {
  const [peruGeoJSON, setPeruGeoJSON] = useState<any>(null);

  useEffect(() => {
    fetch('/peru-boundary.json')
      .then(res => res.json())
      .then(json => setPeruGeoJSON(json))
      .catch(err => console.error("GeoJSON Error:", err));
  }, []);

  const filteredData = selectedDept 
    ? data.filter((d: Alerta) => d.NOMBDEP === selectedDept) 
    : data;

  const getStatusColor = (status: string) => {
    if (status.includes('Atendido')) return '#059669';
    return '#dc2626';
  };

  return (
    <MapContainer 
      center={[-9.19, -75.01]} 
      zoom={6} 
      style={{ height: '100%', width: '100%', background: '#f8fafc' }}
    >
      <MapController 
        center={targetCoords || (userPosition ? [userPosition.lat, userPosition.lng] : null)} 
        zoom={targetCoords ? 14 : (userPosition ? 16 : 6)} 
      />
      
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap'
      />

      {userPosition && (
        <CircleMarker center={[userPosition.lat, userPosition.lng]} pathOptions={{ color: '#3b82f6' }} radius={8}>
          <Popup>Estás aquí</Popup>
        </CircleMarker>
      )}
      
      {peruGeoJSON && (
        <GeoJSON 
          data={peruGeoJSON} 
          interactive={false} 
          style={{ color: '#10b981', weight: 1, fillOpacity: 0 }} 
        />
      )}

      {filteredData.map((alerta: Alerta) => {
        const popupContent = (
          <Popup minWidth={250}>
            <div style={{ fontFamily: 'sans-serif', color: '#1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{alerta.ESTADO_DESC}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>#{alerta.OBJECTID}</span>
              </div>
              
              <div style={{ backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', margin: 0 }}><strong>{alerta.NOMBDIST}</strong></p>
                <p style={{ fontSize: '10px', margin: 0, color: '#64748b' }}>{alerta.NOMBPROV}, {alerta.NOMBDEP}</p>
              </div>

              <ImageCarousel objectId={alerta.OBJECTID} />
              
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <a 
                  href={"https://pifa.oefa.gob.pe/PortalReporta/Home/BuzonCiudadano/ConsultarAlerta?codAlerta=" + alerta.OBJECTID}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: '#059669', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Ver Ficha Oficial ↗
                </a>
              </div>
            </div>
          </Popup>
        );

        return (
          <CircleMarker
            key={alerta.OBJECTID}
            center={[alerta.LATITUD, alerta.LONGITUD]}
            pathOptions={{
              color: getStatusColor(alerta.ESTADO_DESC),
              fillColor: getStatusColor(alerta.ESTADO_DESC),
              fillOpacity: 0.7,
              weight: 1
            }}
            radius={5}
          >
            {popupContent}
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
