import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { Severidad } from '@repo/shared-types';

import { ModalShell } from './ModalShell';
import { Button } from './ui/button';
import { cn } from '../lib/cn';
import { api, type PickedImage } from '../services/api';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDuplicate: (existingReportId: string) => void;
  defaultLat?: number;
  defaultLng?: number;
}

interface SuggestionItem {
  display_name: string;
  lat: string;
  lon: string;
}

const SANITIZE_STREET = /\b(esquina|esq\.|esq|frente a|casi)\b/gi;

function cleanQuery(raw: string): string {
  return raw.replace(SANITIZE_STREET, ' ').replace(/\s+/g, ' ').trim();
}

function validateAsset(asset: ImagePicker.ImagePickerAsset): string | null {
  if (asset.mimeType && !asset.mimeType.startsWith('image/')) {
    return `El archivo "${asset.fileName || 'imagen'}" no es una foto válida. Solo se permiten imágenes.`;
  }
  if (asset.fileSize != null && asset.fileSize > 5 * 1024 * 1024) {
    return `La foto "${asset.fileName || 'imagen'}" pesa más de 5 MB. Por favor elige imágenes más livianas.`;
  }
  if (asset.fileSize != null && asset.fileSize < 5 * 1024) {
    return `La foto "${asset.fileName || 'imagen'}" es demasiado pequeña (mínimo 5 KB).`;
  }
  return null;
}

