import { api } from '../api';

jest.mock('@repo/api', () => {
  const coreApi = {
    getPhotoSignature: jest.fn(),
    addPhotoToReport: jest.fn(),
  };
  return { api: coreApi };
});

import { api as coreApi } from '@repo/api';

const mockCore = coreApi as jest.Mocked<typeof coreApi>;

const sig = {
  apiKey: '1234567890',
  timestamp: 1234567890,
  signature: 'deadbeef',
  cloudName: 'baches-rd',
  folder: 'reportes',
  expiration: 3600,
};

const cloudOk = {
  ok: true,
  json: async () => ({ secure_url: 'https://res.cloudinary.com/x.jpg', public_id: 'reportes/abc' }),
  text: async () => '',
} as unknown as Response;

describe('api.uploadImageToCloudinary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCore.getPhotoSignature.mockResolvedValue(sig as never);
    mockCore.addPhotoToReport.mockResolvedValue({ id: 'foto-1' } as never);
  });

  it('sube data URL a Cloudinary y registra foto en reporte', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(cloudOk) as never;

    const asset = { uri: 'file://tmp.jpg', base64: 'aGVsbG8=', mimeType: 'image/jpeg' };
    const result = await api.uploadImageToCloudinary('report-1', asset, true);

    expect(mockCore.getPhotoSignature).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/baches-rd/image/upload',
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.file).toBe('data:image/jpeg;base64,aGVsbG8=');
    expect(body.api_key).toBe(sig.apiKey);
    expect(mockCore.addPhotoToReport).toHaveBeenCalledWith('report-1', {
      cloudinaryUrl: 'https://res.cloudinary.com/x.jpg',
      cloudinaryPublicId: 'reportes/abc',
      esFotoPrincipal: true,
    });
    expect(result).toEqual({ id: 'foto-1' });
  });

  it('mantiene data URL ya prefijada', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(cloudOk) as never;
    await api.uploadImageToCloudinary('report-1', { uri: 'data:image/png;base64,AAAA' });
    const body = JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.file).toBe('data:image/png;base64,AAAA');
  });

  it('lanza error si Cloudinary responde fallo', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'invalid signature',
    } as unknown as Response) as never;

    await expect(
      api.uploadImageToCloudinary('report-1', { uri: 'file://x.jpg', base64: 'QQ==' })
    ).rejects.toThrow('Error al subir la imagen a Cloudinary');
    expect(mockCore.addPhotoToReport).not.toHaveBeenCalled();
  });
});

describe('api.uploadAvatarToCloudinary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCore.getPhotoSignature.mockResolvedValue(sig as never);
    globalThis.fetch = jest.fn().mockResolvedValue(cloudOk) as never;
  });

  it('retorna secure_url del avatar', async () => {
    const url = await api.uploadAvatarToCloudinary({ uri: 'file://a.jpg', base64: 'QQ==' });
    expect(url).toBe('https://res.cloudinary.com/x.jpg');
  });

  it('rechaza archivo muy pequeño', async () => {
    await expect(
      api.uploadAvatarToCloudinary({ uri: 'file://a.jpg', fileSize: 1024 })
    ).rejects.toThrow(/mínimo es 5 KB/);
  });

  it('rechaza archivo mayor a 5 MB', async () => {
    await expect(
      api.uploadAvatarToCloudinary({ uri: 'file://a.jpg', fileSize: 6 * 1024 * 1024 })
    ).rejects.toThrow(/límite permitido de 5 MB/);
  });
});
