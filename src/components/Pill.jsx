import React from 'react';
import { View, Text } from 'react-native';
import { T } from '../utils/designTokens';

export default function Pill({ label, color, dim }) {
  return (
    <View style={{ backgroundColor: dim, borderColor: color + '30', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: '600', color, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
    </View>
  );
}