import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import type { ReporteResponse } from '@repo/shared-types';

const SANTO_DOMINGO = {
  latitude: 18.474,
  longitude: -69.923,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
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
      style={{
        width: size,
        height: size,
        borderColor: '#0d1420',
        backgroundColor: colors.bg,
        shadowColor: '#0b1e4d',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
    >
      <View className="rounded-full" style={{ width: size * 0.34, height: size * 0.34, backgroundColor: colors.inner }} />
    </View>
  );
}

function UserLocationDot() {
  return (
    <View
      className="rounded-full"
      style={{
        width: 22,
        height: 22,
        backgroundColor: '#3b82f6',
        borderWidth: 3.5,
        borderColor: '#ffffff',
        shadowColor: '#3b82f6',
        shadowOpacity: 0.6,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
      }}
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
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (flyToCenter && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: flyToCenter[0],
          longitude: flyToCenter[1],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1200
      );
    }
  }, [flyToCenter]);

  return (
    <View className="absolute inset-0 z-0" pointerEvents="box-none">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={SANTO_DOMINGO}
        showsUserLocation={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maximumZ={20}
        />

        {userLocation && <Marker coordinate={{ latitude: userLocation[0], longitude: userLocation[1] }} zIndex={1000} anchor={{ x: 0.5, y: 0.5 }}>
          <UserLocationDot />
        </Marker>}

        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{ latitude: report.latitud, longitude: report.longitud }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={selectedReportId === report.id ? 100 : 10}
            onPress={() => onSelectReport(report.id)}
          >
            <CivicPin level={getReportLevel(report)} selected={selectedReportId === report.id} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
