import { api as coreApi } from '@repo/api';
import type { CloudinarySignatureResponse, FotoResponse } from '@repo/shared-types';

export interface PickedImage {
  uri: string;
  base64?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
}

async function getFileDataUrl(asset: PickedImage): Promise<string> {
  const mime = asset.mimeType || 'image/jpeg';
  if (asset.base64) {
    return asset.base64.startsWith('data:') ? asset.base64 : `data:${mime};base64,${asset.base64}`;
  }
  if (asset.uri.startsWith('data:')) {
    return asset.uri;
  }
  try {
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return asset.uri;
  }
}

async function uploadToCloudinary(asset: PickedImage): Promise<{ secure_url: string; public_id: string }> {
  const sig: CloudinarySignatureResponse = await coreApi.getPhotoSignature();
  const fileData = await getFileDataUrl(asset);

  const payload = {
    file: fileData,
    api_key: sig.apiKey,
    timestamp: sig.timestamp,
    signature: sig.signature,
  };

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!cloudRes.ok) {
    const errorText = await cloudRes.text().catch(() => '');
    console.error('[uploadToCloudinary] Cloudinary error:', cloudRes.status, errorText);
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
