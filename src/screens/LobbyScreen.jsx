// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  User, Gamepad2, Trophy, TrendingUp,
  Skull, Clock, ChevronRight, Flame,
  Play, Trash2, Zap, Swords,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { DEFIS } from '../constants/defis';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { navigate } from '../utils/navigationRef';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameSelectScreen from './GameSelectScreen';

const { width: W } = Dimensions.get('window');

/* ─── Défis les plus joués ─── */
function getTopDefis(history = [], limit = 4) {
  const counts = {};
  history.forEach(h => {
    if (!h.gameKey || !h.defiId) return;
    const key = `${h.gameKey}_${h.defiId}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => {
      const [gameKey, defiId] = key.split('_');
      const defi = (DEFIS[gameKey] || []).find(d => d.id === defiId);
      return defi ? { ...defi, gameKey, game: GAMES[gameKey], count } : null;
    })
    .filter(Boolean);
}

const DEFAULT_QUICK = [
  { ...(DEFIS.fifa?.[0]     || {}), gameKey: 'fifa',     game: GAMES.fifa     },
  { ...(DEFIS.physique?.[0] || {}), gameKey: 'physique', game: GAMES.physique  },
  { ...(DEFIS.pes?.[0]      || {}), gameKey: 'pes',      game: GAMES.pes      },
  { ...(DEFIS.nba?.[0]      || {}), gameKey: 'nba',      game: GAMES.nba      },
].filter(d => d?.id);

/* ══ QUEUE CARD ══ */
function QueueCard({ item, index, onPlay, onRemove }) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 11, delay: index * 80, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start(() => onPlay(item));
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 60, duration: 250, useNativeDriver: true }),
    ]).start(() => onRemove(item.queueId));
  };

  const game   = GAMES[item.gameKey] || {};
  const palier = PALIERS[item.p]     || {};
  const color  = game.color          || T.gold;
  const gain   = Math.round((item.mise || 1000) * (item.cote || 1) * 0.9);

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
      marginBottom: 12,
    }}>
      <View style={[styles.queueCard, { borderLeftColor: color }]}>
        <View style={styles.queueHeader}>
          <View style={styles.queueHeaderLeft}>
            <View style={[styles.queueGameDot, { backgroundColor: color }]} />
            <Text style={[styles.queueGame, { color }]}>
              {game.short || item.gameKey?.toUpperCase()}
            </Text>
            {palier.label && (
              <View style={[styles.queuePalier, {
                backgroundColor: palier.dim || '#111',
                borderColor: (palier.color || T.gold) + '40',
              }]}>
                <Text style={[styles.queuePalierText, { color: palier.color || T.gold }]}>
                  {palier.label.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.queueCote, { color: T.gaming }]}>
            ×{(item.cote || 1).toFixed(2)}
          </Text>
        </View>

        <Text style={styles.queueNom}>{item.nom}</Text>

        <View style={styles.queueCondRow}>
          <View style={[styles.queueCondDot, { backgroundColor: color }]} />
          <Text style={styles.queueCond} numberOfLines={2}>{item.cond}</Text>
        </View>

        <View style={styles.queueMiseRow}>
          <Text style={styles.queueMiseLabel}>Mise :</Text>
          <Text style={styles.queueMiseValue}>{fmt(item.mise || 1000)} F</Text>
          <Text style={styles.queueGainLabel}>→ Gain :</Text>
          <Text style={styles.queueGainValue}>+{fmt(gain)} F</Text>
        </View>

        <View style={styles.queueBtns}>
          <TouchableOpacity
            style={[styles.queuePlayBtn, { backgroundColor: color, shadowColor: color }]}
            onPress={handlePlay}
            activeOpacity={0.85}
          >
            <Play size={15} color="#000" fill="#000" />
            <Text style={styles.queuePlayText}>JOUER MAINTENANT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.queueRemoveBtn} onPress={handleRemove} activeOpacity={0.8}>
            <Trash2 size={15} color={T.danger} />
            <Text style={styles.queueRemoveText}>SUPPRIMER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

/* ══ QUICK CARD ══ */
function QuickCard({ defi, index, onPress }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.93, tension: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start(() => onPress(defi));
  };

  const color  = defi.game?.color || T.gold;
  const palier = PALIERS[defi.p]  || {};

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.quickCard, { borderColor: color + '30' }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.quickAccent, { backgroundColor: color }]} />
        {defi.count > 1 && (
          <View style={[styles.quickCountBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Flame size={8} color={color} />
            <Text style={[styles.quickCountText, { color }]}>×{defi.count}</Text>
          </View>
        )}
        <Text style={styles.quickNom} numberOfLines={2}>{defi.nom}</Text>
        <Text style={[styles.quickGame, { color }]}>{defi.game?.short || defi.gameKey}</Text>
        <View style={styles.quickFooter}>
          <View style={[styles.quickPalierDot, { backgroundColor: palier.color || T.gold }]} />
          <Text style={[styles.quickCote, { color: T.gaming }]}>×{(defi.cote || 1).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ══ LOBBY SCREEN ══ */
export default function LobbyScreen({ walletBalance = 0, history = [], onLogout }) {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation();

  const [queue,      setQueue]      = useState([]);
  const [quickDefis, setQuickDefis] = useState(DEFAULT_QUICK);
  const [username,   setUsername]   = useState('Joueur');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
    loadData();
  }, []);

  useEffect(() => {
    const top = getTopDefis(history);
    setQuickDefis(top.length >= 2 ? top : DEFAULT_QUICK);
  }, [history]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) setUsername(JSON.parse(stored).username || 'Joueur');
      const qStored = await AsyncStorage.getItem('skillz_queue');
      if (qStored) setQueue(JSON.parse(qStored));
    } catch (_) {}
  };

  const removeFromQueue = async (queueId) => {
    const newQueue = queue.filter(q => q.queueId !== queueId);
    setQueue(newQueue);
    await AsyncStorage.setItem('skillz_queue', JSON.stringify(newQueue));
  };

  const playFromQueue = (item) => {
    navigate('Config', { gameKey: item.gameKey, defi: item });
  };

  const wins    = history.filter(h => h.outcome === 'win').length;
  const losses  = history.filter(h => h.outcome !== 'win').length;
  const winRate = history.length ? Math.round(wins / history.length * 100) : 0;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.greetingDate}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={styles.greetingText}>
              {greeting}, <Text style={styles.greetingName}>{username}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('ProfileTab');
            }}
          >
            <User size={20} color={T.gold} />
          </TouchableOpacity>
        </Animated.View>

        {/* STATS */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {[
            { icon: Gamepad2,   color: T.gaming,  value: history.length, label: 'Duels'     },
            { icon: Trophy,     color: T.success,  value: wins,           label: 'Victoires' },
            { icon: TrendingUp, color: T.gold,     value: `${winRate}%`,  label: 'Taux'      },
            { icon: Skull,      color: T.danger,   value: losses,         label: 'Défaites'  },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={`stat_${i}`}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statBox}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
                    <Icon size={16} color={s.color} />
                  </View>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </Animated.View>

        {/* BANNER DUELS */}
        <Animated.View style={[styles.duelBanner, { opacity: fadeAnim }]}>
          <View style={styles.duelBannerLeft}>
            <Swords size={18} color="#A855F7" />
            <View>
              <Text style={styles.duelBannerTitle}>Duels 1v1</Text>
              <Text style={styles.duelBannerSub}>Affronte un joueur en direct</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.duelBannerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('DuelTab');
            }}
          >
            <Text style={styles.duelBannerBtnText}>VOIR</Text>
            <ChevronRight size={13} color="#A855F7" />
          </TouchableOpacity>
        </Animated.View>

        {/* ACCÈS RAPIDE */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>ACCÈS RAPIDE</Text>
              <Text style={styles.sectionSub}>
                {history.length > 0 ? 'Tes défis les plus joués' : 'Défis populaires'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigate('GameSelect');
              }}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ChevronRight size={12} color={T.gold} />
            </TouchableOpacity>
          </View>
          <View style={styles.quickGrid}>
            {quickDefis.slice(0, 4).map((defi, i) => (
              <QuickCard
                key={`quick_${defi.id}_${i}`}
                defi={defi}
                index={i}
                onPress={(d) => navigate('Config', { gameKey: d.gameKey, defi: d })}
              />
            ))}
          </View>
        </Animated.View>

        {/* FILE D'ATTENTE */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>FILE D'ATTENTE</Text>
              <Text style={styles.sectionSub}>
                {queue.length === 0
                  ? 'Aucun défi en attente'
                  : `${queue.length} défi${queue.length > 1 ? 's' : ''} prêt${queue.length > 1 ? 's' : ''}`}
              </Text>
            </View>
            {queue.length > 0 && (
              <View style={styles.queueBadge}>
                <Zap size={10} color={T.gold} />
                <Text style={styles.queueBadgeText}>{queue.length}</Text>
              </View>
            )}
          </View>

          {queue.length === 0 ? (
            <View style={styles.queueEmpty}>
              <View style={styles.queueEmptyIcon}>
                <Clock size={28} color={T.muted} />
              </View>
              <Text style={styles.queueEmptyTitle}>File vide</Text>
              <Text style={styles.queueEmptyText}>
                Configure un défi et appuie sur "Ajouter à la file"
              </Text>
            </View>
          ) : (
            queue.map((item, i) => (
              <QueueCard
                key={item.queueId}
                item={item}
                index={i}
                onPlay={playFromQueue}
                onRemove={removeFromQueue}
              />
            ))
          )}
        </Animated.View>

        {/* HISTORIQUE */}
        {history.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>DERNIERS RÉSULTATS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('HistoriqueTab')}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {history.slice(0, 4).map((h, i) => {
              const win  = h.outcome === 'win';
              const gain = Math.round(h.mise * (h.cote || 2));
              return (
                <View key={`hist_${i}`} style={styles.histRow}>
                  <View style={[styles.histDot, { backgroundColor: win ? T.success : T.danger }]} />
                  <Text style={styles.histName} numberOfLines={1}>{h.defi?.nom || 'Défi'}</Text>
                  <Text style={[styles.histAmount, { color: win ? T.success : T.danger }]}>
                    {win ? '+' : '-'}{fmt(win ? gain : h.mise)} F
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  orb1: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: T.gaming,   opacity: 0.07 },
  orb2: { position: 'absolute', top: 300, left: -80,  width: 180, height: 180, borderRadius: 90,  backgroundColor: T.physique, opacity: 0.06 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, marginBottom: 20 },
  greetingDate: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginBottom: 4 },
  greetingText: { fontFamily: 'Rajdhani-Bold', fontSize: 30, color: '#EEEEF5' },
  greetingName: { color: T.gold },
  avatarBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: T.gold + '12', borderWidth: 1.5, borderColor: T.gold + '35', justifyContent: 'center', alignItems: 'center' },

  statsRow:    { flexDirection: 'row', backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16, overflow: 'hidden' },
  statBox:     { flex: 1, paddingVertical: 16, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 12 },
  statIcon:    { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue:   { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#EEEEF5' },
  statLabel:   { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '600' },

  duelBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, borderColor: '#A855F7' + '30', padding: 14, marginBottom: 20 },
  duelBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  duelBannerTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5' },
  duelBannerSub:   { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginTop: 2 },
  duelBannerBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#A855F7' + '15', borderWidth: 1, borderColor: '#A855F7' + '40', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  duelBannerBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 13, color: '#A855F7', letterSpacing: 1 },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  sectionTitle:  { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2 },
  sectionSub:    { fontFamily: 'Inter-Regular', fontSize: 12, color: '#EEEEF5', marginTop: 3 },
  seeAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText:    { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gold, fontWeight: '600' },

  quickGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard:       { width: (W - 46) / 2, backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 14, position: 'relative' },
  quickAccent:     { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  quickCountBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  quickCountText:  { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800' },
  quickNom:        { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5', marginTop: 8, marginBottom: 4, lineHeight: 20 },
  quickGame:       { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  quickFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quickPalierDot:  { width: 6, height: 6, borderRadius: 3 },
  quickCote:       { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, fontWeight: '700' },

  queueBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.gold + '15', borderWidth: 1, borderColor: T.gold + '30', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  queueBadgeText: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.gold, fontWeight: '800' },
  queueEmpty:     { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 32, alignItems: 'center', gap: 10 },
  queueEmptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center' },
  queueEmptyTitle:{ fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5' },
  queueEmptyText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 18 },

  queueCard:       { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 3, padding: 16 },
  queueHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  queueHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  queueGameDot:    { width: 7, height: 7, borderRadius: 4 },
  queueGame:       { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  queuePalier:     { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  queuePalierText: { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  queueCote:       { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, fontWeight: '700' },
  queueNom:        { fontFamily: 'Rajdhani-Bold', fontSize: 19, color: '#EEEEF5', marginBottom: 6 },
  queueCondRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  queueCondDot:    { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  queueCond:       { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, flex: 1, lineHeight: 18 },
  queueMiseRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  queueMiseLabel:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },
  queueMiseValue:  { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: T.gold, fontWeight: '700' },
  queueGainLabel:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },
  queueGainValue:  { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: T.success, fontWeight: '700' },
  queueBtns:       { flexDirection: 'row', gap: 10 },
  queuePlayBtn:    { flex: 1, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  queuePlayText:   { fontFamily: 'Rajdhani-Bold', fontSize: 13, color: '#000', letterSpacing: 1.5 },
  queueRemoveBtn:  { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: T.danger + '10', borderWidth: 1, borderColor: T.danger + '35', flexDirection: 'row', alignItems: 'center', gap: 6 },
  queueRemoveText: { fontFamily: 'Rajdhani-Bold', fontSize: 12, color: T.danger, letterSpacing: 0.5 },

  histRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  histDot:    { width: 7, height: 7, borderRadius: 4 },
  histName:   { flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5' },
  histAmount: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
});