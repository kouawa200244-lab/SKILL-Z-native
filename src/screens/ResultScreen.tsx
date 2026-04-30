// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  Trophy,
  Skull,
  Shield,
  PlusCircle,
  LayoutDashboard,
  Zap,
} from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bet } = route.params || {};

  const win = bet?.outcome === 'win';
  const gain = Math.round((bet?.mise || 0) * (bet?.cote || 1));
  const col = win ? T.success : T.danger;

  // Animation de slam
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const defi = bet?.defi;
  const g = GAMES[bet?.game] || {};
  const filet = bet?.filet || 0;

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.content, { opacity: opacityAnim }]}>
        {/* Statut */}
        <Text style={[styles.statusLabel, { color: col }]}>
          {win ? 'VICTOIRE' : 'DÉFAITE'}
        </Text>

        {/* Joueur */}
        <Text style={styles.playerName}>
          {(bet?.player || 'JOUEUR').toUpperCase()}
        </Text>

        {/* Défi */}
        <Text style={styles.defiNom}>
          {defi?.nom} · {g.label} · ×{bet?.cote?.toFixed(2)}
        </Text>

        {/* Montant animé */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Text style={[styles.amount, { color: col }]}>
            {win ? `+${fmt(gain)} F` : `-${fmt((bet?.mise || 0) - filet)} F`}
          </Text>
        </Animated.View>

        {/* Filet si applicable */}
        {!win && filet > 0 && (
          <View style={styles.filetRow}>
            <Shield size={18} color={T.intellect} />
            <Text style={styles.filetText}>
              FILET SKILL'Z : {fmt(filet)} F remboursés
            </Text>
          </View>
        )}

        {/* Message */}
        <Text style={styles.message}>
          {win
            ? 'Félicitations ! Tu remportes ce défi.'
            : `SKILL'Z garde ${fmt((bet?.mise || 0) - filet)} F. Retente ta chance !`}
        </Text>

        {/* Boutons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('NewDefi')}
          >
            <PlusCircle size={20} color={T.textInverse} />
            <Text style={styles.primaryButtonText}>NOUVEAU DÉFI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Lobby')}
          >
            <LayoutDashboard size={20} color={T.muted} />
            <Text style={styles.secondaryButtonText}>ACCUEIL</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  statusLabel: {
    fontFamily: T.fontTitle,
    fontSize: 22,
    letterSpacing: 6,
    marginBottom: 12,
  },
  playerName: {
    fontFamily: T.fontTitle,
    fontSize: 40,
    color: T.text,
    letterSpacing: 3,
    marginBottom: 8,
  },
  defiNom: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.muted,
    marginBottom: 32,
    textAlign: 'center',
  },
  amount: {
    fontFamily: T.fontMono,
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },
  filetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  filetText: {
    fontFamily: T.fontBody,
    fontSize: 16,
    color: T.intellect,
    fontWeight: '600',
  },
  message: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.muted,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: T.gold,
  },
  primaryButtonText: {
    fontFamily: T.fontTitle,
    fontSize: 16,
    color: T.textInverse,
    letterSpacing: 2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: T.border,
  },
  secondaryButtonText: {
    fontFamily: T.fontTitle,
    fontSize: 16,
    color: T.muted,
    letterSpacing: 2,
  },
});