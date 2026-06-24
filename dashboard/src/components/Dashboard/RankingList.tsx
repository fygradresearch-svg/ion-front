// components/Dashboard/RankingList.tsx
import { TrendingUp, MapPin } from 'lucide-react';
import { RankingItem } from '@/types';

interface RankingListProps {
    items: RankingItem[];
    onSelect: (item: RankingItem, index: number) => void;
    onClassify: (item: RankingItem, index: number) => void;
}

export default function RankingList({ items, onSelect, onClassify }: RankingListProps) {
    const handleItemClick = (item: RankingItem, index: number) => {
        onSelect(item, index);
    };

    const handleClassifyClick = (item: RankingItem, index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onClassify(item, index);
    };

    return (
        <section className="mt-8">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                Puntos Críticos (Top 10)
            </h2>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <button
                        key={`${item.dept}-${item.district}-${index}`}
                        onClick={() => handleItemClick(item, index)}
                        className="w-full text-left group bg-white hover:bg-slate-50 border border-slate-100 hover:border-emerald-500/50 p-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 w-5 h-5 flex items-center justify-center rounded-lg border border-slate-100">
                                    {index + 1}
                                </span>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 truncate max-w-[140px]">
                                    {item.district}
                                </span>
                            </div>
                            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                {item.count}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-slate-500">
                                <MapPin className="w-3 h-3" />
                                <span className="font-medium">{item.dept}</span>
                            </div>
                            <button
                                onClick={(e) => handleClassifyClick(item, index, e)}
                                className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                            >
                                <span className="text-xs">🔬</span>
                                Analizar
                            </button>
                        </div>

                        <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-700"
                                style={{ width: `${(item.count / items[0].count) * 100}%` }}
                            ></div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}