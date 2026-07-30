import type {
  AuthResponse,
  CloudinarySignatureResponse,
  FotoRequest,
  FotoResponse,
  ReporteRequest,
  ReporteResponse,
  UpdatePerfilRequest,
  UpdateReporteRequest,
  UsuarioResponse,
} from '@repo/shared-types';

const API_BASE_URL = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
      if (errorData.error) errorMessage = `${errorData.error}: ${errorMessage}`;
    } catch {
      // Ignore JSON parse errors
    }

    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 24 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { nombre: string; email: string; password: string }) =>
    request<UsuarioResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users
  getProfile: () => request<UsuarioResponse>('/users/me'),

  updateProfile: (data: UpdatePerfilRequest) =>
    request<UsuarioResponse>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getMyReports: () => request<ReporteResponse[]>('/users/me/reports'),

  // Reports
  getReports: (params?: {
    minLat?: number;
    maxLat?: number;
    minLon?: number;
    maxLon?: number;
    estado?: string;
    severidad?: string;
    page?: number;
    size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) query.append(key, String(val));
      });
    }
    const qStr = query.toString();
    return request<{ content: ReporteResponse[]; totalElements: number; totalPages: number }>(
      `/reports${qStr ? `?${qStr}` : ''}`
    );
  },

  getNearbyReports: (latitud: number, longitud: number, radio = 5000) =>
    request<ReporteResponse[]>(`/reports/nearby?latitud=${latitud}&longitud=${longitud}&radio=${radio}`),

  getReportById: (id: string) => request<ReporteResponse>(`/reports/${id}`),

  createReport: (data: ReporteRequest) =>
    request<ReporteResponse>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteReport: (id: string) =>
    request<void>(`/reports/${id}`, {
      method: 'DELETE',
    }),

  updateReport: (id: string, data: UpdateReporteRequest) =>
    request<ReporteResponse>(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePhoto: (reportId: string, photoId: string) =>
    request<void>(`/reports/${reportId}/photos/${photoId}`, {
      method: 'DELETE',
    }),

  // Validations (Likes)
  validateReport: (reportId: string) =>
    request<void>(`/reports/${reportId}/validate`, {
      method: 'POST',
    }),

  removeValidation: (reportId: string) =>
    request<void>(`/reports/${reportId}/validate`, {
      method: 'DELETE',
    }),

  // Photos
  getPhotoSignature: () => request<CloudinarySignatureResponse>('/photos/signature'),

  addPhotoToReport: (reportId: string, data: FotoRequest) =>
    request<FotoResponse>(`/reports/${reportId}/photos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadImageToCloudinary: async (reportId: string, file: File, isMain = true): Promise<FotoResponse> => {
    const sigData = await api.getPhotoSignature();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', String(sigData.timestamp));
    formData.append('signature', sigData.signature);

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!cloudRes.ok) {
      throw new Error('Error al subir la imagen a Cloudinary');
    }

    const cloudData = await cloudRes.json();
    return api.addPhotoToReport(reportId, {
      cloudinaryUrl: cloudData.secure_url,
      cloudinaryPublicId: cloudData.public_id,
      esFotoPrincipal: isMain,
    });
  },

  uploadAvatarToCloudinary: async (file: File): Promise<string> => {
    // Validar tamaño: Mínimo 5KB, Máximo 5MB
    const MIN_SIZE = 5 * 1024; // 5KB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (file.size < MIN_SIZE) {
      throw new Error('La imagen es demasiado pequeña. El tamaño mínimo es 5 KB.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('La imagen supera el límite permitido de 5 MB.');
    }

    const sigData = await api.getPhotoSignature();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', String(sigData.timestamp));
    formData.append('signature', sigData.signature);

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!cloudRes.ok) {
      throw new Error('Error al subir avatar a Cloudinary');
    }

    const cloudData = await cloudRes.json();
    return cloudData.secure_url;
  },
};
