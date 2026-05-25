'use client';

import { useState, useEffect, useCallback } from 'react';
import Map from '@/components/Map/Map';
import Sidebar from '@/components/Dashboard/Sidebar';
import { useGeolocation } from '@/hooks/useGeolocation';
import AlertToast from '@/components/UI/AlertToast';
import InfoModal from '@/components/UI/InfoModal';
import { Alerta, RankingItem } from '@/types';
import { PanelLeftOpen, PanelLeftClose, Menu, X } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedProv, setSelectedProv] = useState<string | null>(null);
  const [targetCoords, setTargetCoords] = useState<[number, number] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showContaminationLayer, setShowContaminationLayer] = useState(true);
  const [gpsActive, setGpsActive] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onProximityAlert = useCallback((nearby: Alerta[]) => {
    if (nearby.length > 0 && !alertInfo.show) {
      const p = nearby[0];
      setAlertInfo({
        show: true,
        message: `¡Alerta! Estás pasando por una zona contaminada en ${p.NOMBDIST}. Te sugiero usar mascarillas al pasar por este lugar para proteger tu salud.`,
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
  const provinces = selectedDept
    ? Array.from(new Set(data.filter(d => d.NOMBDEP === selectedDept).map(d => d.NOMBPROV))).filter(Boolean)
    : [];

  const stats = {
    total: data.length,
    atendidos: data.filter(d => d.ESTADO_DESC?.includes('Atendido')).length,
    noAtendidos: data.filter(d => d.ESTADO_DESC?.includes('No atendido')).length,
  };

  const ranking = Object.values(
    data
      .filter(d => d.ESTADO_DESC?.includes('No atendido'))
      .filter(d => !selectedDept || d.NOMBDEP === selectedDept)
      .filter(d => !selectedProv || d.NOMBPROV === selectedProv)
      .reduce((acc: any, curr) => {
        const key = `${curr.NOMBDEP}-${curr.NOMBPROV}-${curr.NOMBDIST}`;
        if (!acc[key]) {
          acc[key] = { district: curr.NOMBDIST, dept: curr.NOMBDEP, count: 0, lat: curr.LATITUD, lng: curr.LONGITUD };
        }
        acc[key].count += 1;
        return acc;
      }, {})
  ).sort((a: any, b: any) => b.count - a.count).slice(0, 10) as any[];

  const handleSelectRanking = (item: any) => {
    setTargetCoords([item.lat, item.lng]);
    setSelectedDept(item.dept);
    setSidebarOpen(false);
  };

  const handleSelectDept = (dept: string | null) => {
    setSelectedDept(dept);
    setSelectedProv(null);
  };

  const toggleSidebar = () => setSidebarOpen(v => !v);

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
    <main className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans">

      {/* Botón hamburguesa móvil — z-index máximo, siempre visible encima de todo */}
      <button
        className="md:hidden fixed top-3 left-3 z-[99999] bg-white border border-slate-200 rounded-xl p-2.5 shadow-lg active:scale-95 transition-transform"
        onClick={toggleSidebar}
        onTouchEnd={(e) => { e.preventDefault(); toggleSidebar(); }}
        aria-label={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
      >
        {sidebarOpen
          ? <X className="w-5 h-5 text-slate-700" />
          : <Menu className="w-5 h-5 text-slate-700" />}
      </button>

      <AlertToast
        show={alertInfo.show}
        message={alertInfo.message}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        onNotify={() => { setNotificationSuccess(true); setTimeout(() => setNotificationSuccess(false), 5000); }}
        onShowInfo={() => setShowInfoModal(true)}
      />

      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

      {notificationSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10001] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex items-center gap-3">
          <div className="bg-white/20 p-1 rounded-full">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-bold">Notificación enviada con éxito a la municipalidad</span>
        </div>
      )}

      <Sidebar
        stats={stats}
        departments={departments}
        provinces={provinces}
        selectedDept={selectedDept}
        selectedProv={selectedProv}
        onSelectDept={handleSelectDept}
        onSelectProv={setSelectedProv}
        ranking={ranking}
        onSelectRanking={handleSelectRanking}
        gpsActive={gpsActive}
        onToggleGps={setGpsActive}
        showHeatmap={showHeatmap}
        onToggleHeatmap={(val: boolean) => {
          setShowHeatmap(val);
          if (val) { setTargetCoords([-11.5, -75.0]); setSelectedDept('JUNIN'); }
        }}
        showContaminationLayer={showContaminationLayer}
        onToggleContaminationLayer={setShowContaminationLayer}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Botón toggle — solo desktop */}
      <button
        onClick={toggleSidebar}
        className={[
          'hidden md:flex fixed top-4 z-[9999] items-center justify-center',
          'bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 shadow-lg',
          'hover:bg-white transition-all duration-300 ease-in-out active:scale-95',
          sidebarOpen ? 'left-4 md:left-80' : 'left-4',
        ].join(' ')}
        aria-label={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
      >
        {sidebarOpen
          ? <PanelLeftClose className="w-5 h-5 text-slate-700" />
          : <PanelLeftOpen className="w-5 h-5 text-slate-700" />}
      </button>

      <section className="flex-1 relative min-w-0 overflow-hidden">
        <Map
          data={data}
          selectedDept={selectedDept}
          selectedProv={selectedProv}
          targetCoords={targetCoords}
          userPosition={userPosition}
          showHeatmap={showHeatmap}
          showContaminationLayer={showContaminationLayer}
        />

        <div className="absolute top-4 left-16 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-2xl shadow-xl">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Localización Actual
            </h2>
            <p className="text-slate-900 font-black text-base leading-tight">
              {selectedProv ? `${selectedProv}, ${selectedDept}` : (selectedDept || 'Todo el Perú')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
