import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Register } from './Register'
import { api } from '@/services/api'

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }))

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useNavigate: () => navigateMock,
}))

vi.mock('@/services/api', () => ({
  api: { register: vi.fn() },
}))

const mockedRegister = vi.mocked(api.register)

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Rodríguez' } })
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'ana@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123' } })
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'secret123' } })
}

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRegister.mockResolvedValue({} as Awaited<ReturnType<typeof api.register>>)
  })

  it('muestra error si la contraseña tiene menos de 8 caracteres', async () => {
    render(<Register />)

    fillValidForm()
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'corta' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'corta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La contraseña debe tener al menos 8 caracteres.'
    )
    expect(mockedRegister).not.toHaveBeenCalled()
  })

  it('muestra error si las contraseñas no coinciden', async () => {
    render(<Register />)

    fillValidForm()
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'diferente' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.')
    expect(mockedRegister).not.toHaveBeenCalled()
  })

  it('requiere aceptar los términos y condiciones', async () => {
    render(<Register />)

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Debes aceptar los términos y condiciones.'
    )
    expect(mockedRegister).not.toHaveBeenCalled()
  })

  it('registra y navega al login cuando el formulario es válido', async () => {
    render(<Register />)

    fillValidForm()
    fireEvent.click(screen.getByLabelText(/Acepto los términos/))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledWith({
        nombre: 'Ana Rodríguez',
        email: 'ana@example.com',
        password: 'secret123',
      })
    })
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })
})
