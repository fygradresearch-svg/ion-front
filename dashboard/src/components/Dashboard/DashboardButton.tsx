'use client';

import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import DashboardPanel from './DashboardPanel';
import { Alerta, WastePoint } from '@/types';

interface DashboardButtonProps {
    alerts: Alerta[];
    wastePoints: WastePoint[];
    stats: {
        total: number;
        atendidos: number;
        noAtendidos: number;
    };
    /** Si es true, el panel se abre automáticamente al montar el componente (ej. al abrir la app) */
    openOnMount?: boolean;
}

export default function DashboardButton({ alerts, wastePoints, stats, openOnMount = false }: DashboardButtonProps) {
    const [isOpen, setIsOpen] = useState(openOnMount);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-slate-700 hover:text-emerald-700 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl shadow-sm"
            >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden xs:inline">Dashboard</span>
            </button>

            <DashboardPanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                alerts={alerts}
                wastePoints={wastePoints}
                stats={stats}
            />
        </>
    );
}