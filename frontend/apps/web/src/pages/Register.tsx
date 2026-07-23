import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    // Mock visual only — sin API aún
  }

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Fondo cívico: gradientes + “mapa” abstracto */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,oklch(0.55_0.18_245/0.18),transparent_50%),radial-gradient(ellipse_at_80%_10%,oklch(0.82_0.14_78/0.22),transparent_45%),radial-gradient(ellipse_at_70%_85%,oklch(0.55_0.18_245/0.12),transparent_50%)]" />
        <div className="absolute -left-24 top-16 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 size-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,oklch(0.55_0.18_245/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.55_0.18_245/0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

        <span className="civic-marker absolute left-[12%] top-[22%] size-8 opacity-80"><span /></span>
        <span className="civic-marker civic-marker--critical absolute right-[18%] top-[30%] size-7 opacity-70"><span /></span>
        <span className="civic-marker civic-marker--verified absolute bottom-[18%] left-[22%] size-9 opacity-75"><span /></span>
        <span className="civic-marker absolute bottom-[28%] right-[14%] size-6 opacity-60"><span /></span>
      </div>

      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        {/* Panel de marca */}
        <section className="glass hidden flex-col justify-between rounded-[2rem] p-8 shadow-glass lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <MapPin className="size-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">Baches RD</p>
                <p className="text-sm text-muted-foreground">Santo Domingo de Guzmán</p>
              </div>
            </div>

            <h1 className="mt-10 max-w-md text-4xl font-bold tracking-tight text-balance">
              Únete a la red ciudadana.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Crea tu cuenta para reportar baches, validar evidencia cerca de ti
              y sumar datos útiles a tu comunidad.
            </p>
          </div>

          <ul className="mt-10 grid gap-3">
            <Feature
              icon={<User className="size-4" aria-hidden="true" />}
              title="Perfil verificado"
              description="Tu identidad protege la calidad de cada reporte"
            />
            <Feature
              icon={<ShieldCheck className="size-4" aria-hidden="true" />}
              title="Reportes con evidencia"
              description="Foto, ubicación y severidad en un solo flujo"
            />
            <Feature
              icon={<Users className="size-4" aria-hidden="true" />}
              title="Impacto colectivo"
              description="Más vecinos activos, mejores calles para todos"
            />
          </ul>
        </section>

        {/* Card de registro */}
        <section className="glass flex flex-col justify-center rounded-[2rem] p-6 shadow-glass sm:p-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MapPin className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight">Baches RD</p>
              <p className="text-xs text-muted-foreground">Calles mejores, entre todos.</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Registro ciudadano
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Crea tu cuenta
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Completa tus datos para empezar a reportar y validar en el mapa.
            </p>
          </div>

          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <Field label="Nombre completo" htmlFor="name">
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="María Rodríguez"
                  className={fieldInputClass}
                />
              </div>
            </Field>

            <Field label="Correo electrónico" htmlFor="register-email">
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className={fieldInputClass}
                />
              </div>
            </Field>

            <Field label="Contraseña" htmlFor="register-password">
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={cn(fieldInputClass, 'pr-11')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirmar contraseña" htmlFor="confirm-password">
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={cn(fieldInputClass, 'pr-11')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <label className="flex cursor-pointer items-start gap-2 pt-1 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
              />
              <span>
                Acepto los términos de uso y la política de privacidad de Baches RD.
              </span>
            </label>

            <Button type="submit" size="lg" className="mt-2 h-12 w-full rounded-xl text-sm font-semibold">
              Crear cuenta
            </Button>

            {submitted && (
              <p className="rounded-xl bg-secondary/80 px-3 py-2 text-center text-xs text-muted-foreground">
                Vista de diseño — el registro aún no está conectado al backend.
              </p>
            )}
          </form>

          <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary transition-opacity hover:opacity-80"
            >
              Inicia sesión
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

const fieldInputClass =
  'h-12 w-full rounded-xl border border-border bg-secondary/70 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/40'

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </li>
  )
}
