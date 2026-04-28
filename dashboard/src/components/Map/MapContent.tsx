'use client';

import { MapContainer, TileLayer, Popup, CircleMarker, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Alerta } from '@/types';
import ImageCarousel from './ImageCarousel';
import HeatmapLayer from './HeatmapLayer';

const juninMarketsHeatmapData: [number, number, number][] = [
  // Mercado Modelo de Huancayo (High density) - Generamos más puntos para más intensidad
  [-12.0658, -75.2058, 2.0], [-12.0659, -75.2057, 1.5], [-12.0657, -75.2059, 1.8], [-12.0660, -75.2055, 1.9], [-12.0655, -75.2060, 1.7],
  [-12.0658, -75.2058, 2.0], [-12.0659, -75.2057, 1.5], [-12.0657, -75.2059, 1.8], [-12.0660, -75.2055, 1.9], [-12.0655, -75.2060, 1.7],
  // Mercado Mayorista de Huancayo
  [-12.0673, -75.2014, 1.9], [-12.0675, -75.2012, 1.8], [-12.0670, -75.2016, 1.9], [-12.0678, -75.2010, 1.7],
  [-12.0673, -75.2014, 1.9], [-12.0675, -75.2012, 1.8], [-12.0670, -75.2016, 1.9], [-12.0678, -75.2010, 1.7],
  // Mercado de Satipo
  [-11.2530, -74.6385, 1.8], [-11.2532, -74.6383, 1.7], [-11.2528, -74.6387, 1.6],
  [-11.2530, -74.6385, 1.8], [-11.2532, -74.6383, 1.7], [-11.2528, -74.6387, 1.6],
  // Mercado de Tarma
  [-11.4180, -75.6880, 1.7], [-11.4182, -75.6878, 1.6],
  [-11.4180, -75.6880, 1.7], [-11.4182, -75.6878, 1.6],
  // Mercado de La Oroya
  [-11.5170, -75.8970, 1.8], [-11.5175, -75.8965, 1.7],
  // Mercado de La Merced (Chanchamayo)
  [-11.0545, -75.3280, 1.7], [-11.0548, -75.3278, 1.6],
  // Mercado de Jauja
  [-11.7760, -75.4980, 1.6], [-11.7762, -75.4982, 1.5],
  // Mercado de Chilca
  [-12.0830, -75.2030, 1.8], [-12.0833, -75.2028, 1.7], [-12.0828, -75.2032, 1.6],
  // Mercado de El Tambo
  [-12.0460, -75.2150, 1.7], [-12.0462, -75.2148, 1.6], [-12.0458, -75.2152, 1.5],
];

function MapController({ center, zoom }: { center: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapContent({ data, selectedDept, selectedProv, targetCoords, userPosition, showHeatmap }: any) {
  const [peruGeoJSON, setPeruGeoJSON] = useState<any>(null);

  useEffect(() => {
    fetch('/peru-boundary.json')
      .then(res => res.json())
      .then(json => setPeruGeoJSON(json))
      .catch(err => console.error("GeoJSON Error:", err));
  }, []);

  const filteredData = data.filter((d: Alerta) => {
    if (selectedDept && d.NOMBDEP !== selectedDept) return false;
    if (selectedProv && d.NOMBPROV !== selectedProv) return false;
    return true;
  });

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

      {showHeatmap && (
        <HeatmapLayer points={juninMarketsHeatmapData} />
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
