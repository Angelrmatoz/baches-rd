import { divIcon } from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const reports = [
  { position: [18.4698, -69.9245] as [number, number], level: 'critical' },
  { position: [18.4649, -69.9325] as [number, number], level: 'medium' },
  { position: [18.4754, -69.913] as [number, number], level: 'verified' },
  { position: [18.483, -69.94] as [number, number], level: 'critical' },
  { position: [18.456, -69.905] as [number, number], level: 'medium' },
  { position: [18.49, -69.919] as [number, number], level: 'verified' },
]

function markerIcon(level: string, active: boolean) {
  return divIcon({
    className: '',
    html: `<span class="civic-marker civic-marker--${level}${active ? ' civic-marker--active' : ''}"><span></span></span>`,
    iconSize: active ? [42, 42] : [30, 30],
    iconAnchor: active ? [21, 21] : [15, 15],
  })
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

export default function MapView({ selectedReport, onSelectReport }: { selectedReport: number; onSelectReport: (index: number) => void }) {
  return (
    <div className="absolute inset-0 z-0" aria-label="Mapa de reportes de baches en Santo Domingo">
      <MapContainer center={[18.474, -69.923]} zoom={14} zoomControl={false} className="h-full w-full" attributionControl={false}>
        <ResponsiveMap />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <ZoomControl position="bottomright" />
        {reports.map((report, index) => (
          <Marker key={`${report.position[0]}-${report.position[1]}`} position={report.position} icon={markerIcon(report.level, selectedReport === index)} eventHandlers={{ click: () => onSelectReport(index) }} />
        ))}
      </MapContainer>
    </div>
  )
}
