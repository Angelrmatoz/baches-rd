import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Map, Marker, type CameraRef, type StyleSpecification } from '@maplibre/maplibre-react-native';
import type { ReporteResponse } from '@repo/shared-types';

const SANTO_DOMINGO = {
  latitude: 18.474,
  longitude: -69.923,
  zoom: 12,
};

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#eef0f3' } },
    { id: 'carto', type: 'raster', source: 'carto' },
  ],
};

const PIN_COLORS: Record<string, { bg: string; inner: string }> = {
  medium: { bg: '#e6b23f', inner: '#332308' },
  critical: { bg: '#e0554a', inner: '#0d1420' },
  verified: { bg: '#5b8aff', inner: '#0d1420' },
};

function getReportLevel(report: ReporteResponse): string {
  if (report.estado === 'RESUELTO' || report.totalValidaciones >= 5) return 'verified';
  if (report.severidad === 'GRAVE') return 'critical';
  return 'medium';
}

function CivicPin({ level, selected }: { level: string; selected: boolean }) {
  const colors = PIN_COLORS[level] || PIN_COLORS.medium;
  const size = selected ? 42 : 30;
  return (
    <View
      className="items-center justify-center rounded-full border-[3px]"
      style={[
        {
          width: size,
          height: size,
          borderColor: '#0d1420',
          backgroundColor: colors.bg,
        },
        Platform.select({
          web: {
            boxShadow: '0 4px 10px rgba(11, 30, 77, 0.35)',
          },
          default: {
            shadowColor: '#0b1e4d',
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          },
        }),
      ]}
    >
      <View className="rounded-full" style={{ width: size * 0.34, height: size * 0.34, backgroundColor: colors.inner }} />
    </View>
  );
}

function UserLocationDot() {
  return (
    <View
      className="rounded-full"
      style={[
        {
          width: 22,
          height: 22,
          backgroundColor: '#3b82f6',
          borderWidth: 3.5,
          borderColor: '#ffffff',
        },
        Platform.select({
          web: {
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
          },
          default: {
            shadowColor: '#3b82f6',
            shadowOpacity: 0.6,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            elevation: 4,
          },
        }),
      ]}
    />
  );
}

export default function MapViewComponent({
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
  const cameraRef = useRef<CameraRef>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => {
    setStatus('loading');
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (flyToCenter && cameraRef.current) {
      cameraRef.current.flyTo({
        center: [flyToCenter[1], flyToCenter[0]],
        zoom: 16,
        duration: 1200,
      });
    }
  }, [flyToCenter]);

  return (
    <View className="absolute inset-0 z-0" style={{ pointerEvents: 'box-none' }}>
      <Map
        key={reloadKey}
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE}
        onWillStartLoadingMap={() => setStatus('loading')}
        onDidFinishLoadingMap={() => setStatus('ready')}
        onDidFailLoadingMap={() => setStatus('error')}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [SANTO_DOMINGO.longitude, SANTO_DOMINGO.latitude],
            zoom: SANTO_DOMINGO.zoom,
          }}
        />

        {userLocation && (
          <Marker lngLat={[userLocation[1], userLocation[0]]}>
            <UserLocationDot />
          </Marker>
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            lngLat={[report.longitud, report.latitud]}
            onPress={() => onSelectReport(report.id)}
          >
            <CivicPin level={getReportLevel(report)} selected={selectedReportId === report.id} />
          </Marker>
        ))}
      </Map>

      {status === 'loading' && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(13,20,32,0.35)' }}
        >
          <ActivityIndicator size="large" color="#5b8aff" />
        </View>
      )}

      {status === 'error' && (
        <View
          className="absolute inset-0 items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(13,20,32,0.7)' }}
        >
          <View
            className="glass w-full max-w-sm items-center gap-3 border border-civic-secondary p-5"
            style={{ backgroundColor: 'rgba(22,32,55,0.96)', borderRadius: 16 }}
          >
            <Text className="text-base font-bold text-civic-foreground">No se pudo cargar el mapa</Text>
            <Text className="text-center text-sm text-civic-muted-foreground">
              Verifica tu conexión a internet e intenta de nuevo.
            </Text>
            <Pressable
              onPress={retry}
              className="rounded-xl bg-civic-primary px-5 py-2.5"
              accessibilityRole="button"
            >
              <Text className="text-sm font-bold text-civic-primary-foreground">Reintentar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}