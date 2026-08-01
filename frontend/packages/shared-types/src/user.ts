export type Rol = 'CIUDADANO' | 'ADMIN';

export interface UsuarioResponse {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatarUrl?: string | null;
  activo: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UsuarioResponse;
}

export interface UpdatePerfilRequest {
  nombre?: string;
  avatarUrl?: string;
}
