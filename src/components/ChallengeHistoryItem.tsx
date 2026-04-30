// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gamepad2, Dumbbell } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { GAMES } from '../constants/games';

const STATUS_COLORS = {
  win: '#22C55E',
  loss: '#EF4444',
  pending: '#FF6B00',
};

function getStatusColor(outcome) {
  if (outcome === 'win') return STATUS_COLORS.win;
  if (outcome === 'loss') return STATUS_COLORS.loss;
  return STATUS_COLORS.pending;
}

export default function ChallengeHistoryItem({ item, index, type }) {
  const { defi, player, outcome, game, duration } = item;
  const status = outcome || 'pending';
  const statusColor = getStatusColor(status);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const Icon = type === 'gaming' ? Gamepad2 : Dumbbell;
  const accentColor = type === 'gaming' ? T.gaming : T.physique;

  return (
    <Pressable
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      style={[
        styles.historyItem,
        { borderColor: statusColor, backgroundColor: `${statusColor}10` }
      ]}
      onPressIn={handlePressIn}
    >
      <View style={styles.historyLeft}>
        <View style={[styles.historyIcon, { backgroundColor: accentColor + '20' }]}>
          <Icon size={18} color={accentColor} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.historyTitle}>{defi?.nom || 'Défi inconnu'}</Text>
          <Text style={styles.historyMeta}>
            {GAMES[game]?.label} · {player}
          </Text>
          {duration ? (
            <Text style={styles.historyDuration}>⏱ {duration} min</Text>
          ) : null}
          <Text style={[styles.historyStatus, { color: statusColor }]}>
            {status === 'win' ? 'Gagné' : status === 'loss' ? 'Perdu' : 'En attente'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTitle: {
    fontFamily: T.fontTitle,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  historyMeta: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyDuration: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  historyStatus: {
    fontFamily: T.fontBody,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});