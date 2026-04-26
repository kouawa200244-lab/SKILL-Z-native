import React from 'react';
import { Text } from 'react-native';
import { coteCol } from '../utils/helpers';

export default function CoteDisplay({ cote, size = 18 }) {
  const col = coteCol(cote);
  return <Text style={{ fontFamily: 'JetBrainsMono-Regular', fontSize: size, fontWeight: '700', color: col, textShadowColor: col + '60', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>×{cote.toFixed(2)}</Text>;
}