import type { ReactNode } from 'react';
import { View } from 'react-native';

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-4xl border border-white/10 bg-civic-card/95 ${className}`}
      style={{
        shadowColor: '#0b1e4d',
        shadowOpacity: 0.35,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 8,
      }}
    >
      {children}
    </View>
  );
}
