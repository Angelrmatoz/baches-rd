import { divIcon } from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import type { ReporteResponse } from '@repo/shared-types';
import '../web.css';

function getReportLevel(report: ReporteResponse): string {
  if (report.estado === 'RESUELTO' || report.totalValidaciones >= 5) return 'verified';
  if (report.severidad === 'GRAVE') return 'critical';
  return 'medium';
}

function markerIcon(level: string, active: boolean) {
  return divIcon({
    className: '',
    html: `<span class="civic-marker civic-marker--${level}${active ? ' civic-marker--active' : ''}"><span></span></span>`,
    iconSize: active ? [42, 42] : [30, 30],
    iconAnchor: active ? [21, 21] : [15, 15],
  });
}

function userLocationIcon() {
  return divIcon({
    className: '',
    html: `<span class="user-location-pulse"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const isValidCoords = (coords?: [number, number] | null): coords is [number, number] =>
  Boolean(
    coords &&
      Array.isArray(coords) &&
      coords.length === 2 &&
      typeof coords[0] === 'number' &&
      !isNaN(coords[0]) &&
      typeof coords[1] === 'number' &&
      !isNaN(coords[1])
  );

function FlyToCenter({ center }: { center?: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!isValidCoords(center)) return;

    const timer = setTimeout(() => {
      try {
        const size = map.getSize();
        if (size.x > 0 && size.y > 0) {
          map.flyTo(center, 16, { animate: true, duration: 1.2 });
        } else {
          map.setView(center, 16);
        }
      } catch {
        // Fallback si el contenedor aún no tiene dimensiones
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [center, map]);

  return null;
}

function ResponsiveMap() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ animate: false }));

    resizeObserver.observe(container);
    map.invalidateSize({ animate: false });

    return () => resizeObserver.disconnect();
  }, [map]);

  return null;
}

export default function MapView({
  reports,
  selectedReportId,
  userLocation,
  flyToCenter,
  onSelectReport,
}: {
  reports: ReporteResponse[];
  selectedReportId: string | null;
  userLocation?: [number, number] | null;
  flyToCenter?: [number, number] | null;
  onSelectReport: (id: string) => void;
}) {
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <MapContainer center={[18.474, -69.923]} zoom={14} zoomControl={false} style={{ width: '100%', height: '100%' }} attributionControl={false}>
        <ResponsiveMap />
        <FlyToCenter center={flyToCenter} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <ZoomControl position="bottomright" />

        {isValidCoords(userLocation) && <Marker position={userLocation} icon={userLocationIcon()} zIndexOffset={1000} />}

        {reports.map((report) => {
          if (typeof report.latitud !== 'number' || isNaN(report.latitud) || typeof report.longitud !== 'number' || isNaN(report.longitud)) {
            return null;
          }
          return (
            <Marker
              key={report.id}
              position={[report.latitud, report.longitud]}
              icon={markerIcon(getReportLevel(report), selectedReportId === report.id)}
              eventHandlers={{ click: () => onSelectReport(report.id) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
