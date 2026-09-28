import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';

interface Props {
  name?: string;
  uri?: string;
  size?: number;
}

export default function Avatar({ name, uri, size = 48 }: Props) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: Colors.neutral.gray200 },
  placeholder: {
    backgroundColor: Colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});
