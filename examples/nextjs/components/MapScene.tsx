'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const checkpoints: Array<{ name: string; coords: LngLatLike; detail: string }> = [
  {
    name: 'Port of Antwerp',
    coords: [4.4003, 51.2602],
    detail: 'Primary EU corridor • recent interdiction spikes'
  },
  {
    name: 'Port of Rotterdam',
    coords: [4.4792, 51.9244],
    detail: 'High-volume container traffic under watch'
  },
  {
    name: 'Valencia Logistics',
    coords: [-0.3763, 39.4699],
    detail: 'Ops coordinator flagged shell firms cluster'
  },
  {
    name: 'Liverpool Freeport',
    coords: [-3.0036, 53.4084],
    detail: 'Ops trialing predictive alerts'
  }
];

export function MapScene() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [1.5, 51],
      zoom: 4.1,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    checkpoints.forEach((point) => {
      const el = document.createElement('div');
      el.className = 'map-pin';
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(point.coords).addTo(map);
      const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
        `<strong>${point.name}</strong><p>${point.detail}</p>`
      );
      marker.setPopup(popup);
    });

    return () => {
      map.remove();
    };
  }, []);

  return <div className="map-scene" ref={mapRef} role="presentation" />;
}
