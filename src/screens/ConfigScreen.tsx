// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, TextInput, PanResponder,
  Dimensions, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, HelpCircle, Clock, Shield,
  TrendingUp, Zap, Plus, Layers,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { coteCol } from '../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToQueue } from '../utils/queueService'; // ✅ ajoute cet import

const { width: W } = Dimensions.get('window');

const MISE_MIN = 200;
const MISE_MAX = 20000;
const SLIDER_W = W - 48;

/* ══════════════════════════════════════
   SLIDER CUSTOM
══════════════════════════════════════ */
function CustomSlider({ value, onValueChange, min, max, color }) {
  const sliderRef  = useRef(null);
  const fillAnim   = useRef(new Animated.Value((value - min) / (max - min))).current;
  const thumbScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: (value - min) / (max - min),
      tension: 80, friction: 8, useNativeDriver: false,
    }).start();
  }, [value]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SLIDER_W],
  });

  const thumbLeft = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SLIDER_W - 20],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(thumbScale, { toValue: 1.3, tension: 200, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gesture) => {
        const ratio   = Math.max(0, Math.min(1, gesture.moveX / SLIDER_W));
        const newVal  = Math.round((min + ratio * (max - min)) / 100) * 100;
        onValueChange(Math.max(min, Math.min(max, newVal)));
      },
      onPanResponderRelease: () => {
        Haptics.selectionAsync();
        Animated.spring(thumbScale, { toValue: 1, tension: 200, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <View style={{ paddingHorizontal: 0, marginBottom: 6 }}>
      <View
        style={[styles.sliderTrack]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrackBg} />
        <Animated.View style={[styles.sliderFill, { width: fillWidth, backgroundColor: color }]} />
        <Animated.View style={[
          styles.sliderThumb,
          {
            left: thumbLeft,
            borderColor: color,
            transform: [{ scale: thumbScale }],
            shadowColor: color,
          }
        ]} />
      </View>
    </View>
  );
}

/* ══════════════════════════════════════
   CONFIG SCREEN
══════════════════════════════════════ */
export default function ConfigScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();
  const { gameKey, defi } = route.params || {};

  const [mise,    setMise]    = useState(1000);
  const [loading, setLoading] = useState(false);
  const [queued,  setQueued]  = useState(false);

  const game   = GAMES[gameKey]   || {};
  const palier = PALIERS[defi?.p] || {};
  const color  = game.color       || T.gaming;

  const gain       = Math.round(mise * (defi?.cote || 1));
  const gainNet    = gain - mise;
  const filet      = Math.round(mise * 0.9);
  const perteMax   = mise - filet;
  const commission = Math.round(gain * 0.10);
  const gainFinal  = gain - commission;

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const heroAnim   = useRef(new Animated.Value(30)).current;
  const coteAnim   = useRef(new Animated.Value(0.7)).current;
  const cardAnim   = useRef(new Animated.Value(40)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const queueAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(heroAnim,  { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.spring(coteAnim,  { toValue: 1, tension: 45, friction: 8,  useNativeDriver: true, delay: 200 }),
      Animated.spring(cardAnim,  { toValue: 0, tension: 55, friction: 10, useNativeDriver: true, delay: 150 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1], outputRange: [0.3, 0.7],
  });

  /* ── Ajouter à la file d'attente ── */
  const handleAddToQueue = async () => {
    if (queued) return;

    // ✅ Feedback immédiat SANS attendre
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQueued(true); // UI update instantanée

    const result = await addToQueue(defi, gameKey, mise);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Petit délai pour que le state soit mis à jour avant la navigation
      setTimeout(() => {
        navigation.navigate('HomeTab', { screen: 'Lobby' });
      }, 150);
    } else if (result.reason === 'duplicate') {
      setQueued(false);
      Alert.alert('Déjà dans la file', 'Ce défi est déjà dans ta file d\'attente.');
    } else {
      setQueued(false);
      Alert.alert('Erreur', 'Impossible d\'ajouter.');
    }

    // Animation bouton
    Animated.sequence([
      Animated.spring(queueAnim, { toValue: 0.92, tension: 300, useNativeDriver: true }),
      Animated.spring(queueAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();
  };

  /* ── PLACER LE PARI → LiveScreen ── */
const handlePlay = async () => {
  if (mise < MISE_MIN) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Mise trop faible', `Minimum ${fmt(MISE_MIN)} FCFA.`);
    return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  setLoading(true);

  try {
    const stored = await AsyncStorage.getItem('skillz_user');
    const user   = JSON.parse(stored || '{}');

    // Vérifier le solde
    if ((user.balance || 0) < mise) {
      Alert.alert(
        'Solde insuffisant',
        `Ton solde : ${fmt(user.balance || 0)} FCFA\nMise requise : ${fmt(mise)} FCFA`,
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    // Débiter localement (optimiste)
    const updatedUser = { ...user, balance: user.balance - mise };
    await AsyncStorage.setItem('skillz_user', JSON.stringify(updatedUser));

    // ✅ Naviguer vers LiveScreen (et non DuelLobby)
    navigate('Live', {
      defi,
      gameKey,
      mise,
      user: updatedUser,
    });

  } catch (e) {
    Alert.alert('Erreur', e.message || 'Impossible de lancer le défi.');
  } finally {
    setLoading(false);
  }
};

  const handleMiseChange = (text) => {
    const val = parseInt(text.replace(/\D/g, ''), 10) || MISE_MIN;
    setMise(Math.max(MISE_MIN, Math.min(MISE_MAX, val)));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }}
          >
            <ArrowLeft size={20} color="#EEEEF5" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerGame}>{game.label?.split(' / ')?.[0] || gameKey?.toUpperCase()}</Text>
            <Text style={[styles.headerGameAccent, { color }]}>
              {' '}{game.label?.split(' / ')?.[1] || game.short || ''}
            </Text>
          </View>

          <TouchableOpacity style={styles.headerBtn}>
            <HelpCircle size={20} color={T.muted} />
          </TouchableOpacity>
        </Animated.View>

        {/* ══ HERO CARD ══ */}
        <Animated.View style={[
          styles.heroCard,
          { transform: [{ translateY: heroAnim }], opacity: fadeAnim },
        ]}>
          <View style={styles.heroBg}>
            <View style={[styles.heroBgOrb1, { backgroundColor: color }]} />
            <View style={styles.heroBgOrb2} />
            <View style={[styles.heroBgOrb3, { backgroundColor: palier.color || T.gold }]} />
            <View style={styles.heroGrid} />
          </View>

          <View style={[styles.palierBadge, { backgroundColor: (palier.color || T.gold) + '25', borderColor: palier.color || T.gold }]}>
            <Text style={[styles.palierBadgeText, { color: palier.color || T.gold }]}>
              {palier.label?.toUpperCase() || 'DÉBUTANT'}
            </Text>
          </View>

          <Text style={styles.heroDefiNom}>{defi?.nom}</Text>

          <Animated.View style={[styles.coteWrap, { transform: [{ scale: coteAnim }] }]}>
            <Animated.View style={[styles.coteGlow, { opacity: glowOpacity, shadowColor: color }]} />
            <Text style={[styles.coteText, { color }]}>
              ×{(defi?.cote || 1).toFixed(2)}
            </Text>
          </Animated.View>

          <Text style={styles.heroCond}>{defi?.cond}</Text>

          <View style={styles.tauxPill}>
            <Clock size={13} color="rgba(255,255,255,0.6)" />
            <Text style={styles.tauxText}>
              Réussite estimée : ~{defi?.taux || 0}%
            </Text>
          </View>
        </Animated.View>

        {/* ══ MISE ══ */}
        <Animated.View style={[styles.miseSection, { opacity: fadeAnim, transform: [{ translateY: cardAnim }] }]}>
          <Text style={styles.sectionLabel}>MISE EN FCFA</Text>

          <View style={[styles.miseInputCard, { borderColor: color + '60' }]}>
            <View style={[styles.miseIconBox, { backgroundColor: color + '20' }]}>
              <Text style={{ fontSize: 20 }}>🪙</Text>
            </View>

            <TextInput
              style={styles.miseInput}
              value={String(mise)}
              onChangeText={handleMiseChange}
              keyboardType="numeric"
              selectTextOnFocus
            />

            <View style={styles.miseDevise}>
              <Text style={styles.miseDeviseText}>FCFA</Text>
              <Text style={[styles.miseDeviseChevron, { color }]}>▼</Text>
            </View>
          </View>

          <View style={styles.sliderSection}>
            <Text style={styles.sliderBound}>{fmt(MISE_MIN)}</Text>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <CustomSlider
                value={mise}
                onValueChange={(v) => { setMise(v); }}
                min={MISE_MIN}
                max={MISE_MAX}
                color={color}
              />
            </View>
            <Text style={styles.sliderBound}>{fmt(MISE_MAX)}</Text>
          </View>
          <Text style={styles.sliderHint}>Min {fmt(MISE_MIN)}  •  Max {fmt(MISE_MAX)} FCFA</Text>

          <View style={styles.misesRapides}>
            {[500, 1000, 2000, 5000].map(m => (
              <TouchableOpacity
                key={`mise_${m}`}
                style={[styles.miseChip, mise === m && { backgroundColor: color + '20', borderColor: color }]}
                onPress={() => { Haptics.selectionAsync(); setMise(m); }}
              >
                <Text style={[styles.miseChipText, mise === m && { color }]}>
                  {fmt(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ══ GAINS ══ */}
        <Animated.View style={[styles.gainsCard, { opacity: fadeAnim, transform: [{ translateY: cardAnim }] }]}>
          <View style={styles.gainsRow}>
            <View style={styles.gainsLeft}>
              <TrendingUp size={30} color={T.success} />
              <Text style={styles.gainsLabel}>Gain potentiel</Text>
            </View>
            <View style={styles.gainsRight}>
              <Text style={[styles.gainsValue, { color: T.success }]}>
                +{fmt(gainFinal)}
              </Text>
              <Text style={styles.gainsCurrency}>FCFA</Text>
            </View>
          </View>

          <View style={styles.gainsDivider} />

          

          <View style={styles.gainsDivider} />

          <View style={styles.gainsRow}>
            <View style={styles.gainsLeft}>
              
            </View>
            <View style={styles.gainsRight}>
              <Text style={[styles.gainsValue, { color: T.danger }]}>
                
              </Text>

            </View>
          </View>
        </Animated.View>

        {/* ══ BOUTONS ══ */}
        <Animated.View style={[styles.btnsSection, { opacity: fadeAnim }]}>

          <Animated.View style={{ transform: [{ scale: queueAnim }] }}>
            <TouchableOpacity
              style={[
                styles.queueBtn,
                queued && { backgroundColor: T.success + '15', borderColor: T.success + '50' },
              ]}
              onPress={handleAddToQueue}
              activeOpacity={0.8}
              disabled={queued}
            >
              {queued
                ? <Layers size={16} color={T.success} />
                : <Plus   size={16} color={T.gold}    />
              }
              <Text style={[
                styles.queueBtnText,
                queued && { color: T.success },
              ]}>
                {queued ? 'AJOUTÉ À LA FILE ✓' : 'AJOUTER À LA FILE D\'ATTENTE'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.playBtn}
            onPress={handlePlay}
            activeOpacity={0.88}
            disabled={loading}
          >
            <View style={[styles.playBtnGradient, { backgroundColor: color }]} />
            <View style={styles.playBtnGradient2} />

            <View style={styles.playBtnInner}>
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Text style={styles.playBtnText}>PLACER LE PARI</Text>
                  <View style={styles.playBtnIcon}>
                    <Zap size={18} color={color} fill={color} />
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12, marginBottom: 20,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flexDirection: 'row', alignItems: 'baseline' },
  headerGame: {
    fontFamily: 'Rajdhani-Bold', fontSize: 20,
    color: '#EEEEF5', letterSpacing: 1,
  },
  headerGameAccent: {
    fontFamily: 'Rajdhani-Bold', fontSize: 20, letterSpacing: 1,
  },

  /* Hero card */
  heroCard: {
    borderRadius: 24, overflow: 'hidden',
    marginBottom: 20, padding: 24,
    alignItems: 'center', minHeight: 320,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0D12',
  },
  heroBgOrb1: {
    position: 'absolute', top: -80, left: -60,
    width: 240, height: 240, borderRadius: 120, opacity: 0.18,
  },
  heroBgOrb2: {
    position: 'absolute', bottom: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#8A2BE2', opacity: 0.12,
  },
  heroBgOrb3: {
    position: 'absolute', top: 60, right: -30,
    width: 120, height: 120, borderRadius: 60, opacity: 0.10,
  },
  heroGrid: {
    position: 'absolute', inset: 0, opacity: 0.03,
    borderWidth: 0,
  },

  palierBadge: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
    marginBottom: 16, zIndex: 1,
  },
  palierBadgeText: {
    fontFamily: 'Inter-Regular', fontSize: 11,
    fontWeight: '800', letterSpacing: 2,
  },

  heroDefiNom: {
    fontFamily: 'Rajdhani-Bold', fontSize: 30,
    color: '#FFFFFF', letterSpacing: 1,
    textAlign: 'center', marginBottom: 12, zIndex: 1,
  },

  coteWrap: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, zIndex: 1, position: 'relative',
  },
  coteGlow: {
    position: 'absolute', width: 200, height: 80,
    borderRadius: 40, opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 30, elevation: 0,
  },
  coteText: {
    fontFamily: 'Rajdhani-Bold', fontSize: 72,
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  heroCond: {
    fontFamily: 'Inter-Regular', fontSize: 14,
    color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    lineHeight: 20, marginBottom: 16, zIndex: 1,
    paddingHorizontal: 10,
  },

  tauxPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    zIndex: 1,
  },
  tauxText: {
    fontFamily: 'Inter-Regular', fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },

  /* Mise */
  miseSection: { marginBottom: 14 },
  sectionLabel: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted,
    fontWeight: '800', letterSpacing: 2, marginBottom: 10,
  },

  miseInputCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0D1118', borderRadius: 16,
    borderWidth: 1.5, padding: 14, gap: 14, marginBottom: 16,
  },
  miseIconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  miseInput: {
    flex: 1, fontFamily: 'Rajdhani-Bold',
    fontSize: 36, color: '#FFFFFF',
    padding: 0,
  },
  miseDevise: { alignItems: 'flex-end', gap: 2 },
  miseDeviseText: {
    fontFamily: 'Inter-Regular', fontSize: 13,
    color: T.muted, fontWeight: '700',
  },
  miseDeviseChevron: { fontSize: 10 },

  /* Slider */
  sliderSection: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8,
  },
  sliderBound: {
    fontFamily: 'Inter-Regular', fontSize: 11,
    color: T.muted, fontWeight: '600',
  },
  sliderTrack: {
    height: 32, justifyContent: 'center', position: 'relative',
  },
  sliderTrackBg: {
    position: 'absolute', left: 0, right: 0,
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
  },
  sliderFill: {
    position: 'absolute', left: 0,
    height: 4, borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10, elevation: 8,
    top: 5,
  },
  sliderHint: {
    fontFamily: 'Inter-Regular', fontSize: 11,
    color: T.muted, textAlign: 'center', marginBottom: 14,
  },

  /* Mises rapides */
  misesRapides: { flexDirection: 'row', gap: 8 },
  miseChip: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center',
  },
  miseChipText: {
    fontFamily: 'Inter-Regular', fontSize: 12,
    color: T.muted, fontWeight: '700',
  },

  /* Gains card */
  gainsCard: {
    backgroundColor: '#0D1118', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 18, marginBottom: 20,
  },
  gainsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  gainsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gainsRight:{ flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  gainsLabel:{ fontFamily: 'Inter-Regular', fontSize: 14, color: '#EEEEF5' },
  gainsValue:{ fontFamily: 'Rajdhani-Bold', fontSize: 22, letterSpacing: 0.5 },
  gainsCurrency:{ fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  gainsDivider:{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  /* Boutons */
  btnsSection: { gap: 12 },

  queueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: T.gold + '40',
    backgroundColor: T.gold + '08',
  },
  queueBtnText: {
    fontFamily: 'Rajdhani-Bold', fontSize: 15,
    color: T.gold, letterSpacing: 1.5,
  },

  playBtn: {
    borderRadius: 18, overflow: 'hidden',
    height: 60, position: 'relative',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  playBtnGradient: {
    ...StyleSheet.absoluteFillObject, opacity: 0.9,
  },
  playBtnGradient2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    left: '50%',
  },
  playBtnInner: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  playBtnText: {
    fontFamily: 'Rajdhani-Bold', fontSize: 20,
    color: '#000', letterSpacing: 2, fontWeight: '900',
  },
  playBtnIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
});