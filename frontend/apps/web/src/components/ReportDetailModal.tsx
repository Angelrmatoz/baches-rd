import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Heart, MapPin, ShieldAlert, Trash2, User, X } from 'lucide-react'
import type { ReporteResponse, UsuarioResponse } from '@repo/shared-types'
import { Button } from '@/components/ui/button'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { api } from '@/services/api'

interface ReportDetailModalProps {
  report: ReporteResponse | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  onDelete?: (reportId: string) => void
  currentUser?: UsuarioResponse | null
}

export function ReportDetailModal({
  report,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  currentUser,
}: ReportDetailModalProps) {
  const [loadingLike, setLoadingLike] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  if (!isOpen || !report) return null

  const fotos = report.fotos || []
  const hasMultiple = fotos.length > 1
  const currentPhoto = fotos[currentPhotoIndex] || fotos[0]
  const isOwnerOrAdmin = currentUser && (report.usuario?.id === currentUser.id || currentUser.rol === 'ADMIN')

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? fotos.length - 1 : prev - 1))
  }

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === fotos.length - 1 ? 0 : prev + 1))
  }

  const handleToggleValidation = async () => {
    try {
      setLoadingLike(true)
      if (report.validadoPorUsuarioActual) {
        await api.removeValidation(report.id)
      } else {
        await api.validateReport(report.id)
      }
      onUpdate()
    } catch {
      // Error handling
    } finally {
      setLoadingLike(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await api.deleteReport(report.id)
    } catch {
      // Ignore if already deleted
    } finally {
      setIsConfirmDeleteOpen(false)
      onClose()
      if (onDelete) onDelete(report.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-backdrop">
      <div className="glass w-full max-w-lg overflow-hidden rounded-3xl border bg-card p-0 shadow-2xl animate-modal-pop">
        {fotos.length > 0 ? (
          <div className="relative h-60 w-full overflow-hidden bg-black/90">
            <img
              src={currentPhoto.cloudinaryUrl}
              alt={`Foto ${currentPhotoIndex + 1} del bache`}
              className="h-full w-full object-cover transition-all duration-300"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-xl bg-black/50 text-white backdrop-blur-md hover:bg-black/75"
            >
              <X className="size-5" />
            </Button>

            {hasMultiple && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/75"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/75"
                >
                  <ChevronRight className="size-5" />
                </Button>

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <span>{currentPhotoIndex + 1} / {fotos.length}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between border-b p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              <h2 className="text-lg font-bold">Detalle del reporte</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="size-5" />
            </Button>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    report.severidad === 'GRAVE'
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  {report.severidad}
                </span>
                <span className="text-xs text-muted-foreground">Estado: {report.estado}</span>
              </div>
              <h3 className="mt-2 text-xl font-bold">
                {report.direccionAprox || `Ubicación GPS (${report.latitud}, ${report.longitud})`}
              </h3>
            </div>
          </div>

          {report.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{report.descripcion}</p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">Reportado por</p>
                <p className="text-xs font-semibold">{report.usuario?.nombre || 'Ciudadano'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">Coordenadas</p>
                <p className="text-xs font-semibold">
                  {report.latitud.toFixed(4)}, {report.longitud.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-5 text-primary" />
              <span>{report.totalValidaciones} likes</span>
            </div>

            <div className="flex items-center gap-2">
              {isOwnerOrAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Eliminar
                </Button>
              )}

              <Button
                onClick={handleToggleValidation}
                disabled={loadingLike}
                variant={report.validadoPorUsuarioActual ? 'default' : 'outline'}
                className="rounded-xl"
              >
                <Heart className={`mr-1.5 size-4 ${report.validadoPorUsuarioActual ? 'fill-current' : ''}`} />
                {report.validadoPorUsuarioActual ? 'Validado' : 'Validar este bache'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
