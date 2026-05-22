// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar, ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Trophy, X, Zap, TrendingUp, TrendingDown,
  RotateCcw, Home, Star, Shield, Clock,
  CheckCircle, AlertTriangle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { supabase } from '../supabaseClient';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

/* ══════════════════════════════════════
   PARTICULES CONFETTI (victoire)
══════════════════════════════════════ */
function Particle({ color, delay, startX }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const rotate     = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dx = (Math.random() - 0.5) * 200;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1,    duration: 200,  useNativeDriver: true }),
        Animated.spring(scale,      { toValue: 1,    tension: 200,   useNativeDriver: true }),
        Animated.timing(translateY, { toValue: H * 0.7, duration: 2000, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: dx,   duration: 2000, useNativeDriver: true }),
        Animated.loop(
          Animated.timing(rotate, { toValue: 1, duration: 800, useNativeDriver: true }),
          { iterations: 3 }
        ),
        Animated.sequence([
          Animated.delay(1500),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const size = 8 + Math.random() * 8;

  return (
    <Animated.View style={{
      position:  'absolute',
      left:      startX,
      top:       0,
      width:     size,
      height:    size,
      borderRadius: Math.random() > 0.5 ? size / 2 : 2,
      backgroundColor: color,
      opacity,
      transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }],
    }} />
  );
}

function Confetti() {
  const COLORS  = [T.gold, T.gaming, T.success, T.physique, '#A855F7', '#FFF'];
  const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
    id:      i,
    color:   COLORS[i % COLORS.length],
    delay:   Math.random() * 800,
    startX:  Math.random() * W,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
    </View>
  );
}

