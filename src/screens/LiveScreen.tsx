// @ts-nocheck
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Alert, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X, Pause, Play, CheckCircle,
  AlertTriangle, Camera as CameraIcon,
  Plus, Minus,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { getExerciseConfig } from '../utils/exerciseConfig';
import { RepCounterMachine } from '../utils/repCounter';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: W, height: H } = Dimensions.get('window');

/* ══════════════════════════════════════
   COMPTEUR ANIMÉ
══════════════════════════════════════ */
function AnimatedCounter({ value, color }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevVal   = useRef(value);

  useEffect(() => {
    if (value !== prevVal.current) {
      prevVal.current = value;
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.4, tension: 300, friction: 5, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1,   tension: 200, friction: 8, useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [value]);

  return (
    <Animated.Text style={[styles.repCount, { color, transform: [{ scale: scaleAnim }] }]}>
      {value}
    </Animated.Text>
  );
}

/* ══════════════════════════════════════
   BARRE DE PROGRESSION
══════════════════════════════════════ */
function ProgressBar({ current, target, color }) {
  const widthAnim  = useRef(new Animated.Value(0)).current;
  const percentage = Math.min(current / Math.max(target, 1), 1);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage * (W - 48),
      duration: 300, useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: widthAnim, backgroundColor: color }]} />
      </View>
      <Text style={[styles.progressLabel, { color }]}>{current} / {target}</Text>
    </View>
  );
}

/* ══════════════════════════════════════
   LIVE SCREEN — Compatible Expo Go
   Mode : caméra en fond + comptage manuel
   avec bouton +1 rep ou auto-timer planche
══════════════════════════════════════ */
export default function LiveScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

