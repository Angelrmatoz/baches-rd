import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DuplicateReportDialogProps {
  isOpen: boolean
  onClose: () => void
  onFocusExisting: () => void
}

export function DuplicateReportDialog({
  isOpen,
  onClose,
  onFocusExisting,
}: DuplicateReportDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-backdrop">
      <div className="glass w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl animate-modal-pop">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <h2 className="text-lg font-bold text-foreground">Reporte duplicado detectado</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ya existe un reporte activo registrado a menos de 30 metros de esta ubicación.
          </p>
          <p className="text-xs text-muted-foreground">
            Para evitar información duplicada, te invitamos a revisar el reporte existente y otorgar tu **validación (like)** para darle mayor visibilidad.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onFocusExisting()
              onClose()
            }}
            className="rounded-xl"
          >
            <CheckCircle2 className="mr-1.5 size-4" />
            Ver reporte existente
          </Button>
        </div>
      </div>
    </div>
  )
}
