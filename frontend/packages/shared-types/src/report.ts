import { UsuarioResponse } from './user';

export type Severidad = 'LEVE' | 'MEDIA' | 'GRAVE';
export type EstadoReporte = 'ACTIVO' | 'EN_REPARACION' | 'RESUELTO';

export interface FotoResponse {
  id: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  esFotoPrincipal: boolean;
  createdAt: string;
}

export interface ReporteResponse {
  id: string;
  usuario?: UsuarioResponse | null;
  descripcion?: string | null;
  latitud: number;
  longitud: number;
  direccionAprox?: string | null;
  severidad: Severidad;
  estado: EstadoReporte;
  totalValidaciones: number;
  validadoPorUsuarioActual: boolean;
  fotos: FotoResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ReporteRequest {
  latitud: number;
  longitud: number;
  descripcion?: string;
  direccionAprox?: string;
  severidad?: Severidad;
}

export interface FotoRequest {
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  esFotoPrincipal?: boolean;
}

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}