const {
  defi, gameKey, mise, user,
  isViral      = false,   // ✅ nouveau
  isChallenger = false,   // ✅ nouveau
  viralDefiId  = null,    // ✅ nouveau
  creatorPerf  = null,    // ✅ nouveau
} = route.params || {};

  const config = getExerciseConfig(defi?.id);

  const [permission, requestPermission] = useCameraPermissions();

  // États
  const [isActive,     setIsActive]     = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);
  const [isFinished,   setIsFinished]   = useState(false);
  const [showCountdown,setShowCountdown]= useState(true);
  const [countdown,    setCountdown]    = useState(3);
  const [repCount,     setRepCount]     = useState(0);
  const [feedback,     setFeedback]     = useState(config?.feedback?.start || '⏳ Prêt...');
  const [elapsed,      setElapsed]      = useState(0);
  const [plankActive,  setPlankActive]  = useState(false); // pour planche

  const timerRef   = useRef(null);
  const elapsedRef = useRef(0);
  const repRef     = useRef(0);

  const accentColor  = gameKey === 'physique' ? T.physique : T.gaming;
  const isPlank      = config?.type === 'timed';
  const targetReps   = config?.targetReps || 10;

  // Animations
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const btnScaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  /* ── Countdown au démarrage ── */
  useEffect(() => {
    let count = 3;
    const cd  = setInterval(() => {
      count--;
      setCountdown(count);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (count <= 0) {
        clearInterval(cd);
        setShowCountdown(false);
        setIsActive(true);
        startTimer();
      }
    }, 1000);
    return () => clearInterval(cd);
  }, []);

  /* ── Timer ── */
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(e => e + 1);

      // Auto-incrément pour planche tenue
      if (isPlank && plankActive) {
        const secs = elapsedRef.current;
        repRef.current = secs;
        setRepCount(secs);
        setFeedback(`💪 Tiens bon ! ${secs}s`);

        if (secs >= targetReps) {
          handleFinish(secs);
        }
      }
    }, 1000);
  }, [isPlank, plankActive, targetReps]);

  /* ── Pulse animation ── */
  useEffect(() => {
    if (isActive && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isActive, isPaused]);

  /* ── +1 rep (mode reps) ── */
  const handleAddRep = () => {
    if (!isActive || isPaused || isPlank) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animation bouton
    Animated.sequence([
      Animated.spring(btnScaleAnim, { toValue: 0.92, tension: 300, useNativeDriver: true }),
      Animated.spring(btnScaleAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();

    const newCount = repRef.current + 1;
    repRef.current = newCount;
    setRepCount(newCount);
    setFeedback(config?.feedback?.good || '✓ Bonne rep !');

    setTimeout(() => {
      setFeedback(config?.feedback?.down || '⬇️ Descends !');
    }, 800);

    if (newCount >= targetReps) {
      handleFinish(newCount);
    }
  };

  /* ── -1 rep (correction) ── */
  const handleRemoveRep = () => {
    if (!isActive || isPaused || repRef.current <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCount = repRef.current - 1;
    repRef.current = newCount;
    setRepCount(newCount);
    setFeedback('↩️ Corrigé');
  };

  {/* ✅ Perf du Joueur 1 à battre */}
{isChallenger && creatorPerf && (
  <View style={styles.creatorPerfBar}>
    <Text style={styles.creatorPerfLabel}>À BATTRE</Text>
    <Text style={styles.creatorPerfValue}>
      {isPlank
        ? `${creatorPerf.reps || creatorPerf.time || 0}s`
        : `${creatorPerf.reps || 0} reps`
      }
    </Text>
    {/* Indicateur si en tête */}
    {((isPlank  && repCount > (creatorPerf.reps || 0)) ||
      (!isPlank && repCount > (creatorPerf.reps || 0))) && (
      <View style={styles.leadingBadge}>
        <Text style={styles.leadingBadgeText}>🔥 EN TÊTE</Text>
      </View>
    )}
  </View>
)}

  /* ── Toggle planche ── */
  const togglePlank = () => {
    if (!isActive || isPaused) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlankActive(prev => {
      if (!prev) {
        setFeedback('💪 Planche démarrée !');
      } else {
        setFeedback('⏹️ Planche arrêtée');
      }
      return !prev;
    });
  };

  /* ── Pause / Reprendre ── */
  const togglePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      setIsPaused(false);
      startTimer();
    } else {
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  }, [isPaused, startTimer]);

  /* ── Terminer ── */
  // Remplace l'intégralité de handleFinish par :
const handleFinish = useCallback((finalReps = repRef.current) => {
  if (isFinished) return;
  setIsFinished(true);
  clearInterval(timerRef.current);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  const success     = finalReps >= targetReps;
  const performance = {
    reps: finalReps,
    time: elapsedRef.current,
    unit: isPlank ? 'sec' : 'reps',
  };

  setTimeout(async () => {
    if (isViral && viralDefiId && isChallenger) {
      // ✅ Joueur 2 — sauvegarder + naviguer vers résultat viral
      try {
        const { supabase } = require('../utils/SupabaseClients');
        await supabase
          .from('viral_defis')
          .update({
            challenger_id:           user?.id,
            challenger_username:     user?.username,
            challenger_performance:  performance,
            challenger_completed_at: new Date().toISOString(),
          })
          .eq('id', viralDefiId);
      } catch (e) { console.error(e); }

      navigation.replace('ViralResult', {
        viralDefiId,
        challengerPerf: performance,
        creatorPerf,
        defi,
        mise,
        user,
      });

    } else if (isViral && !isChallenger) {
      // ✅ Joueur 1 — créer le défi viral puis partager
      try {
        const { supabase } = require('../utils/SupabaseClients');
        const { data: viralDefi } = await supabase
          .from('viral_defis')
          .insert({
            creator_id:           user?.id,
            creator_username:     user?.username,
            game_key:             gameKey,
            defi_id:              defi?.id,
            defi_nom:             defi?.nom,
            defi_cond:            defi?.cond,
            defi_palier:          defi?.p,
            mise:                 mise || 500,
            cote:                 defi?.cote || 1.5,
            creator_performance:  performance,
            creator_completed_at: new Date().toISOString(),
          })
          .select().single();

        navigation.replace('ViralShare', {
          viralDefi,
          performance,
          defi,
          user,
        });
      } catch (e) {
        console.error(e);
        navigation.replace('Result', { defi, gameKey, mise, user, result: { reps: finalReps, target: targetReps, time: elapsedRef.current, success, outcome: success ? 'win' : 'loss' } });
      }

    } else {
      // ✅ Mode normal (inchangé)
      navigation.replace('Result', {
        defi, gameKey, mise, user,
        result: {
          reps:    finalReps,
          target:  targetReps,
          time:    elapsedRef.current,
          success,
          outcome: success ? 'win' : 'loss',
        },
      });
    }
  }, 900);
}, [isFinished, targetReps, defi, gameKey, mise, user, isViral, isChallenger, viralDefiId, creatorPerf]);

  /* ── Abandon ── */
  const handleAbandon = () => {
    Alert.alert(
      'Abandonner le défi ?',
      'Ta mise sera perdue. Confirmer ?',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Abandonner', style: 'destructive',
          onPress: () => {
            clearInterval(timerRef.current);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  /* ── Permission caméra ── */
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accentColor} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <CameraIcon size={48} color={T.muted} />
        <Text style={styles.permText}>Accès caméra requis</Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: accentColor }]}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={48} color={T.danger} />
        <Text style={styles.permText}>Exercice non reconnu</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.permBtnText, { color: accentColor }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      {/* ── CAMÉRA FOND ── */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="front"
      />

      {/* Overlay sombre */}
      <View style={styles.overlay} />

      {/* ══════════ HUD ══════════ */}

      {/* HEADER */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 8, opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleAbandon}>
          <X size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.exerciseName}>{config.name}</Text>
          <View style={styles.timerPill}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
        </View>

        {/* Badge mode */}
        <View style={[styles.modePill, { borderColor: accentColor + '60' }]}>
          <View style={[styles.modeDot, { backgroundColor: isActive && !isPaused ? accentColor : T.muted }]} />
          <Text style={[styles.modeText, { color: isActive && !isPaused ? accentColor : T.muted }]}>
            {isActive && !isPaused ? 'LIVE' : 'PAUSE'}
          </Text>
        </View>
      </Animated.View>

      {/* FEEDBACK */}
      <View style={styles.feedbackZone} pointerEvents="none">
        <View style={styles.feedbackPill}>
          <Text style={[styles.feedbackText, { color: '#fff' }]}>
            {feedback}
          </Text>
        </View>
        <Text style={styles.guideHint}>{config.guide}</Text>
      </View>

      {/* COMPTEUR CENTRAL */}
      <View style={styles.counterZone} pointerEvents="none">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <AnimatedCounter value={repCount} color={accentColor} />
        </Animated.View>
        <Text style={styles.repLabel}>
          / {targetReps} {isPlank ? 'sec' : 'reps'}
        </Text>

        {/* État */}
        <View style={[styles.statePill, { borderColor: accentColor + '50', backgroundColor: accentColor + '15' }]}>
          <Text style={[styles.stateText, { color: accentColor }]}>
            {!isActive         ? '⏳ PRÊT'
              : isPaused       ? '⏸ PAUSE'
              : isPlank && plankActive ? '💪 EN PLANCHE'
              : isPlank        ? '▶️ DÉMARRE LA PLANCHE'
              : repCount === 0 ? '▶️ COMMENCE !'
              : `${Math.round(repCount / targetReps * 100)}% ACCOMPLI`}
          </Text>
        </View>
      </View>

      {/* BOUTON PRINCIPAL (centre bas) */}
      {isActive && !isPaused && !isFinished && (
        <View style={styles.mainActionZone}>
          {isPlank ? (
            /* ── Mode Planche : démarrer/arrêter ── */
            <TouchableOpacity
              style={[
                styles.plankBtn,
                { backgroundColor: plankActive ? T.danger : accentColor, shadowColor: plankActive ? T.danger : accentColor },
              ]}
              onPress={togglePlank}
              activeOpacity={0.85}
            >
              <Text style={styles.plankBtnText}>
                {plankActive ? '⏹ ARRÊTER LA PLANCHE' : '▶️ COMMENCER LA PLANCHE'}
              </Text>
            </TouchableOpacity>
          ) : (
            /* ── Mode Reps : +1 / -1 ── */
            <View style={styles.repBtnsRow}>
              {/* -1 */}
              <TouchableOpacity
                style={[styles.minusBtn, { borderColor: T.danger + '60' }]}
                onPress={handleRemoveRep}
                activeOpacity={0.8}
              >
                <Minus size={22} color={T.danger} />
              </TouchableOpacity>

              {/* +1 rep */}
              <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
                <TouchableOpacity
                  style={[styles.addRepBtn, { backgroundColor: accentColor, shadowColor: accentColor }]}
                  onPress={handleAddRep}
                  activeOpacity={0.85}
                >
                  <Plus size={32} color="#000" />
                  <Text style={styles.addRepBtnText}>REP</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Placeholder droit */}
              <View style={styles.minusBtn} />
            </View>
          )}
        </View>
      )}

      {/* BOTTOM HUD */}
      <Animated.View style={[styles.bottomHud, { paddingBottom: insets.bottom + 16, opacity: fadeAnim }]}>
        <ProgressBar
          current={repCount}
          target={targetReps}
          color={accentColor}
        />
        <View style={styles.controls}>
          <TouchableOpacity style={styles.pauseBtn} onPress={togglePause} disabled={!isActive}>
            {isPaused
              ? <Play  size={18} color="#fff" />
              : <Pause size={18} color="#fff" />
            }
            <Text style={styles.pauseBtnText}>
              {isPaused ? 'REPRENDRE' : 'PAUSE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishBtn, { backgroundColor: accentColor, shadowColor: accentColor }]}
            onPress={() => handleFinish()}
            disabled={!isActive}
          >
            <CheckCircle size={18} color="#000" />
            <Text style={styles.finishBtnText}>TERMINER</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* COUNTDOWN */}
      {showCountdown && (
        <View style={styles.cdOverlay}>
          <View style={styles.cdCard}>
            <Text style={[styles.cdNumber, { color: accentColor }]}>
              {countdown > 0 ? countdown : '⚡'}
            </Text>
            <Text style={styles.cdText}>
              {countdown > 0 ? 'Prépare-toi...' : "C'est parti !"}
            </Text>
            <Text style={styles.cdDefi}>{config.name}</Text>
          </View>
        </View>
      )}

      {/* PAUSE */}
      {isPaused && !showCountdown && (
        <View style={styles.cdOverlay}>
          <View style={styles.pauseCard}>
            <Pause size={32} color={accentColor} />
            <Text style={styles.pauseTitle}>PAUSE</Text>
            <Text style={styles.pauseSub}>{repCount} / {targetReps} {isPlank ? 'sec' : 'reps'}</Text>
            <Text style={styles.pauseTime}>{formatTime(elapsed)}</Text>
            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: accentColor }]}
              onPress={togglePause}
            >
              <Play size={18} color="#000" />
              <Text style={styles.resumeBtnText}>REPRENDRE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* SUCCÈS */}
      {isFinished && (
        <View style={styles.cdOverlay}>
          <View style={styles.successCard}>
            <View style={[styles.successIcon, { backgroundColor: accentColor + '20' }]}>
              <CheckCircle size={52} color={accentColor} />
            </View>
            <Text style={[styles.successTitle, { color: accentColor }]}>
              {repCount >= targetReps ? 'DÉFI RÉUSSI ! 🏆' : 'DÉFI TERMINÉ'}
            </Text>
            <Text style={styles.successReps}>
              {repCount} / {targetReps} {isPlank ? 'secondes' : 'reps'}
            </Text>
            <Text style={styles.successTime}>en {formatTime(elapsedRef.current)}</Text>
            <ActivityIndicator color={accentColor} style={{ marginTop: 16 }} />
            <Text style={styles.successLoading}>Calcul des résultats...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1, backgroundColor: '#080A0F',
    justifyContent: 'center', alignItems: 'center',
    gap: 16, padding: 24,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Ajoute dans StyleSheet.create({}) :
creatorPerfBar: {
  position: 'absolute', top: 100, left: 16, right: 16,
  flexDirection: 'row', alignItems: 'center', gap: 10,
  backgroundColor: 'rgba(240,192,64,0.15)',
  borderRadius: 12, borderWidth: 1,
  borderColor: 'rgba(240,192,64,0.35)',
  padding: 10, zIndex: 15,
},
creatorPerfLabel: {
  fontFamily: 'Inter-Regular', fontSize: 10,
  color: '#F0C040', fontWeight: '800', letterSpacing: 1,
},
creatorPerfValue: {
  fontFamily: 'JetBrainsMono-Regular', fontSize: 18,
  color: '#F0C040', fontWeight: '700', flex: 1,
},
leadingBadge: {
  backgroundColor: 'rgba(46,204,113,0.2)',
  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  borderWidth: 1, borderColor: 'rgba(46,204,113,0.4)',
},
leadingBadgeText: {
  fontFamily: 'Inter-Regular', fontSize: 9,
  color: '#2ECC71', fontWeight: '800',
},

  /* Header */
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, zIndex: 10,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter:  { alignItems: 'center', gap: 4 },
  exerciseName: {
    fontFamily: 'Rajdhani-Bold', fontSize: 19,
    color: '#fff', letterSpacing: 1,
    textShadowColor: '#000', textShadowRadius: 6,
  },
  timerPill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
  },
  timerText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 16, color: '#fff' },

  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  modeDot:  { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  /* Feedback */
  feedbackZone: {
    position: 'absolute', top: H * 0.17,
    left: 0, right: 0,
    alignItems: 'center', gap: 8, zIndex: 10,
  },
  feedbackPill: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20, paddingHorizontal: 22, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  feedbackText: { fontFamily: 'Rajdhani-Bold', fontSize: 20, letterSpacing: 1 },
  guideHint:    { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingHorizontal: 30 },

  /* Compteur */
  counterZone: {
    position: 'absolute', top: H * 0.28,
    left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  repCount: {
    fontFamily: 'Rajdhani-Bold', fontSize: 120,
    lineHeight: 125, letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 20,
  },
  repLabel: {
    fontFamily: 'Inter-Regular', fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    marginTop: -6, marginBottom: 12,
  },
  statePill: {
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1,
  },
  stateText: { fontFamily: 'Rajdhani-Bold', fontSize: 13, letterSpacing: 1.5 },

  /* Bouton rep */
  mainActionZone: {
    position: 'absolute', bottom: 200,
    left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  repBtnsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 20,
  },
  addRepBtn: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center', gap: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 16,
  },
  addRepBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 2 },
  minusBtn: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
  },

  /* Planche */
  plankBtn: {
    paddingHorizontal: 32, paddingVertical: 18,
    borderRadius: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  plankBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#fff', letterSpacing: 1.5 },

  /* Bottom HUD */
  bottomHud: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 18,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
  },
  progressWrap:  { marginBottom: 14 },
  progressTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill:  { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4 },
  progressLabel: { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, fontWeight: '700', textAlign: 'right' },

  controls: { flexDirection: 'row', gap: 12 },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  pauseBtnText:  { fontFamily: 'Rajdhani-Bold', fontSize: 14, color: '#fff', letterSpacing: 1.5 },
  finishBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 8,
  },
  finishBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 14, color: '#000', letterSpacing: 1.5 },

  /* Permission */
  permText:    { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#fff', textAlign: 'center' },
  permBtn:     { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  permBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 15, color: '#000', letterSpacing: 1 },

  /* Countdown */
  cdOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  cdCard:   { alignItems: 'center', gap: 10 },
  cdNumber: { fontFamily: 'Rajdhani-Bold', fontSize: 140, lineHeight: 150 },
  cdText:   { fontFamily: 'Rajdhani-Bold', fontSize: 22, color: 'rgba(255,255,255,0.75)', letterSpacing: 2 },
  cdDefi:   { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

  /* Pause */
  pauseCard: {
    backgroundColor: '#0F1219', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 32, alignItems: 'center', gap: 10, minWidth: 280,
  },
  pauseTitle:    { fontFamily: 'Rajdhani-Bold', fontSize: 32, color: '#fff', letterSpacing: 3 },
  pauseSub:      { fontFamily: 'Inter-Regular', fontSize: 16, color: T.muted },
  pauseTime:     { fontFamily: 'JetBrainsMono-Regular', fontSize: 20, color: '#fff' },
  resumeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  resumeBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 1.5 },

  /* Succès */
  successCard: {
    backgroundColor: '#0F1219', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 36, alignItems: 'center', gap: 8, minWidth: 290,
  },
  successIcon:    { width: 88, height: 88, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  successTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 28, letterSpacing: 2 },
  successReps:    { fontFamily: 'JetBrainsMono-Regular', fontSize: 22, color: '#EEEEF5', fontWeight: '700' },
  successTime:    { fontFamily: 'Inter-Regular', fontSize: 14, color: T.muted },
  successLoading: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, marginTop: 4 },
});