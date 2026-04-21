'use client';

import dynamic from 'next/dynamic';

const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-900 animate-pulse">
      <p className="text-gray-400 text-lg">Cargando mapa interactivo...</p>
    </div>
  ),
});

export default MapContent;
