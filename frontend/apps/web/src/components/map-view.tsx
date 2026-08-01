import { divIcon } from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { ReporteResponse } from '@repo/shared-types'
import 'leaflet/dist/leaflet.css'

function getReportLevel(report: ReporteResponse): string {
  if (report.estado === 'RESUELTO' || report.totalValidaciones >= 5) return 'verified'
  if (report.severidad === 'GRAVE') return 'critical'
  return 'medium'
}

function markerIcon(level: string, active: boolean) {
  return divIcon({
    className: '',
    html: `<span class="civic-marker civic-marker--${level}${active ? ' civic-marker--active' : ''}"><span></span></span>`,
    iconSize: active ? [42, 42] : [30, 30],
    iconAnchor: active ? [21, 21] : [15, 15],
  })
}

function userLocationIcon() {
  return divIcon({
    className: '',
    html: `<span class="user-location-pulse"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function FlyToCenter({ center }: { center?: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { animate: true, duration: 1.2 })
    }
  }, [center, map])

  return null
}

function ResponsiveMap() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ animate: false }))

    resizeObserver.observe(container)
    map.invalidateSize({ animate: false })

    return () => resizeObserver.disconnect()
  }, [map])

  return null
}

export default function MapView({
  reports,
  selectedReportId,
  userLocation,
  flyToCenter,
  onSelectReport,
}: {
  reports: ReporteResponse[]
  selectedReportId: string | null
  userLocation?: [number, number] | null
  flyToCenter?: [number, number] | null
  onSelectReport: (id: string) => void
}) {
  return (
    <div className="absolute inset-0 z-0" aria-label="Mapa de reportes de baches en Santo Domingo">
      <MapContainer center={[18.474, -69.923]} zoom={14} zoomControl={false} className="h-full w-full" attributionControl={false}>
        <ResponsiveMap />
        <FlyToCenter center={flyToCenter} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <ZoomControl position="bottomright" />

        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon()} zIndexOffset={1000} />
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitud, report.longitud]}
            icon={markerIcon(getReportLevel(report), selectedReportId === report.id)}
            eventHandlers={{ click: () => onSelectReport(report.id) }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
