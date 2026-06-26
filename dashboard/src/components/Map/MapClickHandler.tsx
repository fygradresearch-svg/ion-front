'use client';

import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
    onMapDoubleClick: (lat: number, lng: number) => void;
    enabled?: boolean;
}

export default function MapClickHandler({ onMapDoubleClick, enabled = true }: MapClickHandlerProps) {
    useMapEvents({
        dblclick: (e) => {
            if (enabled) {
                onMapDoubleClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}
