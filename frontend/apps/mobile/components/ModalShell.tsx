import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';

interface ModalShellProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  cardClassName?: string;
  cardStyle?: object;
}

export function ModalShell({ visible, onClose, children, cardClassName = '', cardStyle }: ModalShellProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.94);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(scale, { toValue: 1, duration: 280, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[styles.backdrop, { opacity }]}
        className="items-center justify-center p-4"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar modal" />
        <Animated.View style={[{ width: '100%', maxWidth: 500, transform: [{ scale }] }, cardStyle]}>
          <View
            className={`rounded-4xl border border-[#a8b2c7]/20 bg-[#162037] ${cardClassName}`}
            style={{
              shadowColor: '#0b1e4d',
              shadowOpacity: 0.45,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 16 },
              elevation: 12,
            }}
          >
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});
