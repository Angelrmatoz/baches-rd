import { useEffect, useState, type FormEvent } from 'react'
import { Edit3, Trash2, User, X } from 'lucide-react'
import type { ReporteResponse, UsuarioResponse } from '@repo/shared-types'
import { Button } from '@/components/ui/button'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { api } from '@/services/api'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: UsuarioResponse | null
  onUserUpdated: (user: UsuarioResponse) => void
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'reports'>('profile')
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [myReports, setMyReports] = useState<ReporteResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportToDeleteId, setReportToDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setNombre(user.nombre)
      setAvatarUrl(user.avatarUrl || '')
    }
  }, [user])

  useEffect(() => {
    if (isOpen && activeTab === 'reports') {
      api.getMyReports().then(setMyReports).catch(() => {})
    }
  }, [isOpen, activeTab])

  if (!isOpen || !user) return null

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const updated = await api.updateProfile({
        nombre: nombre.trim(),
        avatarUrl: avatarUrl.trim(),
      })
      onUserUpdated(updated)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-backdrop">
      <div className="glass w-full max-w-lg rounded-3xl border bg-card p-6 shadow-xl animate-modal-pop">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Mi cuenta</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-secondary/70 p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              activeTab === 'profile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Editar perfil
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              activeTab === 'reports' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Mis reportes
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSaveProfile} className="mt-5 flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-destructive/15 p-3 text-xs text-destructive">
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="mt-1 h-11 w-full rounded-xl border bg-secondary/60 px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Foto de perfil (Avatar)</label>
              <div className="mt-2 flex items-center gap-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="size-14 rounded-full border object-cover shadow-sm" />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
                    {nombre ? nombre[0].toUpperCase() : 'U'}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border bg-secondary/80 px-3 text-xs font-semibold hover:bg-secondary">
                    <span>{avatarUrl ? 'Cambiar foto' : 'Subir nueva foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            setError(null)
                            setLoading(true)
                            const url = await api.uploadAvatarToCloudinary(file)
                            setAvatarUrl(url)
                          } catch (err: unknown) {
                            setError(err instanceof Error ? err.message : 'Error al subir avatar')
                          } finally {
                            setLoading(false)
                          }
                        }
                      }}
                    />
                  </label>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                    >
                      Borrar foto
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Formato JPG, PNG o WEBP. Tamaño min. 5 KB, máx. 5 MB.</p>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                Cerrar
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl">
                <Edit3 className="mr-1.5 size-4" />
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-5 flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
            {myReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-2xl border bg-secondary/50 p-3">
                <div>
                  <p className="text-sm font-semibold">
                    {report.direccionAprox || `Bache (${report.latitud.toFixed(4)}, ${report.longitud.toFixed(4)})`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {report.severidad} · {report.totalValidaciones} likes · {report.estado}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setReportToDeleteId(report.id)}
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  title="Eliminar reporte"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {myReports.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">No has creado ningún reporte de bache aún.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        isOpen={!!reportToDeleteId}
        onClose={() => setReportToDeleteId(null)}
        onConfirm={async () => {
          if (reportToDeleteId) {
            await api.deleteReport(reportToDeleteId)
            setMyReports((prev) => prev.filter((r) => r.id !== reportToDeleteId))
            onUserUpdated(user)
          }
        }}
      />
    </div>
  )
}
