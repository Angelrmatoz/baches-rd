import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { ReporteResponse, UsuarioResponse } from '@repo/shared-types';

import { ModalShell } from './ModalShell';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { Button } from './ui/button';
import { cn } from '../lib/cn';
import { api, type PickedImage } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UsuarioResponse | null;
  onUserUpdated: (user: UsuarioResponse) => void;
}

export function ProfileModal({ isOpen, onClose, user, onUserUpdated }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'reports'>('profile');
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [myReports, setMyReports] = useState<ReporteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportToDeleteId, setReportToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre);
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && activeTab === 'reports') {
      api.getMyReports().then(setMyReports).catch(() => {});
    }
  }, [isOpen, activeTab]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateProfile({
        nombre: nombre.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      onUserUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleUploadAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const picked: PickedImage = {
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    };
    try {
      setError(null);
      setLoading(true);
      const url = await api.uploadAvatarToCloudinary(picked);
      setAvatarUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalShell visible={isOpen} onClose={onClose} cardClassName="max-h-[90%]">
        <View className="flex-row items-center justify-between border-b border-civic-secondary p-5 pb-4">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-civic-primary/15">
              <Feather name="user" size={20} color="#5b8aff" />
            </View>
            <View>
              <Text className="text-lg font-bold text-civic-foreground">Mi cuenta</Text>
              <Text className="text-xs text-civic-muted-foreground">{user.email}</Text>
            </View>
          </View>
          <Button variant="ghost" size="icon" className="rounded-xl" onPress={onClose}>
            <Feather name="x" size={20} color="#a8b2c7" />
          </Button>
        </View>

        <View className="p-5">
          <View className="flex-row gap-1 rounded-xl bg-civic-secondary/70 p-1">
            {(['profile', 'reports'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={cn('flex-1 items-center rounded-lg py-2', activeTab === tab ? 'bg-civic-background shadow-sm' : '')}
              >
                <Text className={cn('text-xs font-semibold', activeTab === tab ? 'text-civic-foreground' : 'text-civic-muted-foreground')}>
                  {tab === 'profile' ? 'Editar perfil' : 'Mis reportes'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {activeTab === 'profile' ? (
          <ScrollView className="px-5 pb-6" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
            {!!error && (
              <View className="rounded-xl bg-civic-destructive/15 p-3">
                <Text className="text-xs text-civic-destructive">{error}</Text>
              </View>
            )}

            <View>
              <Text className="text-xs font-semibold text-civic-muted-foreground">Nombre completo</Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholderTextColor="#a8b2c7"
                className="mt-1 h-11 w-full rounded-xl border border-civic-secondary bg-civic-secondary/60 px-3 text-sm text-civic-foreground"
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-civic-muted-foreground">Foto de perfil (Avatar)</Text>
              <View className="mt-2 flex-row items-center gap-4">
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="h-14 w-14 rounded-full border object-cover" accessibilityLabel="Avatar" />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-civic-primary/15">
                    <Text className="text-xl font-bold text-civic-primary">{nombre ? nombre[0].toUpperCase() : 'U'}</Text>
                  </View>
                )}

                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => void handleUploadAvatar()}
                    className="h-10 flex-row items-center gap-2 rounded-xl border border-civic-secondary bg-civic-secondary/80 px-3 active:bg-civic-secondary"
                  >
                    <Text className="text-xs font-semibold text-civic-foreground">
                      {avatarUrl ? 'Cambiar foto' : 'Subir nueva foto'}
                    </Text>
                  </Pressable>

                  {!!avatarUrl && (
                    <Button variant="ghost" size="sm" className="rounded-xl" onPress={handleRemoveAvatar}>
                      <Text className="text-xs text-civic-destructive">Borrar foto</Text>
                    </Button>
                  )}
                </View>
              </View>
              <Text className="mt-1.5 text-[11px] text-civic-muted-foreground">
                Formato JPG, PNG o WEBP. Tamaño min. 5 KB, máx. 5 MB.
              </Text>
            </View>

            <View className="mt-2 flex-row items-center justify-end gap-2 border-t border-civic-secondary pt-4">
              <Button variant="outline" className="rounded-xl" onPress={onClose}>
                <Text className="text-sm font-medium text-civic-foreground">Cerrar</Text>
              </Button>
              <Button className="rounded-xl" loading={loading} disabled={loading} onPress={() => void handleSaveProfile()}>
                <Feather name="edit-3" size={16} color="#0d1420" />
                <Text className="text-sm font-semibold text-civic-primary-foreground">
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </Text>
              </Button>
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="px-5 pb-6" contentContainerClassName="gap-2">
            {myReports.map((report) => (
              <View key={report.id} className="flex-row items-center justify-between rounded-2xl border border-civic-secondary bg-civic-secondary/50 p-3">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-semibold text-civic-foreground" numberOfLines={1}>
                    {report.direccionAprox || `Bache (${report.latitud.toFixed(4)}, ${report.longitud.toFixed(4)})`}
                  </Text>
                  <Text className="text-xs text-civic-muted-foreground">
                    {report.severidad} · {report.totalValidaciones} likes · {report.estado}
                  </Text>
                </View>
                <Button variant="ghost" size="icon" className="rounded-xl" onPress={() => setReportToDeleteId(report.id)}>
                  <Feather name="trash-2" size={16} color="#e0554a" />
                </Button>
              </View>
            ))}
            {myReports.length === 0 && (
              <Text className="p-4 text-center text-xs text-civic-muted-foreground">
                No has creado ningún reporte de bache aún.
              </Text>
            )}
          </ScrollView>
        )}
      </ModalShell>

      <ConfirmDeleteDialog
        isOpen={!!reportToDeleteId}
        onClose={() => setReportToDeleteId(null)}
        onConfirm={async () => {
          if (reportToDeleteId) {
            await api.deleteReport(reportToDeleteId);
            setMyReports((prev) => prev.filter((r) => r.id !== reportToDeleteId));
            onUserUpdated(user);
          }
        }}
      />
    </>
  );
}
