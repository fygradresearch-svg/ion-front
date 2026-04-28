import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.L = L;
  require('leaflet.heat');
}

interface HeatmapLayerProps {
  points: [number, number, number][]; // lat, lng, intensity
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;
    
    // @ts-ignore - leaflet.heat is an extension
    const heat = L.heatLayer(points, {
      radius: 40,
      blur: 25,
      maxZoom: 14,
      max: 0.8, // Bajar el máximo hace que los puntos se vean "más calientes" más rápido
      gradient: {
        0.2: 'blue',
        0.4: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}
