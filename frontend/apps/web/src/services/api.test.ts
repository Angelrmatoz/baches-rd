import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('API Client Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes Authorization Bearer token header when token exists in localStorage', async () => {
    localStorage.setItem('token', 'fake-jwt-token-123');

    const mockResponse = { id: 'uuid-123', email: 'test@example.com', nombre: 'Test', rol: 'CIUDADANO', activo: true, createdAt: '2026-01-01' };
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-length': '100' }),
      json: async () => mockResponse,
    });

    const user = await api.getProfile();

    expect(user).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith('/api/v1/users/me', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer fake-jwt-token-123',
      }),
    }));
  });

  it('sends POST /auth/login payload correctly', async () => {
    const mockAuthResponse = {
      token: 'jwt-auth-token',
      user: { id: 'user-1', email: 'user@test.com', nombre: 'User Test', rol: 'CIUDADANO', activo: true, createdAt: '2026-01-01' },
    };

    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-length': '100' }),
      json: async () => mockAuthResponse,
    });

    const res = await api.login({ email: 'user@test.com', password: 'Password123!' });

    expect(res).toEqual(mockAuthResponse);
    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'user@test.com', password: 'Password123!' }),
    }));
  });
});
