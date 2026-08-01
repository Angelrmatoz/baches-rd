import { api as coreApi, configureApi } from '@repo/api';
import type { FotoResponse } from '@repo/shared-types';

// Cliente compartido @repo/api configurado para web:
// - base URL relativa /api/v1 (proxy Vite hacia el backend)
// - token leído de localStorage (sesión persistente)
configureApi({
  baseUrl: '/api/v1',
  tokenProvider: () => localStorage.getItem('token'),
});

export const api = {
  ...coreApi,

  // Helpers de subida a Cloudinary (solo web: usan File/FormData del navegador)
  uploadImageToCloudinary: async (reportId: string, file: File, isMain = true): Promise<FotoResponse> => {
    const sigData = await coreApi.getPhotoSignature();
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
    return coreApi.addPhotoToReport(reportId, {
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

    const sigData = await coreApi.getPhotoSignature();
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
