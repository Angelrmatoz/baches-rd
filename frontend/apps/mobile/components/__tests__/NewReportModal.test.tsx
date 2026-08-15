import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

jest.mock('../../services/api', () => ({
  api: {
    createReport: jest.fn(),
    uploadImageToCloudinary: jest.fn(),
  },
}));

import { api } from '../../services/api';
import { NewReportModal } from '../NewReportModal';

const mockApi = api as jest.Mocked<typeof api>;

const renderModal = (overrides: Partial<Parameters<typeof NewReportModal>[0]> = {}) =>
  render(
    <NewReportModal
      isOpen
      onClose={jest.fn()}
      onSuccess={jest.fn()}
      onDuplicate={jest.fn()}
      defaultLat={18.4861}
      defaultLng={-69.9312}
      {...overrides}
    />
  );

describe('NewReportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.createReport.mockResolvedValue({ id: 'report-1' } as never);
    mockApi.uploadImageToCloudinary.mockResolvedValue({ id: 'foto-1' } as never);
  });

  it('renderiza titulo y modo calle por defecto', async () => {
    await renderModal();
    expect(screen.getByText('Reportar nuevo bache')).toBeOnTheScreen();
    expect(screen.getByText('1. Por nombre de calle')).toBeOnTheScreen();
    expect(
      screen.getByPlaceholderText('Ej: Av. 27 de Febrero esq. Lope de Vega')
    ).toBeOnTheScreen();
  });

  it('muestra error si submit sin direccion en modo calle', async () => {
    await renderModal();
    await fireEvent.press(screen.getByText('Publicar reporte'));
    expect(await screen.findByText('Por favor ingresa una dirección de calle.')).toBeOnTheScreen();
    expect(mockApi.createReport).not.toHaveBeenCalled();
  });

  it('geocodifica la calle antes de crear el reporte', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Av. Lincoln, Santo Domingo, República Dominicana',
          lat: '18.477000',
          lon: '-69.933000',
        },
      ],
    }) as never;

    await renderModal();
    await fireEvent.changeText(
      screen.getByPlaceholderText('Ej: Av. 27 de Febrero esq. Lope de Vega'),
      'Av. Lincoln'
    );
    await fireEvent.press(screen.getByText('Publicar reporte'));

    await waitFor(() => {
      expect(mockApi.createReport).toHaveBeenCalledWith(
        expect.objectContaining({ latitud: 18.477, longitud: -69.933 })
      );
    });
    expect(mockApi.createReport).toHaveBeenCalledWith(
      expect.objectContaining({ direccionAprox: 'Av. Lincoln', severidad: 'MEDIA' })
    );
  });

  it('crea reporte en modo GPS con coordenadas por defecto', async () => {
    await renderModal();
    await fireEvent.press(screen.getByText('2. GPS / Coordenadas'));
    await fireEvent.press(screen.getByText('Publicar reporte'));

    await waitFor(() => {
      expect(mockApi.createReport).toHaveBeenCalledWith(
        expect.objectContaining({ latitud: 18.4861, longitud: -69.9312 })
      );
    });
  });

  it('reporta duplicado con status 409', async () => {
    const onDuplicate = jest.fn();
    const onClose = jest.fn();
    mockApi.createReport.mockRejectedValue(
      Object.assign(
        new Error('Ya existe un bache reportado en esa ubicación (ID: 123e4567-e89b-12d3-a456-426614174000)'),
        { status: 409 }
      ) as never
    );

    await renderModal({ onDuplicate, onClose });
    await fireEvent.press(screen.getByText('2. GPS / Coordenadas'));
    await fireEvent.press(screen.getByText('Publicar reporte'));

    await waitFor(() => {
      expect(onDuplicate).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('sube fotos tras crear el reporte', async () => {
    await renderModal();

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://foto.jpg',
          base64: 'cGhvdG8=',
          fileName: 'foto.jpg',
          mimeType: 'image/jpeg',
          fileSize: 100 * 1024,
        },
      ],
    });

    await fireEvent.press(screen.getByText('Agregar fotos del daño'));
    await waitFor(() => {
      expect(screen.getByText('foto.jpg')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByText('2. GPS / Coordenadas'));
    await fireEvent.press(screen.getByText('Publicar reporte'));

    await waitFor(() => {
      expect(mockApi.uploadImageToCloudinary).toHaveBeenCalledWith('report-1', expect.any(Object), true);
    });
  });

  it('rechaza foto que no es imagen y muestra error', async () => {
    await renderModal();

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://clip.mp4',
          fileName: 'clip.mp4',
          mimeType: 'video/mp4',
          fileSize: 200 * 1024,
        },
      ],
    });

    await fireEvent.press(screen.getByText('Agregar fotos del daño'));

    expect(await screen.findByText(/no es una foto válida/)).toBeOnTheScreen();
    expect(screen.queryByText('clip.mp4')).not.toBeOnTheScreen();
  });

  it('obtiene posicion GPS al presionar boton', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 18.484567, longitude: -69.930123 },
    });

    await renderModal();
    await fireEvent.press(screen.getByText('2. GPS / Coordenadas'));
    await fireEvent.press(screen.getByText('Obtener mi posición GPS actual'));

    expect(await screen.findByText('Ubicación obtenida por GPS.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Publicar reporte'));

    await waitFor(() => {
      expect(mockApi.createReport).toHaveBeenCalledWith(
        expect.objectContaining({ latitud: 18.484567, longitud: -69.930123 })
      );
    });
  });
});
