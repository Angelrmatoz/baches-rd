import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('../../services/api', () => ({
  api: {
    getReportById: jest.fn(),
    updateReport: jest.fn(),
    deletePhoto: jest.fn(),
    uploadImageToCloudinary: jest.fn(),
    validateReport: jest.fn(),
    removeValidation: jest.fn(),
    deleteReport: jest.fn(),
  },
}));

import { api } from '../../services/api';
import { ReportDetailModal } from '../ReportDetailModal';

const mockApi = api as jest.Mocked<typeof api>;

const FOTOS = [
  { id: 'f-1', cloudinaryUrl: 'https://res.cloudinary.com/baches-rd/image/upload/foto1.jpg', esFotoPrincipal: true },
  { id: 'f-2', cloudinaryUrl: 'https://res.cloudinary.com/baches-rd/image/upload/foto2.jpg', esFotoPrincipal: false },
];

const makeReport = (overrides: Record<string, unknown> = {}) => ({
  id: 'r-1',
  descripcion: 'Bache grande en la esquina',
  direccionAprox: 'Av. Lincoln',
  severidad: 'GRAVE' as const,
  estado: 'ACTIVO' as const,
  latitud: 18.4861,
  longitud: -69.9312,
  totalValidaciones: 3,
  validadoPorUsuarioActual: false,
  usuario: { id: 'u-1', nombre: 'Juan Pérez', email: 'juan@test.com', rol: 'CIUDADANO' as const, activo: true, createdAt: '2024-01-01T00:00:00Z' },
  fotos: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const renderModal = (overrides: Record<string, unknown> = {}) => {
  const report = (overrides.report as Record<string, unknown> | undefined) ?? makeReport();
  mockApi.getReportById.mockResolvedValue(report as never);
  return render(
    <ReportDetailModal
      report={makeReport()}
      isOpen
      onClose={jest.fn()}
      onUpdate={jest.fn()}
      onDelete={jest.fn()}
      currentUser={{ id: 'u-1', nombre: 'Juan Pérez', email: 'juan@test.com', rol: 'CIUDADANO' } as never}
      {...overrides}
    />
  );
};

describe('ReportDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getReportById.mockResolvedValue(makeReport() as never);
    mockApi.updateReport.mockResolvedValue({} as never);
    mockApi.deleteReport.mockResolvedValue({} as never);
    mockApi.validateReport.mockResolvedValue({} as never);
    mockApi.removeValidation.mockResolvedValue({} as never);
  });

  it('renderiza detalle sin fotos con badge, direccion y likes', async () => {
    await renderModal();
    expect(screen.getByText('Detalle del reporte')).toBeOnTheScreen();
    expect(screen.getByText('GRAVE')).toBeOnTheScreen();
    expect(screen.getByText('Estado: ACTIVO')).toBeOnTheScreen();
    expect(screen.getByText('Av. Lincoln')).toBeOnTheScreen();
    expect(screen.getByText('3 likes')).toBeOnTheScreen();
    expect(screen.getByText('Juan Pérez')).toBeOnTheScreen();
    expect(screen.getByText('Validar este bache')).toBeOnTheScreen();
  });

  it('navega carrusel de fotos con contador', async () => {
    await renderModal({ report: makeReport({ fotos: FOTOS }) });
    expect(screen.getByText('1 / 2')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Siguiente foto'));
    expect(screen.getByText('2 / 2')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Anterior foto'));
    expect(screen.getByText('1 / 2')).toBeOnTheScreen();
  });

  it('muestra botones de edicion solo para creador o admin', async () => {
    await renderModal({ currentUser: { id: 'otro-user', rol: 'CIUDADANO' } as never });
    expect(screen.queryByText('Editar')).not.toBeOnTheScreen();
    expect(screen.queryByText('Eliminar')).not.toBeOnTheScreen();

    await renderModal();
    expect(screen.getByText('Editar')).toBeOnTheScreen();
    expect(screen.getByText('Eliminar')).toBeOnTheScreen();
  });

  it('alterna validacion y llama onUpdate', async () => {
    const onUpdate = jest.fn();
    await renderModal({ onUpdate });

    await fireEvent.press(screen.getByText('Validar este bache'));
    await waitFor(() => expect(mockApi.validateReport).toHaveBeenCalledWith('r-1'));
    expect(onUpdate).toHaveBeenCalled();

    mockApi.validateReport.mockClear();
    await renderModal({
      report: makeReport({ validadoPorUsuarioActual: true }),
      onUpdate,
    });
    await fireEvent.press(screen.getByText('Confirmado / Validado'));
    await waitFor(() => expect(mockApi.removeValidation).toHaveBeenCalledWith('r-1'));
  });

  it('edita descripcion y guarda cambios', async () => {
    const onUpdate = jest.fn();
    await renderModal({ onUpdate });

    await fireEvent.press(screen.getByText('Editar'));
    await fireEvent.changeText(screen.getByPlaceholderText('Descripción del bache'), 'Bache más profundo de lo que parece');
    await fireEvent.press(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(mockApi.updateReport).toHaveBeenCalledWith('r-1', {
        descripcion: 'Bache más profundo de lo que parece',
        direccionAprox: 'Av. Lincoln',
        severidad: 'GRAVE',
      });
    });
    expect(onUpdate).toHaveBeenCalled();
  });

  it('confirma borrado y elimina el reporte', async () => {
    const onDelete = jest.fn();
    const onClose = jest.fn();
    await renderModal({ onDelete, onClose });

    await fireEvent.press(screen.getByText('Eliminar'));
    expect(screen.getByText('¿Eliminar reporte de bache?')).toBeOnTheScreen();

    await fireEvent.press(screen.getAllByText('Eliminar')[1]);
    await waitFor(() => expect(mockApi.deleteReport).toHaveBeenCalledWith('r-1'));
    expect(onDelete).toHaveBeenCalledWith('r-1');
    expect(onClose).toHaveBeenCalled();
  });
});