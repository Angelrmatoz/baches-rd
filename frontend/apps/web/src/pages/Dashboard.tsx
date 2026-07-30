import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Crosshair,
  Filter,
  LogOut,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  User,
  X,
} from 'lucide-react'
import type { ReporteResponse } from '@repo/shared-types'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import MapView from '@/components/map-view'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

import { DuplicateReportDialog } from '@/components/DuplicateReportDialog'
import { NewReportModal } from '@/components/NewReportModal'
import { ProfileModal } from '@/components/ProfileModal'
import { ReportDetailModal } from '@/components/ReportDetailModal'

const filters = ['Todos', 'Críticos', 'Validados']

export function Dashboard() {
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [panelOpen, setPanelOpen] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const [reports, setReports] = useState<ReporteResponse[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Geolocation state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null)

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modals state
  const [isNewReportOpen, setIsNewReportOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setToastMessage('Tu navegador no soporta geolocalización.')
      setTimeout(() => setToastMessage(null), 4000)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(coords)
        setFlyToCenter(coords)
        localStorage.setItem('lastUserLocation', JSON.stringify({ lat: coords[0], lng: coords[1] }))
        setToastMessage('Ubicado en tu posición actual')
        setTimeout(() => setToastMessage(null), 3000)
      },
      (err) => {
        setToastMessage(err.code === 1 ? 'Permiso de ubicación denegado.' : 'No se pudo obtener tu ubicación.')
        setTimeout(() => setToastMessage(null), 4000)
      },
      { enableHighAccuracy: true }
    )
  }

  useEffect(() => {
    fetchReports()

    // 1. Restaurar ubicación previa guardada inmediatamente al recargar
    const savedLoc = localStorage.getItem('lastUserLocation')
    if (savedLoc) {
      try {
        const parsed = JSON.parse(savedLoc)
        if (parsed.lat && parsed.lng) {
          const coords: [number, number] = [parsed.lat, parsed.lng]
          setUserLocation(coords)
          setFlyToCenter(coords)
        }
      } catch {
        // Ignorar error de parseo
      }
    }

    // 2. Auto-obtener ubicación actual GPS al cargar la página
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserLocation(coords)
          setFlyToCenter(coords)
          localStorage.setItem('lastUserLocation', JSON.stringify({ lat: coords[0], lng: coords[1] }))
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await api.getReports({ size: 50 })
      setReports(data.content || [])
      if (data.content && data.content.length > 0) {
        setSelectedReportId(data.content[0].id)
      }
    } catch {
      // Fallback if DB empty or error
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'Críticos') return r.severidad === 'GRAVE'
    if (activeFilter === 'Validados') return r.totalValidaciones > 0 || r.validadoPorUsuarioActual
    return true
  })

  const totalReports = reports.length
  const totalValidated = reports.filter((r) => r.totalValidaciones > 0).length
  const totalCritical = reports.filter((r) => r.severidad === 'GRAVE').length

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <main className="relative isolate h-dvh min-h-150 overflow-hidden bg-background" onClick={() => setAccountOpen(false)}>
      <MapView
        reports={filteredReports}
        selectedReportId={selectedReportId}
        userLocation={userLocation}
        flyToCenter={flyToCenter}
        onSelectReport={setSelectedReportId}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 md:p-5">
        <div className="glass pointer-events-auto flex h-14 items-center gap-3 rounded-2xl px-3 shadow-glass md:h-16 md:px-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin aria-hidden="true" />
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-bold tracking-tight">Baches RD</p>
            <p className="text-xs text-muted-foreground">Calles mejores, entre todos.</p>
          </div>
          <div className="hidden h-8 w-px bg-border md:block" />
          <label className="hidden h-10 min-w-64 items-center gap-2 rounded-xl bg-secondary/80 px-3 md:flex">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Buscar sector o dirección</span>
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Buscar sector o dirección" />
          </label>
        </div>

        <div className="pointer-events-auto relative" onClick={(event) => event.stopPropagation()}>
          <div className="glass flex h-14 items-center gap-1 rounded-2xl p-2 shadow-glass md:h-16">
            <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative rounded-xl">
              <Bell />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
            </Button>

            {isAuthenticated && user ? (
              <Button variant="ghost" className="rounded-xl gap-2" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.nombre} className="size-7 rounded-full border border-primary/30 object-cover" />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {getInitials(user.nombre)}
                  </span>
                )}
                <span className="hidden sm:inline">{user.nombre.split(' ')[0]}</span>
                <ChevronDown data-icon="inline-end" className={cn('hidden transition-transform sm:block', accountOpen && 'rotate-180')} />
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="rounded-xl">Iniciar sesión</Button>
                </Link>
                <Link to="/register" className="hidden sm:inline">
                  <Button size="sm" className="rounded-xl">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>

          {accountOpen && user && (
            <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] flex w-56 flex-col gap-1 rounded-2xl border bg-card p-2 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button role="menuitem" onClick={() => { setAccountOpen(false); setIsProfileOpen(true); }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary">
                <User className="size-4" /> Mi cuenta
              </button>
              <button role="menuitem" onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="size-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <aside className={cn('absolute bottom-24 left-3 top-24 z-20 flex w-[calc(100%-1.5rem)] max-w-80 flex-col rounded-3xl border bg-card/95 p-4 shadow-lg transition-all duration-300 md:bottom-5 md:left-5 md:top-28', panelOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-[120%] opacity-0 pointer-events-none')}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Santo Domingo</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance">Estado de las calles</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setPanelOpen(false)} aria-label="Cerrar panel">
            <X />
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric value={String(totalReports)} label="Reportes" />
          <Metric value={String(totalValidated)} label="Validados" />
          <Metric value={String(totalCritical)} label="Críticos" alert={totalCritical > 0} />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Vista del mapa</p>
          <Button variant="ghost" size="sm" onClick={fetchReports}><SlidersHorizontal data-icon="inline-start" />Actualizar</Button>
        </div>
        <div className="mt-2 flex gap-1 rounded-xl bg-secondary/70 p-1">
          {filters.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={cn('flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors', activeFilter === filter ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Reportes recientes</p>
          <span className="text-xs text-muted-foreground">{loading ? 'Cargando...' : `${filteredReports.length} reportes`}</span>
        </div>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {filteredReports.map((report) => (
            <ReportRow
              key={report.id}
              active={selectedReportId === report.id}
              report={report}
              onClick={() => {
                setSelectedReportId(report.id)
                setIsDetailOpen(true)
              }}
            />
          ))}
          {!loading && filteredReports.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">No hay reportes disponibles en este filtro.</p>
          )}
        </div>

        <Button size="lg" className="mt-4 h-11 rounded-xl" onClick={() => setIsNewReportOpen(true)}>
          <Plus data-icon="inline-start" />Reportar un bache
        </Button>
      </aside>

      <div className="absolute bottom-24 right-3 z-20 flex flex-col gap-2 md:bottom-6 md:right-5">
        <Button variant="outline" size="icon-lg" className="rounded-2xl bg-card shadow-md hover:bg-secondary" onClick={handleLocateUser} aria-label="Centrar en mi ubicación">
          <Crosshair />
        </Button>
        <Button variant="outline" size="icon-lg" className="rounded-2xl bg-card shadow-md hover:bg-secondary" onClick={() => setPanelOpen((open) => !open)} aria-label="Abrir o cerrar panel lateral">
          <Filter />
        </Button>
      </div>

      <NewReportModal
        isOpen={isNewReportOpen}
        onClose={() => setIsNewReportOpen(false)}
        onSuccess={fetchReports}
        onDuplicate={(id) => {
          if (id) setSelectedReportId(id)
          setIsDuplicateDialogOpen(true)
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
          setIsDetailOpen(false)
          setSelectedReportId(null)
        }}
        onUpdate={fetchReports}
        onDelete={() => {
          setIsDetailOpen(false)
          setSelectedReportId(null)
          fetchReports()
          setToastMessage('Reporte eliminado correctamente')
          setTimeout(() => setToastMessage(null), 4000)
        }}
        currentUser={user}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUserUpdated={(updated) => {
          updateUser(updated)
          fetchReports()
          setToastMessage('Perfil actualizado correctamente')
          setTimeout(() => setToastMessage(null), 4000)
        }}
      />

      {toastMessage && (
        <div className="pointer-events-none fixed top-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary/95 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xl backdrop-blur-md animate-toast-slide">
          <CheckCircle2 className="size-4 shrink-0" />
          <span className="whitespace-nowrap">{toastMessage}</span>
        </div>
      )}
    </main>
  )
}

function Metric({ value, label, alert = false }: { value: string; label: string; alert?: boolean }) {
  return <div className="rounded-2xl bg-secondary/75 p-3"><p className={cn('text-xl font-bold', alert && 'text-destructive')}>{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>
}

function ReportRow({ report, active, onClick }: { report: ReporteResponse; active: boolean; onClick: () => void }) {
  const critical = report.severidad === 'GRAVE'
  const validated = report.totalValidaciones > 0
  const location = report.direccionAprox || report.descripcion || `Bache (${report.latitud.toFixed(4)}, ${report.longitud.toFixed(4)})`

  return (
    <button onClick={onClick} className={cn('flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors', active ? 'border-primary/30 bg-primary/10' : 'border-transparent bg-secondary/60 hover:bg-secondary')}>
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', critical ? 'bg-destructive/15 text-destructive' : validated ? 'bg-primary/15 text-primary' : 'bg-accent text-accent-foreground')}>
        {validated ? <CheckCircle2 aria-hidden="true" /> : critical ? <CircleAlert aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{location}</p><p className="mt-0.5 text-xs text-muted-foreground">{report.severidad} · {report.totalValidaciones} likes</p></div>
      <ChevronDown className="size-4 -rotate-90 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}
