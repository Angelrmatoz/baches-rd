import { useState, type ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@repo/api';

import { CivicBackground } from '../components/CivicBackground';
import { GlassCard } from '../components/GlassCard';
import { setStoredUser, setToken } from '../lib/storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login({ email: email.trim(), password });
      if (data.token) {
        await setToken(data.token);
      }
      if (data.user) {
        await setStoredUser(data.user);
      }
      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-civic-background">
      <CivicBackground />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow items-center justify-center px-4 py-8"
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View className="z-10 w-full max-w-5xl gap-6 lg:flex-row lg:items-stretch">
            {/* Panel de marca (Héroe para pantallas grandes) */}
            <GlassCard className="hidden flex-1 flex-col justify-between rounded-[2rem] p-8 lg:flex">
              <View>
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-civic-primary shadow-md">
                    <Feather name="map-pin" size={24} color="#0d1420" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold tracking-tight text-civic-foreground">
                      Baches RD
                    </Text>
                    <Text className="text-sm text-civic-muted-foreground">
                      Santo Domingo de Guzmán
                    </Text>
                  </View>
                </View>

                <Text className="mt-10 text-4xl font-bold tracking-tight text-civic-foreground">
                  Calles mejores, entre todos.
                </Text>
                <Text className="mt-4 text-base leading-relaxed text-civic-muted-foreground">
                  Reporta, documenta y valida daños viales con evidencia geoespacial. Tu cuenta protege la integridad de cada reporte cívico.
                </Text>
              </View>

              <View className="mt-10 gap-3">
                <Feature
                  icon="map-pin"
                  title="Mapa en vivo"
                  description="Pines por severidad y validación social"
                />
                <Feature
                  icon="shield"
                  title="Validación ciudadana"
                  description="Confirma reportes reales cerca de ti"
                />
                <Feature
                  icon="users"
                  title="Comunidad local"
                  description="Datos útiles para vecinos y autoridades"
                />
              </View>
            </GlassCard>

            {/* Card de Formulario Login */}
            <GlassCard className="w-full flex-1 rounded-[2rem] p-6 sm:p-8 lg:max-w-[480px]">
              {/* Header móvil */}
              <View className="mb-6 flex-row items-center gap-3 lg:hidden">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-civic-primary">
                  <Feather name="map-pin" size={20} color="#0d1420" />
                </View>
                <View>
                  <Text className="text-base font-bold tracking-tight text-civic-foreground">
                    Baches RD
                  </Text>
                  <Text className="text-xs text-civic-muted-foreground">
                    Calles mejores, entre todos.
                  </Text>
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-widest text-civic-primary">
                  Acceso ciudadano
                </Text>
                <Text className="mt-2 text-2xl font-bold tracking-tight text-civic-foreground sm:text-3xl">
                  Inicia sesión
                </Text>
                <Text className="mt-2 text-sm text-civic-muted-foreground">
                  Entra para ver el mapa, reportar baches y validar reportes de tu zona.
                </Text>
              </View>

              <View className="mt-8 gap-4">
                {/* Email */}
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-civic-foreground">
                    Correo electrónico
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-civic-secondary bg-civic-secondary/70">
                    <Feather name="mail" size={16} color="#a8b2c7" className="ml-3 mr-2" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tu@correo.com"
                      placeholderTextColor="#a8b2c7"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      className="h-12 flex-1 pr-3 text-sm text-civic-foreground"
                    />
                  </View>
                </View>

                {/* Password */}
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-civic-foreground">Contraseña</Text>
                  <View className="flex-row items-center rounded-xl border border-civic-secondary bg-civic-secondary/70">
                    <Feather name="lock" size={16} color="#a8b2c7" className="ml-3 mr-2" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#a8b2c7"
                      secureTextEntry={!showPassword}
                      autoComplete="current-password"
                      className="h-12 flex-1 pr-3 text-sm text-civic-foreground"
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      className="mr-2 h-8 w-8 items-center justify-center rounded-lg"
                      accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={16}
                        color="#a8b2c7"
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Recordarme + Olvidaste contraseña */}
                <View className="flex-row items-center justify-between gap-2 pt-1">
                  <Pressable
                    onPress={() => setRemember((v) => !v)}
                    className="flex-row items-center gap-2"
                  >
                    <View
                      className={`h-4 w-4 items-center justify-center rounded border ${
                        remember ? 'border-civic-primary bg-civic-primary' : 'border-civic-muted-foreground'
                      }`}
                    >
                      {remember && <Feather name="check" size={12} color="#0d1420" />}
                    </View>
                    <Text className="text-sm text-civic-muted-foreground">Recordarme</Text>
                  </Pressable>

                  <Pressable>
                    <Text className="text-sm font-medium text-civic-primary">
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </Pressable>
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  className={`mt-2 h-12 w-full items-center justify-center rounded-xl ${
                    loading ? 'bg-civic-primary/60' : 'bg-civic-primary'
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#0d1420" />
                  ) : (
                    <Text className="text-sm font-semibold text-civic-primary-foreground">
                      Entrar al mapa
                    </Text>
                  )}
                </Pressable>

                {error && (
                  <Text
                    role="alert"
                    className="rounded-xl bg-civic-destructive/10 px-3 py-2 text-center text-xs text-civic-destructive"
                  >
                    {error}
                  </Text>
                )}
              </View>

              <View className="mt-6 border-t border-civic-secondary pt-6">
                <Text className="text-center text-sm text-civic-muted-foreground">
                  ¿Aún no tienes cuenta?{' '}
                  <Link href="/register" className="font-semibold text-civic-primary">
                    Crear cuenta
                  </Link>
                </Text>
              </View>
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-civic-secondary/60 p-3">
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-civic-primary/15">
        <Feather name={icon} size={16} color="#5b8aff" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-civic-foreground">{title}</Text>
        <Text className="mt-0.5 text-xs text-civic-muted-foreground">{description}</Text>
      </View>
    </View>
  );
}
