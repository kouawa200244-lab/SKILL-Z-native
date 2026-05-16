// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Swords, Plus, Users, Clock, Zap,
  Trophy, Gamepad2, Dumbbell, RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helper';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { supabase } from '../supabaseClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ── Carte duel ouvert ── */
function DuelCard({ duel, index, onJoin, currentUserId }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, delay: index * 70, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const game   = GAMES[duel.game_key] || {};
  const palier = PALIERS[duel.defi_palier] || {};
  const cond   = getDuelCondition(duel.defi_id);
  const color  = game.color || T.gold;
  const isOwn  = duel.creator_id === currentUserId;
  const gain   = Math.round(duel.mise * 2 * 0.9);

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, tension: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start(() => onJoin(duel));
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }], marginBottom: 12 }}>
      <View style={[styles.duelCard, { borderLeftColor: color }]}>
        <View style={styles.duelCardHeader}>
          <View style={styles.duelCardLeft}>
            {duel.game_key === 'physique'
              ? <Dumbbell size={14} color={color} />
              : <Gamepad2 size={14} color={color} />
            }
            <Text style={[styles.duelCardGame, { color }]}>
              {game.short || duel.game_key?.toUpperCase()}
            </Text>
            {palier.label && (
              <View style={[styles.duelCardPalier, { backgroundColor: palier.dim, borderColor: (palier.color || T.gold) + '40' }]}>
                <Text style={[styles.duelCardPalierText, { color: palier.color || T.gold }]}>
                  {palier.label.toUpperCase()}
                </Text>
              </View>
            )}
            {isOwn && (
              <View style={styles.ownBadge}>
                <Text style={styles.ownBadgeText}>MON DUEL</Text>
              </View>
            )}
          </View>
          <View style={styles.duelCardTimer}>
            <Clock size={10} color={T.muted} />
            <Text style={styles.duelCardTimerText}>{timeLeft(duel.expires_at)}</Text>
          </View>
        </View>

        <Text style={styles.duelCardNom}>{duel.defi_nom}</Text>

        <View style={styles.duelCardCondRow}>
          <Swords size={11} color={color} />
          <Text style={[styles.duelCardCondLabel, { color }]}>{cond.label}</Text>
        </View>
        <Text style={styles.duelCardCond} numberOfLines={2}>{cond.desc}</Text>

        <View style={styles.duelCardFooter}>
          <View style={styles.duelCardCreator}>
            <View style={[styles.duelCardAvatar, { backgroundColor: color + '20' }]}>
              <Text style={[styles.duelCardAvatarText, { color }]}>
                {(duel.creator_name || duel.creator_username)?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.duelCardCreatorName}>
              {duel.creator_name || duel.creator_username || 'Joueur'}
            </Text>
          </View>
          <View style={styles.duelCardRight}>
            <View style={styles.duelCardMise}>
              <Text style={styles.duelCardMiseLabel}>Mise</Text>
              <Text style={[styles.duelCardMiseValue, { color: T.gold }]}>{fmt(duel.mise)} F</Text>
            </View>
            <View style={styles.duelCardGain}>
              <Trophy size={10} color={T.success} />
              <Text style={styles.duelCardGainValue}>+{fmt(gain)} F</Text>
            </View>
          </View>
        </View>

        {!isOwn ? (
          <TouchableOpacity style={[styles.joinBtn, { backgroundColor: color }]} onPress={handleJoin} activeOpacity={0.85}>
            <Users size={15} color="#000" />
            <Text style={styles.joinBtnText}>REJOINDRE CE DUEL · {fmt(duel.mise)} F</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingBadge}>
            <ActivityIndicator size="small" color={T.gaming} style={{ marginRight: 8 }} />
            <Text style={styles.waitingText}>En attente d'un adversaire...</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

/* ── Carte duel actif ── */
function ActiveDuelCard({ duel, index, onResume, currentUserId }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const isCreator  = duel.creator_id === currentUserId;
  const myFinished = isCreator ? duel.creator_finished : duel.opponent_finished;
  const game       = GAMES[duel.game_key] || {};
  const color      = game.color || T.gaming;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 10 }}>
      <TouchableOpacity
        style={[styles.activeDuelCard, { borderColor: color + '40' }]}
        onPress={() => onResume(duel)}
        activeOpacity={0.85}
      >
        <View style={[styles.activeDuelAccent, { backgroundColor: color }]} />
        <View style={styles.activeDuelInner}>
          <View style={styles.activeDuelHeader}>
            <Text style={[styles.activeDuelGame, { color }]}>
              {game.short || duel.game_key?.toUpperCase()}
            </Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN COURS</Text>
            </View>
          </View>
          <Text style={styles.activeDuelNom}>{duel.defi_nom}</Text>
          <Text style={styles.activeDuelVs}>
            {duel.creator_username} <Text style={{ color: T.muted }}>vs</Text> {duel.opponent_username}
          </Text>
          <View style={styles.activeDuelFooter}>
            <View style={styles.activeDuelMise}>
              <Text style={styles.activeDuelMiseLabel}>Pot :</Text>
              <Text style={[styles.activeDuelMiseValue, { color: T.gold }]}>
                {fmt(duel.mise * 2)} F
              </Text>
            </View>
            {myFinished ? (
              <View style={styles.finishedBadge}>
                <Text style={styles.finishedBadgeText}>✓ Terminé — En attente admin</Text>
              </View>
            ) : (
              <View style={[styles.resumeBtn, { backgroundColor: color }]}>
                <Text style={styles.resumeBtnText}>REPRENDRE →</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── ÉCRAN PRINCIPAL ── */
export default function DuelScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation();

  const [tab,          setTab]          = useState('open');
  const [openDuels,    setOpenDuels]    = useState([]);
  const [myDuels,      setMyDuels]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [currentUser,  setCurrentUser]  = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
    loadUser();
  }, []);

  useFocusEffect(useCallback(() => { loadDuels(); }, []));

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem('skillz_user');
    if (stored) setCurrentUser(JSON.parse(stored));
  };

  const loadDuels = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      const user   = stored ? JSON.parse(stored) : null;
      if (!user) return;

      const { data: open } = await supabase
        .from('duels')
        .select('*, profiles!creator_id(username)')
        .eq('status', 'waiting')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: mine } = await supabase
        .from('duels')
        .select('*')
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .in('status', ['waiting', 'active', 'pending_result'])
        .order('created_at', { ascending: false });

      // Formater les données open
      const formattedOpen = (open || []).map(d => ({
        ...d,
        creator_name: d.profiles?.username || d.creator_username,
      }));

      setOpenDuels(formattedOpen);
      setMyDuels(mine || []);
      setCurrentUser(user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadDuels();
    setRefreshing(false);
  };

  const handleJoin = (duel) => {
    Alert.alert(
      'Rejoindre ce duel ?',
      `Défi : ${duel.defi_nom}\nMise : ${fmt(duel.mise)} FCFA\n\nCe montant sera débité immédiatement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: `Rejoindre · ${fmt(duel.mise)} F`,
          onPress: () => navigate('DuelRoom', { duel, user: currentUser }),
        },
      ]
    );
  };

  const handleResume = (duel) => {
    navigate('DuelRoom', { duel, user: currentUser });
  };

  const myActiveDuels = myDuels.filter(d => d.status === 'active' || d.status === 'pending_result');
  const myWaiting     = myDuels.filter(d => d.status === 'waiting');
  const filteredOpen  = openDuels.filter(d => d.creator_id !== currentUser?.id);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.gold} colors={[T.gold]} />
        }
      >
        {/* HEADER */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.eyebrow}>SKILL'Z</Text>
            <Text style={styles.title}>Duels</Text>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigate('DuelCreate'); }}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#000" />
            <Text style={styles.createBtnText}>CRÉER</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* STATS */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: T.gaming }]}>{filteredOpen.length}</Text>
            <Text style={styles.statLabel}>Duels ouverts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: T.success }]}>{myActiveDuels.length}</Text>
            <Text style={styles.statLabel}>Mes duels actifs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: T.gold }]}>{myWaiting.length}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </Animated.View>

        {/* TABS */}
        <View style={styles.tabs}>
          {[
            { key: 'open', label: `Disponibles (${filteredOpen.length})` },
            { key: 'mine', label: `Mes Duels (${myDuels.length})` },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTENU */}
        {loading ? (
          <ActivityIndicator color={T.gold} size="large" style={{ marginTop: 40 }} />
        ) : tab === 'open' ? (
          filteredOpen.length === 0 ? (
            <View style={styles.emptyState}>
              <Swords size={36} color={T.muted} />
              <Text style={styles.emptyTitle}>Aucun duel disponible</Text>
              <Text style={styles.emptyText}>Sois le premier à lancer un défi !</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigate('DuelCreate')}>
                <Plus size={14} color={T.gold} />
                <Text style={styles.emptyBtnText}>Créer un duel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOpen.map((d, i) => (
              <DuelCard
                key={`open_${d.id}`}
                duel={d}
                index={i}
                onJoin={handleJoin}
                currentUserId={currentUser?.id}
              />
            ))
          )
        ) : (
          myDuels.length === 0 ? (
            <View style={styles.emptyState}>
              <Swords size={36} color={T.muted} />
              <Text style={styles.emptyTitle}>Aucun duel en cours</Text>
              <Text style={styles.emptyText}>Lance ou rejoins un duel pour commencer</Text>
            </View>
          ) : (
            <>
              {myActiveDuels.length > 0 && (
                <>
                  <Text style={styles.subSection}>EN COURS</Text>
                  {myActiveDuels.map((d, i) => (
                    <ActiveDuelCard
                      key={`active_${d.id}`}
                      duel={d} index={i}
                      onResume={handleResume}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </>
              )}
              {myWaiting.length > 0 && (
                <>
                  <Text style={[styles.subSection, { marginTop: 16 }]}>EN ATTENTE ADVERSAIRE</Text>
                  {myWaiting.map((d, i) => (
                    <DuelCard
                      key={`waiting_${d.id}`}
                      duel={d} index={i}
                      onJoin={() => {}}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </>
              )}
            </>
          )
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  orb1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: T.gaming, opacity: 0.07 },
  orb2: { position: 'absolute', top: 300, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: '#A855F7', opacity: 0.06 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, marginBottom: 20 },
  eyebrow:      { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  title:        { fontFamily: 'Rajdhani-Bold', fontSize: 36, color: '#EEEEF5' },
  createBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.gold, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, shadowColor: T.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  createBtnText:{ fontFamily: 'Rajdhani-Bold', fontSize: 14, color: '#000', letterSpacing: 1.5 },

  statsRow:    { flexDirection: 'row', backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 18, overflow: 'hidden' },
  statBox:     { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 10 },
  statValue:   { fontFamily: 'Rajdhani-Bold', fontSize: 24 },
  statLabel:   { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '600' },

  tabs:          { flexDirection: 'row', backgroundColor: '#0F1219', borderRadius: 14, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tab:           { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive:     { backgroundColor: T.gaming + '20', borderWidth: 1, borderColor: T.gaming + '50' },
  tabText:       { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, fontWeight: '700' },
  tabTextActive: { color: T.gaming },

  subSection: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },

  duelCard:           { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 3, padding: 16 },
  duelCardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  duelCardLeft:       { flexDirection: 'row', alignItems: 'center', gap: 7 },
  duelCardGame:       { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  duelCardPalier:     { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  duelCardPalierText: { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  ownBadge:           { backgroundColor: T.gold + '20', borderWidth: 1, borderColor: T.gold + '40', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  ownBadgeText:       { fontFamily: 'Inter-Regular', fontSize: 8, color: T.gold, fontWeight: '800', letterSpacing: 1 },
  duelCardTimer:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duelCardTimerText:  { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },
  duelCardNom:        { fontFamily: 'Rajdhani-Bold', fontSize: 19, color: '#EEEEF5', marginBottom: 8 },
  duelCardCondRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  duelCardCondLabel:  { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  duelCardCond:       { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, lineHeight: 17, marginBottom: 12 },
  duelCardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  duelCardCreator:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  duelCardAvatar:     { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  duelCardAvatarText: { fontFamily: 'Rajdhani-Bold', fontSize: 13 },
  duelCardCreatorName:{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#EEEEF5', fontWeight: '600' },
  duelCardRight:      { alignItems: 'flex-end', gap: 3 },
  duelCardMise:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  duelCardMiseLabel:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },
  duelCardMiseValue:  { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
  duelCardGain:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duelCardGainValue:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.success, fontWeight: '700' },
  joinBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, paddingVertical: 13 },
  joinBtnText:        { fontFamily: 'Rajdhani-Bold', fontSize: 14, color: '#000', letterSpacing: 1 },
  waitingBadge:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.gaming + '10', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: T.gaming + '25' },
  waitingText:        { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gaming },

  activeDuelCard:    { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  activeDuelAccent:  { height: 2 },
  activeDuelInner:   { padding: 16 },
  activeDuelHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  activeDuelGame:    { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  liveBadge:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.danger + '18', borderWidth: 1, borderColor: T.danger + '40', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot:           { width: 5, height: 5, borderRadius: 3, backgroundColor: T.danger },
  liveText:          { fontFamily: 'Inter-Regular', fontSize: 9, color: T.danger, fontWeight: '800', letterSpacing: 1 },
  activeDuelNom:     { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5', marginBottom: 4 },
  activeDuelVs:      { fontFamily: 'Inter-Regular', fontSize: 12, color: '#EEEEF5', marginBottom: 12 },
  activeDuelFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeDuelMise:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDuelMiseLabel:{ fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  activeDuelMiseValue:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 14, fontWeight: '700' },
  resumeBtn:         { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  resumeBtnText:     { fontFamily: 'Rajdhani-Bold', fontSize: 13, color: '#000', letterSpacing: 1 },
  finishedBadge:     { backgroundColor: T.success + '12', borderWidth: 1, borderColor: T.success + '30', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  finishedBadgeText: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.success, fontWeight: '700' },

  emptyState:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#EEEEF5' },
  emptyText:    { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, textAlign: 'center' },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.gold + '12', borderWidth: 1, borderColor: T.gold + '30', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  emptyBtnText: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.gold, fontWeight: '700' },
});