// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, RefreshControl,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Swords, Plus, Users, Clock, Zap,
  Trophy, Gamepad2, Dumbbell, Flame,
  TrendingUp, Shield, Crown,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { getDuelCondition } from '../constants/duelTypes';
import { supabase } from '../supabaseClient';
import { navigate } from '../utils/navigationRef'; // ✅ FIX
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ── Header animé compétitif ── */
function CompetitiveHeader({ openCount, myCount }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
    ])).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={styles.competHeader}>
      {/* Fond ambiance */}
      <View style={styles.competHeaderBg} />
      <View style={styles.competHeaderGrid} />

      {/* Orbes */}
      <Animated.View style={[styles.competOrb1, { opacity: glowOpacity }]} />
      <View style={styles.competOrb2} />

      {/* Titre */}
      <View style={styles.competTitleRow}>
        <Animated.View style={[styles.competIconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Swords size={22} color={'#A855F7'} />
        </Animated.View>
        <View>
          <Text style={styles.competEyebrow}>SKILL'Z</Text>
          <Text style={styles.competTitle}>ARENA</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Stats arène */}
      <View style={styles.competStats}>
        <View style={styles.competStatBox}>
          <Text style={[styles.competStatValue, { color: '#A855F7' }]}>{openCount}</Text>
          <Text style={styles.competStatLabel}>Duels ouverts</Text>
        </View>
        <View style={styles.competStatSep} />
        <View style={styles.competStatBox}>
          <Text style={[styles.competStatValue, { color: '#A855F7' }]}>{myCount}</Text>
          <Text style={styles.competStatLabel}>Mes duels</Text>
        </View>
        <View style={styles.competStatSep} />
        <View style={styles.competStatBox}>
          <Flame size={16} color={T.danger} />
          <Text style={styles.competStatLabel}>Arène active</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Carte duel compétitive ── */
function DuelCard({ duel, index, onJoin, onResume, currentUserId }) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, delay: index * 70, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const isOwn   = duel.creator_id === currentUserId;
  const isActive= duel.status === 'active';
  const game    = GAMES[duel.game_key]    || {};
  const palier  = PALIERS[duel.defi_palier] || {};
  const cond    = getDuelCondition(duel.defi_id);
  const color   = game.color || '#A855F7';
  const gain    = Math.round((duel.mise || 0) * 2 * 0.9);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, tension: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start(() => {
      if (isOwn || isActive) onResume?.(duel);
      else onJoin?.(duel);
    });
  };

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      marginBottom: 12,
    }}>
      <View style={[styles.duelCard, { borderTopColor: color }]}>
        {/* Bande couleur top */}
        <View style={[styles.duelCardTopBar, { backgroundColor: color }]} />

        {/* Header */}
        <View style={styles.duelCardHeader}>
          <View style={styles.duelCardHeaderLeft}>
            {duel.game_key === 'physique'
              ? <Dumbbell size={13} color={color} />
              : <Gamepad2 size={13} color={color} />
            }
            <Text style={[styles.duelCardGame, { color }]}>
              {game.short || duel.game_key?.toUpperCase()}
            </Text>
            {palier.label && (
              <View style={[styles.palierBadge, { backgroundColor: (palier.color || T.gold) + '20', borderColor: (palier.color || T.gold) + '40' }]}>
                <Text style={[styles.palierBadgeText, { color: palier.color || T.gold }]}>
                  {palier.label.toUpperCase()}
                </Text>
              </View>
            )}
            {isOwn && (
              <View style={styles.ownBadge}>
                <Crown size={8} color={T.gold} />
                <Text style={styles.ownBadgeText}>MON DUEL</Text>
              </View>
            )}
          </View>
          <View style={styles.duelCardTimer}>
            <Clock size={10} color={T.muted} />
            <Text style={styles.duelCardTimerText}>{timeLeft(duel.expires_at)}</Text>
          </View>
        </View>

        {/* Nom */}
        <Text style={styles.duelCardNom}>{duel.defi_nom}</Text>

        {/* Condition duel */}
        <View style={styles.condRow}>
          <Swords size={11} color={color} />
          <Text style={[styles.condLabel, { color }]}>{cond.label}</Text>
        </View>
        <Text style={styles.condDesc} numberOfLines={2}>{cond.desc}</Text>

        {/* Créateur vs ? */}
        <View style={styles.vsRow}>
          <View style={styles.vsPlayer}>
            <View style={[styles.vsAvatar, { backgroundColor: color + '20', borderColor: color + '50' }]}>
              <Text style={[styles.vsInitial, { color }]}>
                {(duel.creator_name || duel.creator_username || '?')[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.vsName} numberOfLines={1}>
              {duel.creator_name || duel.creator_username || 'Joueur'}
            </Text>
          </View>

          <View style={styles.vsCenter}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={[styles.vsPot, { color: T.gold }]}>{fmt(duel.mise * 2)} F</Text>
          </View>

          <View style={styles.vsPlayer}>
            <View style={[styles.vsAvatar, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' }]}>
              <Text style={styles.vsQuestion}>?</Text>
            </View>
            <Text style={styles.vsName}>Toi ?</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.duelCardFooter}>
          <View style={styles.duelCardGain}>
            <Trophy size={11} color={T.success} />
            <Text style={styles.duelCardGainText}>+{fmt(gain)} F</Text>
          </View>

          {!isOwn ? (
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: color, shadowColor: color }]}
              onPress={handlePress}
              activeOpacity={0.85}
            >
              <Users size={13} color="#000" />
              <Text style={styles.joinBtnText}>REJOINDRE · {fmt(duel.mise)} F</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingPill}>
              <ActivityIndicator size="small" color={'#A855F7'} style={{ marginRight: 6 }} />
              <Text style={styles.waitingText}>En attente...</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

