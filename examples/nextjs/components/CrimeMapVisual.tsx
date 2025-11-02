'use client';

import dynamic from 'next/dynamic';

const MapScene = dynamic(() => import('@/components/MapScene').then((mod) => mod.MapScene), { ssr: false });

export function CrimeMapVisual() {
  return (
    <div className="hero-visual">
      <div className="map-wrapper">
        <MapScene />
      </div>
    </div>
  );
}
