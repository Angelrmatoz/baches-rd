import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Heart, MapPin, Pencil, Plus, ShieldAlert, Trash2, User, X } from 'lucide-react'
import type { ReporteResponse, Severidad, UsuarioResponse } from '@repo/shared-types'
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
  const [editing, setEditing] = useState(false)
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editDireccion, setEditDireccion] = useState('')
  const [editSeveridad, setEditSeveridad] = useState<Severidad>('MEDIA')
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState(report?.fotos || [])
  const [addingPhoto, setAddingPhoto] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen || !report) return null

  const fotos = photos
  const hasMultiple = fotos.length > 1
  const currentPhoto = fotos[currentPhotoIndex] || fotos[0]
  const isOwnerOrAdmin = currentUser && (report.usuario?.id === currentUser.id || currentUser.rol === 'ADMIN')

  const handleStartEdit = () => {
    setEditDescripcion(report.descripcion || '')
    setEditDireccion(report.direccionAprox || '')
    setEditSeveridad(report.severidad)
    setPhotos([...report.fotos])
    setCurrentPhotoIndex(0)
    setErrorMessage('')
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setPhotos([...report.fotos])
    setErrorMessage('')
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      setErrorMessage('')
      await api.updateReport(report.id, {
        descripcion: editDescripcion,
        direccionAprox: editDireccion,
        severidad: editSeveridad,
      })
      onUpdate()
      setEditing(false)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.deletePhoto(report.id, photoId)
      setPhotos((prev) => prev.filter((f) => f.id !== photoId))
      setCurrentPhotoIndex((prev) => Math.min(prev, photos.length - 2))
    } catch {
      // Error handling
    }
  }

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 3) {
      setErrorMessage('Máximo 3 fotos por reporte')
      return
    }
    try {
      setAddingPhoto(true)
      setErrorMessage('')
      await api.uploadImageToCloudinary(report.id, file, photos.length === 0)
      const updated = await api.getReportById(report.id)
      setPhotos(updated.fotos)
      onUpdate()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al subir foto')
    } finally {
      setAddingPhoto(false)
    }
    e.target.value = ''
  }

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

            {editing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePhoto(currentPhoto.id)}
                className="absolute left-3 top-3 z-10 rounded-xl bg-destructive/70 text-white backdrop-blur-md hover:bg-destructive"
              >
                <Trash2 className="size-5" />
              </Button>
            )}

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
                {editing ? (
                  <select
                    value={editSeveridad}
                    onChange={(e) => setEditSeveridad(e.target.value as Severidad)}
                    className="rounded-lg border bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
                  >
                    <option value="LEVE">Leve</option>
                    <option value="MEDIA">Media</option>
                    <option value="GRAVE">Grave</option>
                  </select>
                ) : (
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      report.severidad === 'GRAVE'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {report.severidad}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">Estado: {report.estado}</span>
              </div>

              {editing ? (
                <input
                  type="text"
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  placeholder="Dirección aproximada"
                  className="mt-2 w-full rounded-xl border bg-secondary/60 px-3 py-2 text-sm"
                />
              ) : (
                <h3 className="mt-2 text-xl font-bold">
                  {report.direccionAprox || `Ubicación GPS (${report.latitud}, ${report.longitud})`}
                </h3>
              )}
            </div>
          </div>

          {editing ? (
            <textarea
              value={editDescripcion}
              onChange={(e) => setEditDescripcion(e.target.value)}
              placeholder="Descripción del bache"
              rows={3}
              className="mt-4 w-full rounded-xl border bg-secondary/60 px-3 py-2 text-sm"
            />
          ) : (
            report.descripcion && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{report.descripcion}</p>
            )
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

          {errorMessage && (
            <div className="mt-4 rounded-xl bg-destructive/20 px-4 py-2.5 text-xs font-semibold text-destructive">
              {errorMessage}
            </div>
          )}

          {editing && (
            <div className="mt-4">
              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border border-dashed ${photos.length >= 3 ? 'cursor-not-allowed opacity-50' : ''} bg-secondary/40 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary/80`}>
                <Plus className="size-4" />
                {addingPhoto ? 'Subiendo...' : photos.length >= 3 ? 'Máximo 3 fotos' : 'Agregar foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} disabled={addingPhoto || photos.length >= 3} />
              </label>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-5 text-primary" />
              <span>{report.totalValidaciones} likes</span>
            </div>

            <div className="flex items-center gap-2">
              {isOwnerOrAdmin && !editing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEdit}
                    className="rounded-xl hover:bg-secondary/80"
                  >
                    <Pencil className="mr-1.5 size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsConfirmDeleteOpen(true)}
                    className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    Eliminar
                  </Button>
                </>
              )}

              {editing && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="rounded-xl">
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </>
              )}

              {!editing && (
                <Button
                  onClick={handleToggleValidation}
                  disabled={loadingLike}
                  variant={report.validadoPorUsuarioActual ? 'default' : 'outline'}
                  className="rounded-xl"
                >
                  <Heart className={`mr-1.5 size-4 ${report.validadoPorUsuarioActual ? 'fill-current' : ''}`} />
                  {report.validadoPorUsuarioActual ? 'Validado' : 'Validar este bache'}
                </Button>
              )}
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
