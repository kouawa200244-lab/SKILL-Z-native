// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, TextInput,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Swords, Trophy, Clock, Zap, User,
  AlertTriangle, ArrowRight, Shield,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { navigate } from '../utils/navigationRef';
import { supabase } from '../supabaseClient';
import { formatPerformance } from '../utils/deepLinking';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const C = {
  bg:     '#0B0E13',
  card:   '#161B22',
  violet: '#A259FF',
  vDim:   'rgba(162,89,255,0.12)',
  vBord:  'rgba(162,89,255,0.30)',
  orange: '#FF6B35',
  text:   '#F5F7FA',
  muted:  '#8B949E',
  success:'#2ECC71',
  danger: '#E74C3C',
  gold:   '#F0C040',
};

/* ── Compte à rebours ── */
function useCountdown(expiresAt) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setTimeLeft('Expiré'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? h + 'h ' : ''}${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return timeLeft;
}

/* ══════════════════════════════════════
   ÉCRAN PRINCIPAL
══════════════════════════════════════ */
export default function DefiChallengeScreen() {
  const insets   = useSafeAreaInsets();
  const route    = useRoute();

  // Reçoit soit params de navigation soit defiId depuis deep link
  const { defiId, viralDefi: initialViralDefi } = route.params || {};

  const [viralDefi, setViralDefi]       = useState(initialViralDefi || null);
  const [loading,   setLoading]         = useState(!initialViralDefi);
  const [user,      setUser]            = useState(null);
  const [showLogin, setShowLogin]       = useState(false);
  const [guestName, setGuestName]       = useState('');
  const [joining,   setJoining]         = useState(false);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const btnAnim    = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  const timeLeft = useCountdown(viralDefi?.expires_at || new Date().toISOString());
  const isExpired = timeLeft === 'Expiré';

  const game   = GAMES[viralDefi?.game_key]    || {};
  const palier = PALIERS[viralDefi?.defi_palier] || {};
  const perf   = viralDefi?.creator_performance;
  const perfStr = formatPerformance(perf);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: false }),
    ])).start();

    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger user
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) setUser(JSON.parse(stored));

      // Charger défi si pas déjà en params
      if (!initialViralDefi && defiId) {
        const { data, error } = await supabase
          .from('viral_defis')
          .select('*')
          .eq('id', defiId)
          .single();

        if (error || !data) {
          Alert.alert('Défi introuvable', 'Ce défi n\'existe pas ou a expiré.');
          return;
        }
        setViralDefi(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] });

  /* ── Relever le défi ── */
  const handleChallenge = async () => {
    // Si pas connecté → demander un nom
    if (!user) {
      if (!guestName.trim()) {
        setShowLogin(true);
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setJoining(true);

    Animated.sequence([
      Animated.spring(btnAnim, { toValue: 0.96, tension: 300, useNativeDriver: true }),
      Animated.spring(btnAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();

    try {
      // Vérifier wallet si connecté
      if (user) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (!wallet || wallet.balance < viralDefi.mise) {
          Alert.alert(
            'Solde insuffisant',
            `Il te faut ${viralDefi.mise?.toLocaleString('fr-FR')} FCFA.\nSolde actuel : ${(wallet?.balance || 0).toLocaleString('fr-FR')} FCFA`
          );
          return;
        }

        // Débiter mise challenger
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance - viralDefi.mise })
          .eq('user_id', user.id);
      }

      // Naviguer vers LiveScreen
      navigate('Live', {
        defi: {
          id:   viralDefi.defi_id,
          nom:  viralDefi.defi_nom,
          cond: viralDefi.defi_cond,
          p:    viralDefi.defi_palier,
          cote: viralDefi.cote,
        },
        gameKey:        viralDefi.game_key,
        mise:           viralDefi.mise,
        isViral:        true,
        isChallenger:   true,
        viralDefiId:    viralDefi.id,
        creatorPerf:    viralDefi.creator_performance,
      });

    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={C.violet} size="large" />
        <Text style={styles.loadingText}>Chargement du défi...</Text>
      </View>
    );
  }

  if (!viralDefi) {
    return (
      <View style={styles.loadingScreen}>
        <Swords size={40} color={C.muted} />
        <Text style={styles.notFoundTitle}>Défi introuvable</Text>
        <Text style={styles.notFoundSub}>Ce défi n'existe pas ou a été supprimé.</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigate('MainTabs')}>
          <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top, opacity: fadeAnim }]}>
      {/* Fond animé */}
      <Animated.View style={[styles.bgGlow, { opacity: glowOpacity }]} />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerCreator}>
            <View style={[styles.creatorAvatar, { backgroundColor: game.color + '20' || C.vDim }]}>
              <Text style={[styles.creatorAvatarText, { color: game.color || C.violet }]}>
                {viralDefi.creator_username?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.headerFrom}>Défi de</Text>
              <Text style={styles.creatorName}>{viralDefi.creator_username}</Text>
            </View>
          </View>

          {/* Timer */}
          <View style={[
            styles.timerPill,
            isExpired && { backgroundColor: C.danger + '15', borderColor: C.danger + '40' },
          ]}>
            <Clock size={12} color={isExpired ? C.danger : C.gold} />
            <Text style={[styles.timerText, isExpired && { color: C.danger }]}>
              {isExpired ? 'Expiré' : timeLeft}
            </Text>
          </View>
        </Animated.View>

        {/* ── CARTE DÉFI ── */}
        <Animated.View style={[
          styles.defiCard,
          { transform: [{ translateY: slideAnim }] },
          { borderColor: (game.color || C.violet) + '40' },
        ]}>
          <View style={[styles.defiCardAccent, { backgroundColor: game.color || C.violet }]} />
          <View style={styles.defiCardBody}>
            {/* Jeu + palier */}
            <View style={styles.defiCardRow1}>
              <View style={[styles.gameChip, { backgroundColor: (game.color || C.violet) + '18', borderColor: (game.color || C.violet) + '35' }]}>
                <Text style={[styles.gameChipText, { color: game.color || C.violet }]}>
                  {game.short || viralDefi.game_key?.toUpperCase()}
                </Text>
              </View>
              {palier.label && (
                <View style={[styles.palierChip, { backgroundColor: (palier.color || C.gold) + '15', borderColor: (palier.color || C.gold) + '35' }]}>
                  <Text style={[styles.palierChipText, { color: palier.color || C.gold }]}>
                    {palier.label?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[styles.cotePill, { borderColor: C.violet + '50' }]}>
                <Zap size={9} color={C.violet} />
                <Text style={[styles.coteText, { color: C.violet }]}>×{viralDefi.cote?.toFixed(2)}</Text>
              </View>
            </View>

            {/* Nom */}
            <Text style={styles.defiNom}>{viralDefi.defi_nom}</Text>

            {/* Condition */}
            <Text style={styles.defiCond}>{viralDefi.defi_cond}</Text>

            {/* Mise */}
            <View style={styles.miseRow}>
              <View style={styles.misePart}>
                <Text style={styles.miseLabel}>Mise</Text>
                <Text style={styles.miseValue}>{viralDefi.mise?.toLocaleString('fr-FR')} FCFA</Text>
              </View>
              <View style={styles.miseSep} />
              <View style={styles.misePart}>
                <Text style={styles.miseLabel}>Gain si victoire</Text>
                <Text style={[styles.miseValue, { color: C.success }]}>
                  +{Math.round(viralDefi.mise * 2 * 0.9)?.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── PERFORMANCE JOUEUR 1 ── */}
        <Animated.View style={[styles.perfCard, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.perfCardHeader}>
            <Trophy size={14} color={C.gold} />
            <Text style={styles.perfCardTitle}>PERFORMANCE À BATTRE</Text>
          </View>

          <View style={styles.perfCardBody}>
            {/* Avatar créateur */}
            <View style={styles.perfPlayer}>
              <View style={[styles.perfAvatar, { backgroundColor: (game.color || C.violet) + '20' }]}>
                <Text style={[styles.perfAvatarText, { color: game.color || C.violet }]}>
                  {viralDefi.creator_username?.[0]?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.perfPlayerName}>{viralDefi.creator_username}</Text>
            </View>

            {/* Stats */}
            <View style={styles.perfStats}>
              {perf?.time != null && (
                <View style={styles.perfStat}>
                  <Clock size={14} color={C.muted} />
                  <Text style={styles.perfStatLabel}>Temps</Text>
                  <Text style={styles.perfStatValue}>
                    {Math.floor((perf.time || 0) / 60).toString().padStart(2,'0')}:{String((perf.time || 0) % 60).padStart(2,'0')}
                  </Text>
                </View>
              )}
              {perf?.reps != null && perf.reps > 0 && (
                <View style={styles.perfStat}>
                  <Zap size={14} color={C.muted} />
                  <Text style={styles.perfStatLabel}>Reps</Text>
                  <Text style={styles.perfStatValue}>{perf.reps}</Text>
                </View>
              )}
              {perf?.score != null && perf.score > 0 && (
                <View style={styles.perfStat}>
                  <Trophy size={14} color={C.muted} />
                  <Text style={styles.perfStatLabel}>Score</Text>
                  <Text style={styles.perfStatValue}>{perf.score}</Text>
                </View>
              )}
            </View>

            {/* Résumé */}
            <View style={styles.perfSummary}>
              <Text style={styles.perfSummaryLabel}>À BATTRE</Text>
              <Text style={[styles.perfSummaryValue, { color: C.gold }]}>{perfStr}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── FORMULAIRE GUEST (si non connecté) ── */}
        {!user && (
          <View style={styles.guestCard}>
            <User size={16} color={C.violet} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>Entre ton nom pour relever le défi</Text>
              <TextInput
                style={styles.guestInput}
                placeholder="Ton nom / pseudo"
                placeholderTextColor={C.muted}
                value={guestName}
                onChangeText={setGuestName}
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* ── DÉFI EXPIRÉ ── */}
        {isExpired && (
          <View style={styles.expiredCard}>
            <AlertTriangle size={18} color={C.danger} />
            <Text style={styles.expiredText}>Ce défi a expiré et ne peut plus être relevé.</Text>
          </View>
        )}

        {/* ── BOUTON RELEVER ── */}
        {!isExpired && (
          <Animated.View style={{ transform: [{ scale: btnAnim }] }}>
            <TouchableOpacity
              style={[
                styles.challengeBtn,
                (!user && !guestName.trim()) && styles.challengeBtnDisabled,
                joining && { opacity: 0.7 },
              ]}
              onPress={handleChallenge}
              disabled={joining || (!user && !guestName.trim())}
              activeOpacity={0.88}
            >
              {joining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Swords size={22} color="#fff" />
                  <Text style={styles.challengeBtnText}>RELEVER LE DÉFI</Text>
                  <ArrowRight size={18} color="rgba(255,255,255,0.7)" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Sécurité */}
        <View style={styles.securityRow}>
          <Shield size={12} color={C.muted} />
          <Text style={styles.securityText}>
            La mise est débitée et sécurisée. Résultat calculé automatiquement.
          </Text>
        </View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  scrollContent:{ paddingHorizontal: 18, paddingBottom: 60 },
  loadingScreen:{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText:  { fontFamily: 'Inter-Regular', fontSize: 14, color: C.muted },
  notFoundTitle:{ fontFamily: 'Rajdhani-Bold', fontSize: 22, color: C.text },
  notFoundSub:  { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted, textAlign: 'center' },
  homeBtn:      { marginTop: 16, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  homeBtnText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted },

  bgGlow: { position: 'absolute', top: -100, left: -100, width: W + 200, height: 400, backgroundColor: C.violet },
  orb1:   { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: C.orange, opacity: 0.07 },
  orb2:   { position: 'absolute', top: 400, left: -60, width: 150, height: 150, borderRadius: 75, backgroundColor: C.violet, opacity: 0.06 },

  /* Header */
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, marginBottom: 18 },
  headerCreator:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  creatorAvatar:  { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  creatorAvatarText: { fontFamily: 'Rajdhani-Bold', fontSize: 20 },
  headerFrom:     { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, fontWeight: '600' },
  creatorName:    { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: C.text },
  timerPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.gold + '12', borderWidth: 1, borderColor: C.gold + '30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  timerText:      { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: C.gold, fontWeight: '700' },

  /* Défi card */
  defiCard:      { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  defiCardAccent:{ height: 3 },
  defiCardBody:  { padding: 18, gap: 10 },
  defiCardRow1:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gameChip:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  gameChipText:  { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  palierChip:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  palierChipText:{ fontFamily: 'Inter-Regular', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cotePill:      { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderColor: C.violet + '40' },
  coteText:      { fontFamily: 'Rajdhani-Bold', fontSize: 12 },
  defiNom:       { fontFamily: 'Rajdhani-Bold', fontSize: 22, color: C.text },
  defiCond:      { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted, lineHeight: 18 },
  miseRow:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  misePart:      { flex: 1, padding: 12, alignItems: 'center', gap: 3 },
  miseSep:       { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },
  miseLabel:     { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, fontWeight: '600' },
  miseValue:     { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.gold },

  /* Perf card */
  perfCard:       { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.gold + '20', overflow: 'hidden', marginBottom: 14 },
  perfCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  perfCardTitle:  { fontFamily: 'Inter-Regular', fontSize: 10, color: C.gold, fontWeight: '800', letterSpacing: 2 },
  perfCardBody:   { padding: 16, gap: 14 },
  perfPlayer:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perfAvatar:     { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  perfAvatarText: { fontFamily: 'Rajdhani-Bold', fontSize: 16 },
  perfPlayerName: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.text },
  perfStats:      { flexDirection: 'row', gap: 10 },
  perfStat:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, alignItems: 'center', gap: 4 },
  perfStatLabel:  { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, fontWeight: '600' },
  perfStatValue:  { fontFamily: 'JetBrainsMono-Regular', fontSize: 18, color: C.text, fontWeight: '700' },
  perfSummary:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.gold + '08', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.gold + '20' },
  perfSummaryLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 1 },
  perfSummaryValue: { fontFamily: 'Rajdhani-Bold', fontSize: 20 },

  /* Guest */
  guestCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.vDim, padding: 14, marginBottom: 14 },
  guestTitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted, marginBottom: 8 },
  guestInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter-Regular', fontSize: 14, color: C.text },

  /* Expiré */
  expiredCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.danger + '10', borderRadius: 12, borderWidth: 1, borderColor: C.danger + '30', padding: 16, marginBottom: 14 },
  expiredText: { fontFamily: 'Inter-Regular', fontSize: 13, color: C.danger, flex: 1 },

  /* Bouton relever */
  challengeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: C.orange, borderRadius: 16,
    paddingVertical: 20, marginBottom: 14,
    shadowColor: C.orange, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 14,
  },
  challengeBtnDisabled: { backgroundColor: 'rgba(255,107,53,0.35)', shadowOpacity: 0 },
  challengeBtnText:     { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#fff', letterSpacing: 2 },

  /* Sécurité */
  securityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  securityText:{ fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.2)', flex: 1, lineHeight: 16 },
});