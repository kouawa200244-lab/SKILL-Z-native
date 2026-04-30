import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { T } from '../utils/designTokens';

export default function CircularProgress({
  value = 0,
  size = 60,
  strokeWidth = 5,
  color = T.physique,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Cercle de fond */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2D35"
          strokeWidth={strokeWidth}
        />
        {/* Cercle de progression */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <Text
        style={{
          position: 'absolute',
          fontFamily: T.fontTitle,
          fontSize: size * 0.28,
          fontWeight: '700',
          color: color,
        }}
      >
        {Math.round(value)}%
      </Text>
    </View>
  );
}