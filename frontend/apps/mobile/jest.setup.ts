(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { Animated } from 'react-native';

jest.spyOn(Animated, 'timing').mockImplementation(
  () =>
    ({
      start: (callback?: (result?: Animated.EndResult) => void) => {
        callback?.({ finished: true });
      },
    }) as never
);

jest.spyOn(Animated, 'parallel').mockImplementation(
  (animations: Animated.CompositeAnimation[]) =>
    ({
      start: (callback?: (result?: Animated.EndResult) => void) => {
        animations.forEach((a) => a.start());
        callback?.({ finished: true });
      },
    }) as never
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('expo-location', () => ({
  Accuracy: { High: 3, Balanced: 2, Low: 1, Lowest: 0 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  MediaType: { Images: 'images' },
}));

jest.mock('@expo/vector-icons', () => {
  const Icon = () => null;
  return { Feather: Icon, Ionicons: Icon, MaterialIcons: Icon };
});

jest.mock('@expo/vector-icons/Feather', () => ({
  __esModule: true,
  default: () => null,
}));