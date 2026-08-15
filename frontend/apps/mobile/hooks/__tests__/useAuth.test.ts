import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { UsuarioResponse } from '@repo/shared-types';

jest.mock('../../lib/storage', () => ({
  getStoredUser: jest.fn(),
  getTokenSync: jest.fn(),
  setStoredUser: jest.fn(),
  clearAuth: jest.fn(),
  setToken: jest.fn(),
}));

jest.mock('@repo/api', () => ({
  api: { getProfile: jest.fn() },
}));

import * as storage from '../../lib/storage';
import { api } from '@repo/api';
import { useAuth } from '../useAuth';

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockApi = api as jest.Mocked<typeof api>;

const USER: UsuarioResponse = {
  id: 'u-1',
  nombre: 'Juan Pérez',
  email: 'juan@test.com',
  rol: 'CIUDADANO',
  activo: true,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getStoredUser.mockReturnValue(null);
  });

  it('sin token deja user null y loading false', async () => {
    mockStorage.getTokenSync.mockReturnValue(null);

    const { result } = await renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('carga perfil cuando existe token', async () => {
    mockStorage.getTokenSync.mockReturnValue('token-123');
    mockApi.getProfile.mockResolvedValue(USER);

    const { result } = await renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(USER);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockStorage.setStoredUser).toHaveBeenCalledWith(USER);
  });

  it('limpia sesion si getProfile devuelve 401', async () => {
    mockStorage.getTokenSync.mockReturnValue('token-vencido');
    mockApi.getProfile.mockRejectedValue(new Error('401 Unauthorized'));

    const { result } = await renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockStorage.clearAuth).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('login guarda token y usuario; logout limpia', async () => {
    mockStorage.getTokenSync.mockReturnValue(null);
    const { result } = await renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.login('token-abc', USER));
    expect(mockStorage.setToken).toHaveBeenCalledWith('token-abc');
    expect(mockStorage.setStoredUser).toHaveBeenCalledWith(USER);
    expect(result.current.user).toEqual(USER);
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });
    expect(mockStorage.clearAuth).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('updateUser actualiza usuario en estado y storage', async () => {
    mockStorage.getTokenSync.mockReturnValue(null);
    const { result } = await renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.login('token-abc', USER));
    const nuevo = { ...USER, nombre: 'Juan Carlos' };
    await act(async () => result.current.updateUser(nuevo));
    expect(mockStorage.setStoredUser).toHaveBeenLastCalledWith(nuevo);
    expect(result.current.user).toEqual(nuevo);
  });
});