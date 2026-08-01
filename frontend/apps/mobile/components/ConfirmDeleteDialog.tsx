import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { ModalShell } from './ModalShell';
import { Button } from './ui/button';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Eliminar reporte de bache?',
  description = 'Esta acción eliminará el reporte y su imagen en Cloudinary permanentemente. ¿Deseas continuar?',
}: ConfirmDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch {
      // Error handled upstream
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell visible={isOpen} onClose={onClose} cardClassName="p-6">
      <View className="flex-row items-center justify-between border-b border-civic-secondary pb-4">
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-civic-destructive/15">
            <Feather name="alert-triangle" size={20} color="#e0554a" />
          </View>
          <Text className="text-lg font-bold text-civic-foreground">{title}</Text>
        </View>
        <Button variant="ghost" size="icon" className="rounded-xl" onPress={onClose}>
          <Feather name="x" size={20} color="#a8b2c7" />
        </Button>
      </View>

      <View className="mt-4">
        <Text className="text-sm leading-relaxed text-civic-muted-foreground">{description}</Text>
      </View>

      <View className="mt-6 flex-row items-center justify-end gap-2 border-t border-civic-secondary pt-4">
        <Button variant="outline" className="rounded-xl" onPress={onClose}>
          <Text className="text-sm font-medium text-civic-foreground">Cancelar</Text>
        </Button>
        <Button
          className="rounded-xl bg-civic-destructive"
          disabled={loading}
          onPress={handleConfirm}
        >
          <Feather name="trash-2" size={16} color="#ffffff" />
          <Text className="text-sm font-medium text-white">{loading ? 'Eliminando...' : 'Eliminar'}</Text>
        </Button>
      </View>
    </ModalShell>
  );
}
