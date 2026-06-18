// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Dimensions, StatusBar,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MapView, { Polyline, Marker } from 'react-native-maps';
import {
  Play, Square, Zap, Trophy,
  MapPin, Activity, Timer, ChevronRight,
  Flame, ArrowLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import {
  AccelerometerService,
  GyroscopeService,
  PedometerService,
  GPSService,
  PushupDetector,
  SquatDetector,
  PlankDetector,
} from '../utils/sensorService';
import { DEFIS_PHYSIQUES } from '../constants/defisPhysiques';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClients';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

/* ── Formater le timer ── */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── Déterminer le mode de défi ── */
function getChallengeMode(defiId) {
  if (['phy1', 'phy4', 'phy8', 'phy11', 'phy14'].includes(defiId)) return 'pushups';
  if (['phy2', 'phy5', 'phy9', 'phy12', 'phy15'].includes(defiId)) return 'squats';
  if (['phy3', 'phy6', 'phy10', 'phy13', 'phy16'].includes(defiId)) return 'plank';
  if (defiId?.startsWith('run_'))                                    return 'running';
  return 'manual'; // défi libre sans capteur
}

/* ── Target du défi ── */
function getChallengeTarget(defi) {
  const nom = defi?.nom?.toLowerCase() || '';
  const matches = nom.match(/(\d+)/);
  return matches ? parseInt(matches[1], 10) : 10;
}

/* ══════════════════════════════════════
   PHYSICAL CHALLENGE SCREEN
══════════════════════════════════════ */
export default function PhysicalChallengeScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

  const { betId, defi, gameKey, mise, cote, user } = route.params || {};

  const mode   = getChallengeMode(defi?.id);
  const target = getChallengeTarget(defi);
  const game   = GAMES[gameKey] || {};
  const palier = PALIERS[defi?.p] || {};
  const color  = T.physique;
  const gain   = Math.round(mise * cote * 0.9);

  /* ── State ── */
  const [phase,        setPhase]        = useState('ready');   // ready|active|done
  const [count,        setCount]        = useState(0);         // pompes/squats
  const [plankSeconds, setPlankSeconds] = useState(0);         // planche
  const [plankHolding, setPlankHolding] = useState(false);
  const [steps,        setSteps]        = useState(0);         // course
  const [distance,     setDistance]     = useState(0);         // course km
  const [speed,        setSpeed]        = useState('0.0');     // km/h
  const [elapsed,      setElapsed]      = useState(0);         // timer global
  const [positions,    setPositions]    = useState([]);        // GPS trace
  const [currentPos,   setCurrentPos]   = useState(null);      // position actuelle
  const [sensorReady,  setSensorReady]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  /* ── Services (instances singleton) ── */
  const accelService  = useRef(new AccelerometerService());
  const gyroService   = useRef(new GyroscopeService());
  const pedoService   = useRef(new PedometerService());
  const gpsService    = useRef(new GPSService());
  const pushupDetect  = useRef(new PushupDetector());
  const squatDetect   = useRef(new SquatDetector());
  const plankDetect   = useRef(new PlankDetector());
  const timerRef      = useRef(null);
  const prevAccelRef  = useRef(null);
  const mapRef        = useRef(null);

  /* ── Animations ── */
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const scaleCount   = useRef(new Animated.Value(1)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    initSensors();
    return () => cleanup();
  }, []);

  /* Pulse en cours */
  useEffect(() => {
    if (phase === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase]);

  /* Mettre à jour la barre de progression */
  useEffect(() => {
    const pct = mode === 'plank'
      ? Math.min(plankSeconds / target, 1)
      : Math.min(count / target, 1);

    Animated.spring(progressAnim, {
      toValue: pct, tension: 60, friction: 10, useNativeDriver: false,
    }).start();
  }, [count, plankSeconds]);

  /* ── Init capteurs ── */
  const initSensors = async () => {
    try {
      if (mode === 'running') {
        const perms = await gpsService.current.requestPermissions();
        if (!perms.foreground) {
          Alert.alert('GPS requis', 'Active la localisation pour cette course.');
          return;
        }
        const pos = await gpsService.current.getCurrentPosition();
        setCurrentPos(pos);
      }

      const pedoAvail = await pedoService.current.checkAvailability();
      setSensorReady(true);
    } catch (e) {
      console.warn('initSensors:', e.message);
      setSensorReady(true); // continuer même sans capteur
    }
  };

  /* ── Cleanup ── */
  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    accelService.current.stop();
    gyroService.current.stop();
    pedoService.current.stop();
    gpsService.current.stopTracking();
  };

  /* ── Démarrer le défi ── */
  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('active');
    setCount(0);
    setElapsed(0);
    setSteps(0);
    setDistance(0);
    setPositions([]);
    pushupDetect.current.reset();
    squatDetect.current.reset();
    plankDetect.current.reset();
    gpsService.current.reset();

    // Timer global
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    // Démarrer les capteurs selon le mode
    if (mode === 'pushups') {
      accelService.current.start(({ x, y, z }) => {
        const detected = pushupDetect.current.analyze({ x, y, z });
        if (detected) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCount(c => {
            const newCount = c + 1;
            // Animation
            Animated.sequence([
              Animated.spring(scaleCount, { toValue: 1.3, tension: 300, useNativeDriver: true }),
              Animated.spring(scaleCount, { toValue: 1,   tension: 200, useNativeDriver: true }),
            ]).start();
            return newCount;
          });
        }
      }, 50);
      accelService.current.start(() => {}, 50);

    } else if (mode === 'squats') {
      accelService.current.start(({ x, y, z }) => {
        const detected = squatDetect.current.analyze({ x, y, z });
        if (detected) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCount(c => c + 1);
        }
      }, 50);

    } else if (mode === 'plank') {
      accelService.current.start(({ x, y, z }) => {
        const result = plankDetect.current.analyze({ x, y, z }, prevAccelRef.current);
        prevAccelRef.current = { x, y, z };
        setPlankHolding(result.holding);
        setPlankSeconds(result.seconds);
      }, 100);

    } else if (mode === 'running') {
      // GPS tracking
      gpsService.current.startTracking((data) => {
        setCurrentPos({ latitude: data.latitude, longitude: data.longitude });
        setDistance(parseFloat(data.distanceKm));
        setSpeed(data.speedKmh);
        setPositions([...data.positions]);

        // Centrer la carte
        mapRef.current?.animateToRegion({
          latitude:       data.latitude,
          longitude:      data.longitude,
          latitudeDelta:  0.005,
          longitudeDelta: 0.005,
        }, 500);
      });

      // Pédomètre pour les pas
      pedoService.current.start((s) => setSteps(s));
    }
  };

  /* ── Arrêter le défi ── */
  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const achieved = mode === 'plank'
      ? plankSeconds >= target
      : mode === 'running'
        ? distance >= target / 1000
        : count >= target;

    Alert.alert(
      achieved ? '🏆 Défi accompli !' : 'Terminer le défi ?',
      achieved
        ? `Tu as atteint l'objectif ! Soumettre le résultat ?`
        : `Tu n'as pas encore atteint l'objectif (${
            mode === 'plank' ? `${plankSeconds}/${target}s`
            : `${count}/${target}`
          }). Terminer quand même ?`,
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: () => submitResult(achieved),
        },
      ]
    );
  };

  /* ── Soumettre le résultat ── */
  const submitResult = async (achieved) => {
    if (timerRef.current) clearInterval(timerRef.current);
    cleanup();
    setSubmitting(true);

    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      const u      = JSON.parse(stored || '{}');

      const resultData = {
        mode,
        achieved,
        elapsed,
        ...(mode === 'pushups' && { reps: count }),
        ...(mode === 'squats'  && { reps: count }),
        ...(mode === 'plank'   && { seconds: plankSeconds }),
        ...(mode === 'running' && { distanceKm: distance, steps, avgSpeed: speed }),
      };

      // Mettre à jour le bet avec le résultat capteurs
      await supabase.from('bets').update({
        status:         'pending_validation',
        proof_time:     elapsed,
        submitted_at:   new Date().toISOString(),
        proof_data:     resultData, // données capteurs
      }).eq('id', betId);

      // Enregistrer pour validation admin
      await supabase.from('admin_validations').insert({
        bet_id:          betId,
        user_id:         u.id,
        game_key:        gameKey,
        defi_nom:        defi?.nom,
        defi_cond:       defi?.cond,
        mise,
        cote,
        gain_potentiel:  gain,
        proof_duration:  elapsed,
        proof_data:      resultData,
        status:          'pending',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.replace('Result', {
        betId,
        defi,
        gameKey,
        mise,
        cote,
        gain,
        user: u,
        status:      'pending_validation',
        sensorData:  resultData,
      });

    } catch (e) {
      Alert.alert('Erreur', e.message);
      setSubmitting(false);
    }
  };

  /* ── Valeur principale affichée ── */
  const mainValue = mode === 'plank'   ? formatTime(plankSeconds)
    : mode === 'running'               ? `${distance.toFixed(2)} km`
    : count;

  const mainLabel = mode === 'plank'   ? 'secondes tenues'
    : mode === 'running'               ? 'parcourus'
    : mode === 'pushups'               ? 'pompes'
    : mode === 'squats'                ? 'squats'
    : 'répétitions';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const pct = mode === 'plank'
    ? Math.min(Math.round(plankSeconds / target * 100), 100)
    : mode === 'running'
      ? Math.min(Math.round(distance / (target / 1000) * 100), 100)
      : Math.min(Math.round(count / target * 100), 100);

  return (
    <Animated.View style={[styles.screen, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.orb1, { backgroundColor: color }]} />
      <View style={styles.orb2} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (phase === 'active') {
              Alert.alert('Abandonner ?', 'Ta mise sera perdue.', [
                { text: 'Non', style: 'cancel' },
                { text: 'Oui', style: 'destructive', onPress: () => navigation.goBack() },
              ]);
            } else navigation.goBack();
          }}
        >
          <ArrowLeft size={18} color="#EEEEF5" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerGame, { color }]}>
            {palier.label?.toUpperCase()} · PHYSIQUE
          </Text>
          <Text style={styles.headerDefi} numberOfLines={1}>{defi?.nom}</Text>
        </View>

        {phase === 'active' && (
          <View style={styles.timerBadge}>
            <Timer size={12} color={T.gold} />
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ CARTE GPS (mode course uniquement) ══ */}
        {mode === 'running' && currentPos && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude:       currentPos.latitude,
                longitude:      currentPos.longitude,
                latitudeDelta:  0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              followsUserLocation={phase === 'active'}
              showsCompass
              showsScale
              mapType="standard"
            >
              {/* Tracé de course */}
              {positions.length > 1 && (
                <Polyline
                  coordinates={positions}
                  strokeColor={color}
                  strokeWidth={4}
                />
              )}
              {/* Point de départ */}
              {positions.length > 0 && (
                <Marker
                  coordinate={positions[0]}
                  title="Départ"
                  pinColor={T.success}
                />
              )}
            </MapView>

            {/* Stats overlay carte */}
            <View style={styles.mapOverlay}>
              <View style={styles.mapStat}>
                <Text style={[styles.mapStatValue, { color }]}>{distance.toFixed(2)}</Text>
                <Text style={styles.mapStatLabel}>km</Text>
              </View>
              <View style={styles.mapStatDivider} />
              <View style={styles.mapStat}>
                <Text style={[styles.mapStatValue, { color: T.gaming }]}>{speed}</Text>
                <Text style={styles.mapStatLabel}>km/h</Text>
              </View>
              <View style={styles.mapStatDivider} />
              <View style={styles.mapStat}>
                <Text style={[styles.mapStatValue, { color: T.gold }]}>{steps}</Text>
                <Text style={styles.mapStatLabel}>pas</Text>
              </View>
            </View>
          </View>
        )}

        {/* ══ COMPTEUR PRINCIPAL ══ */}
        <View style={styles.counterSection}>
          {/* Ring de progression */}
          <View style={styles.progressRing}>
            <Animated.View style={[styles.progressRingInner, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.counterCircle, { borderColor: color + '30' }]}>
                <View style={[styles.counterCircleInner, { backgroundColor: color + '10' }]}>
                  {mode === 'plank' ? (
                    <>
                      <Text style={[styles.counterValue, { color: plankHolding ? T.success : T.danger }]}>
                        {formatTime(plankSeconds)}
                      </Text>
                      <View style={[styles.plankIndicator, { backgroundColor: plankHolding ? T.success : T.danger }]}>
                        <Text style={styles.plankIndicatorText}>
                          {plankHolding ? '✓ EN POSITION' : '⚠ BOUGÉ'}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Animated.Text style={[styles.counterValue, { color, transform: [{ scale: scaleCount }] }]}>
                      {mainValue}
                    </Animated.Text>
                  )}
                  <Text style={styles.counterLabel}>{mainLabel}</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Objectif */}
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>OBJECTIF</Text>
            <Text style={[styles.targetValue, { color }]}>
              {mode === 'plank' ? `${target}s` : mode === 'running' ? `${target}m` : target}
            </Text>
            <Text style={[styles.targetPct, { color: pct >= 100 ? T.success : T.muted }]}>
              {pct}%
            </Text>
          </View>

          {/* Barre de progression */}
          <View style={styles.progressTrack}>
            <Animated.View style={[
              styles.progressFill,
              { width: progressWidth, backgroundColor: pct >= 100 ? T.success : color },
            ]}>
              {pct >= 100 && (
                <View style={styles.progressComplete}>
                  <Text style={styles.progressCompleteText}>✓</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </View>

        {/* ══ INFOS DÉFI ══ */}
        <View style={[styles.defiCard, { borderColor: color + '30' }]}>
          <View style={[styles.defiAccent, { backgroundColor: color }]} />
          <View style={styles.defiInner}>
            <Text style={styles.defiCond}>{defi?.cond}</Text>
            <View style={styles.defiFooter}>
              <Text style={styles.defiMise}>
                Mise : <Text style={{ color: T.gold, fontWeight: '700' }}>{fmt(mise)} F</Text>
              </Text>
              <View style={styles.defiGain}>
                <Trophy size={11} color={T.success} />
                <Text style={styles.defiGainText}>+{fmt(gain)} F</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══ INSTRUCTIONS CAPTEUR ══ */}
        {phase === 'ready' && (
          <View style={styles.instructionCard}>
            <Activity size={18} color={color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.instrTitle, { color }]}>Comment tenir le téléphone</Text>
              <Text style={styles.instrText}>
                {mode === 'pushups' && '📱 Positionne le téléphone sur le sol face à toi, écran vers le haut.'}
                {mode === 'squats'  && '📱 Glisse le téléphone dans ta poche ou tiens-le dans ta main.'}
                {mode === 'plank'   && '📱 Pose le téléphone sous ton visage, à plat sur le sol.'}
                {mode === 'running' && '📱 Garde le téléphone dans ta main ou fixe-le au bras. GPS actif.'}
                {mode === 'manual'  && '📱 Enregistre ta performance. L\'admin validera le résultat.'}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ══ BOUTONS BAS ══ */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
        {phase === 'ready' ? (
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: color, shadowColor: color }]}
            onPress={handleStart}
            activeOpacity={0.85}
            disabled={!sensorReady}
          >
            <Play size={24} color="#000" fill="#000" />
            <Text style={styles.startBtnText}>COMMENCER LE DÉFI</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.stopBtn, submitting && { opacity: 0.6 }]}
            onPress={handleStop}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <Square size={22} color="#fff" fill="#fff" />
            <Text style={styles.stopBtnText}>
              {submitting ? 'Envoi...' : 'TERMINER & SOUMETTRE'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  orb1:          { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, opacity: 0.08 },
  orb2:          { position: 'absolute', bottom: 100, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: '#A855F7', opacity: 0.06 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },

  /* Header */
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerGame:   { fontFamily: 'Inter-Regular', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  headerDefi:   { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5' },
  timerBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.gold + '15', borderWidth: 1, borderColor: T.gold + '30', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  timerText:    { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: T.gold, fontWeight: '700' },

  /* Carte GPS */
  mapContainer: { height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  map:          { flex: 1 },
  mapOverlay:   { position: 'absolute', bottom: 10, left: 10, right: 10, flexDirection: 'row', backgroundColor: 'rgba(8,10,15,0.85)', borderRadius: 12, padding: 10 },
  mapStat:      { flex: 1, alignItems: 'center' },
  mapStatValue: { fontFamily: 'Rajdhani-Bold', fontSize: 22, letterSpacing: 0.5 },
  mapStatLabel: { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '600', marginTop: 1 },
  mapStatDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },

  /* Compteur */
  counterSection:    { alignItems: 'center', paddingTop: 16, marginBottom: 20 },
  progressRing:      { marginBottom: 16 },
  progressRingInner: {},
  counterCircle:     { width: 200, height: 200, borderRadius: 100, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  counterCircleInner:{ width: 168, height: 168, borderRadius: 84, justifyContent: 'center', alignItems: 'center', gap: 6 },
  counterValue:      { fontFamily: 'Rajdhani-Bold', fontSize: 58, letterSpacing: 1 },
  counterLabel:      { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '600' },

  plankIndicator:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  plankIndicatorText: { fontFamily: 'Inter-Regular', fontSize: 9, color: '#000', fontWeight: '800', letterSpacing: 1 },

  targetRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  targetLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 1.5 },
  targetValue: { fontFamily: 'Rajdhani-Bold', fontSize: 16 },
  targetPct:   { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, fontWeight: '700', marginLeft: 'auto' },

  progressTrack:    { width: W - 36, height: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: 4, position: 'relative' },
  progressComplete: { position: 'absolute', right: 4, top: 0, bottom: 0, justifyContent: 'center' },
  progressCompleteText: { fontFamily: 'Inter-Regular', fontSize: 8, color: '#000', fontWeight: '800' },

  /* Défi card */
  defiCard:    { backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  defiAccent:  { height: 2 },
  defiInner:   { padding: 14 },
  defiCond:    { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, lineHeight: 18, marginBottom: 10 },
  defiFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  defiMise:    { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  defiGain:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.success + '12', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  defiGainText:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: T.success, fontWeight: '700' },

  /* Instruction */
  instructionCard: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14, alignItems: 'flex-start', marginBottom: 14 },
  instrTitle:      { fontFamily: 'Inter-Regular', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  instrText:       { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, lineHeight: 18 },

  /* Boutons bas */
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, backgroundColor: 'rgba(8,10,15,0.95)', paddingTop: 12 },
  startBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 18, paddingVertical: 18, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  startBtnText:   { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#000', letterSpacing: 2 },
  stopBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 18, paddingVertical: 18, backgroundColor: T.danger, shadowColor: T.danger, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  stopBtnText:    { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#fff', letterSpacing: 2 },
});