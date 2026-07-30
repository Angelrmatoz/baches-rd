import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReportDetailModal } from './ReportDetailModal'
import type { ReporteResponse, UsuarioResponse } from '@repo/shared-types'

const mockUser: UsuarioResponse = {
  id: 'user-123',
  nombre: 'Ciudadano Matos',
  email: 'matos@example.com',
  rol: 'CIUDADANO',
  activo: true,
  createdAt: '2026-01-01T00:00:00Z',
}

const mockReport: ReporteResponse = {
  id: 'report-111',
  latitud: 18.474,
  longitud: -69.923,
  direccionAprox: 'Av. 27 de Febrero',
  descripcion: 'Bache profundo',
  severidad: 'GRAVE',
  estado: 'ACTIVO',
  totalValidaciones: 3,
  validadoPorUsuarioActual: false,
  usuario: mockUser,
  fotos: [
    { id: 'f1', cloudinaryUrl: 'https://cloudinary.com/f1.jpg', cloudinaryPublicId: 'pub-f1', esFotoPrincipal: true, createdAt: '2026-01-01' },
    { id: 'f2', cloudinaryUrl: 'https://cloudinary.com/f2.jpg', cloudinaryPublicId: 'pub-f2', esFotoPrincipal: false, createdAt: '2026-01-01' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('ReportDetailModal - Unit & Integration Tests', () => {
  const defaultProps = {
    report: mockReport,
    isOpen: true,
    onClose: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    currentUser: mockUser,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders report details and multi-photo carousel counter (1 / 2)', () => {
    render(<ReportDetailModal {...defaultProps} />)

    expect(screen.getByText('Av. 27 de Febrero')).toBeInTheDocument()
    expect(screen.getByText('Bache profundo')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('renders "Eliminar" button for the report author', () => {
    render(<ReportDetailModal {...defaultProps} />)
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
  })

  it('does NOT render "Eliminar" button for non-owner citizens', () => {
    const otherUser: UsuarioResponse = { ...mockUser, id: 'other-user-999' }
    render(<ReportDetailModal {...defaultProps} currentUser={otherUser} />)
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
  })

  it('opens custom confirmation dialog when clicking "Eliminar"', async () => {
    render(<ReportDetailModal {...defaultProps} />)

    const deleteBtn = screen.getByText('Eliminar')
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(screen.getByText('¿Eliminar reporte de bache?')).toBeInTheDocument()
    })
  })
})