/* ══════════════════════════════════════
   STAT ROW
══════════════════════════════════════ */
function StatRow({ icon: Icon, label, value, color, delay = 0 }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, delay, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.statRow, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.statIcon, { backgroundColor: (color || T.muted) + '18' }]}>
        <Icon size={14} color={color || T.muted} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: color || '#EEEEF5' }]}>{value}</Text>
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   RESULT SCREEN
══════════════════════════════════════ */
export default function ResultScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

  const {
    defi, gameKey, mise, user,
    result = {},
  } = route.params || {};

  const {
    reps    = 0,
    target  = 0,
    time    = 0,
    success = false,
    outcome = 'loss',
  } = result;

  const isWin       = outcome === 'win' || success;
  const game        = GAMES[gameKey]    || {};
  const palier      = PALIERS[defi?.p]  || {};
  const accentColor = isWin ? T.success : T.danger;
  const gameColor   = game.color || T.gaming;

  // Calculs financiers
  const gain        = isWin ? Math.round((mise || 0) * (defi?.cote || 1) * 0.9) : 0;
  const commission  = isWin ? Math.round((mise || 0) * (defi?.cote || 1) * 0.1)  : 0;
  const perte       = isWin ? 0 : (mise || 0);
  const netResult   = isWin ? gain - (mise || 0) : -(mise || 0);

  // États
  const [walletProcessed, setWalletProcessed] = useState(false);
  const [walletLoading,   setWalletLoading]   = useState(true);
  const [newBalance,      setNewBalance]       = useState(null);
  const [walletError,     setWalletError]      = useState(null);
  const [xpGained,        setXpGained]         = useState(0);

  // Animations
  const bgAnim       = useRef(new Animated.Value(0)).current;
  const heroScale    = useRef(new Animated.Value(0)).current;
  const heroOpacity  = useRef(new Animated.Value(0)).current;
  const amountAnim   = useRef(new Animated.Value(0)).current;
  const amountScale  = useRef(new Animated.Value(0.5)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const slideUpAnim  = useRef(new Animated.Value(60)).current;

  /* ── Animations d'entrée ── */
  useEffect(() => {
    // Séquence principale
    Animated.sequence([
      // 1. Fond
      Animated.timing(bgAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      // 2. Héros (icône principale)
      Animated.parallel([
        Animated.spring(heroScale,   { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.timing(heroOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // 3. Montant
      Animated.parallel([
        Animated.spring(amountScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.spring(slideUpAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // 4. Haptic + pulsation
      if (isWin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
          ])
        ).start();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Shake sur défaite
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10,  duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6,   duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6,  duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0,   duration: 80, useNativeDriver: true }),
        ]).start();
      }
    });
  }, []);

  /* ── Traitement wallet ── */
  useEffect(() => {
    processWallet();
  }, []);

  const processWallet = async () => {
    setWalletLoading(true);
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      const u      = stored ? JSON.parse(stored) : (user || {});
      if (!u?.id) throw new Error('Utilisateur non trouvé');

      let newBal = u.balance || 0;

      if (isWin) {
        // ── VICTOIRE : créditer le gain ──
        const { data, error } = await supabase.rpc('deposit_funds', {
          p_user_id: u.id,
          p_amount:  gain,
          p_label:   `Victoire — ${defi?.nom} ×${defi?.cote}`,
        });

        if (error) throw error;
        newBal = data?.balance_new ?? (u.balance + gain);

        // Enregistrer dans bets/historique
        await supabase.from('bets').insert({
          user_id:     u.id,
          game_key:    gameKey,
          defi_id:     defi?.id,
          defi_nom:    defi?.nom,
          defi_cond:   defi?.cond,
          defi_palier: defi?.p,
          mise:        mise,
          cote:        defi?.cote,
          gain:        gain,
          commission:  commission,
          status:      'win',
          resolved_at: new Date().toISOString(),
        }).single();

        // XP gagné
        const xp = 50 + Math.floor((mise || 0) / 100);
        setXpGained(xp);
        await supabase
          .from('profiles')
          .update({ xp: supabase.sql`xp + ${xp}` })
          .eq('id', u.id);

      } else {
        // ── DÉFAITE : la mise a déjà été débitée à ConfigScreen ──
        // Juste enregistrer le résultat
        newBal = u.balance;

        await supabase.from('bets').insert({
          user_id:     u.id,
          game_key:    gameKey,
          defi_id:     defi?.id,
          defi_nom:    defi?.nom,
          defi_cond:   defi?.cond,
          defi_palier: defi?.p,
          mise:        mise,
          cote:        defi?.cote,
          gain:        0,
          commission:  0,
          status:      'loss',
          resolved_at: new Date().toISOString(),
        }).single();

        const xp = 10; // XP consolation
        setXpGained(xp);
        await supabase
          .from('profiles')
          .update({ xp: supabase.sql`xp + ${xp}` })
          .eq('id', u.id);
      }

      // Mettre à jour AsyncStorage
      const updatedUser = { ...u, balance: newBal };
      await AsyncStorage.setItem('skillz_user', JSON.stringify(updatedUser));

      setNewBalance(newBal);
      setWalletProcessed(true);

    } catch (e) {
      console.error('Wallet error:', e);
      setWalletError(e.message);
      // Fallback local si Supabase échoue
      const stored = await AsyncStorage.getItem('skillz_user');
      const u      = stored ? JSON.parse(stored) : {};
      setNewBalance(isWin ? (u.balance || 0) + gain : (u.balance || 0));
      setWalletProcessed(true);
    } finally {
      setWalletLoading(false);
    }
  };

  /* ── Formatter le temps ── */
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}min ${s}s` : `${s}s`;
  };

  /* ── Navigation ── */
  const handleReplay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('Config', { gameKey, defi });
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  // Couleur de fond animée
  const bgColor = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#080A0F', isWin ? '#080F0A' : '#0F0808'],
  });

  return (
    <Animated.View style={[styles.screen, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Confetti victoire */}
      {isWin && <Confetti />}

      {/* Orbes déco */}
      <View style={[styles.orb1, { backgroundColor: accentColor }]} />
      <View style={[styles.orb2, { backgroundColor: gameColor }]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ══ HERO ══ */}
        <Animated.View style={[
          styles.heroSection,
          {
            opacity:   heroOpacity,
            transform: [
              { scale: Animated.multiply(heroScale, pulseAnim) },
              { translateX: shakeAnim },
            ],
          },
        ]}>
          {/* Anneau lumineux */}
          <View style={[styles.heroRingOuter, { borderColor: accentColor + '25' }]}>
            <View style={[styles.heroRingInner, { borderColor: accentColor + '50' }]}>
              <View style={[styles.heroCircle, { backgroundColor: accentColor + '15', borderColor: accentColor }]}>
                {isWin
                  ? <Trophy size={52} color={accentColor} />
                  : <X      size={52} color={accentColor} />
                }
              </View>
            </View>
          </View>

          {/* Titre */}
          <Text style={[styles.resultTitle, { color: accentColor }]}>
            {isWin ? 'VICTOIRE !' : 'DÉFAITE'}
          </Text>
          <Text style={styles.resultSub}>
            {isWin
              ? `Défi réussi en ${formatTime(time)} ! 🔥`
              : `${reps}/${target} reps · Continue d'essayer !`}
          </Text>
        </Animated.View>

        {/* ══ MONTANT PRINCIPAL ══ */}
        <Animated.View style={[
          styles.amountCard,
          {
            borderColor: accentColor + '40',
            transform:   [{ scale: amountScale }, { translateY: slideUpAnim }],
          },
        ]}>
          <View style={[styles.amountCardAccent, { backgroundColor: accentColor }]} />

          <View style={styles.amountCardInner}>
            {/* Label */}
            <Text style={styles.amountLabel}>
              {isWin ? 'GAIN CRÉDITÉ' : 'MISE PERDUE'}
            </Text>

            {/* Montant */}
            <View style={styles.amountRow}>
              {isWin
                ? <TrendingUp   size={28} color={accentColor} />
                : <TrendingDown size={28} color={accentColor} />
              }
              <Text style={[styles.amountValue, { color: accentColor }]}>
                {isWin ? '+' : '-'}{fmt(isWin ? gain : perte)} F
              </Text>
            </View>

            {/* Sous-détail */}
            {isWin && (
              <View style={styles.amountDetail}>
                <Text style={styles.amountDetailText}>
                  Mise {fmt(mise)} × {defi?.cote} = {fmt(Math.round((mise || 0) * (defi?.cote || 1)))} F
                </Text>
                <Text style={styles.amountDetailText}>
                  Commission SKILL'Z : -{fmt(commission)} F
                </Text>
              </View>
            )}

            {/* Nouveau solde */}
            <View style={styles.balanceRow}>
              {walletLoading ? (
                <ActivityIndicator size="small" color={accentColor} />
              ) : (
                <>
                  <Text style={styles.balanceLabel}>Nouveau solde :</Text>
                  <Text style={[styles.balanceValue, { color: accentColor }]}>
                    {fmt(newBalance ?? 0)} FCFA
                  </Text>
                </>
              )}
              {walletError && (
                <Text style={styles.walletErrorText}>⚠️ Sync en cours...</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ══ STATS ══ */}
        <Animated.View style={[styles.statsCard, { opacity: heroOpacity, transform: [{ translateY: slideUpAnim }] }]}>
          <Text style={styles.statsTitle}>STATISTIQUES</Text>

          <StatRow
            icon={isWin ? CheckCircle : AlertTriangle}
            label="Résultat"
            value={isWin ? 'Réussi ✓' : 'Échoué'}
            color={accentColor}
            delay={100}
          />
          <View style={styles.statsDivider} />
          <StatRow
            icon={Zap}
            label="Répétitions"
            value={`${reps} / ${target}`}
            color={reps >= target ? T.success : T.muted}
            delay={150}
          />
          <View style={styles.statsDivider} />
          <StatRow
            icon={Clock}
            label="Temps"
            value={formatTime(time)}
            color={T.gaming}
            delay={200}
          />
          <View style={styles.statsDivider} />
          <StatRow
            icon={Star}
            label="XP gagné"
            value={`+${xpGained} XP`}
            color={T.gold}
            delay={250}
          />
          {defi?.cote && (
            <>
              <View style={styles.statsDivider} />
              <StatRow
                icon={TrendingUp}
                label="Cote"
                value={`×${defi.cote.toFixed(2)}`}
                color={T.gaming}
                delay={300}
              />
            </>
          )}
        </Animated.View>

        {/* ══ DÉFI INFO ══ */}
        <Animated.View style={[styles.defiCard, { opacity: heroOpacity, transform: [{ translateY: slideUpAnim }] }]}>
          <View style={styles.defiCardHeader}>
            {game.short && (
              <View style={[styles.gameTag, { backgroundColor: gameColor + '15', borderColor: gameColor + '35' }]}>
                <Text style={[styles.gameTagText, { color: gameColor }]}>{game.short}</Text>
              </View>
            )}
            {palier.label && (
              <View style={[styles.palierTag, { backgroundColor: palier.dim, borderColor: (palier.color || T.gold) + '35' }]}>
                <Text style={[styles.palierTagText, { color: palier.color || T.gold }]}>
                  {palier.label.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.defiNom}>{defi?.nom}</Text>
          <Text style={styles.defiCond}>{defi?.cond}</Text>
        </Animated.View>

        {/* ══ BOUTONS ══ */}
        <Animated.View style={[styles.buttons, { opacity: heroOpacity, transform: [{ translateY: slideUpAnim }] }]}>

          {/* Rejouer */}
          <TouchableOpacity
            style={[styles.replayBtn, { borderColor: gameColor + '50', backgroundColor: gameColor + '10' }]}
            onPress={handleReplay}
            activeOpacity={0.85}
          >
            <RotateCcw size={18} color={gameColor} />
            <Text style={[styles.replayBtnText, { color: gameColor }]}>REJOUER CE DÉFI</Text>
          </TouchableOpacity>

          {/* Accueil */}
          <TouchableOpacity
            style={[styles.homeBtn, { backgroundColor: isWin ? T.success : accentColor, shadowColor: isWin ? T.success : accentColor }]}
            onPress={handleHome}
            activeOpacity={0.85}
          >
            <Home size={18} color="#000" />
            <Text style={styles.homeBtnText}>RETOUR À L'ACCUEIL</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ══ MESSAGE MOTIVATION ══ */}
        <Animated.View style={[styles.motivCard, { opacity: heroOpacity }]}>
          <Shield size={13} color={T.muted} />
          <Text style={styles.motivText}>
            {isWin
              ? '🏆 Félicitations ! Ton gain a été automatiquement crédité sur ton wallet.'
              : '💪 La défaite forge les champions. Réessaie avec une meilleure préparation !'
            }
          </Text>
        </Animated.View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  screen:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, alignItems: 'center', paddingBottom: 40 },

  orb1: { position: 'absolute', top: -80, right: -60, width: 250, height: 250, borderRadius: 125, opacity: 0.12 },
  orb2: { position: 'absolute', top: H * 0.4, left: -80, width: 200, height: 200, borderRadius: 100, opacity: 0.08 },

  /* Hero */
  heroSection: { alignItems: 'center', marginBottom: 28, marginTop: 10 },
  heroRingOuter: {
    width: 170, height: 170, borderRadius: 85,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  heroRingInner: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  heroCircle: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
  },
  resultTitle: {
    fontFamily: 'Rajdhani-Bold', fontSize: 42,
    letterSpacing: 4, marginBottom: 6,
  },
  resultSub: {
    fontFamily: 'Inter-Regular', fontSize: 14,
    color: T.muted, textAlign: 'center',
  },

  /* Montant */
  amountCard: {
    width: '100%', backgroundColor: '#0C0E14',
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden', marginBottom: 14,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  amountCardAccent: { height: 3 },
  amountCardInner:  { padding: 20, alignItems: 'center' },
  amountLabel: {
    fontFamily: 'Inter-Regular', fontSize: 10,
    color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 10,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  amountValue: {
    fontFamily: 'Rajdhani-Bold', fontSize: 52,
    letterSpacing: 1,
  },
  amountDetail: { alignItems: 'center', gap: 3, marginBottom: 14 },
  amountDetailText: {
    fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted,
  },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  balanceLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  balanceValue: { fontFamily: 'JetBrainsMono-Regular', fontSize: 16, fontWeight: '700' },
  walletErrorText: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.danger },

  /* Stats */
  statsCard: {
    width: '100%', backgroundColor: '#0C0E14',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16, marginBottom: 14,
  },
  statsTitle: {
    fontFamily: 'Inter-Regular', fontSize: 10,
    color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 8,
  },
  statIcon: {
    width: 30, height: 30, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  statLabel: {
    flex: 1, fontFamily: 'Inter-Regular',
    fontSize: 13, color: T.muted,
  },
  statValue: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13, fontWeight: '700',
  },
  statsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  /* Défi info */
  defiCard: {
    width: '100%', backgroundColor: '#0C0E14',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16, marginBottom: 20,
  },
  defiCardHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  gameTag:        { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  gameTagText:    { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  palierTag:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  palierTagText:  { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  defiNom:  { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5', marginBottom: 4 },
  defiCond: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, lineHeight: 18 },

  /* Boutons */
  buttons: { width: '100%', gap: 12, marginBottom: 14 },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5,
  },
  replayBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, letterSpacing: 1.5 },
  homeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  homeBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 1.5 },

  /* Motivation */
  motivCard: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start',
    gap: 8, backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  motivText: {
    fontFamily: 'Inter-Regular', fontSize: 11,
    color: T.muted, flex: 1, lineHeight: 17,
  },
});