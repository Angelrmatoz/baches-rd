import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Animated, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReporteResponse } from '@repo/shared-types';

import { cn } from '../lib/cn';
import MapView from '../components/map-view';
import { Button } from '../components/ui/button';
import { DuplicateReportDialog } from '../components/DuplicateReportDialog';
import { NewReportModal } from '../components/NewReportModal';
import { ProfileModal } from '../components/ProfileModal';
import { ReportDetailModal } from '../components/ReportDetailModal';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const filters = ['Todos', 'Críticos', 'Validados'];

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [panelOpen, setPanelOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [reports, setReports] = useState<ReporteResponse[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [dismissingIds, setDismissingIds] = useState<string[]>([]);

  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: '¡Reporte registrado!',
      desc: 'Tu bache en Av. 27 de Febrero fue publicado exitosamente.',
      time: 'Hace 5 min',
      icon: 'map-pin' as const,
      color: 'text-civic-primary bg-civic-primary/15',
    },
    {
      id: 'n2',
      title: 'Nueva validación ciudadana',
      desc: 'Un ciudadano ha verificado y apoyado tu reporte.',
      time: 'Hace 25 min',
      icon: 'check-circle' as const,
      color: 'text-emerald-400 bg-emerald-400/15',
    },
    {
      id: 'n3',
      title: 'Actualización del Ayuntamiento',
      desc: 'El estado del bache cambió a EN REPARACIÓN.',
      time: 'Hace 2 horas',
      icon: 'shield' as const,
      color: 'text-blue-400 bg-blue-400/15',
    },
  ]);

  const panelTranslate = useRef(new Animated.Value(0)).current;
  const notifAnim = useRef(new Animated.Value(0)).current;
  const accountAnim = useRef(new Animated.Value(0)).current;

  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    Animated.timing(panelTranslate, {
      toValue: panelOpen ? 0 : -450,
      duration: 280,
      useNativeDriver,
    }).start();
  }, [panelOpen, panelTranslate, useNativeDriver]);

  useEffect(() => {
    Animated.timing(notifAnim, {
      toValue: notificationsOpen ? 1 : 0,
      duration: 200,
      useNativeDriver,
    }).start();
  }, [notificationsOpen, notifAnim, useNativeDriver]);

  useEffect(() => {
    Animated.timing(accountAnim, {
      toValue: accountOpen ? 1 : 0,
      duration: 200,
      useNativeDriver,
    }).start();
  }, [accountOpen, accountAnim, useNativeDriver]);

  const showToast = (message: string, duration = 4000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setDismissingIds([]);
  };

  const handleLocateUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permiso de ubicación denegado.', 4000);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserLocation(coords);
      setFlyToCenter(coords);
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem('lastUserLocation', JSON.stringify({ lat: coords[0], lng: coords[1] }));
        } catch {
          // Ignorar errores de storage web
        }
      }
      showToast('Ubicado en tu posición actual', 3000);
    } catch {
      showToast('No se pudo obtener tu ubicación.', 4000);
    }
  };

  useEffect(() => {
    fetchReports();

    const restoreLocation = async () => {
      if (Platform.OS === 'web') {
        try {
          const savedLoc = localStorage.getItem('lastUserLocation');
          if (savedLoc) {
            const parsed = JSON.parse(savedLoc);
            if (typeof parsed.lat === 'number' && !isNaN(parsed.lat) && typeof parsed.lng === 'number' && !isNaN(parsed.lng)) {
              const coords: [number, number] = [parsed.lat, parsed.lng];
              setUserLocation(coords);
              setFlyToCenter(coords);
            }
          }
        } catch {
          // Ignorar error de parseo
        }
      } else {
        try {
          const savedLoc = await AsyncStorage.getItem('lastUserLocation');
          if (savedLoc) {
            const parsed = JSON.parse(savedLoc);
            if (typeof parsed.lat === 'number' && !isNaN(parsed.lat) && typeof parsed.lng === 'number' && !isNaN(parsed.lng)) {
              const coords: [number, number] = [parsed.lat, parsed.lng];
              setUserLocation(coords);
              setFlyToCenter(coords);
            }
          }
        } catch {
          // Ignorar error de parseo
        }
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setFlyToCenter(coords);
          const saved = JSON.stringify({ lat: coords[0], lng: coords[1] });
          if (Platform.OS === 'web') {
            localStorage.setItem('lastUserLocation', saved);
          } else {
            AsyncStorage.setItem('lastUserLocation', saved);
          }
        }
      } catch {
        // Geolocalización opcional
      }
    };

    restoreLocation();
  }, []);

  const fetchReports = async (newReportId?: string) => {
    try {
      setLoading(true);
      const data = await api.getReports({ size: 50 });
      const fetched = data.content || [];
      setReports(fetched);

      if (newReportId) {
        const target = fetched.find((r) => r.id === newReportId);
        if (target) {
          setSelectedReportId(target.id);
          setFlyToCenter([target.latitud, target.longitud]);
          showToast('¡Bache publicado exitosamente en el mapa!');
        }
      } else if (fetched.length > 0 && !selectedReportId) {
        setSelectedReportId(fetched[0].id);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'Críticos') return r.severidad === 'GRAVE';
    if (activeFilter === 'Validados') return r.totalValidaciones > 0 || r.validadoPorUsuarioActual;
    return true;
  });

  const totalReports = reports.length;
  const totalValidated = reports.filter((r) => r.totalValidaciones > 0).length;
  const totalCritical = reports.filter((r) => r.severidad === 'GRAVE').length;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const closeAllMenus = () => {
    setNotificationsOpen(false);
    setAccountOpen(false);
    setPanelOpen(false);
  };

  return (
    <View className="flex-1 overflow-hidden bg-civic-background" onTouchEnd={closeAllMenus}>
      {(notificationsOpen || accountOpen || panelOpen) && (
        <Pressable
          className="absolute inset-0 z-10"
          onPress={closeAllMenus}
          accessibilityLabel="Cerrar menús y panel"
        />
      )}

      <MapView
        reports={filteredReports}
        selectedReportId={selectedReportId}
        userLocation={userLocation}
        flyToCenter={flyToCenter}
        onSelectReport={(id) => {
          setSelectedReportId(id);
          setIsDetailOpen(true);
        }}
      />

      {/* Header — matches web Dashboard header */}
      <View
        className="absolute inset-x-0 top-0 z-30 flex-row items-start justify-between gap-3 p-3"
        style={{ pointerEvents: 'box-none', paddingTop: Math.max(insets.top + 12, 12) }}
      >
        <View
          className="glass h-14 flex-row items-center gap-2.5 border border-civic-secondary px-3 shadow-lg"
          style={{ backgroundColor: 'rgba(22,32,55,0.94)', borderRadius: 16, overflow: 'hidden' }}
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-civic-primary">
            <Feather name="map-pin" size={20} color="#0d1420" />
          </View>
          <View>
            <Text className="text-sm font-bold tracking-tight text-civic-foreground">Baches RD</Text>
            <Text className="text-[10px] text-civic-muted-foreground">Calles mejores, entre todos.</Text>
          </View>
        </View>

        <View className="relative" style={{ pointerEvents: 'auto' }} onTouchEnd={(e) => e.stopPropagation()}>
          <View
            className="glass h-14 flex-row items-center gap-1 border border-civic-secondary p-2 shadow-lg"
            style={{ backgroundColor: 'rgba(22,32,55,0.94)', borderRadius: 16, overflow: 'hidden' }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl"
              onPress={() => {
                setNotificationsOpen((prev) => !prev);
                setAccountOpen(false);
                setHasUnreadNotifications(false);
              }}
            >
              <Feather name="bell" size={20} color="#a8b2c7" />
              {hasUnreadNotifications && (
                <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-civic-card bg-civic-destructive" />
              )}
            </Button>

            {isAuthenticated && user ? (
              <Button
                variant="ghost"
                className="rounded-xl"
                onPress={() => {
                  setAccountOpen((open) => !open);
                  setNotificationsOpen(false);
                }}
              >
                {user.avatarUrl ? (
                  <View className="h-7 w-7 overflow-hidden rounded-full border border-civic-primary/30">
                    <Image source={{ uri: user.avatarUrl }} className="h-7 w-7" accessibilityLabel={`Avatar de ${user.nombre}`} />
                  </View>
                ) : (
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-civic-primary">
                    <Text className="text-xs font-bold text-civic-primary-foreground">{getInitials(user.nombre)}</Text>
                  </View>
                )}
                <Feather
                  name="chevron-down"
                  size={16}
                  color="#a8b2c7"
                  style={{ transform: [{ rotate: accountOpen ? '180deg' : '0deg' }] }}
                />
              </Button>
            ) : (
              <View className="flex-row items-center gap-1.5 px-1">
                <Button variant="outline" size="sm" className="rounded-2xl" onPress={() => router.push('/login')}>
                  <Text className="text-xs font-medium text-civic-foreground">Iniciar sesión</Text>
                </Button>
              </View>
            )}
          </View>

          {/* Notification Center Dropdown */}
          {notificationsOpen && (
            <Animated.View
              className="absolute z-40 border border-civic-secondary shadow-xl"
              style={{
                position: 'absolute',
                top: 60,
                right: 0,
                width: 330,
                maxWidth: (Platform.OS === 'web' ? 'calc(100vw - 24px)' : '92%') as any,
                borderRadius: 20,
                padding: 16,
                overflow: 'hidden',
                backgroundColor: 'rgba(22,32,55,0.96)',
                opacity: notifAnim,
                transform: [
                  {
                    scale: notifAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                  {
                    translateY: notifAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-8, 0],
                    }),
                  },
                ],
              }}
            >
              <View className="flex-row items-center justify-between border-b border-civic-secondary pb-2.5 mb-2">
                <View className="flex-row items-center gap-2">
                  <Feather name="bell" size={16} color="#5b8aff" />
                  <Text className="text-sm font-bold text-civic-foreground">Notificaciones</Text>
                </View>
                {notifications.length > 0 && (
                  <Pressable onPress={handleClearAllNotifications}>
                    <Text className="text-[11px] font-semibold text-civic-muted-foreground">Borrar todas</Text>
                  </Pressable>
                )}
              </View>

              {notifications.length > 0 ? (
                <View className="max-h-72 gap-2">
                  {notifications.map((n) => {
                    const isDismissing = dismissingIds.includes(n.id);
                    return (
                      <View
                        key={n.id}
                        className={cn('flex-row items-start gap-2.5 rounded-xl p-2', isDismissing && 'opacity-30')}
                      >
                        <View className={cn('mt-0.5 h-8 w-8 items-center justify-center rounded-xl', n.color)}>
                          <Feather name={n.icon} size={16} color="#5b8aff" />
                        </View>
                        <View className="min-w-0 flex-1">
                          <View className="flex-row items-center justify-between gap-2">
                            <Text className="flex-1 text-xs font-semibold text-civic-foreground">
                              {n.title}
                            </Text>
                            <View className="flex-row items-center gap-1.5 shrink-0">
                              <Text className="text-[10px] text-civic-muted-foreground">{n.time}</Text>
                              <Pressable
                                onPress={() => handleDismissNotification(n.id)}
                                className="rounded-lg p-0.5"
                              >
                                <Feather name="x" size={14} color="#a8b2c7" />
                              </Pressable>
                            </View>
                          </View>
                          <Text className="mt-0.5 text-[11px] leading-tight text-civic-muted-foreground">{n.desc}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="items-center justify-center p-6">
                  <Feather name="check-circle" size={32} color="#a8b2c7" />
                  <Text className="mt-2 text-xs font-semibold text-civic-muted-foreground">
                    No tienes notificaciones pendientes
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {accountOpen && user && (
            <Animated.View
              className="absolute z-40 border border-civic-secondary shadow-xl"
              style={{
                position: 'absolute',
                top: 60,
                right: 0,
                width: 240,
                maxWidth: (Platform.OS === 'web' ? 'calc(100vw - 24px)' : '92%') as any,
                borderRadius: 20,
                padding: 14,
                overflow: 'hidden',
                backgroundColor: 'rgba(22,32,55,0.96)',
                opacity: accountAnim,
                transform: [
                  {
                    scale: accountAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                  {
                    translateY: accountAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-8, 0],
                    }),
                  },
                ],
              }}
            >
              <View className="px-3 py-2">
                <Text className="text-sm font-semibold text-civic-foreground">{user.nombre}</Text>
                <Text className="text-xs text-civic-muted-foreground">{user.email}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setAccountOpen(false);
                  setIsProfileOpen(true);
                }}
                className="flex-row items-center gap-2 rounded-xl px-3 py-2 active:bg-civic-secondary"
              >
                <Feather name="user" size={16} color="#a8b2c7" />
                <Text className="text-sm text-civic-foreground">Mi cuenta</Text>
              </Pressable>
              <Pressable
                onPress={() => void logout()}
                className="flex-row items-center gap-2 rounded-xl px-3 py-2 active:bg-civic-destructive/10"
              >
                <Feather name="log-out" size={16} color="#e0554a" />
                <Text className="text-sm text-civic-destructive">Cerrar sesión</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>

      <Animated.View
        className="absolute z-20 border border-civic-secondary shadow-xl"
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'rgba(22,32,55,0.96)',
          top: Platform.OS === 'web' ? 80 : Math.max(insets.top + 76, 80),
          left: 12,
          bottom: 96,
          width: 340,
          maxWidth: '90%',
          borderRadius: 28,
          padding: 20,
          overflow: 'hidden',
          transform: [{ translateX: panelTranslate }],
        }}
      >
        <View className="flex-row items-start justify-between gap-4">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-civic-primary">Santo Domingo</Text>
            <Text className="mt-1 text-2xl font-bold tracking-tight text-civic-foreground">Estado de las calles</Text>
          </View>
          <Button variant="ghost" size="icon" className="rounded-xl" onPress={() => setPanelOpen(false)}>
            <Feather name="x" size={20} color="#a8b2c7" />
          </Button>
        </View>

        <View className="mt-5 flex-row gap-2">
          <Metric value={String(totalReports)} label="Reportes" />
          <Metric value={String(totalValidated)} label="Validados" />
          <Metric value={String(totalCritical)} label="Críticos" alert={totalCritical > 0} />
        </View>

        <View className="mt-5 flex-row items-center justify-between gap-2">
          <Text className="text-sm font-semibold text-civic-foreground">Vista del mapa</Text>
          <Button variant="ghost" size="sm" onPress={() => void fetchReports()}>
            <Feather name="sliders" size={14} color="#a8b2c7" />
            <Text className="text-xs font-medium text-civic-foreground">Actualizar</Text>
          </Button>
        </View>
        <View className="mt-2 flex-row gap-1 rounded-xl bg-civic-secondary p-1">
          {filters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={cn(
                'flex-1 items-center rounded-lg px-2 py-2',
                activeFilter === filter ? 'bg-civic-background shadow-sm' : ''
              )}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  activeFilter === filter ? 'text-civic-foreground' : 'text-civic-muted-foreground'
                )}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-5 flex-row items-center justify-between gap-3">
          <Text className="text-sm font-semibold text-civic-foreground">Reportes recientes</Text>
          <Text className="text-xs text-civic-muted-foreground">
            {loading ? 'Cargando...' : `${filteredReports.length} reportes`}
          </Text>
        </View>
        <ScrollView className="mt-3 flex-1" contentContainerClassName="gap-2">
          {filteredReports.map((report) => (
            <ReportRow
              key={report.id}
              active={selectedReportId === report.id}
              report={report}
              onClick={() => {
                setSelectedReportId(report.id);
                setIsDetailOpen(true);
              }}
            />
          ))}
          {!loading && filteredReports.length === 0 && (
            <Text className="p-4 text-center text-xs text-civic-muted-foreground">
              No hay reportes disponibles en este filtro.
            </Text>
          )}
        </ScrollView>

        <Button size="lg" className="mt-4 h-11 rounded-xl" onPress={() => setIsNewReportOpen(true)}>
          <Feather name="plus" size={16} color="#0d1420" />
          <Text className="text-sm font-semibold text-civic-primary-foreground">Reportar un bache</Text>
        </Button>
      </Animated.View>

      <View className="absolute bottom-24 right-3 z-20 flex-col gap-2" onTouchEnd={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-2xl bg-civic-card shadow-md"
          onPress={() => {
            void handleLocateUser();
            setPanelOpen((open) => !open);
          }}
        >
          <Feather name="crosshair" size={20} color="#a8b2c7" />
        </Button>
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-2xl bg-civic-card shadow-md"
          onPress={() => setPanelOpen((open) => !open)}
        >
          <Feather name="filter" size={20} color="#a8b2c7" />
        </Button>
      </View>

      <NewReportModal
        isOpen={isNewReportOpen}
        onClose={() => setIsNewReportOpen(false)}
        onSuccess={(newId) => void fetchReports(newId)}
        onDuplicate={(id) => {
          if (id) setSelectedReportId(id);
          setIsDuplicateDialogOpen(true);
        }}
      />

      <DuplicateReportDialog
        isOpen={isDuplicateDialogOpen}
        onClose={() => setIsDuplicateDialogOpen(false)}
        onFocusExisting={() => setIsDetailOpen(true)}
      />

      <ReportDetailModal
        isOpen={isDetailOpen}
        report={reports.find((r) => r.id === selectedReportId) || null}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReportId(null);
        }}
        onUpdate={() => void fetchReports()}
        onDelete={(id) => {
          setReports((prev) => prev.filter((r) => r.id !== id));
          setIsDetailOpen(false);
          setSelectedReportId(null);
          void fetchReports();
          showToast('Reporte eliminado correctamente');
        }}
        currentUser={user}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUserUpdated={(updated) => {
          updateUser(updated);
          void fetchReports();
          showToast('Perfil actualizado correctamente');
        }}
      />

      {!!toastMessage && (
        <View className="pointer-events-none absolute inset-x-0 top-20 z-40 flex-row justify-center">
          <View className="flex-row items-center gap-2 rounded-full bg-civic-primary/95 px-4 py-2 shadow-xl">
            <Feather name="check-circle" size={16} color="#0d1420" />
            <Text className="text-xs font-semibold text-civic-primary-foreground">{toastMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Metric({ value, label, alert = false }: { value: string; label: string; alert?: boolean }) {
  return (
    <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: 'rgba(28,38,57,0.75)' }}>
      <Text className={cn('text-xl font-bold text-civic-foreground', alert && 'text-civic-destructive')}>{value}</Text>
      <Text className="mt-1 text-[11px] text-civic-muted-foreground">{label}</Text>
    </View>
  );
}

function ReportRow({ report, active, onClick }: { report: ReporteResponse; active: boolean; onClick: () => void }) {
  const critical = report.severidad === 'GRAVE';
  const validated = report.totalValidaciones > 0;
  const location = report.direccionAprox || report.descripcion || `Bache (${report.latitud.toFixed(4)}, ${report.longitud.toFixed(4)})`;

  return (
    <Pressable
      onPress={onClick}
      className={cn(
        'flex-row items-center gap-3 rounded-2xl border p-3',
        active ? 'border-civic-primary/30 bg-civic-primary/10' : 'border-transparent active:bg-civic-secondary'
      )}
      style={!active ? { backgroundColor: 'rgba(28,38,57,0.6)' } : undefined}
    >
      <View
        className={cn(
          'h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          critical
            ? 'bg-civic-destructive/15'
            : validated
              ? 'bg-civic-primary/15'
              : 'bg-civic-accent'
        )}
      >
        <Feather
          name={validated ? 'check-circle' : critical ? 'alert-circle' : 'shield'}
          size={18}
          color={critical ? '#e0554a' : validated ? '#5b8aff' : '#332308'}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="truncate text-sm font-semibold text-civic-foreground">{location}</Text>
        <Text className="mt-0.5 text-xs text-civic-muted-foreground">
          {report.severidad} · {report.totalValidaciones} likes
        </Text>
      </View>
      <Feather name="chevron-down" size={16} color="#a8b2c7" style={{ transform: [{ rotate: '-90deg' }] }} />
    </Pressable>
  );
}
