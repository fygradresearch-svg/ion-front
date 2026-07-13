'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Map from '@/components/Map/Map';
import Sidebar from '@/components/Dashboard/Sidebar';
import { useGeolocation } from '@/hooks/useGeolocation';
import AlertToast from '@/components/UI/AlertToast';
import InfoModal from '@/components/UI/InfoModal';
import ClassificationDashboard from '@/components/Dashboard/ClassificationDashboard';
import { Alerta, RankingItem } from '@/types';
import { useWastePoints } from '@/hooks/useWastePoints';
import { PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose, Menu, X, LayoutDashboard } from 'lucide-react';
import { alertsData } from "@/data";
import DashboardPanel from "@/components/Dashboard/DashboardPanel";

export default function Dashboard() {
    const [data, setData] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState<string | null>('JUNIN');
    const [selectedProv, setSelectedProv] = useState<string | null>('HUANCAYO');
    const [targetCoords, setTargetCoords] = useState<[number, number] | null>([-12.07, -75.205]);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showContaminationLayer, setShowContaminationLayer] = useState(true);
    const [gpsActive, setGpsActive] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [notificationSuccess, setNotificationSuccess] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ✅ El panel de dashboard ahora vive al costado del mapa, no como modal
    const [dashboardOpen, setDashboardOpen] = useState(true);

    const [showClassification, setShowClassification] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{
        district: string;
        dept: string;
        lat: number;
        lng: number;
        count?: number;
        rankingPosition?: number;
    } | null>(null);

    const [dashboardKey, setDashboardKey] = useState(0);

    const ESTADO_MAP: { [key: number]: string } = {
        1: "Pendiente validación",
        2: "No válida",
        3: "No atendido",
        4: "Atención programada",
        5: "Atendido por Municipalidad",
        6: "Atendido por Municipalidad"
    };

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
    const { wastePoints, refresh: refreshWastePoints } = useWastePoints();

    // ✅ Mapeamos los wastePoints a un formato compatible con Alerta para poder usarlos en los dashboards,
    // heredando la información geográfica y de estado de la alerta OEFA más cercana
    const pointsData = useMemo(() => {
        return wastePoints
            .filter(p => p.prediction !== 'no_detection')
            .map(p => {
                let nearestAlert: Alerta | null = null;
                let minDist = Infinity;
                for (const a of data) {
                    if (typeof a.LATITUD !== 'number' || typeof a.LONGITUD !== 'number') continue;
                    const dist = Math.hypot(p.lat - a.LATITUD, p.lng - a.LONGITUD);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestAlert = a;
                    }
                }
                return {
                    OBJECTID: p.id,
                    ESTADO_DESC: nearestAlert ? nearestAlert.ESTADO_DESC : 'No atendido',
                    ESTADO_COD: nearestAlert ? nearestAlert.ESTADO_COD : '3',
                    NOMBDEP: nearestAlert ? nearestAlert.NOMBDEP : 'JUNIN',
                    NOMBPROV: nearestAlert ? nearestAlert.NOMBPROV : 'HUANCAYO',
                    NOMBDIST: nearestAlert ? nearestAlert.NOMBDIST : 'HUANCAYO',
                    LATITUD: p.lat,
                    LONGITUD: p.lng,
                    prediction: p.prediction,
                    confidence: p.confidence,
                    image_url: p.image_url,
                } as unknown as Alerta;
            });
    }, [wastePoints, data]);

    useEffect(() => {
        const loadLocalData = async () => {
            try {
                const validData: Alerta[] = alertsData.map((item: any) => ({
                    OBJECTID: item.OBJECTID,
                    ESTADO_DESC: item.ESTADO_DESC || ESTADO_MAP[item.ESTADO_COD] || 'Estado desconocido',
                    NOMBDEP: item.NOMBDEP,
                    NOMBPROV: item.NOMBPROV,
                    NOMBDIST: item.NOMBDIST,
                    LATITUD: parseFloat(item.LATITUD),
                    LONGITUD: parseFloat(item.LONGITUD),
                })).filter((item: Alerta) => item.LATITUD && item.LONGITUD && item.NOMBPROV === 'HUANCAYO');

                setData(validData);
                setLoading(false);
            } catch (error) {
                console.error('Error cargando los datos locales:', error);
                setLoading(false);
            }
        };

        loadLocalData();
    }, []);

    const departments = useMemo(() => {
        return Array.from(new Set(pointsData.map(d => d.NOMBDEP))).filter(Boolean);
    }, [pointsData]);

    const provinces = useMemo(() => {
        if (!selectedDept) return [];
        return Array.from(new Set(pointsData.filter(d => d.NOMBDEP === selectedDept).map(d => d.NOMBPROV))).filter(Boolean);
    }, [pointsData, selectedDept]);

    const stats = useMemo(() => {
        return {
            total: pointsData.length,
            atendidos: pointsData.filter(d => d.ESTADO_DESC?.includes('Atendido')).length,
            noAtendidos: pointsData.filter(d => d.ESTADO_DESC?.includes('No atendido')).length,
        };
    }, [pointsData]);

    const ranking = useMemo(() => {
        return Object.values(
            pointsData
                .filter(d => d.ESTADO_DESC?.includes('No atendido'))
                .filter(d => !selectedDept || d.NOMBDEP === selectedDept)
                .filter(d => !selectedProv || d.NOMBPROV === selectedProv)
                .reduce((acc: any, curr) => {
                    const key = `${curr.NOMBDEP}-${curr.NOMBPROV}-${curr.NOMBDIST}`;
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
        ).sort((a: any, b: any) => b.count - a.count).slice(0, 10) as any[];
    }, [pointsData, selectedDept, selectedProv]);

    const handleSelectRanking = (item: RankingItem, index: number) => {
        setTargetCoords([item.lat, item.lng]);
        setSelectedDept(item.dept);
        setSelectedLocation({
            district: item.district,
            dept: item.dept,
            lat: item.lat,
            lng: item.lng,
            count: item.count,
            rankingPosition: index + 1,
        });
        setDashboardKey(prev => prev + 1);
        setShowClassification(true);
        setSidebarOpen(false);
        refreshWastePoints();
    };

    const handleSelectDept = (dept: string | null) => {
        setSelectedDept(dept);
        setSelectedProv(null);
    };

    const toggleSidebar = () => setSidebarOpen(v => !v);
    const toggleDashboard = () => setDashboardOpen(v => !v);

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
        <main className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
            <button
                className="md:hidden fixed top-3 left-3 z-[2001] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-2.5 shadow-lg active:scale-95 transition-transform touch-manipulation"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
            >
                {sidebarOpen
                    ? <X className="w-5 h-5 text-slate-700" />
                    : <Menu className="w-5 h-5 text-slate-700" />}
            </button>

            {/* ✅ Botón para mostrar/ocultar el dashboard en mobile (en desktop siempre visible) */}
            <button
                className="md:hidden fixed top-3 right-3 z-[2001] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-2.5 shadow-lg active:scale-95 transition-transform touch-manipulation"
                onClick={toggleDashboard}
                aria-label={dashboardOpen ? 'Cerrar dashboard' : 'Abrir dashboard'}
            >
                <LayoutDashboard className="w-5 h-5 text-slate-700" />
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
                alerts={pointsData as any}
                wastePoints={wastePoints}
            />

            <button
                onClick={toggleSidebar}
                className="hidden md:flex fixed top-4 z-[9999] items-center justify-center bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 shadow-lg hover:bg-white transition-all duration-300 active:scale-95"
                style={{ left: sidebarOpen ? 'calc(20rem + 1rem)' : '1rem' }}
                aria-label={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
            >
                {sidebarOpen
                    ? <PanelLeftClose className="w-5 h-5 text-slate-700" />
                    : <PanelLeftOpen className="w-5 h-5 text-slate-700" />}
            </button>

            {/* ✅ Mapa */}
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

                {/* Localización Actual ligeramente desplazada a la izquierda para dejar sitio al botón de colapso */}
                <div className="absolute top-3 sm:top-4 right-14 sm:right-16 z-10 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl inline-block max-w-[calc(100vw-6rem)] sm:max-w-full">
                        <h2 className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            Localización Actual
                        </h2>
                        <p className="text-slate-900 font-black text-xs sm:text-sm md:text-base leading-tight truncate">
                            Huancayo, Junín
                        </p>
                    </div>
                </div>

                {/* ✅ Botón de colapso del dashboard derecho para desktop */}
                <button
                    onClick={toggleDashboard}
                    className="hidden md:flex absolute top-4 right-4 z-[9999] items-center justify-center bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 shadow-lg hover:bg-white transition-all duration-300 active:scale-95 pointer-events-auto"
                    aria-label={dashboardOpen ? 'Cerrar dashboard' : 'Abrir dashboard'}
                >
                    {dashboardOpen
                        ? <PanelRightClose className="w-5 h-5 text-slate-700" />
                        : <PanelRightOpen className="w-5 h-5 text-slate-700" />}
                </button>
            </section>

            {/* ✅ Dashboard fijo al costado del mapa (drawer en mobile) */}
            <DashboardPanel
                isOpen={dashboardOpen}
                onClose={() => setDashboardOpen(false)}
                alerts={pointsData as any}
                wastePoints={wastePoints}
                stats={stats}
            />

            {selectedLocation && showClassification && (
                <ClassificationDashboard
                    key={`dashboard-${dashboardKey}-${selectedLocation.district}`}
                    isOpen={showClassification}
                    onClose={() => {
                        setShowClassification(false);
                        setDashboardKey(prev => prev + 1);
                    }}
                    district={selectedLocation.district}
                    dept={selectedLocation.dept}
                    alerts={pointsData as any}
                    wastePoints={wastePoints}
                    alertCount={selectedLocation.count || 0}
                    rankingPosition={selectedLocation.rankingPosition || 1}
                />
            )}
        </main>
    );
}