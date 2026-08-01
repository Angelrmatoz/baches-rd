import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ModalShell } from './ModalShell';
import { Button } from './ui/button';

interface DuplicateReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusExisting: () => void;
}

export function DuplicateReportDialog({ isOpen, onClose, onFocusExisting }: DuplicateReportDialogProps) {
  return (
    <ModalShell visible={isOpen} onClose={onClose} cardClassName="p-6">
      <View className="flex-row items-center justify-between border-b border-civic-secondary pb-4">
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-civic-destructive/15">
            <Feather name="alert-triangle" size={20} color="#e0554a" />
          </View>
          <Text className="text-lg font-bold text-civic-foreground">Reporte duplicado detectado</Text>
        </View>
        <Button variant="ghost" size="icon" className="rounded-xl" onPress={onClose}>
          <Feather name="x" size={20} color="#a8b2c7" />
        </Button>
      </View>

      <View className="mt-4 gap-3">
        <Text className="text-sm leading-relaxed text-civic-muted-foreground">
          Ya existe un reporte activo registrado a menos de 30 metros de esta ubicación.
        </Text>
        <Text className="text-xs text-civic-muted-foreground">
          Para evitar información duplicada, te invitamos a revisar el reporte existente y otorgar tu validación (like) para darle mayor visibilidad.
        </Text>
      </View>

      <View className="mt-6 flex-row items-center justify-end gap-2 border-t border-civic-secondary pt-4">
        <Button variant="outline" className="rounded-xl" onPress={onClose}>
          <Text className="text-sm font-medium text-civic-foreground">Cerrar</Text>
        </Button>
        <Button
          className="rounded-xl"
          onPress={() => {
            onFocusExisting();
            onClose();
          }}
        >
          <Feather name="check-circle" size={16} color="#0d1420" />
          <Text className="text-sm font-semibold text-civic-primary-foreground">Ver reporte existente</Text>
        </Button>
      </View>
    </ModalShell>
  );
}
