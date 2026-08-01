import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewReportModal } from './NewReportModal'

describe('NewReportModal - Unit & Security Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onDuplicate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renders modal with location options (By street vs GPS)', () => {
    render(<NewReportModal {...defaultProps} />)
    expect(screen.getByText('Reportar nuevo bache')).toBeInTheDocument()
    expect(screen.getByText('1. Por nombre de calle')).toBeInTheDocument()
    expect(screen.getByText('2. GPS / Coordenadas')).toBeInTheDocument()
  })

  it('rejects invalid street address and prevents report creation if street does not exist', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [], // No geocoding results found for fake street
    })

    render(<NewReportModal {...defaultProps} />)

    const streetInput = screen.getByPlaceholderText(/Av. 27 de Febrero/i)
    fireEvent.change(streetInput, { target: { value: 'asdfasfa' } })

    const submitBtn = screen.getByText('Publicar reporte')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/no se encontró en el mapa de Santo Domingo/i)).toBeInTheDocument()
    })
    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
  })

  it('enforces maximum 3 photos limit', async () => {
    render(<NewReportModal {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file1 = new File(['a'.repeat(6000)], 'photo1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['a'.repeat(6000)], 'photo2.jpg', { type: 'image/jpeg' })
    const file3 = new File(['a'.repeat(6000)], 'photo3.jpg', { type: 'image/jpeg' })
    const file4 = new File(['a'.repeat(6000)], 'photo4.jpg', { type: 'image/jpeg' })

    fireEvent.change(fileInput, { target: { files: [file1, file2, file3, file4] } })

    await waitFor(() => {
      expect(screen.getByText(/Solo se permite adjuntar un máximo de 3 fotos/i)).toBeInTheDocument()
    })
  })

  it('rejects video files and non-image formats', async () => {
    render(<NewReportModal {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const videoFile = new File(['a'.repeat(6000)], 'video.mp4', { type: 'video/mp4' })

    fireEvent.change(fileInput, { target: { files: [videoFile] } })

    await waitFor(() => {
      expect(screen.getByText(/Solo se permiten imágenes/i)).toBeInTheDocument()
    })
  })

  it('rejects images exceeding 5 MB limit', async () => {
    render(<NewReportModal {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const hugeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' })

    fireEvent.change(fileInput, { target: { files: [hugeFile] } })

    await waitFor(() => {
      expect(screen.getByText(/pesa más de 5 MB/i)).toBeInTheDocument()
    })
  })
})
