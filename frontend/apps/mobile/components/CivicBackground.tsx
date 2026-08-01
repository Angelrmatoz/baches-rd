import { Platform, View } from 'react-native';

function CivicMarker({
  type = 'gold',
  className = '',
}: {
  type?: 'gold' | 'critical' | 'verified';
  className?: string;
}) {
  const bgMap = {
    gold: 'bg-[#e6b23f]',
    critical: 'bg-[#e0554a]',
    verified: 'bg-[#5b8aff]',
  };
  const innerMap = {
    gold: 'bg-[#332308]',
    critical: 'bg-[#edf1f7]',
    verified: 'bg-[#0d1420]',
  };

  return (
    <View
      className={`absolute items-center justify-center rounded-full border-[3px] border-[#0d1420] ${bgMap[type]} ${className}`}
      style={[
        Platform.select({
          web: {
            boxShadow: '0 4px 12px rgba(13, 20, 32, 0.45)',
          },
          default: {
            shadowColor: '#0d1420',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.45,
            shadowRadius: 12,
            elevation: 8,
          },
        }),
      ]}
    >
      <View className={`h-2 w-2 rounded-full ${innerMap[type]}`} />
    </View>
  );
}

export function CivicBackground() {
  return (
    <View className="absolute inset-0 bg-[#0e1524] overflow-hidden" style={{ pointerEvents: 'none' }}>
      {/* Massive geometric circles matching Web retro background */}
      
      {/* Top Left Deep Blue Circle */}
      <View className="absolute -left-[20%] -top-[10%] h-[800px] w-[800px] rounded-full bg-[#1c2e4a] opacity-80" />
      
      {/* Bottom Left Dark Red/Brown Circle */}
      <View className="absolute -left-[10%] -bottom-[20%] h-[700px] w-[700px] rounded-full bg-[#8c3f3f] opacity-80" />
      
      {/* Bottom Center Mustard Yellow Circle */}
      <View className="absolute -bottom-[30%] left-[20%] h-[900px] w-[900px] rounded-full bg-[#d69f33] opacity-90" />
      
      {/* Top Right Cyan Circle */}
      <View className="absolute -right-[15%] -top-[15%] h-[800px] w-[800px] rounded-full bg-[#008db8] opacity-90" />
      
      {/* Right Edge Teal/Blue Circle */}
      <View className="absolute -right-[10%] top-[30%] h-[600px] w-[600px] rounded-full bg-[#105a75] opacity-80" />

      {/* Decorative map pins */}
      <CivicMarker type="gold" className="left-[12%] top-[22%] h-8 w-8 opacity-80" />
      <CivicMarker type="critical" className="right-[18%] top-[30%] h-7 w-7 opacity-70" />
      <CivicMarker type="verified" className="bottom-[18%] left-[22%] h-9 w-9 opacity-75" />
      <CivicMarker type="gold" className="bottom-[28%] right-[14%] h-6 w-6 opacity-60" />
    </View>
  );
}
