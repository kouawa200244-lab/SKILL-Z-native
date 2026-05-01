// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import {
  ArrowLeft,
  Timer,
  Trophy,
  XCircle,
  Zap,
  Gamepad2,
  Dumbbell,
} from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { T } from '../utils/designTokens';
import { fmt, pad2 } from '../utils/helpers';
import CoteDisplay from '../components/CoteDisplay';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';

export default function LiveScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bet } = route.params || {};
  const { user, sessionId } = useSession(); // userId et sessionId depuis le contexte

  const [tick, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef(null);

  const gameKey = bet?.game || 'fifa';
  const defi = bet?.defi;
  const player = bet?.player || 'Joueur';
  const mise = bet?.mise || 500;
  const cote = defi?.cote || 1.10;
  const isPhysique = gameKey === 'physique';

  const g = GAMES[gameKey];
  const pc = PALIERS[defi?.p] || {};
  const Icon = isPhysique ? Dumbbell : Gamepad2;
  const gain = Math.round(mise * cote);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTick(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const mins = pad2(Math.floor(tick / 60));
  const secs = pad2(tick % 60);

  const handleResult = (outcome: 'win' | 'loss') => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    Vibration.vibrate(200);

    // Construire les paramètres que ResultScreen attend
    const resultParams = {
      userId: user?.id,
      sessionId: sessionId || undefined,
      gameKey,
      defi,
      player,
      mise,
      outcome,
      durationSecs: tick,
      validationMode: 'room',
      witnessName: undefined,
    };

    navigation.replace('Result', resultParams);
  };

  return (
    <View style={styles.screen}>
      {/* Bouton retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={T.muted} />
      </TouchableOpacity>

      {/* Chronomètre */}
      <View style={styles.timerContainer}>
        <Timer size={28} color={T.gold} style={{ marginBottom: 8 }} />
        <Text style={styles.timerText}>{mins}:{secs}</Text>
        <Text style={styles.timerLabel}>en cours</Text>
      </View>

      {/* Infos du défi */}
      <View style={styles.defiCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Icon size={24} color={isPhysique ? T.physique : g.color} style={{ marginRight: 8 }} />
          <Text style={[styles.gameLabel, { color: isPhysique ? T.physique : g.color }]}>
            {g.label}
          </Text>
          <View style={[styles.pill, { marginLeft: 10, backgroundColor: pc.dim, borderColor: pc.color + '30' }]}>
            <Text style={[styles.pillText, { color: pc.color }]}>{pc.label?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.defiName}>{defi?.nom}</Text>
        <Text style={styles.defiCond}>{defi?.cond}</Text>
      </View>

      {/* Infos joueur + cote */}
      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>JOUEUR</Text>
          <Text style={styles.infoValue}>{player.toUpperCase()}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>MISE</Text>
          <Text style={[styles.infoValue, { color: T.gold }]}>{fmt(mise)} F</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>GAIN POTENTIEL</Text>
          <Text style={[styles.infoValue, { color: T.success }]}>+{fmt(gain)} F</Text>
        </View>
      </View>

      {/* Cote */}
      <CoteDisplay cote={cote} size={36} />

      {/* Boutons de validation */}
      <View style={styles.buttonRow}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], flex: 1 }}>
          <TouchableOpacity
            style={[styles.resultButton, styles.winButton]}
            onPress={() => handleResult('win')}
            activeOpacity={0.8}
          >
            <Trophy size={24} color="#fff" />
            <Text style={styles.resultButtonText}>RÉUSSI</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }], flex: 1 }}>
          <TouchableOpacity
            style={[styles.resultButton, styles.lossButton]}
            onPress={() => handleResult('loss')}
            activeOpacity={0.8}
          >
            <XCircle size={24} color="#fff" />
            <Text style={styles.resultButtonText}>ÉCHOUÉ</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontFamily: T.fontMono,
    fontSize: 64,
    fontWeight: '800',
    color: T.gold,
    letterSpacing: 4,
  },
  timerLabel: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.muted,
    marginTop: 4,
  },
  defiCard: {
    backgroundColor: T.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 18,
    width: '100%',
    marginBottom: 20,
  },
  gameLabel: {
    fontFamily: T.fontTitle,
    fontSize: 18,
    letterSpacing: 1,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: T.fontBody,
    fontSize: 11,
    fontWeight: '600',
  },
  defiName: {
    fontFamily: T.fontTitle,
    fontSize: 24,
    color: T.text,
    letterSpacing: 1,
    marginBottom: 8,
  },
  defiCond: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.muted,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  infoBlock: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.muted,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: T.fontMono,
    fontSize: 16,
    fontWeight: '700',
    color: T.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  resultButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  winButton: {
    backgroundColor: '#15803d',
  },
  lossButton: {
    backgroundColor: '#991b1b',
  },
  resultButtonText: {
    fontFamily: T.fontTitle,
    fontSize: 18,
    color: '#fff',
    letterSpacing: 2,
  },
});