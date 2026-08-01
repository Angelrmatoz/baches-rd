import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-4xl border border-white/10 bg-[#162037] ${className}`}
      style={Platform.select({
        web: {
          boxShadow: '0 16px 24px rgba(11, 30, 77, 0.35)',
        },
        default: {
          shadowColor: '#0b1e4d',
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 16 },
          elevation: 8,
        },
      })}
    >
      {children}
    </View>
  );
}
