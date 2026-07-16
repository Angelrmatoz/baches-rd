import { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Crosshair,
  Filter,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import MapView from '@/components/map-view'

const filters = ['Todos', 'Críticos', 'Validados']

export function CivicDashboard() {
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [panelOpen, setPanelOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(0)

  return (
    <main className="relative isolate h-dvh min-h-[600px] overflow-hidden bg-background" onClick={() => setAccountOpen(false)}>
      <MapView selectedReport={selectedReport} onSelectReport={setSelectedReport} />

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
            <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘ K</kbd>
          </label>
        </div>

        <div className="pointer-events-auto relative" onClick={(event) => event.stopPropagation()}>
          <div className="glass flex h-14 items-center gap-1 rounded-2xl p-2 shadow-glass md:h-16">
            <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative rounded-xl">
              <Bell />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">JR</span>
              <span className="hidden sm:inline">José</span>
              <ChevronDown data-icon="inline-end" className={cn('hidden transition-transform sm:block', accountOpen && 'rotate-180')} />
            </Button>
          </div>

          {accountOpen && (
            <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] flex w-56 flex-col gap-1 rounded-2xl border bg-card p-2 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">José Ramírez</p>
                <p className="text-xs text-muted-foreground">Ciudadano verificado</p>
              </div>
              <button role="menuitem" className="rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary">Mi cuenta</button>
              <button role="menuitem" className="rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary">Mis reportes</button>
              <button role="menuitem" className="rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary">Configuración</button>
            </div>
          )}
        </div>
      </header>

      <aside className={cn('absolute bottom-24 left-3 top-24 z-20 flex w-[calc(100%-1.5rem)] max-w-80 flex-col rounded-3xl border bg-card/95 p-4 shadow-lg transition-transform md:bottom-5 md:left-5 md:top-28', panelOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0')}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Santo Domingo</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance">Estado de las calles</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={() => setPanelOpen(false)} aria-label="Cerrar panel">
            <X />
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric value="248" label="Reportes" />
          <Metric value="183" label="Validados" />
          <Metric value="36" label="Críticos" alert />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Vista del mapa</p>
          <Button variant="ghost" size="sm"><SlidersHorizontal data-icon="inline-start" />Filtros</Button>
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
          <span className="text-xs text-muted-foreground">Actualizado ahora</span>
        </div>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          <ReportRow active={selectedReport === 0} level="Crítico" location="Av. 27 de Febrero" time="Hace 8 min" onClick={() => setSelectedReport(0)} />
          <ReportRow active={selectedReport === 1} level="Medio" location="Calle José Contreras" time="Hace 21 min" onClick={() => setSelectedReport(1)} />
          <ReportRow active={selectedReport === 2} level="Validado" location="Av. Winston Churchill" time="Hace 34 min" onClick={() => setSelectedReport(2)} />
        </div>

        <Button size="lg" className="mt-4 h-11 rounded-xl"><Plus data-icon="inline-start" />Reportar un bache</Button>
      </aside>

      <div className="absolute bottom-24 right-3 z-20 flex flex-col gap-2 md:bottom-6 md:right-5">
        <Button variant="outline" size="icon-lg" className="rounded-2xl bg-card shadow-md" aria-label="Centrar en mi ubicación"><Crosshair /></Button>
        <Button variant="outline" size="icon-lg" className="rounded-2xl bg-card shadow-md" aria-label="Abrir filtros"><Filter /></Button>
      </div>

      <div className="absolute bottom-5 left-3 z-20 flex md:hidden">
        <Button variant="outline" className="h-12 rounded-2xl bg-card shadow-md" onClick={() => setPanelOpen(true)}><SlidersHorizontal data-icon="inline-start" />Explorar reportes</Button>
      </div>
    </main>
  )
}

function Metric({ value, label, alert = false }: { value: string; label: string; alert?: boolean }) {
  return <div className="rounded-2xl bg-secondary/75 p-3"><p className={cn('text-xl font-bold', alert && 'text-destructive')}>{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>
}

function ReportRow({ level, location, time, active, onClick }: { level: string; location: string; time: string; active: boolean; onClick: () => void }) {
  const critical = level === 'Crítico'
  const validated = level === 'Validado'
  return (
    <button onClick={onClick} className={cn('flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors', active ? 'border-primary/30 bg-primary/10' : 'border-transparent bg-secondary/60 hover:bg-secondary')}>
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', critical ? 'bg-destructive/15 text-destructive' : validated ? 'bg-primary/15 text-primary' : 'bg-accent text-accent-foreground')}>
        {validated ? <CheckCircle2 aria-hidden="true" /> : critical ? <CircleAlert aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{location}</p><p className="mt-0.5 text-xs text-muted-foreground">{level} · {time}</p></div>
      <ChevronDown className="size-4 -rotate-90 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}