export function NewReportModal({
  isOpen,
  onClose,
  onSuccess,
  onDuplicate,
  defaultLat = 18.486,
  defaultLng = -69.931,
}: NewReportModalProps) {
  const [locationMode, setLocationMode] = useState<'street' | 'gps'>('street');
  const [latitud, setLatitud] = useState(defaultLat);
  const [longitud, setLongitud] = useState(defaultLng);
  const [descripcion, setDescripcion] = useState('');
  const [direccionAprox, setDireccionAprox] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isStreetVerified, setIsStreetVerified] = useState(false);
  const [severidad, setSeveridad] = useState<Severidad>('MEDIA');
  const [files, setFiles] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingSuccess, setGeocodingSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoSelect = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - files.length,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    if (files.length + result.assets.length > 3) {
      setError('Solo se permite adjuntar un máximo de 3 fotos por reporte.');
      return;
    }

    const valid: PickedImage[] = [];
    for (const asset of result.assets) {
      const problem = validateAsset(asset);
      if (problem) {
        setError(problem);
        return;
      }
      valid.push({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });
    }

    setFiles((prev) => [...prev, ...valid].slice(0, 3));
  };

  const handleRemovePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('No se pudo obtener la ubicación GPS.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitud(Number(pos.coords.latitude.toFixed(6)));
      setLongitud(Number(pos.coords.longitude.toFixed(6)));
      setGeocodingSuccess('Ubicación obtenida por GPS.');
      setTimeout(() => setGeocodingSuccess(null), 3000);
    } catch {
      setError('No se pudo obtener la ubicación GPS.');
    }
  };

  const fetchSuggestions = async (rawQuery: string) => {
    setIsStreetVerified(false);
    if (!rawQuery.trim() || rawQuery.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cleaned = cleanQuery(rawQuery);

    try {
      setGeocodingLoading(true);
      const queryParam = `${cleaned}, Santo Domingo, República Dominicana`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParam)}&limit=5`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (res.ok) {
        const results: SuggestionItem[] = await res.json();
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }
    } catch {
      // Ignore network search errors silently
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    const foundLat = Number(parseFloat(item.lat).toFixed(6));
    const foundLon = Number(parseFloat(item.lon).toFixed(6));
    setLatitud(foundLat);
    setLongitud(foundLon);

    if (!direccionAprox.trim()) {
      setDireccionAprox(item.display_name.split(',')[0] || item.display_name);
    }

    setIsStreetVerified(true);
    setShowSuggestions(false);
    setGeocodingSuccess(`Ubicación seleccionada: (${foundLat}, ${foundLon})`);
    setTimeout(() => setGeocodingSuccess(null), 4000);
  };

  const handleGeocodeAddress = async (): Promise<boolean> => {
    if (!direccionAprox.trim()) {
      setError('Por favor ingresa una dirección o referencia de la calle.');
      return false;
    }

    const cleaned = cleanQuery(direccionAprox);

    try {
      setGeocodingLoading(true);
      setError(null);
      const queryParam = `${cleaned}, Santo Domingo, República Dominicana`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParam)}&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      );

      if (res.ok) {
        const results: SuggestionItem[] = await res.json();
        if (results && results.length > 0) {
          handleSelectSuggestion(results[0]);
          return true;
        }
      }
      setError(`La dirección "${direccionAprox}" no se encontró en el mapa de Santo Domingo. Selecciona una opción válida.`);
      return false;
    } catch {
      setError('Error al consultar la dirección en el mapa.');
      return false;
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (locationMode === 'street') {
      if (!direccionAprox.trim()) {
        setError('Por favor ingresa una dirección de calle.');
        return;
      }
      if (!isStreetVerified) {
        const verified = await handleGeocodeAddress();
        if (!verified) return;
      }
    }

    setLoading(true);

    try {
      const created = await api.createReport({
        latitud,
        longitud,
        descripcion: descripcion.trim(),
        direccionAprox: direccionAprox.trim(),
        severidad,
      });

      if (files.length > 0 && created.id) {
        for (let i = 0; i < files.length; i++) {
          try {
            await api.uploadImageToCloudinary(created.id, files[i], i === 0);
          } catch {
            // Continue uploading remaining photos
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const msg = err instanceof Error ? err.message : 'Error al crear reporte';

      if (status === 409 || msg.includes('DUPLICATE_REPORT') || msg.includes('ubicación')) {
        const match = msg.match(/[0-9a-fA-F-]{36}/);
        const existingId = match ? match[0] : '';
        onDuplicate(existingId);
        onClose();
        return;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell visible={isOpen} onClose={onClose} cardClassName="max-h-[90%]">
      <View className="flex-row items-center justify-between border-b border-civic-secondary p-5 pb-4">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#00a8ff26]">
            <Feather name="map-pin" size={20} color="#00a8ff" />
          </View>
          <Text className="text-xl font-bold text-civic-foreground">Reportar nuevo bache</Text>
        </View>
        <Button variant="ghost" size="icon" className="rounded-xl" onPress={onClose}>
          <Feather name="x" size={20} color="#a8b2c7" />
        </Button>
      </View>

      <ScrollView className="p-5" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
        {geocodingSuccess && (
          <View className="flex-row items-center gap-2 rounded-xl bg-[#00a8ff26] p-3">
            <Feather name="check" size={16} color="#00a8ff" />
            <Text className="flex-1 text-xs font-semibold text-[#00a8ff]">{geocodingSuccess}</Text>
          </View>
        )}
        {error && (
          <View className="flex-row items-center gap-2 rounded-xl bg-[#e0554a26] p-3">
            <Feather name="alert-circle" size={16} color="#e0554a" />
            <Text className="flex-1 text-xs font-semibold text-[#e0554a]">{error}</Text>
          </View>
        )}

        <View className="flex-row gap-1 rounded-xl bg-[#1c2639] p-1">
          {(['street', 'gps'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setLocationMode(mode)}
              className={cn(
                'flex-1 rounded-lg py-2 px-1 items-center',
                locationMode === mode ? 'bg-civic-background shadow-sm' : ''
              )}
            >
              <Text className={cn('text-xs font-semibold', locationMode === mode ? 'text-civic-foreground' : 'text-civic-muted-foreground')}>
                {mode === 'street' ? '1. Por nombre de calle' : '2. GPS / Coordenadas'}
              </Text>
            </Pressable>
          ))}
        </View>

        {locationMode === 'street' ? (
          <View>
            <Text className="text-xs font-semibold text-civic-muted-foreground">Dirección o referencia de la calle</Text>
            <View className="mt-1 flex-row gap-2">
              <TextInput
                value={direccionAprox}
                onChangeText={(text) => {
                  setDireccionAprox(text);
                  fetchSuggestions(text);
                }}
                placeholder="Ej: Av. 27 de Febrero esq. Lope de Vega"
                placeholderTextColor="#a8b2c7"
                className="h-11 flex-1 rounded-xl border border-civic-secondary bg-[#1c2639] px-3 text-sm text-civic-foreground"
              />
              <Button
                variant="secondary"
                disabled={geocodingLoading}
                onPress={() => void handleGeocodeAddress()}
                className="h-11 rounded-xl px-3"
              >
                <Feather name="search" size={14} color="#a8b2c7" />
                <Text className="text-xs font-semibold text-civic-foreground">
                  {geocodingLoading ? 'Buscando...' : 'Buscar calle'}
                </Text>
              </Button>
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View className="z-30 mt-1 max-h-48 rounded-2xl border border-civic-secondary bg-civic-card p-1">
                {suggestions.map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectSuggestion(item)}
                    className="flex-row items-start gap-2.5 rounded-xl p-2.5 active:bg-civic-secondary"
                  >
                    <Feather name="map-pin" size={16} color="#5b8aff" style={{ marginTop: 2 }} />
                    <Text className="flex-1 text-xs leading-tight text-civic-foreground" numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text className="mt-1.5 text-[11px] text-civic-muted-foreground">
              Escribe la dirección y selecciona una de las sugerencias del mapa para obtener las coordenadas automáticamente.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            <Button variant="outline" size="sm" className="rounded-xl self-start" onPress={() => void handleGetCurrentLocation()}>
              <Feather name="map-pin" size={14} color="#a8b2c7" />
              <Text className="text-xs text-civic-foreground">Obtener mi posición GPS actual</Text>
            </Button>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-civic-muted-foreground">Latitud</Text>
                <TextInput
                  value={String(latitud)}
                  onChangeText={(text) => setLatitud(parseFloat(text) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor="#a8b2c7"
                  className="mt-1 h-11 w-full rounded-xl border border-civic-secondary bg-[#1c2639] px-3 text-sm text-civic-foreground"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-civic-muted-foreground">Longitud</Text>
                <TextInput
                  value={String(longitud)}
                  onChangeText={(text) => setLongitud(parseFloat(text) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor="#a8b2c7"
                  className="mt-1 h-11 w-full rounded-xl border border-civic-secondary bg-[#1c2639] px-3 text-sm text-civic-foreground"
                />
              </View>
            </View>
            <View>
              <Text className="text-xs font-semibold text-civic-muted-foreground">Referencia de dirección (opcional)</Text>
              <TextInput
                value={direccionAprox}
                onChangeText={setDireccionAprox}
                placeholder="Ej: Frente al supermercado"
                placeholderTextColor="#a8b2c7"
                className="mt-1 h-11 w-full rounded-xl border border-civic-secondary bg-[#1c2639] px-3 text-sm text-civic-foreground"
              />
            </View>
          </View>
        )}

        <View>
          <Text className="text-xs font-semibold text-civic-muted-foreground">Severidad del daño</Text>
          <View className="mt-1 flex-row gap-2">
            {(['LEVE', 'MEDIA', 'GRAVE'] as Severidad[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSeveridad(s)}
                className={cn(
                  'h-10 flex-1 items-center justify-center rounded-xl',
                  severidad === s
                    ? s === 'GRAVE'
                      ? 'bg-civic-destructive'
                      : 'bg-civic-primary'
                    : 'bg-civic-secondary'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    severidad === s ? 'text-civic-primary-foreground' : 'text-civic-muted-foreground'
                  )}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs font-semibold text-civic-muted-foreground">Descripción opcional</Text>
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe la profundidad o peligro del agujero..."
            placeholderTextColor="#a8b2c7"
            multiline
            numberOfLines={2}
            className="mt-1 w-full rounded-xl border border-civic-secondary bg-[#1c2639] p-3 text-sm text-civic-foreground"
          />
        </View>

        <View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-civic-muted-foreground">Fotos del daño (máximo 3, máx 5 MB c/u)</Text>
            <Text className="text-[11px] font-semibold text-civic-muted-foreground">{files.length}/3 fotos</Text>
          </View>
          <View className="mt-1 gap-2">
            {files.length < 3 && (
              <Pressable
                onPress={() => void handlePhotoSelect()}
                className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-civic-secondary bg-[#1c2639] px-4 active:bg-[#1c2639]"
              >
                <Feather name="camera" size={16} color="#00a8ff" />
                <Text className="text-xs font-semibold text-civic-foreground">
                  {files.length === 0 ? 'Agregar fotos del daño' : 'Agregar otra foto'}
                </Text>
              </Pressable>
            )}

            {files.length > 0 && (
              <View className="gap-1.5">
                {files.map((f, idx) => (
                  <View key={idx} className="flex-row items-center justify-between rounded-xl border border-civic-secondary bg-[#1c263980] px-3 py-2">
                    <Text className="flex-1 pr-2 text-xs font-medium text-civic-foreground" numberOfLines={1}>
                      {f.fileName || `Foto ${idx + 1}`}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[10px] text-civic-muted-foreground">
                        {((f.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg"
                        onPress={() => handleRemovePhoto(idx)}
                      >
                        <Feather name="x" size={14} color="#e0554a" />
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View className="mt-2 flex-row items-center justify-end gap-2 border-t border-civic-secondary pt-4">
          <Button variant="outline" className="rounded-xl" onPress={onClose}>
            <Text className="text-sm font-medium text-civic-foreground">Cancelar</Text>
          </Button>
          <Button className="rounded-xl" loading={loading} disabled={loading} onPress={() => void handleSubmit()}>
            <Text className="text-sm font-semibold text-civic-primary-foreground">
              {loading ? 'Publicando...' : 'Publicar reporte'}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </ModalShell>
  );
}
