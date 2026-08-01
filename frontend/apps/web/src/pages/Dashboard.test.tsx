import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';

vi.mock('@/services/api', () => ({
  api: {
    getReports: vi.fn().mockResolvedValue({
      content: [
        {
          id: '1',
          latitud: 18.486,
          longitud: -69.931,
          descripcion: 'Bache 27 de Febrero',
          direccionAprox: 'Av. 27 de Febrero',
          severidad: 'GRAVE',
          estado: 'ACTIVO',
          totalValidaciones: 2,
          validadoPorUsuarioActual: false,
          fotos: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    }),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/components/map-view', () => ({
  default: () => <div data-testid="mock-map">Map Component</div>,
}));

describe('Dashboard Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Header title and Santo Domingo streets panel', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Baches RD')).toBeInTheDocument();
      expect(screen.getByText('Estado de las calles')).toBeInTheDocument();
      expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    });
  });

  it('displays report metrics', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Reportes').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Validados').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Críticos').length).toBeGreaterThan(0);
    });
  });
});
