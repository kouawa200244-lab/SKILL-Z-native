import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../utils/designTokens';

export default function Pill({ label, color, dim }) {
  return (
    <View style={[styles.pill, { backgroundColor: dim || T.card, borderColor: color + '40' }]}>
      <Text style={[styles.text, { color: color || T.text }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  text: {
    fontFamily: T.fontBody,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});