'use client';

import { MapContainer, TileLayer, Popup, CircleMarker, GeoJSON, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Alerta, WastePoint } from '@/types';
import HeatmapLayer from './HeatmapLayer';
import { getContaminationDataFromSentinel2, convertToHeatmapFormat, ContaminationPoint } from '@/services/sentinelService';
import AlertPopup from './AlertPopup';
import MapClickHandler from './MapClickHandler';
import CreatePointModal from './CreatePointModal';
import WastePointPopup from './WastePointPopup';
import AnalyzeAllButton, {getAlertaImageUrl} from "@/components/Map/AnalyzeAllButton";

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
  const [wastePoints, setWastePoints] = useState<WastePoint[]>([]);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]); // Estado para resultados

  const HUANCAYO_CENTER: [number, number] = [-12.07, -75.205];

  const fetchWastePoints = async () => {
    try {
      const res = await fetch('/api/points');
      if (!res.ok) return;
      const data = await res.json();
      if (data.points) setWastePoints(data.points);
    } catch (err) {
      console.error('Error cargando puntos IA:', err);
    }
  };
  // En MapContent.tsx - Versión optimizada
  const analyzeAllPoints = async () => {
    try {
      const allPoints = [...filteredData, ...wastePoints];

      if (allPoints.length === 0) {
        throw new Error('No hay puntos para analizar');
      }

      // 🔥 Resolver imageUrl para CADA punto antes de filtrar
      // wastePoints ya traen imageUrl; las alertas (Alerta[]) necesitan resolverla via ArcGIS
      const pointsWithResolvedImages = await Promise.all(
          allPoints.map(async (point) => {
            // Si ya tiene imageUrl (wastePoints), úsala directo
            const existingUrl = point.IMAGEN_URL || point.imageUrl;
            if (existingUrl) {
              return { ...point, _resolvedImageUrl: existingUrl };
            }
            // Si es una Alerta (tiene OBJECTID), resolver contra ArcGIS
            if (point.OBJECTID) {
              const resolvedUrl = await getAlertaImageUrl(point.OBJECTID);
              return { ...point, _resolvedImageUrl: resolvedUrl };
            }
            return { ...point, _resolvedImageUrl: null };
          })
      );

      const pointsWithImages = pointsWithResolvedImages.filter(
          (point) => point._resolvedImageUrl
      );

      if (pointsWithImages.length === 0) {
        alert('⚠️ No hay puntos con imágenes disponibles para analizar');
        return [];
      }

      const BATCH_SIZE = 5;
      const results = [];

      for (let i = 0; i < pointsWithImages.length; i += BATCH_SIZE) {
        const batch = pointsWithImages.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
            batch.map(async (point) => {
              try {
                const imageUrl = point._resolvedImageUrl;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // más margen

                const imgResponse = await fetch(imageUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!imgResponse.ok) {
                  throw new Error('No se pudo descargar la imagen');
                }

                const blob = await imgResponse.blob();
                const formData = new FormData();
                formData.append('image', blob, 'imagen.jpg');
                formData.append('lat', point.LATITUD || point.lat || '0');
                formData.append('lng', point.LONGITUD || point.lng || '0');

                // const response = await fetch(`http://127.0.0.1:5000/create-point`, {
                //   method: 'POST',
                //   body: formData,
                // });

                const response = await fetch(`https://ion-back-production-495d.up.railway.app/create-point`, {
                  method: 'POST',
                  body: formData,
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                  throw new Error(data.error || 'Error en el análisis');
                }

                return {
                  id: point.OBJECTID || point.id,
                  success: true,
                  prediction: data.prediction,
                  point,
                };
              } catch (error) {
                return {
                  id: point.OBJECTID || point.id,
                  success: false,
                  error: error instanceof Error ? error.message : 'Error desconocido',
                  point,
                };
              }
            })
        );

        results.push(...batchResults);
        console.log(`Procesado ${Math.min(i + BATCH_SIZE, pointsWithImages.length)}/${pointsWithImages.length} puntos`, batchResults);
      }

      setAnalysisResults(results);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      alert(
          `📊 Análisis completado:\n` +
          `✅ ${successCount} puntos analizados correctamente\n` +
          `❌ ${failCount} puntos con errores\n` +
          `📸 ${allPoints.length - pointsWithImages.length} puntos sin imagen`
      );

      return results;
    } catch (error) {
      console.error('Error en análisis masivo:', error);
      throw error;
    }
  };


  // Función para obtener el conteo total de puntos
  const getTotalPoints = () => {
    return filteredData.length + wastePoints.length;
  };
  useEffect(() => {
    fetch('/peru-boundary.json')
        .then(res => res.json())
        .then(json => setPeruGeoJSON(json))
        .catch(err => console.error("GeoJSON Error:", err));
  }, []);

  useEffect(() => {
    fetchWastePoints();
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
    if (d.NOMBPROV !== 'HUANCAYO') return false;
    if (selectedDept && d.NOMBDEP !== selectedDept) return false;
    if (selectedProv && d.NOMBPROV !== selectedProv) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    if (status.includes('Atendido')) return '#059669';
    return '#dc2626';
  };

  const handleMapDoubleClick = (lat: number, lng: number) => {
    setClickCoords({ lat, lng });
  };

  const handlePointCreated = async () => {
    await fetchWastePoints();
  };

  return (
      <div className="relative h-full w-full">
        {clickCoords && (
            <CreatePointModal
                lat={clickCoords.lat}
                lng={clickCoords.lng}
                onClose={() => setClickCoords(null)}
                onSuccess={handlePointCreated}
            />
        )}

        <MapContainer
            center={HUANCAYO_CENTER}
            zoom={13}
            doubleClickZoom={false}
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <MapController
              center={targetCoords || (userPosition ? [userPosition.lat, userPosition.lng] : null)}
              zoom={targetCoords ? 14 : (userPosition ? 16 : 13)}
          />

          <MapClickHandler onMapDoubleClick={handleMapDoubleClick} enabled={!clickCoords} />

          <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap'
          />

          {userPosition && (
              <CircleMarker center={[userPosition.lat, userPosition.lng]} pathOptions={{ color: '#3b82f6' }} radius={8}>
                <Popup>Estás aquí</Popup>
              </CircleMarker>
          )}

          {clickCoords && (
              <CircleMarker
                  center={[clickCoords.lat, clickCoords.lng]}
                  pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.9, weight: 2 }}
                  radius={8}
              />
          )}

          {wastePoints.map((point) => (
              <CircleMarker
                  key={`waste-${point.id}`}
                  center={[point.lat, point.lng]}
                  pathOptions={{
                    color: '#7c3aed',
                    fillColor: '#7c3aed',
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                  radius={7}
              >
                <Popup minWidth={240}>
                  <WastePointPopup point={point} />
                </Popup>
              </CircleMarker>
          ))}

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
                  <AlertPopup alerta={alerta} />
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
        {/*<div className="absolute top-4 right-4 z-[1000]">*/}
        {/*  <AnalyzeAllButton*/}
        {/*      onAnalyzeAll={analyzeAllPoints}*/}
        {/*      totalPoints={getTotalPoints()}*/}
        {/*  />*/}
        {/*</div>*/}
        {!clickCoords && (
            <div className="absolute bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[1000] pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md border border-violet-200 px-3 sm:px-4 py-2 rounded-full shadow-lg text-center">
                    <p className="text-[10px] sm:text-xs text-violet-700 font-medium">
                        📍 Doble clic / doble toque en el mapa para registrar un punto
                    </p>
                </div>
            </div>
        )}
      </div>
  );
}