import { StyleSheet, Text, View } from 'react-native';
import { avatarFor } from './avatars';
import { glow } from '@/ui/theme';

export function PlayerAvatar({ avatar, size = 48, dimmed }: { avatar: string; size?: number; dimmed?: boolean }) {
  const a = avatarFor(avatar);
  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: a.color,
          boxShadow: dimmed ? undefined : glow(a.color, 10),
          opacity: dimmed ? 0.4 : 1,
        },
      ]}
      accessible={false}
    >
      <Text style={{ fontSize: size * 0.55 }}>{a.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1030' },
});
