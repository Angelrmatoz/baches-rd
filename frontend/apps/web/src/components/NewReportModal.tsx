import { useState, type FormEvent } from 'react'
import { AlertCircle, Camera, Check, Loader2, MapPin, Search, X } from 'lucide-react'
import type { Severidad } from '@repo/shared-types'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

interface NewReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onDuplicate: (existingReportId: string) => void
  defaultLat?: number
  defaultLng?: number
}

interface SuggestionItem {
  display_name: string
  lat: string
  lon: string
}

export function NewReportModal({
  isOpen,
  onClose,
  onSuccess,
  onDuplicate,
  defaultLat = 18.486,
  defaultLng = -69.931,
}: NewReportModalProps) {
  const [locationMode, setLocationMode] = useState<'street' | 'gps'>('street')
  const [latitud, setLatitud] = useState(defaultLat)
  const [longitud, setLongitud] = useState(defaultLng)
  const [descripcion, setDescripcion] = useState('')
  const [direccionAprox, setDireccionAprox] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isStreetVerified, setIsStreetVerified] = useState(false)
  const [severidad, setSeveridad] = useState<Severidad>('MEDIA')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [geocodingSuccess, setGeocodingSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    if (files.length + selected.length > 3) {
      setError('Solo se permite adjuntar un máximo de 3 fotos por reporte.')
      return
    }

    const valid: File[] = []
    for (const f of selected) {
      if (!f.type.startsWith('image/')) {
        setError(`El archivo "${f.name}" no es una foto válida. Solo se permiten imágenes.`)
        return
      }
      if (f.size > 5 * 1024 * 1024) {
        setError(`La foto "${f.name}" pesa más de 5 MB. Por favor elige imágenes más livianas.`)
        return
      }
      if (f.size < 5 * 1024) {
        setError(`La foto "${f.name}" es demasiado pequeña (mínimo 5 KB).`)
        return
      }
      valid.push(f)
    }

    setFiles((prev) => [...prev, ...valid].slice(0, 3))
  }

  const handleRemovePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitud(Number(pos.coords.latitude.toFixed(6)))
          setLongitud(Number(pos.coords.longitude.toFixed(6)))
          setGeocodingSuccess('Ubicación obtenida por GPS.')
          setTimeout(() => setGeocodingSuccess(null), 3000)
        },
        () => setError('No se pudo obtener la ubicación GPS.')
      )
    }
  }

  const fetchSuggestions = async (rawQuery: string) => {
    setIsStreetVerified(false)
    if (!rawQuery.trim() || rawQuery.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const cleaned = rawQuery
      .replace(/\b(esquina|esq\.|esq|frente a|casi)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    try {
      setGeocodingLoading(true)
      const queryParam = `${cleaned}, Santo Domingo, República Dominicana`
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParam)}&limit=5`,
        { headers: { 'Accept-Language': 'es' } }
      )

      if (res.ok) {
        const results: SuggestionItem[] = await res.json()
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      }
    } catch {
      // Ignore network search errors silently
    } finally {
      setGeocodingLoading(false)
    }
  }

  const handleSelectSuggestion = (item: SuggestionItem) => {
    const foundLat = Number(parseFloat(item.lat).toFixed(6))
    const foundLon = Number(parseFloat(item.lon).toFixed(6))
    setLatitud(foundLat)
    setLongitud(foundLon)

    if (!direccionAprox.trim()) {
      setDireccionAprox(item.display_name.split(',')[0] || item.display_name)
    }

    setIsStreetVerified(true)
    setShowSuggestions(false)
    setGeocodingSuccess(`Ubicación seleccionada: (${foundLat}, ${foundLon})`)
    setTimeout(() => setGeocodingSuccess(null), 4000)
  }

  const handleGeocodeAddress = async (): Promise<boolean> => {
    if (!direccionAprox.trim()) {
      setError('Por favor ingresa una dirección o referencia de la calle.')
      return false
    }

    const cleaned = direccionAprox
      .replace(/\b(esquina|esq\.|esq|frente a|casi)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    try {
      setGeocodingLoading(true)
      setError(null)
      const queryParam = `${cleaned}, Santo Domingo, República Dominicana`
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParam)}&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      )

      if (res.ok) {
        const results: SuggestionItem[] = await res.json()
        if (results && results.length > 0) {
          handleSelectSuggestion(results[0])
          return true
        }
      }
      setError(`La dirección "${direccionAprox}" no se encontró en el mapa de Santo Domingo. Selecciona una opción válida.`)
      return false
    } catch {
      setError('Error al consultar la dirección en el mapa.')
      return false
    } finally {
      setGeocodingLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Strict validation if in Street mode
    if (locationMode === 'street') {
      if (!direccionAprox.trim()) {
        setError('Por favor ingresa una dirección de calle.')
        return
      }

      if (!isStreetVerified) {
        const verified = await handleGeocodeAddress()
        if (!verified) return // Stop submission if street does not exist or failed geocoding!
      }
    }

    setLoading(true)

    try {
      const created = await api.createReport({
        latitud,
        longitud,
        descripcion: descripcion.trim(),
        direccionAprox: direccionAprox.trim(),
        severidad,
      })

      if (files.length > 0 && created.id) {
        for (let i = 0; i < files.length; i++) {
          try {
            await api.uploadImageToCloudinary(created.id, files[i], i === 0)
          } catch {
            // Continue uploading remaining photos
          }
        }
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      const msg = err instanceof Error ? err.message : 'Error al crear reporte'

      if (status === 409 || msg.includes('DUPLICATE_REPORT') || msg.includes('ubicación')) {
        const match = msg.match(/[0-9a-fA-F-]{36}/)
        const existingId = match ? match[0] : ''
        onDuplicate(existingId)
        onClose()
        return
      }

      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-backdrop">
      <div className="glass w-full max-w-lg rounded-3xl border bg-card p-6 shadow-xl animate-modal-pop">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MapPin className="size-5" />
            </div>
            <h2 className="text-xl font-bold">Reportar nuevo bache</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {geocodingSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-primary/15 p-3 text-xs text-primary">
              <Check className="size-4 shrink-0" />
              <span>{geocodingSuccess}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/15 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-1 rounded-xl bg-secondary/70 p-1">
            <button
              type="button"
              onClick={() => setLocationMode('street')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                locationMode === 'street' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              1. Por nombre de calle
            </button>
            <button
              type="button"
              onClick={() => setLocationMode('gps')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                locationMode === 'gps' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              2. GPS / Coordenadas
            </button>
          </div>

          {locationMode === 'street' ? (
            <div className="relative">
              <label className="text-xs font-semibold text-muted-foreground">Dirección o referencia de la calle</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Av. 27 de Febrero esq. Lope de Vega"
                  value={direccionAprox}
                  onChange={(e) => {
                    setDireccionAprox(e.target.value)
                    fetchSuggestions(e.target.value)
                  }}
                  required
                  className="h-11 flex-1 rounded-xl border bg-secondary/60 px-3 text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={geocodingLoading}
                  onClick={handleGeocodeAddress}
                  className="h-11 rounded-xl px-3 text-xs font-semibold"
                >
                  {geocodingLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-1 size-3.5" />
                      <span>Buscar calle</span>
                    </>
                  )}
                </Button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border bg-card p-1 shadow-2xl backdrop-blur-md animate-modal-pop">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left text-xs transition-colors hover:bg-secondary"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="line-clamp-2 leading-tight text-foreground">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Escribe la dirección y selecciona una de las sugerencias del mapa para obtener las coordenadas automáticamente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation} className="rounded-xl text-xs">
                <MapPin className="mr-1 size-3.5" /> Obtener mi posición GPS actual
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Latitud</label>
                  <input
                    type="number"
                    step="any"
                    value={latitud}
                    onChange={(e) => setLatitud(parseFloat(e.target.value))}
                    required
                    className="mt-1 h-11 w-full rounded-xl border bg-secondary/60 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    value={longitud}
                    onChange={(e) => setLongitud(parseFloat(e.target.value))}
                    required
                    className="mt-1 h-11 w-full rounded-xl border bg-secondary/60 px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Referencia de dirección (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Frente al supermercado"
                  value={direccionAprox}
                  onChange={(e) => setDireccionAprox(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border bg-secondary/60 px-3 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Severidad del daño</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(['LEVE', 'MEDIA', 'GRAVE'] as Severidad[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSeveridad(s)}
                  className={`h-10 rounded-xl text-xs font-semibold transition-all ${
                    severidad === s
                      ? s === 'GRAVE'
                        ? 'bg-destructive text-destructive-foreground shadow-sm'
                        : 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Descripción opcional</label>
            <textarea
              placeholder="Describe la profundidad o peligro del agujero..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border bg-secondary/60 p-3 text-sm outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Fotos del daño (máximo 3, máx 5 MB c/u)</label>
              <span className="text-[11px] font-semibold text-muted-foreground">{files.length}/3 fotos</span>
            </div>
            <div className="mt-1 flex flex-col gap-2">
              {files.length < 3 && (
                <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed bg-secondary/60 px-4 text-xs font-semibold transition-colors hover:bg-secondary">
                  <Camera className="size-4 text-primary" />
                  <span>{files.length === 0 ? 'Agregar fotos del daño' : 'Agregar otra foto'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}

              {files.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border bg-secondary/50 px-3 py-2 text-xs">
                      <span className="max-w-[240px] truncate font-medium text-foreground">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePhoto(idx)}
                          className="size-6 rounded-lg text-destructive hover:bg-destructive/10"
                          title="Eliminar foto"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? 'Publicando...' : 'Publicar reporte'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
