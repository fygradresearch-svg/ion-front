'use client';

import { MapContainer, TileLayer, Popup, CircleMarker, GeoJSON, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Alerta } from '@/types';
import ImageCarousel from './ImageCarousel';
import HeatmapLayer from './HeatmapLayer';
import { getContaminationDataFromSentinel2, convertToHeatmapFormat, ContaminationPoint } from '@/services/sentinelService';
import ImageAnalysisModal from "@/components/ImageAnalysisModal";

const juninMarketsHeatmapData: [number, number, number][] = [
  // 1. Distrito de Huancayo (Cercado)
  // Mercado Modelo de Huancayo: foco más crítico de insalubridad
  [-12.0720, -75.2055, 2.0], [-12.0721, -75.2054, 2.0], [-12.0719, -75.2056, 1.8], [-12.0722, -75.2053, 1.9], [-12.0718, -75.2057, 1.7],
  // Mercado Mayorista (Ex Maltería): Gran emisor de residuos orgánicos
  [-12.0782, -75.2114, 1.9], [-12.0783, -75.2113, 1.8], [-12.0781, -75.2115, 1.9],
  // Avenida Ferrocarril (Tramo Crítico): Contaminación ambiental y sonora
  [-12.0685, -75.2078, 1.8], [-12.0686, -75.2077, 1.7],

  // 2. Distrito de El Tambo
  // Mercado El Tambo: Acumulación de basura en puertas y calles laterales
  [-12.0601, -75.2116, 1.7], [-12.0602, -75.2115, 1.6],
  // Mercado Micaela Bastidas (Justicia, Paz y Vida): Depósito nocturno ilegal
  [-12.0465, -75.2238, 1.8], [-12.0466, -75.2237, 1.7],
  // Intersección Av. Independencia y Los Amautas: Punto de arrojo recurrente
  [-12.0531, -75.2192, 1.6],

  // 3. Distrito de Pilcomayo (Emergencia Sanitaria 2025-2026)
  // Mercado de Pilcomayo: Acumulación por más de 5 días
  [-12.0592, -75.2447, 2.0], [-12.0593, -75.2446, 2.0], [-12.0591, -75.2448, 1.9], [-12.0594, -75.2445, 1.8],
  // Av. Mariscal Castilla con Jr. Libertad: Punto crítico de acumulación masiva
  [-12.0615, -75.2421, 1.9], [-12.0616, -75.2420, 1.8],

  // 4. Distrito de Chilca
  // Mercado de Chilca: Alta generación de residuos orgánicos
  [-12.0838, -75.2072, 1.8], [-12.0839, -75.2071, 1.7],
  // Feria Dominical: Concentración de residuos post-feria
  [-12.0765, -75.2091, 1.7], [-12.0766, -75.2090, 1.6],
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

export default function MapContent({ data, selectedDept, selectedProv, targetCoords, userPosition, showHeatmap, showContaminationLayer }: any) {
  const [peruGeoJSON, setPeruGeoJSON] = useState<any>(null);
  const [contaminationHeatmap, setContaminationHeatmap] = useState<[number, number, number][]>([]);
  const [contaminationPoints, setContaminationPoints] = useState<ContaminationPoint[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/peru-boundary.json')
        .then(res => res.json())
        .then(json => setPeruGeoJSON(json))
        .catch(err => console.error("GeoJSON Error:", err));
  }, []);

  // Cargar datos de contaminación de Sentinel-2
  useEffect(() => {
    getContaminationDataFromSentinel2().then(points => {
      setContaminationPoints(points);
      const heatmapData = convertToHeatmapFormat(points);
      setContaminationHeatmap(heatmapData);
    });
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

  // Función para abrir el modal de análisis
  const openAnalysisModal = (objectId: number) => {
    // @ts-ignore
    setSelectedAlertId(objectId);
    setShowAnalysisModal(true);
  };

  return (
      <>
        <MapContainer
            center={[-9.19, -75.01]}
            zoom={6}
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            zoomControl={false}
        >
          <ZoomControl position="bottomright" />
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

          {/* Capa de contaminación de zonas remotas (Sentinel-2) */}
          {showContaminationLayer && contaminationHeatmap.length > 0 && (
              <HeatmapLayer
                  points={contaminationHeatmap}
                  options={{
                    radius: 25,
                    blur: 15,
                    max: 2.0,
                    gradient: {
                      0.0: '#2563eb',    // Azul - bajo
                      0.25: '#10b981',   // Verde - moderado
                      0.5: '#f59e0b',    // Naranja - medio-alto
                      0.75: '#f97316',   // Naranja profundo
                      1.0: '#dc2626',    // Rojo - alto
                    },
                  }}
              />
          )}

          {/* Mostrar puntos críticos de contaminación */}
          {showContaminationLayer && contaminationPoints.map((point, idx) => {
            if (point.intensity <= 1.5) return null; // Solo mostrar puntos críticos

            const typeLabels: Record<string, string> = {
              water: '💧 Agua contaminada',
              vegetation: '🌳 Vegetación degradada',
              soil: '🚫 Suelo contaminado',
              urban: '🏢 Expansión urbana',
            };

            const popupContent = (
                <Popup minWidth={280}>
                  <div style={{ fontFamily: 'sans-serif', color: '#1e293b', fontSize: '12px' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      <span>🛰️ Detección Sentinel-2</span>
                    </div>
                    <div style={{ backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                      <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{typeLabels[point.type]}</p>
                      <p style={{ margin: '4px 0', fontSize: '11px', color: '#64748b' }}>
                        Intensidad: {(point.intensity * 50).toFixed(0)}%
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '11px', color: '#64748b' }}>
                        Confianza: {point.confidence}%
                      </p>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '3px', marginBottom: '8px' }}>
                      <p style={{ margin: '2px 0' }}>Índices espectrales:</p>
                      <p style={{ margin: '2px 0' }}>NDVI: {point.ndvi?.toFixed(3)}</p>
                      <p style={{ margin: '2px 0' }}>NDWI: {point.ndwi?.toFixed(3)}</p>
                      <p style={{ margin: '2px 0' }}>NDBI: {point.ndbi?.toFixed(3)}</p>
                    </div>
                    <div style={{ fontSize: '9px', backgroundColor: '#fef3c7', padding: '6px', borderRadius: '3px', borderLeft: '3px solid #d97706' }}>
                      <p style={{ margin: '3px 0 2px 0', fontWeight: 'bold', color: '#92400e' }}>📋 MARCO LEGAL</p>
                      <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>DL Nº1278: Ley de Gestión Integral de Residuos Sólidos</p>
                      <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>Modificado por DL N°1501</p>
                      <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>Reglamento: DS Nº014-2017-MINAM</p>
                    </div>
                  </div>
                </Popup>
            );

            return (
                <CircleMarker
                    key={`contamination-${idx}`}
                    center={[point.lat, point.lng]}
                    pathOptions={{
                      color: point.intensity > 1.8 ? '#dc2626' : '#f97316',
                      fillColor: point.intensity > 1.8 ? '#dc2626' : '#f97316',
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                    radius={point.intensity > 1.8 ? 7 : 5}
                >
                  {popupContent}
                </CircleMarker>
            );
          })}

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

                    {/* Botón de análisis de IA */}
                    <button
                        onClick={() => openAnalysisModal(alerta.OBJECTID)}
                        className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-2 rounded-lg text-xs font-bold hover:shadow-lg transition-all"
                    >
                      🔬 Analizar evidencia con IA
                    </button>

                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginBottom: '12px' }}>
                      <a
                          href={"https://pifa.oefa.gob.pe/PortalReporta/Home/BuzonCiudadano/ConsultarAlerta?codAlerta=" + alerta.OBJECTID}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '11px', color: '#059669', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        Ver Ficha Oficial ↗
                      </a>
                    </div>

                    <div style={{ fontSize: '9px', backgroundColor: '#fef3c7', padding: '6px', borderRadius: '3px', borderLeft: '3px solid #d97706' }}>
                      <p style={{ margin: '3px 0 2px 0', fontWeight: 'bold', color: '#92400e' }}>📋 MARCO LEGAL</p>
                      <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>DL Nº1278: Ley de Gestión Integral de Residuos Sólidos</p>
                      <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>Modificado por DL N°1501</p>
                      <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>Reglamento: DS Nº014-2017-MINAM</p>
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

        {/* Modal de análisis de imágenes */}
        <ImageAnalysisModal
            isOpen={showAnalysisModal}
            onClose={() => {
              setShowAnalysisModal(false);
              setSelectedAlertId(null);
            }}
            alertId={selectedAlertId || undefined}
        />
      </>
  );
}