/* ── Carte mon duel actif ── */
function ActiveDuelCard({ duel, index, onResume, currentUserId }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const isCreator   = duel.creator_id === currentUserId;
  const myFinished  = isCreator ? duel.creator_finished : duel.opponent_finished;
  const game        = GAMES[duel.game_key] || {};
  const color       = game.color || '#A855F7';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 10 }}>
      <TouchableOpacity style={[styles.activeDuelCard, { borderColor: color + '50' }]} onPress={() => onResume(duel)} activeOpacity={0.85}>
        <View style={[styles.activeDuelBar, { backgroundColor: color }]} />
        <View style={styles.activeDuelContent}>
          <View style={styles.activeDuelHeader}>
            <Text style={[styles.activeDuelGame, { color }]}>{game.short || duel.game_key?.toUpperCase()}</Text>
            <View style={styles.livePillSm}>
              <View style={styles.liveDotSm} />
              <Text style={styles.liveTextSm}>EN COURS</Text>
            </View>
          </View>
          <Text style={styles.activeDuelNom}>{duel.defi_nom}</Text>
          <Text style={styles.activeDuelVs}>
            {duel.creator_username} <Text style={{ color: T.muted }}>vs</Text> {duel.opponent_username}
          </Text>
          <View style={styles.activeDuelFooter}>
            <Text style={[styles.activeDuelPot, { color: T.gold }]}>Pot : {fmt((duel.mise || 0) * 2)} F</Text>
            {myFinished ? (
              <View style={styles.finishedBadge}>
                <Text style={styles.finishedBadgeText}>✓ En attente admin</Text>
              </View>
            ) : (
              <View style={[styles.resumeBtn, { backgroundColor: color }]}>
                <Text style={styles.resumeBtnText}>CONTINUER →</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   ÉCRAN PRINCIPAL
══════════════════════════════════════ */
export default function DuelScreen() {
  const insets = useSafeAreaInsets();

  const [tab,         setTab]         = useState('open');
  const [openDuels,   setOpenDuels]   = useState([]);
  const [myDuels,     setMyDuels]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    loadUser();
  }, []);

  useFocusEffect(useCallback(() => { loadDuels(); }, []));

  const loadUser = async () => {
    const s = await AsyncStorage.getItem('skillz_user');
    if (s) setCurrentUser(JSON.parse(s));
  };

  const loadDuels = async () => {
    setLoading(true);
    try {
      const s    = await AsyncStorage.getItem('skillz_user');
      const user = s ? JSON.parse(s) : null;
      if (!user) return;

      const { data: open } = await supabase
        .from('duels')
        .select('*, profiles!duels_creator_id_fkey(username)')
        .eq('status', 'waiting')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      const { data: mine } = await supabase
        .from('duels')
        .select('*')
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .in('status', ['waiting', 'active', 'pending_result'])
        .order('created_at', { ascending: false });

      // Enrichir open avec creator_name
      const enriched = (open || []).map(d => ({
        ...d,
        creator_name: d.profiles?.username || d.creator_username,
      }));

      setOpenDuels(enriched);
      setMyDuels(mine || []);
      setCurrentUser(user);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadDuels();
    setRefreshing(false);
  };

  const handleJoin = (duel) => {
    Alert.alert(
      `⚔️ Rejoindre ce duel ?`,
      `${duel.defi_nom}\nMise : ${fmt(duel.mise)} FCFA\n\nLe montant sera débité immédiatement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: `Rejoindre · ${fmt(duel.mise)} F`,
          onPress: () => navigate('DuelRoom', { duel, user: currentUser }),
        },
      ]
    );
  };

  const handleResume = (duel) => navigate('DuelRoom', { duel, user: currentUser });

  const filteredOpen  = openDuels.filter(d => d.creator_id !== currentUser?.id);
  const myActive      = myDuels.filter(d => d.status === 'active' || d.status === 'pending_result');
  const myWaiting     = myDuels.filter(d => d.status === 'waiting');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#A855F7'} colors={['#A855F7']} />
        }
      >
        {/* ── HEADER COMPÉTITIF ── */}
        <CompetitiveHeader openCount={filteredOpen.length} myCount={myDuels.length} />

        {/* ── BOUTON CRÉER ── */}
        <Animated.View style={[styles.createRow, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.createDuelBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              navigate('DuelPick'); // ✅ FIX
            }}
            activeOpacity={0.85}
          >
            <View style={styles.createDuelBtnGlow} />
            <Plus  size={18} color="#000" />
            <Text  style={styles.createDuelBtnText}>LANCER UN DUEL</Text>
            <Swords size={16} color="#000" />
          </TouchableOpacity>
        </Animated.View>

        {/* ── TABS ── */}
        <View style={styles.tabs}>
          {[
            { key: 'open', label: `Disponibles`, count: filteredOpen.length },
            { key: 'mine', label: `Mes Duels`,   count: myDuels.length      },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
              {t.count > 0 && (
                <View style={[styles.tabBadge, tab === t.key && { backgroundColor: '#A855F7' + '30' }]}>
                  <Text style={styles.tabBadgeText}>{t.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTENU ── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={'#A855F7'} size="large" />
            <Text style={styles.loadingText}>Chargement de l'arène...</Text>
          </View>
        ) : tab === 'open' ? (
          filteredOpen.length === 0 ? (
            <View style={styles.emptyState}>
              <Swords size={40} color={T.muted} />
              <Text style={styles.emptyTitle}>Aucun duel disponible</Text>
              <Text style={styles.emptySub}>Sois le premier à lancer un défi dans l'arène !</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigate('DuelPick')} // ✅ FIX
              >
                <Plus size={14} color={'#A855F7'} />
                <Text style={styles.emptyBtnText}>Lancer un duel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.listHeader}>{filteredOpen.length} DUEL{filteredOpen.length > 1 ? 'S' : ''} DISPONIBLE{filteredOpen.length > 1 ? 'S' : ''}</Text>
              {filteredOpen.map((d, i) => (
                <DuelCard
                  key={`open_${d.id}`}
                  duel={d}
                  index={i}
                  onJoin={handleJoin}
                  onResume={handleResume}
                  currentUserId={currentUser?.id}
                />
              ))}
            </>
          )
        ) : (
          myDuels.length === 0 ? (
            <View style={styles.emptyState}>
              <Swords size={40} color={T.muted} />
              <Text style={styles.emptyTitle}>Pas encore de duels</Text>
              <Text style={styles.emptySub}>Lance ou rejoins un duel pour commencer</Text>
            </View>
          ) : (
            <>
              {myActive.length > 0 && (
                <>
                  <Text style={styles.listHeader}>EN COURS ({myActive.length})</Text>
                  {myActive.map((d, i) => (
                    <ActiveDuelCard
                      key={`active_${d.id}`}
                      duel={d}
                      index={i}
                      onResume={handleResume}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </>
              )}
              {myWaiting.length > 0 && (
                <>
                  <Text style={[styles.listHeader, { marginTop: 16 }]}>EN ATTENTE ({myWaiting.length})</Text>
                  {myWaiting.map((d, i) => (
                    <DuelCard
                      key={`wait_${d.id}`}
                      duel={d}
                      index={i}
                      onJoin={() => {}}
                      onResume={handleResume}
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
  screen:        { flex: 1, backgroundColor: '#05070C' },
  scrollContent: { paddingBottom: 40 },

  /* Header compétitif */
  competHeader:    { marginBottom: 0, paddingBottom: 20, position: 'relative', overflow: 'hidden' },
  competHeaderBg:  { ...StyleSheet.absoluteFillObject, backgroundColor: '#080C14' },
  competHeaderGrid:{ ...StyleSheet.absoluteFillObject, opacity: 0.04 },
  competOrb1:      { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: '#A855F7' },
  competOrb2:      { position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: '#A855F7', opacity: 0.12 },
  competTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 12, marginBottom: 16 },
  competIconWrap:  { width: 44, height: 44, borderRadius: 13, backgroundColor: '#A855F7' + '20', borderWidth: 1, borderColor: '#A855F7' + '50', justifyContent: 'center', alignItems: 'center' },
  competEyebrow:   { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 3 },
  competTitle:     { fontFamily: 'Rajdhani-Bold', fontSize: 32, color: '#EEEEF5', letterSpacing: 4 },
  livePill:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.danger + '20', borderWidth: 1, borderColor: T.danger + '50', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 'auto' },
  liveDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: T.danger },
  liveText:        { fontFamily: 'Inter-Regular', fontSize: 10, color: T.danger, fontWeight: '800', letterSpacing: 1 },
  competStats:     { flexDirection: 'row', marginHorizontal: 18, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  competStatBox:   { flex: 1, paddingVertical: 12, alignItems: 'center', gap: 4 },
  competStatSep:   { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },
  competStatValue: { fontFamily: 'Rajdhani-Bold', fontSize: 24 },
  competStatLabel: { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '600' },

  /* Bouton créer */
  createRow:      { paddingHorizontal: 18, marginTop: 16, marginBottom: 16 },
  createDuelBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#A855F7', borderRadius: 16,
    paddingVertical: 16, position: 'relative', overflow: 'hidden',
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  createDuelBtnGlow: { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.12)' },
  createDuelBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#000', letterSpacing: 2 },

  /* Tabs */
  tabs:        { flexDirection: 'row', marginHorizontal: 18, backgroundColor: '#0C0F16', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tab:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11, gap: 6 },
  tabActive:   { backgroundColor: '#A855F7' + '18', borderWidth: 1, borderColor: '#A855F7' + '40' },
  tabText:     { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, fontWeight: '700' },
  tabTextActive:{ color: '#A855F7' },
  tabBadge:    { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  tabBadgeText:{ fontFamily: 'Inter-Regular', fontSize: 10, color: '#000', fontWeight: '800' },

  /* List header */
  listHeader: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 12, paddingHorizontal: 18 },

  /* Duel card */
  duelCard:        { backgroundColor: '#0C0F16', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginHorizontal: 18 },
  duelCardTopBar:  { height: 2 },
  duelCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8 },
  duelCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  duelCardGame:    { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  palierBadge:     { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  palierBadgeText: { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  ownBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: T.gold + '18', borderWidth: 1, borderColor: T.gold + '35', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  ownBadgeText:    { fontFamily: 'Inter-Regular', fontSize: 8, color: T.gold, fontWeight: '800', letterSpacing: 0.5 },
  duelCardTimer:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duelCardTimerText:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },
  duelCardNom:     { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#EEEEF5', paddingHorizontal: 14, marginBottom: 8 },
  condRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, marginBottom: 4 },
  condLabel:       { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  condDesc:        { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, lineHeight: 16, paddingHorizontal: 14, marginBottom: 12 },

  vsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 12 },
  vsPlayer:  { alignItems: 'center', gap: 5, flex: 1 },
  vsAvatar:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  vsInitial: { fontFamily: 'Rajdhani-Bold', fontSize: 20 },
  vsQuestion:{ fontFamily: 'Rajdhani-Bold', fontSize: 20, color: T.muted },
  vsName:    { fontFamily: 'Inter-Regular', fontSize: 11, color: '#EEEEF5', fontWeight: '600', textAlign: 'center' },
  vsCenter:  { alignItems: 'center', gap: 2, paddingHorizontal: 10 },
  vsText:    { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: T.muted, letterSpacing: 3 },
  vsPot:     { fontFamily: 'JetBrainsMono-Regular', fontSize: 11, fontWeight: '700' },

  duelCardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 },
  duelCardGain:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  duelCardGainText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.success, fontWeight: '700' },
  joinBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  joinBtnText:      { fontFamily: 'Rajdhani-Bold', fontSize: 13, color: '#000', letterSpacing: 1 },
  waitingPill:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#A855F7' + '10', borderWidth: 1, borderColor: '#A855F7' + '25', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  waitingText:      { fontFamily: 'Inter-Regular', fontSize: 12, color: '#A855F7' },

  /* Active duel */
  activeDuelCard:    { backgroundColor: '#0C0F16', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginHorizontal: 18, flexDirection: 'row' },
  activeDuelBar:     { width: 3 },
  activeDuelContent: { flex: 1, padding: 14 },
  activeDuelHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  activeDuelGame:    { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  livePillSm:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.danger + '15', borderWidth: 1, borderColor: T.danger + '35', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  liveDotSm:         { width: 5, height: 5, borderRadius: 3, backgroundColor: T.danger },
  liveTextSm:        { fontFamily: 'Inter-Regular', fontSize: 9, color: T.danger, fontWeight: '800', letterSpacing: 1 },
  activeDuelNom:     { fontFamily: 'Rajdhani-Bold', fontSize: 17, color: '#EEEEF5', marginBottom: 4 },
  activeDuelVs:      { fontFamily: 'Inter-Regular', fontSize: 11, color: '#EEEEF5', marginBottom: 10 },
  activeDuelFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeDuelPot:     { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
  resumeBtn:         { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  resumeBtnText:     { fontFamily: 'Rajdhani-Bold', fontSize: 12, color: '#000', letterSpacing: 1 },
  finishedBadge:     { backgroundColor: T.success + '12', borderWidth: 1, borderColor: T.success + '30', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  finishedBadgeText: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.success, fontWeight: '700' },

  /* États vides */
  loadingWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  emptyState:  { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 30 },
  emptyTitle:  { fontFamily: 'Rajdhani-Bold', fontSize: 22, color: '#EEEEF5' },
  emptySub:    { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, textAlign: 'center' },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#A855F7' + '15', borderWidth: 1, borderColor: '#A855F7' + '40', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  emptyBtnText:{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#A855F7', fontWeight: '700' },
});