import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Login } from './Login'
import { api } from '@/services/api'

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }))

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useNavigate: () => navigateMock,
}))

vi.mock('@/services/api', () => ({
  api: { login: vi.fn() },
}))

const mockedLogin = vi.mocked(api.login)

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockedLogin.mockResolvedValue({ token: 'fake-token' } as Awaited<ReturnType<typeof api.login>>)
  })

  it('muestra error si faltan campos y no llama a la API', async () => {
    render(<Login />)

    fireEvent.click(screen.getByRole('button', { name: 'Entrar al mapa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Por favor completa todos los campos.'
    )
    expect(mockedLogin).not.toHaveBeenCalled()
  })

  it('loguea, guarda el token en localStorage y navega al mapa', async () => {
    render(<Login />)

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar al mapa' }))

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
      })
    })
    expect(localStorage.getItem('token')).toBe('fake-token')
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
  })

  it('muestra el error del servidor cuando el login falla', async () => {
    mockedLogin.mockRejectedValue(new Error('Credenciales inválidas'))
    render(<Login />)

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar al mapa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
  })
})
