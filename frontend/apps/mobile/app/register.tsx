import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones.');
      return;
    }

    setLoading(true);
    try {
      await api.register({
        nombre: name.trim(),
        email: email.trim(),
        password,
      });
      router.replace('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la cuenta';
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
        behavior="padding"
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
                  Únete a la red ciudadana.
                </Text>
                <Text className="mt-4 text-base leading-relaxed text-civic-muted-foreground">
                  Crea tu cuenta para reportar baches, validar evidencia cerca de ti y sumar datos útiles a tu comunidad.
                </Text>
              </View>

              <View className="mt-10 gap-3">
                <Feature
                  icon="user"
                  title="Perfil verificado"
                  description="Tu identidad protege la calidad de cada reporte"
                />
                <Feature
                  icon="shield"
                  title="Reportes con evidencia"
                  description="Foto, ubicación y severidad en un solo flujo"
                />
                <Feature
                  icon="users"
                  title="Impacto colectivo"
                  description="Más vecinos activos, mejores calles para todos"
                />
              </View>
            </GlassCard>

            {/* Card de Formulario Registro */}
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
                  Registro ciudadano
                </Text>
                <Text className="mt-2 text-2xl font-bold tracking-tight text-civic-foreground sm:text-3xl">
                  Crea tu cuenta
                </Text>
                <Text className="mt-2 text-sm text-civic-muted-foreground">
                  Completa tus datos para empezar a reportar y validar en el mapa.
                </Text>
              </View>

              <View className="mt-8 gap-4">
                {/* Nombre */}
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-civic-foreground">Nombre completo</Text>
                  <View className="flex-row items-center rounded-xl border border-civic-secondary bg-civic-secondary/70">
                    <Feather name="user" size={16} color="#a8b2c7" className="ml-3 mr-2" />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="María Rodríguez"
                      placeholderTextColor="#a8b2c7"
                      autoComplete="name"
                      className="h-12 flex-1 pr-3 text-sm text-civic-foreground"
                    />
                  </View>
                </View>

                {/* Email */}
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-civic-foreground">Correo electrónico</Text>
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
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor="#a8b2c7"
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      className="h-12 flex-1 pr-3 text-sm text-civic-foreground"
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      className="mr-2 h-8 w-8 items-center justify-center rounded-lg"
                      accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#a8b2c7" />
                    </Pressable>
                  </View>
                </View>

                {/* Confirmar contraseña */}
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-civic-foreground">Confirmar contraseña</Text>
                  <View className="flex-row items-center rounded-xl border border-civic-secondary bg-civic-secondary/70">
                    <Feather name="lock" size={16} color="#a8b2c7" className="ml-3 mr-2" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor="#a8b2c7"
                      secureTextEntry={!showConfirm}
                      autoComplete="new-password"
                      className="h-12 flex-1 pr-3 text-sm text-civic-foreground"
                    />
                    <Pressable
                      onPress={() => setShowConfirm((v) => !v)}
                      className="mr-2 h-8 w-8 items-center justify-center rounded-lg"
                      accessibilityLabel={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                    >
                      <Feather name={showConfirm ? 'eye-off' : 'eye'} size={16} color="#a8b2c7" />
                    </Pressable>
                  </View>
                </View>

                {/* Términos */}
                <Pressable
                  onPress={() => setAcceptTerms((v) => !v)}
                  className="flex-row items-start gap-2 pt-1"
                >
                  <View
                    className={`mt-0.5 h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      acceptTerms ? 'border-civic-primary bg-civic-primary' : 'border-civic-muted-foreground'
                    }`}
                  >
                    {acceptTerms && <Feather name="check" size={12} color="#0d1420" />}
                  </View>
                  <Text className="text-sm text-civic-muted-foreground">
                    Acepto los términos de uso y la política de privacidad de Baches RD.
                  </Text>
                </Pressable>

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
                      Crear cuenta
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
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="font-semibold text-civic-primary">
                    Inicia sesión
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
