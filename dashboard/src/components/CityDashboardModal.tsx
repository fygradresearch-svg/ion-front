// src/components/UI/CityDashboardModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Download,
    TrendingUp,
    TrendingDown,
    MapPin,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    PieChart,
    LineChart,
    FileSpreadsheet,
    FileText,
    Printer,
    Mail,
    Share2,
    Users,
    Building,
    Recycle,
    Trash2,
    Droplets,
    Wind,
    Sun,
    CloudRain,
    Thermometer,
    Activity,
    Zap,
    TreePine,
    Home,
    Car,
    Factory,
    Shield,
    Award,
    Target
} from 'lucide-react';

interface CityDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cityName?: string;
    department?: string;
    province?: string;
}

export default function CityDashboardModal({
                                               isOpen,
                                               onClose,
                                               cityName = "Huancayo",
                                               department = "JUNIN",
                                               province = "HUANCAYO"
                                           }: CityDashboardModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'reports' | 'alerts'>('overview');
    const [isExporting, setIsExporting] = useState(false);

    // Datos falsos para el dashboard
    const dashboardData = {
        overview: {
            totalAlerts: 116,
            resolved: 4,
            pending: 112,
            critical: 15,
            attentionRate: 3.4,
            lastUpdate: new Date().toLocaleString('es-PE'),
            affectedDistricts: ["Huancan", "San Agustin", "Chilca", "Sapallanga", "Pilcomayo", "El Tambo", "Chupuro", "Sicaya", "Ingenio", "Quilcas"]
        },
        airQuality: {
            index: 68,
            status: 'Moderado',
            pm25: 12.5,
            pm10: 24.8,
            o3: 0.045,
            no2: 0.025,
            so2: 0.008,
            co: 0.45
        },
        wasteMetrics: {
            dailyGeneration: 185.6, // toneladas
            recyclingRate: 12.8,
            organicWaste: 42.3,
            inorganicWaste: 35.7,
            hazardousWaste: 4.2,
            collectionEfficiency: 67.5
        },
        waterQuality: {
            status: 'Regular',
            turbidity: 3.2,
            ph: 7.1,
            dissolvedOxygen: 4.5,
            coliforms: 120,
            nitrates: 8.5
        },
        recentReports: [
            { id: 1, type: 'Residuos sólidos', location: 'Mercado Modelo', status: 'Pendiente', date: '2024-01-15', priority: 'Alta' },
            { id: 2, type: 'Contaminación agua', location: 'Río Mantaro', status: 'En proceso', date: '2024-01-14', priority: 'Crítica' },
            { id: 3, type: 'Basura en vía pública', location: 'Av. Ferrocarril', status: 'Pendiente', date: '2024-01-13', priority: 'Media' },
            { id: 4, type: 'Residuos peligrosos', location: 'Parque Industrial', status: 'Pendiente', date: '2024-01-12', priority: 'Alta' }
        ],
        environmentalMetrics: {
            temperature: 22.5,
            humidity: 65,
            windSpeed: 8.2,
            uvIndex: 6,
            noiseLevel: 55,
            greenArea: 12.3,
            population: 456250,
            vehicles: 89234
        }
    };

    if (!isOpen) return null;

    const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
        setIsExporting(true);

        // Simular descarga
        setTimeout(() => {
            setIsExporting(false);

            // Crear datos para descarga
            const exportData = {
                city: cityName,
                department: department,
                province: province,
                date: new Date().toISOString(),
                metrics: dashboardData
            };

            // Descargar como JSON (simulación)
            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)],
                { type: 'application/json' }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-${cityName}-${format}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Notificación de éxito
            alert(`📊 Dashboard exportado correctamente en formato ${format.toUpperCase()}`);
        }, 1500);
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-xs font-bold text-red-500 bg-red-200 px-2 py-1 rounded-full">Urgente</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 mt-2">{dashboardData.overview.critical}</p>
                    <p className="text-xs text-red-600 font-medium">Alertas Críticas</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <span className="text-xs font-bold text-yellow-500 bg-yellow-200 px-2 py-1 rounded-full">Pendiente</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700 mt-2">{dashboardData.overview.pending}</p>
                    <p className="text-xs text-yellow-600 font-medium">Sin Atender</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-xs font-bold text-green-500 bg-green-200 px-2 py-1 rounded-full">Atendido</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mt-2">{dashboardData.overview.resolved}</p>
                    <p className="text-xs text-green-600 font-medium">Casos Atendidos</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-bold text-blue-500 bg-blue-200 px-2 py-1 rounded-full">Eficiencia</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 mt-2">{dashboardData.overview.attentionRate}%</p>
                    <p className="text-xs text-blue-600 font-medium">Tasa de Atención</p>
                </div>
            </div>



            {/* Gestión de Residuos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <Recycle className="w-4 h-4 mr-2 text-emerald-500" />
                    Gestión de Residuos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-gray-500">Generación Diaria</p>
                        <p className="text-lg font-bold text-gray-800">{dashboardData.wasteMetrics.dailyGeneration} Tn</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Tasa de Reciclaje</p>
                        <p className="text-lg font-bold text-emerald-600">{dashboardData.wasteMetrics.recyclingRate}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Eficiencia de Recolección</p>
                        <p className="text-lg font-bold text-blue-600">{dashboardData.wasteMetrics.collectionEfficiency}%</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Residuos Orgánicos</p>
                        <p className="text-sm font-bold text-amber-600">{dashboardData.wasteMetrics.organicWaste}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Residuos Inorgánicos</p>
                        <p className="text-sm font-bold text-blue-600">{dashboardData.wasteMetrics.inorganicWaste}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                        <p className="text-xs text-gray-500">Residuos Peligrosos</p>
                        <p className="text-sm font-bold text-red-600">{dashboardData.wasteMetrics.hazardousWaste}%</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMetrics = () => (
        <div className="space-y-6">


            {/* Métricas Ambientales */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <Thermometer className="w-4 h-4 mr-2 text-orange-500" />
                    Indicadores Ambientales
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Temperatura</p>
                        <p className="text-lg font-bold text-orange-600">{dashboardData.environmentalMetrics.temperature}°C</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Humedad</p>
                        <p className="text-lg font-bold text-blue-600">{dashboardData.environmentalMetrics.humidity}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Velocidad Viento</p>
                        <p className="text-lg font-bold text-purple-600">{dashboardData.environmentalMetrics.windSpeed} km/h</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Índice UV</p>
                        <p className="text-lg font-bold text-red-600">{dashboardData.environmentalMetrics.uvIndex}</p>
                    </div>
                </div>
            </div>

            {/* Demografía */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-emerald-500" />
                    Datos Demográficos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Población</p>
                        <p className="text-lg font-bold text-emerald-600">{dashboardData.environmentalMetrics.population.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Vehículos</p>
                        <p className="text-lg font-bold text-blue-600">{dashboardData.environmentalMetrics.vehicles.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Área Verde</p>
                        <p className="text-lg font-bold text-yellow-600">{dashboardData.environmentalMetrics.greenArea}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Ruido Urbano</p>
                        <p className="text-lg font-bold text-red-600">{dashboardData.environmentalMetrics.noiseLevel} dB</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                        Reportes Recientes
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ubicación</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Prioridad</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {dashboardData.recentReports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2 text-xs text-gray-500">#{report.id}</td>
                                <td className="px-4 py-2 text-xs font-medium text-gray-700">{report.type}</td>
                                <td className="px-4 py-2 text-xs text-gray-600">{report.location}</td>
                                <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        report.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                            report.status === 'En proceso' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                    }`}>
                      {report.status}
                    </span>
                                </td>
                                <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        report.priority === 'Crítica' ? 'bg-red-100 text-red-700' :
                            report.priority === 'Alta' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.priority}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Distritos afectados */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                    Distritos Afectados
                </h3>
                <div className="flex flex-wrap gap-2">
                    {dashboardData.overview.affectedDistricts.map((district, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-700"
                        >
              {district}
            </span>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAlerts = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-700">Alertas Críticas</h4>
                            <p className="text-xs text-red-600 mt-1">Se requieren acciones inmediatas en los distritos de Huancan, San Agustin y Sapallanga</p>
                            <p className="text-2xl font-bold text-red-700 mt-2">{dashboardData.overview.critical}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-200 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-yellow-700">Pendientes de Atención</h4>
                            <p className="text-xs text-yellow-600 mt-1">{dashboardData.overview.pending} reportes sin respuesta</p>
                            <p className="text-2xl font-bold text-yellow-700 mt-2">{dashboardData.overview.pending}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recomendaciones */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                <h3 className="text-sm font-bold text-emerald-700 mb-4 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-emerald-600" />
                    Recomendaciones Prioritarias
                </h3>
                <div className="space-y-2">
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-emerald-200 rounded-full mt-0.5">
                            <span className="w-2 h-2 block bg-emerald-600 rounded-full" />
                        </div>
                        <p className="text-sm text-emerald-700">Implementar campañas de reciclaje en los distritos con mayor índice de residuos</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-emerald-200 rounded-full mt-0.5">
                            <span className="w-2 h-2 block bg-emerald-600 rounded-full" />
                        </div>
                        <p className="text-sm text-emerald-700">Reforzar la fiscalización en los puntos críticos de acumulación de residuos</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-emerald-200 rounded-full mt-0.5">
                            <span className="w-2 h-2 block bg-emerald-600 rounded-full" />
                        </div>
                        <p className="text-sm text-emerald-700">Implementar un sistema de monitoreo en tiempo real de la calidad del aire</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-emerald-200 rounded-full mt-0.5">
                            <span className="w-2 h-2 block bg-emerald-600 rounded-full" />
                        </div>
                        <p className="text-sm text-emerald-700">Fortalecer los programas de educación ambiental en la comunidad</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden m-4">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-900">
                                📊 Dashboard Ambiental
                            </h2>
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {cityName}
              </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {department} - {province}
                            <span className="w-px h-3 bg-gray-300" />
                            <Calendar className="w-3 h-3" />
                            Última actualización: {dashboardData.overview.lastUpdate}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Botones de exportación */}
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-emerald-600"
                            title="Exportar a PDF"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            disabled={isExporting}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-emerald-600"
                            title="Exportar a Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={isExporting}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-emerald-600"
                            title="Exportar a CSV"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-gray-200" />
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sticky top-14 bg-gray-50 border-b border-gray-200 px-6 py-2 flex gap-1 overflow-x-auto z-10">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === 'overview'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Resumen
            </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('metrics')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === 'metrics'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Métricas
            </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === 'reports'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reportes
            </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === 'alerts'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertas
            </span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'metrics' && renderMetrics()}
                    {activeTab === 'reports' && renderReports()}
                    {activeTab === 'alerts' && renderAlerts()}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-500" />
              Datos en tiempo real
            </span>
                        <span className="w-px h-4 bg-gray-200" />
                        <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-yellow-500" />
              Fuente: OEFA
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                // Simular envío por correo
                                alert('📧 Reporte enviado al correo electrónico');
                            }}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <Mail className="w-3 h-3" />
                            Enviar Reporte
                        </button>
                        <button
                            onClick={() => {
                                // Simular compartir
                                alert('🔗 Enlace copiado al portapapeles');
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <Share2 className="w-3 h-3" />
                            Compartir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}