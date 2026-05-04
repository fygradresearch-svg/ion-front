/**
 * Servicio para consultar Sentinel-2 ImageServer y detectar contaminación
 * Sentinel-2 URL: https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer
 */

export interface ContaminationPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-2
  type: 'water' | 'soil' | 'vegetation' | 'urban';
  confidence: number; // 0-100
  ndvi?: number;
  ndwi?: number;
  ndbi?: number;
}

/**
 * Simula datos de contaminación detectados por Sentinel-2 en zonas alejadas
 * En producción, consultar: https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer
 */
export async function getContaminationDataFromSentinel2(): Promise<ContaminationPoint[]> {
  // Zonas remotas de Perú con potencial contaminación
  const remoteAreas = [
    // Zona forestal degradada - región alejada Ucayali
    { center: [-10.8, -73.2], type: 'vegetation' as const, name: 'Amazonia Ucayali' },
    // Agua contaminada - ríos alejados Loreto
    { center: [-2.5, -70.2], type: 'water' as const, name: 'Río Ucayali' },
    // Suelo degradado - ceja de selva Junín
    { center: [-11.8, -74.8], type: 'soil' as const, name: 'Ceja de Selva Junín' },
    // Expansión urbana ilegal - zonas remotas Puno
    { center: [-15.5, -70.1], type: 'urban' as const, name: 'Puno Rural' },
    // Minería artesanal - río padre Madre de Dios
    { center: [-12.5, -68.5], type: 'water' as const, name: 'Madre de Dios Mining' },
    // Deforestación - Cusco remoto
    { center: [-13.2, -71.5], type: 'vegetation' as const, name: 'Cusco Deforestation' },
    // Área de basura - Apurímac
    { center: [-13.6, -72.9], type: 'soil' as const, name: 'Apurímac Waste' },
    // Contaminación marina - costa aislada
    { center: [-6.2, -79.2], type: 'water' as const, name: 'Coastal Pollution' },
  ];

  const contaminationPoints: ContaminationPoint[] = [];

  // Generar 15-20 puntos de contaminación alrededor de cada zona
  for (const area of remoteAreas) {
    const numPoints = Math.floor(Math.random() * 6) + 10;
    
    for (let i = 0; i < numPoints; i++) {
      // Dispersar puntos alrededor del centro
      const offsetLat = (Math.random() - 0.5) * 0.4;
      const offsetLng = (Math.random() - 0.5) * 0.4;
      
      const ndvi = area.type === 'vegetation' ? Math.random() * 0.4 - 0.1 : Math.random() * 0.3;
      const ndwi = area.type === 'water' ? Math.random() * 0.6 : Math.random() * 0.2;
      const ndbi = area.type === 'urban' ? Math.random() * 0.5 : Math.random() * 0.2;

      contaminationPoints.push({
        lat: area.center[0] + offsetLat,
        lng: area.center[1] + offsetLng,
        intensity: calculateIntensity(ndvi, ndwi, ndbi, area.type),
        type: area.type,
        confidence: Math.floor(Math.random() * 40 + 60), // 60-100%
        ndvi,
        ndwi,
        ndbi,
      });
    }
  }

  return contaminationPoints;
}

/**
 * Calcula intensidad de contaminación basada en índices espectrales
 */
function calculateIntensity(
  ndvi: number,
  ndwi: number,
  ndbi: number,
  type: string
): number {
  let intensity = 0;

  switch (type) {
    // Vegetación degradada: NDVI negativo o muy bajo
    case 'vegetation':
      if (ndvi < 0) intensity = 2.0; // Muy contaminado
      else if (ndvi < 0.2) intensity = 1.8;
      else if (ndvi < 0.4) intensity = 1.3;
      else intensity = 0.8;
      break;

    // Agua contaminada: NDWI alto + turbidez
    case 'water':
      if (ndwi > 0.4) intensity = 2.0;
      else if (ndwi > 0.2) intensity = 1.7;
      else if (ndwi > 0) intensity = 1.2;
      else intensity = 0.5;
      break;

    // Suelo degradado/basural
    case 'soil':
      intensity = 1.5 + Math.random() * 0.5;
      break;

    // Expansión urbana
    case 'urban':
      if (ndbi > 0.3) intensity = 1.8;
      else if (ndbi > 0.15) intensity = 1.4;
      else intensity = 1.0;
      break;

    default:
      intensity = 1.0;
  }

  return Math.min(2.0, Math.max(0.5, intensity));
}

/**
 * Convertir datos de contaminación a formato de heatmap [lat, lng, intensity]
 */
export function convertToHeatmapFormat(
  points: ContaminationPoint[]
): [number, number, number][] {
  return points.map(p => [p.lat, p.lng, p.intensity]);
}

/**
 * Filtrar puntos críticos de contaminación (intensidad > 1.5)
 */
export function getCriticalContaminationPoints(
  points: ContaminationPoint[]
): ContaminationPoint[] {
  return points.filter(p => p.intensity > 1.5);
}

/**
 * Consultar ImageServer de Sentinel-2 (función real para producción)
 * 
 * endpoint: https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer
 */
export async function queryArcGISSentinel2(
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    // Formato para ArcGIS ImageServer REST API
    const params = new URLSearchParams({
      geometry: JSON.stringify({
        xmin: bbox.minLng,
        ymin: bbox.minLat,
        xmax: bbox.maxLng,
        ymax: bbox.maxLat,
        spatialReference: { wkid: 4326 },
      }),
      time: `${startDate},${endDate}`,
      f: 'json',
    });

    const url = 'https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer/query?' + params;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Sentinel-2 query failed');
    
    return await response.json();
  } catch (error) {
    console.error('Error querying Sentinel-2:', error);
    return null;
  }
}
