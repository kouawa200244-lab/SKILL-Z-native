import React from 'react';
import { Text } from 'react-native';
import { coteCol } from '../utils/helper';
import { T } from '../utils/designTokens';

export default function CoteDisplay({ cote, size = 18 }) {
  const col = coteCol(cote);
  return (
    <Text
      style={{
        fontFamily: T.fontMono,
        fontSize: size,
        fontWeight: '700',
        color: col,
      }}
    >
      ×{cote.toFixed(2)}
    </Text>
  );
}