import { cleanQuery, validateAsset } from '../../components/NewReportModal';

describe('cleanQuery', () => {
  it('remueve termino "esquina"', () => {
    expect(cleanQuery('Av. Lincoln esquina Kennedy')).toBe('Av. Lincoln Kennedy');
  });

  it('remueve variantes esq. y esq', () => {
    expect(cleanQuery('calle 30 esq. Duarte')).toBe('calle 30 Duarte');
    expect(cleanQuery('Av. 27 esq Febrero')).toBe('Av. 27 Febrero');
  });

  it('remueve "frente a" y "casi"', () => {
    expect(cleanQuery('Winston Churchill frente a Blue Mall')).toBe('Winston Churchill Blue Mall');
    expect(cleanQuery('Luperon casi enfrente')).toBe('Luperon enfrente');
  });

  it('colapsa espacios multiples', () => {
    expect(cleanQuery('Av.  a   b')).toBe('Av. a b');
  });

  it('trim espacios al inicio y final', () => {
    expect(cleanQuery('  Av. Lincoln  ')).toBe('Av. Lincoln');
  });

  it('retorna vacio si solo habia terminos sanitizados', () => {
    expect(cleanQuery('esquina casi frente a')).toBe('');
  });
});

describe('validateAsset', () => {
  const baseAsset = { uri: 'file://x.jpg', width: 1024, height: 768 };

  it('retorna null para imagen valida', () => {
    expect(validateAsset({ ...baseAsset, mimeType: 'image/jpeg', fileSize: 500 * 1024, fileName: 'a.jpg' })).toBeNull();
  });

  it('rechaza archivo que no es imagen', () => {
    const err = validateAsset({ ...baseAsset, mimeType: 'video/mp4', fileName: 'clip.mp4' });
    expect(err).toMatch(/no es una foto válida/);
  });

  it('rechaza archivo sin mimeType conocido (no image/)', () => {
    expect(validateAsset({ ...baseAsset, mimeType: 'application/pdf' })).not.toBeNull();
  });

  it('rechaza foto mayor a 5 MB', () => {
    const err = validateAsset({ ...baseAsset, mimeType: 'image/png', fileSize: 6 * 1024 * 1024, fileName: 'big.png' });
    expect(err).toMatch(/más de 5 MB/);
  });

  it('rechaza foto menor a 5 KB', () => {
    const err = validateAsset({ ...baseAsset, mimeType: 'image/jpeg', fileSize: 2 * 1024, fileName: 'tiny.jpg' });
    expect(err).toMatch(/mínimo 5 KB/);
  });

  it('acepta foto con fileSize en el limite exacto de 5 MB', () => {
    expect(validateAsset({ ...baseAsset, mimeType: 'image/webp', fileSize: 5 * 1024 * 1024 })).toBeNull();
  });

  it('no valida size si fileSize es null', () => {
    expect(validateAsset({ ...baseAsset, mimeType: 'image/heic', fileSize: undefined })).toBeNull();
  });
});