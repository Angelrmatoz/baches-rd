import { Platform } from 'react-native';
import { api as coreApi } from '@repo/api';
import type { CloudinarySignatureResponse, FotoResponse } from '@repo/shared-types';

export interface PickedImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
}

async function appendImage(formData: FormData, asset: PickedImage): Promise<void> {
  const name = asset.fileName || 'photo.jpg';
  const type = asset.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    // En web el FormData es el nativo del navegador: necesita un Blob/File.
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    formData.append('file', blob, name);
  } else {
    // En React Native los "files" son objetos { uri, name, type }.
    formData.append('file', { uri: asset.uri, name, type } as unknown as Blob);
  }
}

async function uploadToCloudinary(asset: PickedImage): Promise<{ secure_url: string; public_id: string }> {
  const sig: CloudinarySignatureResponse = await coreApi.getPhotoSignature();
  const formData = new FormData();
  await appendImage(formData, asset);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!cloudRes.ok) {
    throw new Error('Error al subir la imagen a Cloudinary');
  }

  return cloudRes.json();
}

export const api = {
  ...coreApi,

  uploadImageToCloudinary: async (reportId: string, asset: PickedImage, isMain = true): Promise<FotoResponse> => {
    const cloudData = await uploadToCloudinary(asset);
    return coreApi.addPhotoToReport(reportId, {
      cloudinaryUrl: cloudData.secure_url,
      cloudinaryPublicId: cloudData.public_id,
      esFotoPrincipal: isMain,
    });
  },

  uploadAvatarToCloudinary: async (asset: PickedImage): Promise<string> => {
    const MIN_SIZE = 5 * 1024; // 5KB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (asset.fileSize != null) {
      if (asset.fileSize < MIN_SIZE) {
        throw new Error('La imagen es demasiado pequeña. El tamaño mínimo es 5 KB.');
      }
      if (asset.fileSize > MAX_SIZE) {
        throw new Error('La imagen supera el límite permitido de 5 MB.');
      }
    }

    const cloudData = await uploadToCloudinary(asset);
    return cloudData.secure_url;
  },
};
