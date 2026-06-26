'use client';

import { TrendingUp, MapPin, ChevronRight } from 'lucide-react';
import { RankingItem } from '@/types';

interface RankingListProps {
    items: RankingItem[];
    onSelect: (item: RankingItem, index: number) => void;
}

export default function RankingList({ items, onSelect }: RankingListProps) {
    if (items.length === 0) {
        return (
            <section className="mt-6">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    Puntos Críticos (Top 10)
                </h2>
                <p className="text-xs text-slate-400 text-center py-4">Sin datos disponibles</p>
            </section>
        );
    }

    return (
        <section className="mt-6">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                Puntos Críticos (Top 10)
            </h2>
            <p className="text-[9px] text-slate-400 mb-3">
                Toca un distrito para analizar todos sus puntos con IA
            </p>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <button
                        key={`${item.dept}-${item.district}-${index}`}
                        onClick={() => onSelect(item, index)}
                        className="w-full text-left group bg-white active:bg-violet-50 hover:bg-slate-50 border border-slate-100 hover:border-violet-300 p-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"
                    >
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 w-6 h-6 flex items-center justify-center rounded-lg border border-slate-100 shrink-0">
                                    {index + 1}
                                </span>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-violet-600 truncate">
                                    {item.district}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                    {item.count}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500" />
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="font-medium truncate">{item.dept}</span>
                            <span className="ml-auto text-[9px] font-bold text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                                Ver resumen IA →
                            </span>
                        </div>

                        <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-violet-500 transition-all duration-700"
                                style={{ width: `${(item.count / items[0].count) * 100}%` }}
                            />
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
