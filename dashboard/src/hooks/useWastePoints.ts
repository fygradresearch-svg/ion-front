'use client';

import { useState, useEffect, useCallback } from 'react';
import { WastePoint } from '@/types';

export function useWastePoints() {
    const [wastePoints, setWastePoints] = useState<WastePoint[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/points');
            if (!res.ok) return;
            const data = await res.json();
            if (data.points) setWastePoints(data.points);
        } catch (err) {
            console.error('Error cargando puntos IA:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { wastePoints, loading, refresh };
}
