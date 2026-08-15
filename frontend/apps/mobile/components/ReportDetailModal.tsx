import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { FotoResponse, ReporteResponse, Severidad, UsuarioResponse } from '@repo/shared-types';

import { ModalShell } from './ModalShell';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { Button } from './ui/button';
import { cn } from '../lib/cn';
import { api, type PickedImage } from '../services/api';

interface ReportDetailModalProps {
  report: ReporteResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: (reportId: string) => void;
  currentUser?: UsuarioResponse | null;
}

export function ReportDetailModal({
  report,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  currentUser,
}: ReportDetailModalProps) {
  const [loadingLike, setLoadingLike] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editSeveridad, setEditSeveridad] = useState<Severidad>('MEDIA');
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<FotoResponse[]>(report?.fotos || []);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (report) {
      setPhotos(report.fotos || []);
      setCurrentPhotoIndex(0);
      if (isOpen && report.id) {
        api.getReportById(report.id)
          .then((fresh) => {
            if (fresh?.fotos) {
              setPhotos(fresh.fotos);
            }
          })
          .catch(() => {});
      }
    }
  }, [report, isOpen]);

  if (!isOpen || !report) return null;

  const fotos = photos;
  const hasMultiple = fotos.length > 1;
  const currentPhoto = fotos[currentPhotoIndex] || fotos[0];
  const isOwnerOrAdmin = currentUser && (report.usuario?.id === currentUser.id || currentUser.rol === 'ADMIN');

  const handleStartEdit = () => {
    setEditDescripcion(report.descripcion || '');
    setEditDireccion(report.direccionAprox || '');
    setEditSeveridad(report.severidad);
    setPhotos([...report.fotos]);
    setCurrentPhotoIndex(0);
    setErrorMessage('');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setPhotos([...report.fotos]);
    setErrorMessage('');
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      await api.updateReport(report.id, {
        descripcion: editDescripcion,
        direccionAprox: editDireccion,
        severidad: editSeveridad,
      });
      onUpdate();
      setEditing(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.deletePhoto(report.id, photoId);
      setPhotos((prev) => prev.filter((f) => f.id !== photoId));
      setCurrentPhotoIndex((prev) => Math.min(prev, fotos.length - 2));
    } catch {
      // Error handling
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 3) {
      setErrorMessage('Máximo 3 fotos por reporte');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const picked: PickedImage = {
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    };
    try {
      setAddingPhoto(true);
      setErrorMessage('');
      await api.uploadImageToCloudinary(report.id, picked, photos.length === 0);
      const updated = await api.getReportById(report.id);
      setPhotos(updated.fotos);
      onUpdate();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al subir foto');
    } finally {
      setAddingPhoto(false);
    }
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
  };

  const handleToggleValidation = async () => {
    try {
      setLoadingLike(true);
      if (report.validadoPorUsuarioActual) {
        await api.removeValidation(report.id);
      } else {
        await api.validateReport(report.id);
      }
      onUpdate();
    } catch {
      // Error handling
    } finally {
      setLoadingLike(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.deleteReport(report.id);
    } catch {
      // Ignore if already deleted
    } finally {
      setIsConfirmDeleteOpen(false);
      onClose();
      if (onDelete) onDelete(report.id);
    }
  };

  return (
    <>
      <ModalShell visible={isOpen} onClose={onClose} cardClassName="p-0" cardStyle={{ maxHeight: '90%' }}>
        {fotos.length > 0 ? (
          <View className="h-60 w-full overflow-hidden rounded-t-4xl bg-black/90">
            {currentPhoto ? (
              <Image
                source={{ uri: currentPhoto.cloudinaryUrl }}
                className="h-full w-full rounded-t-4xl"
                resizeMode="cover"
                accessibilityLabel={`Foto ${currentPhotoIndex + 1} del bache`}
              />
            ) : null}

            <View className="absolute right-3 top-3 z-10">
              <Button variant="ghost" size="icon" className="rounded-xl bg-black/50" onPress={onClose}>
                <Feather name="x" size={20} color="#ffffff" />
              </Button>
            </View>

            {editing && (
              <View className="absolute left-3 top-3 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl bg-civic-destructive/70"
                  onPress={() => handleDeletePhoto(currentPhoto.id)}
                >
                  <Feather name="trash-2" size={20} color="#ffffff" />
                </Button>
              </View>
            )}

            {hasMultiple && (
              <>
                <View className="absolute inset-x-0 top-1/2 z-10 flex-row items-center justify-between px-3" style={{ marginTop: -16 }}>
                  <Button variant="ghost" size="icon" className="rounded-full bg-black/50" accessibilityLabel="Anterior foto" onPress={handlePrevPhoto}>
                    <Feather name="chevron-left" size={20} color="#ffffff" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full bg-black/50" accessibilityLabel="Siguiente foto" onPress={handleNextPhoto}>
                    <Feather name="chevron-right" size={20} color="#ffffff" />
                  </Button>
                </View>

                <View className="absolute inset-x-0 bottom-3 z-10 flex-row justify-center">
                  <View className="flex-row items-center gap-1.5 rounded-full bg-black/60 px-3 py-1">
                    <Text className="text-xs font-semibold text-white">
                      {currentPhotoIndex + 1} / {fotos.length}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        ) : (
          <View className="flex-row items-center justify-between border-b border-civic-secondary p-5">
            <View className="flex-row items-center gap-2">
              <Feather name="shield" size={20} color="#5b8aff" />
              <Text className="text-lg font-bold text-civic-foreground">Detalle del reporte</Text>
            </View>
            <Button variant="ghost" size="icon" className="rounded-xl" onPress={onClose}>
              <Feather name="x" size={20} color="#a8b2c7" />
            </Button>
          </View>
        )}

        <ScrollView className="p-6" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
          <View>
            <View className="flex-row items-center gap-2">
              {editing ? (
                <View className="flex-row gap-1">
                  {(['LEVE', 'MEDIA', 'GRAVE'] as Severidad[]).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setEditSeveridad(s)}
                      className={cn(
                        'rounded-lg border px-2 py-1',
                        editSeveridad === s ? 'bg-civic-primary' : 'bg-civic-secondary'
                      )}
                    >
                      <Text className="text-xs font-bold uppercase tracking-wider text-civic-foreground">{s}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
                    report.severidad === 'GRAVE'
                      ? 'bg-civic-destructive/20 text-civic-destructive'
                      : 'bg-civic-primary/20 text-civic-primary'
                  )}
                >
                  {report.severidad}
                </Text>
              )}
              <Text className="text-xs text-civic-muted-foreground">Estado: {report.estado}</Text>
            </View>

            {editing ? (
              <TextInput
                value={editDireccion}
                onChangeText={setEditDireccion}
                placeholder="Dirección aproximada"
                placeholderTextColor="#a8b2c7"
                className="mt-2 w-full rounded-xl border border-civic-secondary bg-civic-secondary/60 px-3 py-2 text-sm text-civic-foreground"
              />
            ) : (
              <Text className="mt-2 text-xl font-bold text-civic-foreground">
                {report.direccionAprox || `Ubicación GPS (${report.latitud}, ${report.longitud})`}
              </Text>
            )}
          </View>

          {editing ? (
            <TextInput
              value={editDescripcion}
              onChangeText={setEditDescripcion}
              placeholder="Descripción del bache"
              placeholderTextColor="#a8b2c7"
              multiline
              numberOfLines={3}
              className="w-full rounded-xl border border-civic-secondary bg-civic-secondary/60 px-3 py-2 text-sm text-civic-foreground"
            />
          ) : (
            report.descripcion ? (
              <Text className="text-sm leading-relaxed text-civic-muted-foreground">{report.descripcion}</Text>
            ) : null
          )}

          <View className="flex-col gap-2.5 rounded-2xl bg-civic-secondary/50 p-4">
            <View className="flex-row items-center gap-2">
              <Feather name="user" size={16} color="#a8b2c7" />
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] text-civic-muted-foreground">Reportado por</Text>
                <Text className="text-xs font-semibold text-civic-foreground" numberOfLines={1}>
                  {report.usuario?.nombre || 'Ciudadano'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 border-t border-civic-secondary/40 pt-2">
              <Feather name="map-pin" size={16} color="#a8b2c7" />
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] text-civic-muted-foreground">Coordenadas</Text>
                <Text className="text-xs font-semibold text-civic-foreground">
                  {report.latitud.toFixed(4)}, {report.longitud.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>

          {errorMessage ? (
            <View className="rounded-xl bg-civic-destructive/20 px-4 py-2.5">
              <Text className="text-xs font-semibold text-civic-destructive">{errorMessage}</Text>
            </View>
          ) : null}

          {editing && (
            <Pressable
              onPress={() => void handleAddPhoto()}
              disabled={addingPhoto || photos.length >= 3}
              className={cn(
                'flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-civic-secondary bg-civic-secondary/40 px-4 py-3',
                photos.length >= 3 && 'opacity-50'
              )}
            >
              <Feather name="plus" size={16} color="#a8b2c7" />
              <Text className="text-sm font-semibold text-civic-muted-foreground">
                {addingPhoto ? 'Subiendo...' : photos.length >= 3 ? 'Máximo 3 fotos' : 'Agregar foto'}
              </Text>
            </Pressable>
          )}

          <View className="gap-3 border-t border-civic-secondary pt-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Feather name="check-circle" size={18} color="#5b8aff" />
                <Text className="text-sm font-semibold text-civic-foreground">{report.totalValidaciones} likes</Text>
              </View>

              {isOwnerOrAdmin && !editing && (
                <View className="flex-row items-center gap-1">
                  <Button variant="ghost" size="sm" className="rounded-xl" onPress={handleStartEdit}>
                    <Feather name="edit-2" size={15} color="#a8b2c7" />
                    <Text className="text-xs font-medium text-civic-foreground">Editar</Text>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-xl" onPress={() => setIsConfirmDeleteOpen(true)}>
                    <Feather name="trash-2" size={15} color="#e0554a" />
                    <Text className="text-xs font-medium text-civic-destructive">Eliminar</Text>
                  </Button>
                </View>
              )}

              {editing && (
                <View className="flex-row items-center gap-1">
                  <Button variant="ghost" size="sm" className="rounded-xl" onPress={handleCancelEdit}>
                    <Text className="text-xs font-medium text-civic-foreground">Cancelar</Text>
                  </Button>
                  <Button size="sm" className="rounded-xl" loading={saving} disabled={saving} onPress={() => void handleSaveEdit()}>
                    <Text className="text-xs font-semibold text-civic-primary-foreground">
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </Button>
                </View>
              )}
            </View>

            {!editing && (
              <Button
                variant={report.validadoPorUsuarioActual ? 'default' : 'outline'}
                className="h-11 w-full rounded-xl"
                loading={loadingLike}
                disabled={loadingLike}
                onPress={() => void handleToggleValidation()}
              >
                <Feather
                  name="heart"
                  size={16}
                  color={report.validadoPorUsuarioActual ? '#0d1420' : '#a8b2c7'}
                />
                <Text
                  className={cn(
                    'text-sm font-bold',
                    report.validadoPorUsuarioActual ? 'text-civic-primary-foreground' : 'text-civic-foreground'
                  )}
                >
                  {report.validadoPorUsuarioActual ? 'Confirmado / Validado' : 'Validar este bache'}
                </Text>
              </Button>
            )}
          </View>
        </ScrollView>
      </ModalShell>

      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
