import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileModal } from './ProfileModal'
import { api } from '@/services/api'
import type { UsuarioResponse } from '@repo/shared-types'

vi.mock('@/services/api', () => ({
  api: {
    updateProfile: vi.fn(),
    getMyReports: vi.fn().mockResolvedValue([]),
    uploadAvatarToCloudinary: vi.fn(),
    deleteReport: vi.fn(),
  },
}))

const mockedUpdateProfile = vi.mocked(api.updateProfile)

const mockUser: UsuarioResponse = {
  id: 'user-123',
  nombre: 'Ciudadano Matos',
  email: 'matos@example.com',
  rol: 'CIUDADANO',
  activo: true,
  createdAt: '2026-01-01T00:00:00Z',
  avatarUrl: 'https://cloudinary.com/avatar.jpg',
}

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUpdateProfile.mockResolvedValue(mockUser)
  })

  it('envía avatarUrl vacío al backend cuando se borra la foto de perfil', async () => {
    const onUserUpdated = vi.fn()
    const onClose = vi.fn()

    render(
      <ProfileModal isOpen user={mockUser} onClose={onClose} onUserUpdated={onUserUpdated} />
    )

    fireEvent.click(screen.getByText('Borrar foto'))
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(mockedUpdateProfile).toHaveBeenCalledWith({
        nombre: 'Ciudadano Matos',
        avatarUrl: '',
      })
    })
    expect(onUserUpdated).toHaveBeenCalledWith(mockUser)
    expect(onClose).toHaveBeenCalled()
  })
})
