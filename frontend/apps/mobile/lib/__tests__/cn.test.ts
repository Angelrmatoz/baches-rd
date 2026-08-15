import { cn } from '../cn';

describe('cn', () => {
  it('junta strings validos con espacio', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filtra falsy values', () => {
    expect(cn('a', false, null, undefined, '')).toBe('a');
  });

  it('retorna string vacio si todo es falsy', () => {
    expect(cn(false, null, undefined, '')).toBe('');
  });
});