import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'bachesrd_token';
const USER_KEY = 'bachesrd_user';

let cachedToken: string | null = null;
let cachedUser: string | null = null;

export async function hydrateAuth(): Promise<void> {
  const entries = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  cachedToken = entries[0][1];
  cachedUser = entries[1][1];
}

export function getTokenSync(): string | null {
  return cachedToken;
}

export function getStoredUser<T = unknown>(): T | null {
  return cachedUser ? (JSON.parse(cachedUser) as T) : null;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function setStoredUser(user: unknown): Promise<void> {
  cachedUser = user ? JSON.stringify(user) : null;
  if (user) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(USER_KEY);
  }
}

export async function clearAuth(): Promise<void> {
  await setToken(null);
  await setStoredUser(null);
}
