// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  Timer,
  Trophy,
  XCircle,
  Zap,
  Gamepad2,
  Dumbbell,
  Camera,
  CameraOff,
} from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { T } from '../utils/designTokens';
import { fmt, pad2 } from '../utils/helpers';
import CoteDisplay from '../components/CoteDisplay';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LiveScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bet } = route.params || {};
  const { playBet, addToHistory } = useSession();

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

  const handleResult = (outcome) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    Vibration.vibrate(200);

    const finalBet = {
      ...bet,
      outcome,
      gain: outcome === 'win' ? gain : -mise,
      duration: tick,
      ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (addToHistory) {
      addToHistory(finalBet);
    }

    if (playBet) {
      playBet(bet);
    }

    navigation.replace('Result', { bet: finalBet });
  };

  return (
    <View style={styles.screen}>
      {/* Bouton retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={T.muted} />
      </TouchableOpacity>

      {/* Placeholder caméra pour les défis physiques */}
      {isPhysique && (
        <View style={styles.cameraPlaceholder}>
          <View style={styles.cameraIconContainer}>
            <Camera size={40} color={T.physique} />
          </View>
          <Text style={styles.cameraTitle}>VALIDATION PAR CAMÉRA</Text>
          <Text style={styles.cameraSubtitle}>
            La caméra s'activera automatiquement pour analyser ton mouvement et valider tes répétitions.
          </Text>
          <View style={styles.cameraBadge}>
            <CameraOff size={14} color={T.muted} />
            <Text style={styles.cameraBadgeText}>MediaPipe sera intégré ici</Text>
          </View>
        </View>
      )}

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

      {/* Note en bas pour les défis physiques */}
      {isPhysique && (
        <Text style={styles.note}>
          En mode test, valide toi-même ton score. La validation automatique arrivera bientôt.
        </Text>
      )}
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
  // Placeholder caméra
  cameraPlaceholder: {
    width: SCREEN_WIDTH - 48,
    height: 180,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.physique + '30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  cameraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.physique + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.physique + '30',
  },
  cameraTitle: {
    fontFamily: T.fontTitle,
    fontSize: 16,
    color: T.physique,
    letterSpacing: 2,
    marginBottom: 6,
  },
  cameraSubtitle: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  cameraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cameraBadgeText: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.muted,
  },
  // Chronomètre
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontFamily: T.fontMono,
    fontSize: 56,
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
  // Carte défi
  defiCard: {
    backgroundColor: T.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  gameLabel: {
    fontFamily: T.fontTitle,
    fontSize: 16,
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
    fontSize: 10,
    fontWeight: '600',
  },
  defiName: {
    fontFamily: T.fontTitle,
    fontSize: 20,
    color: T.text,
    letterSpacing: 1,
    marginBottom: 6,
  },
  defiCond: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.muted,
    lineHeight: 20,
  },
  // Infos joueur
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  infoBlock: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontFamily: T.fontBody,
    fontSize: 10,
    color: T.muted,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: T.fontMono,
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
  },
  // Boutons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
  // Note
  note: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.muted,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
});