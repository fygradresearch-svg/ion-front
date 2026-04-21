'use client';

import { useState, useEffect, useCallback } from 'react';
import { Alerta } from '@/types';

interface Coords {
  lat: number;
  lng: number;
}

// Fórmula de Haversine para calcular distancia entre dos puntos en metros
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

export function useGeolocation(
  active: boolean, 
  puntosCriticos: Alerta[], 
  onProximityAlert: (puntos: Alerta[]) => void
) {
  const [position, setPosition] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkProximity = useCallback((userLat: number, userLng: number) => {
    const nearby = puntosCriticos.filter(p => {
      // Solo alertar por puntos "No atendidos"
      if (!p.ESTADO_DESC?.includes('No atendido')) return false;
      
      const distance = calculateDistance(userLat, userLng, p.LATITUD, p.LONGITUD);
      return distance <= 50; // Radio de 50 metros
    });

    if (nearby.length > 0) {
      onProximityAlert(nearby);
    }
  }, [puntosCriticos, onProximityAlert]);

  useEffect(() => {
    if (!active) return;

    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        checkProximity(latitude, longitude);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [active, checkProximity]);

  return { position, error };
}
