import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAuth,
  getStoredUser,
  getTokenSync,
  hydrateAuth,
  setStoredUser,
  setToken,
} from '../storage';

const TOKEN_KEY = 'bachesrd_token';
const USER_KEY = 'bachesrd_user';

describe('storage auth', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('setToken guarda en AsyncStorage y cache', async () => {
    await setToken('token-123');
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBe('token-123');
    expect(getTokenSync()).toBe('token-123');
  });

  it('setToken(null) elimina el token', async () => {
    await setToken('token-123');
    await setToken(null);
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(getTokenSync()).toBeNull();
  });

  it('setStoredUser serializa JSON y setStoredUser(null) limpia', async () => {
    const user = { id: 1, name: 'Angel' };
    await setStoredUser(user);
    expect(await AsyncStorage.getItem(USER_KEY)).toBe(JSON.stringify(user));
    expect(getStoredUser()).toEqual(user);

    await setStoredUser(null);
    expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('clearAuth limpia token y usuario', async () => {
    await setToken('token-123');
    await setStoredUser({ id: 1 });
    await clearAuth();
    expect(getTokenSync()).toBeNull();
    expect(getStoredUser()).toBeNull();
    expect(await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY])).toEqual([
      [TOKEN_KEY, null],
      [USER_KEY, null],
    ]);
  });

  it('hydrateAuth carga cache desde AsyncStorage', async () => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, 'token-hydrated'],
      [USER_KEY, JSON.stringify({ id: 7 })],
    ]);
    expect(getTokenSync()).toBeNull();
    await hydrateAuth();
    expect(getTokenSync()).toBe('token-hydrated');
    expect(getStoredUser()).toEqual({ id: 7 });
  });

  it('getStoredUser retorna null si no hay user cacheado', async () => {
    await setStoredUser(null);
    expect(getStoredUser()).toBeNull();
  });
});