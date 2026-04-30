import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../utils/designTokens';

export default function StatCard({ label, value, color = T.gold, icon: Icon, width = '100%' }) {
  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.header}>
        {Icon && <Icon size={14} color={color} style={{ marginRight: 6 }} />}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.card,
    borderRadius: T.radius,
    padding: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.muted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: T.fontMono,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});