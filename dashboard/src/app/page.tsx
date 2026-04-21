'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import Map from '@/components/Map/Map';
import Sidebar from '@/components/Dashboard/Sidebar';
import { useGeolocation } from '@/hooks/useGeolocation';
import AlertToast from '@/components/UI/AlertToast';
import { Alerta, RankingItem } from '@/types';

export default function Dashboard() {
  const [data, setData] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [targetCoords, setTargetCoords] = useState<[number, number] | null>(null);
  
  // Estado para GPS
  const [gpsActive, setGpsActive] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  const onProximityAlert = useCallback((nearby: Alerta[]) => {
    if (nearby.length > 0 && !alertInfo.show) {
      const p = nearby[0];
      setAlertInfo({
        show: true,
        message: `¡Cuidado! Estás cerca de un punto crítico en ${p.NOMBDIST} (${p.NOMBDEP})`,
      });
    }
  }, [alertInfo.show]);

  const { position: userPosition } = useGeolocation(gpsActive, data, onProximityAlert);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = "https://pifa.oefa.gob.pe/arcgis/rest/services/CiudadanoAmb/alertarrss_WebVisor/MapServer/0/query?where=1%3D1&outFields=*&f=json&outSR=4326";
        const response = await fetch(url);
        const data = await response.json();
        
        const ESTADO_MAP: { [key: number]: string } = {
          1: "Pendiente validación",
          2: "No válida",
          3: "No atendido",
          4: "Atención programada",
          5: "Atendido por Municipalidad",
          6: "Atendido por Municipalidad"
        };

        const features = data.features || [];
        const validData: Alerta[] = features.map((f: any) => ({
          OBJECTID: f.attributes.OBJECTID,
          ESTADO_DESC: ESTADO_MAP[f.attributes.ESTADO] || `Otro (${f.attributes.ESTADO})`,
          NOMBDEP: f.attributes.NOMBDEP,
          NOMBPROV: f.attributes.NOMBPROV,
          NOMBDIST: f.attributes.NOMBDIST,
          LATITUD: f.geometry?.y,
          LONGITUD: f.geometry?.x,
        })).filter((item: Alerta) => item.LATITUD && item.LONGITUD);

        setData(validData);
        setLoading(false);
      } catch (error) {
        console.error('Error cargando los datos:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const departments = Array.from(new Set(data.map(d => d.NOMBDEP))).filter(Boolean);
  
  const stats = {
    total: data.length,
    atendidos: data.filter(d => d.ESTADO_DESC?.includes('Atendido')).length,
    noAtendidos: data.filter(d => d.ESTADO_DESC?.includes('No atendido')).length,
  };

  const ranking = Object.values(
    data
      .filter(d => d.ESTADO_DESC?.includes('No atendido'))
      .reduce((acc: any, curr) => {
        const key = `${curr.NOMBDEP}-${curr.NOMBDIST}`;
        if (!acc[key]) {
          acc[key] = { 
            district: curr.NOMBDIST, 
            dept: curr.NOMBDEP, 
            count: 0,
            lat: curr.LATITUD,
            lng: curr.LONGITUD
          };
        }
        acc[key].count += 1;
        return acc;
      }, {})
  )
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10) as any[];

  const handleSelectRanking = (item: any) => {
    setTargetCoords([item.lat, item.lng]);
    setSelectedDept(item.dept);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-600 font-bold animate-pulse">Iniciando Vigilancia Ambiental...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <AlertToast 
        show={alertInfo.show} 
        message={alertInfo.message} 
        onClose={() => setAlertInfo({ ...alertInfo, show: false })} 
      />

      <Sidebar 
        stats={stats} 
        departments={departments}
        selectedDept={selectedDept}
        onSelectDept={setSelectedDept}
        ranking={ranking}
        onSelectRanking={handleSelectRanking}
        gpsActive={gpsActive}
        onToggleGps={setGpsActive}
      />
      
      <section className="flex-1 relative">
        <Map 
          data={data} 
          selectedDept={selectedDept} 
          targetCoords={targetCoords}
          userPosition={userPosition}
        />
        
        {/* Overlay Superior */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-5 py-3 rounded-2xl shadow-xl">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Localización Actual
            </h2>
            <p className="text-slate-900 font-black text-lg">
              {selectedDept || 'Todo el Perú'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
