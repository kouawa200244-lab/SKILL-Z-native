// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Trophy, Skull, TrendingUp, TrendingDown,
  Gamepad2, Dumbbell, Clock, Filter,
  Zap, BarChart2, Swords,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const FILTERS = [
  { key: 'tout',     label: 'Tout'      },
  { key: 'win',      label: 'Victoires' },
  { key: 'loss',     label: 'Défaites'  },
  { key: 'gaming',   label: 'Gaming'    },
  { key: 'physique', label: 'Physique'  },
  { key: 'duel',     label: 'Duels'     },
];

function formatDate(iso) {
  if (!iso) return '';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = (now - d) / 1000;
  if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ── Normalise une entrée depuis bets ou duels ── */
function normalizeEntry(raw, type) {
  if (type === 'bet') {
    return {
      id:        raw.id,
      source:    'bet',
      outcome:   raw.status === 'win' ? 'win' : raw.status === 'loss' ? 'loss' : 'pending',
      gameKey:   raw.game_key,
      defi: {
        nom:  raw.defi_nom,
        cond: raw.defi_cond,
        p:    raw.defi_palier,
      },
      mise:      raw.mise,
      cote:      parseFloat(raw.cote),
      gain:      raw.gain || 0,
      createdAt: raw.created_at,
    };
  }
  // duel
  return {
    id:        raw.id,
    source:    'duel',
    outcome:   raw.status === 'completed'
      ? (raw.winner_id ? 'win' : 'loss')
      : raw.status,
    gameKey:   raw.game_key,
    defi: {
      nom:  raw.defi_nom,
      cond: raw.defi_cond || raw.duel_condition,
      p:    raw.defi_palier,
    },
    mise:      raw.mise,
    cote:      parseFloat(raw.cote || 1),
    gain:      raw.gain_winner || 0,
    opponent:  raw.creator_username && raw.opponent_username
      ? (raw.opponent_username || raw.creator_username)
      : null,
    createdAt: raw.created_at,
  };
}

/* ══════════════════════════════════════
   HIST CARD
══════════════════════════════════════ */
function HistCard({ item, index, userId }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 11,
        delay: Math.min(index * 60, 400), useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350,
        delay: Math.min(index * 60, 400), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, tension: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();
  };

  const win    = item.outcome === 'win';
  const isPending = item.outcome === 'pending' || item.outcome === 'active' || item.outcome === 'pending_result';
  const game   = GAMES[item.gameKey] || {};
  const palier = PALIERS[item.defi?.p] || {};
  const color  = game.color || T.gold;
  const gain   = item.gain || Math.round(item.mise * item.cote * 0.9);

  const borderColor = isPending ? T.gold : win ? T.success : T.danger;
  const resultBg    = isPending ? T.gold + '15' : (win ? T.success : T.danger) + '15';
  const resultColor = isPending ? T.gold : win ? T.success : T.danger;
  const amountColor = isPending ? T.gold : win ? T.success : T.danger;
  const amountText  = isPending
    ? `${fmt(item.mise)} F`
    : win
      ? `+${fmt(gain)} F`
      : `-${fmt(item.mise)} F`;

  return (
    <Animated.View style={{
      opacity:   fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      marginBottom: 10,
    }}>
      <TouchableOpacity
        style={[styles.histCard, { borderLeftColor: borderColor }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Icône résultat */}
        <View style={[styles.histResultIcon, { backgroundColor: resultBg }]}>
          {isPending
            ? <Clock   size={18} color={resultColor} />
            : win
              ? <Trophy size={18} color={T.success} />
              : <Skull  size={18} color={T.danger}  />
          }
        </View>

        <View style={styles.histContent}>
          {/* Ligne 1 */}
          <View style={styles.histRow1}>
            <Text style={styles.histNom} numberOfLines={1}>
              {item.defi?.nom || 'Défi'}
            </Text>
            <Text style={[styles.histAmount, { color: amountColor }]}>
              {amountText}
            </Text>
          </View>

          {/* Condition */}
          <Text style={styles.histCond} numberOfLines={1}>
            {item.defi?.cond || '—'}
          </Text>

          {/* Badges meta */}
          <View style={styles.histMeta}>
            {/* Jeu */}
            <View style={[styles.histBadge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
              {item.gameKey === 'physique'
                ? <Dumbbell size={9} color={color} />
                : item.source === 'duel'
                  ? <Swords   size={9} color={color} />
                  : <Gamepad2 size={9} color={color} />
              }
              <Text style={[styles.histBadgeText, { color }]}>
                {game.short || item.gameKey?.toUpperCase()}
              </Text>
            </View>

            {/* Palier */}
            {palier.label && (
              <View style={[styles.histBadge, { backgroundColor: palier.dim, borderColor: (palier.color || T.gold) + '30' }]}>
                <Text style={[styles.histBadgeText, { color: palier.color || T.gold }]}>
                  {palier.label.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Source : Duel ou Solo */}
            <View style={[styles.histBadge, {
              backgroundColor: item.source === 'duel' ? '#A855F7' + '15' : T.gaming + '15',
              borderColor:     item.source === 'duel' ? '#A855F7' + '30' : T.gaming + '30',
            }]}>
              <Text style={[styles.histBadgeText, {
                color: item.source === 'duel' ? '#A855F7' : T.gaming,
              }]}>
                {item.source === 'duel' ? '⚔️ DUEL' : '🎯 SOLO'}
              </Text>
            </View>

            {/* Cote */}
            <View style={styles.histBadgeCote}>
              <Zap size={8} color={T.gaming} />
              <Text style={[styles.histBadgeText, { color: T.gaming }]}>
                ×{item.cote?.toFixed(2)}
              </Text>
            </View>

            {/* Mise */}
            <Text style={styles.histMise}>{fmt(item.mise)} F</Text>

            {/* Adversaire si duel */}
            {item.opponent && (
              <Text style={[styles.histMise, { color: '#A855F7' }]}>
                vs {item.opponent}
              </Text>
            )}

            {/* Date */}
            <Text style={styles.histDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   ÉCRAN PRINCIPAL
══════════════════════════════════════ */
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  const [filter,     setFilter]     = useState('tout');
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters,setShowFilters]= useState(false);
  const [userId,     setUserId]     = useState(null);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(20)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(useCallback(() => {
    loadHistory();
  }, []));

  /* ── Charger historique depuis Supabase ── */
  const loadHistory = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);
      setUserId(user.id);

      // Charger bets (paris solo) ET duels en parallèle
      const [betsRes, duelsRes] = await Promise.all([
        supabase
          .from('bets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),

        supabase
          .from('duels')
          .select('*')
          .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
          .not('status', 'eq', 'waiting')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const bets  = (betsRes.data  || []).map(b => normalizeEntry(b, 'bet'));
      const duels = (duelsRes.data || []).map(d => {
        // Déterminer win/loss selon l'userId
        const normalized     = normalizeEntry(d, 'duel');
        normalized.outcome   = d.status === 'completed'
          ? (d.winner_id === user.id ? 'win' : 'loss')
          : d.status;
        normalized.opponent  = d.creator_id === user.id
          ? d.opponent_username
          : d.creator_username;
        return normalized;
      });

      // Fusionner + trier par date
      const all = [...bets, ...duels].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setHistory(all);
    } catch (e) {
      console.error('loadHistory:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await loadHistory();
    setRefreshing(false);
  };

  const toggleFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);
    Animated.spring(filterAnim, {
      toValue, tension: 80, friction: 10, useNativeDriver: false,
    }).start();
  };

  const handleFilter = (key) => {
    Haptics.selectionAsync();
    setFilter(key);
  };

  /* ── Filtrage ── */
  const filtered = history.filter(h => {
    if (filter === 'tout')     return true;
    if (filter === 'win')      return h.outcome === 'win';
    if (filter === 'loss')     return h.outcome === 'loss';
    if (filter === 'gaming')   return h.gameKey !== 'physique';
    if (filter === 'physique') return h.gameKey === 'physique';
    if (filter === 'duel')     return h.source === 'duel';
    return true;
  });

  /* ── Stats ── */
  const wins       = history.filter(h => h.outcome === 'win').length;
  const losses     = history.filter(h => h.outcome === 'loss').length;
  const winRate    = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : 0;
  const totalGains = history
    .filter(h => h.outcome === 'win')
    .reduce((acc, h) => acc + (h.gain || Math.round(h.mise * h.cote * 0.9)), 0);
  const totalPertes = history
    .filter(h => h.outcome === 'loss')
    .reduce((acc, h) => acc + h.mise, 0);
  const net = totalGains - totalPertes;

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 54],
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={T.gold}
            colors={[T.gold]}
          />
        }
      >
        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.eyebrow}>SKILL'Z</Text>
            <Text style={styles.title}>Historique</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={toggleFilters}>
            <Filter size={16} color={showFilters ? T.gold : T.muted} />
            {filter !== 'tout' && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </Animated.View>

        {/* ── STATS ── */}
        {!loading && history.length > 0 && (
          <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
            <View style={styles.statsCardOrb} />
            <View style={styles.statsRow}>

              {/* Win rate */}
              <View style={styles.winRateBox}>
                <Text style={styles.winRateValue}>{winRate}%</Text>
                <Text style={styles.winRateLabel}>Taux de{'\n'}réussite</Text>
              </View>

              <View style={styles.statsDivider} />

              {/* Détails */}
              <View style={styles.statsDetails}>
                <View style={styles.statsDetailRow}>
                  <View style={[styles.statsDetailIcon, { backgroundColor: T.success + '15' }]}>
                    <TrendingUp size={12} color={T.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statsDetailLabel}>Gains totaux</Text>
                    <Text style={[styles.statsDetailValue, { color: T.success }]}>
                      +{fmt(totalGains)} F
                    </Text>
                  </View>
                  <Text style={[styles.statsDetailCount, { color: T.success }]}>{wins}V</Text>
                </View>

                <View style={[styles.statsDetailRow, { marginTop: 10 }]}>
                  <View style={[styles.statsDetailIcon, { backgroundColor: T.danger + '15' }]}>
                    <TrendingDown size={12} color={T.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statsDetailLabel}>Pertes totales</Text>
                    <Text style={[styles.statsDetailValue, { color: T.danger }]}>
                      -{fmt(totalPertes)} F
                    </Text>
                  </View>
                  <Text style={[styles.statsDetailCount, { color: T.danger }]}>{losses}D</Text>
                </View>

                <View style={styles.netRow}>
                  <Text style={styles.netLabel}>NET</Text>
                  <Text style={[styles.netValue, { color: net >= 0 ? T.success : T.danger }]}>
                    {net >= 0 ? '+' : ''}{fmt(net)} F
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── FILTRES ── */}
        <Animated.View style={[styles.filtersWrap, { height: filterHeight, overflow: 'hidden' }]}>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={`filter_${f.key}`}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => handleFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── CONTENU ── */}
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={T.gold} size="large" />
            <Text style={styles.loadingText}>Chargement de l'historique...</Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </Text>
              {filter !== 'tout' && (
                <TouchableOpacity onPress={() => handleFilter('tout')}>
                  <Text style={styles.listReset}>Réinitialiser</Text>
                </TouchableOpacity>
              )}
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <BarChart2 size={32} color={T.muted} />
                </View>
                <Text style={styles.emptyTitle}>
                  {history.length === 0 ? 'Aucun défi joué' : 'Aucun résultat'}
                </Text>
                <Text style={styles.emptyText}>
                  {history.length === 0
                    ? 'Lance ton premier défi pour voir ton historique ici'
                    : 'Aucun défi ne correspond à ce filtre'}
                </Text>
              </View>
            ) : (
              filtered.map((item, i) => (
                <HistCard
                  key={`hist_${item.id}_${i}`}
                  item={item}
                  index={i}
                  userId={userId}
                />
              ))
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  orb1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: T.gaming,   opacity: 0.07 },
  orb2: { position: 'absolute', top: 280, left: -70,  width: 160, height: 160, borderRadius: 80,  backgroundColor: T.physique, opacity: 0.06 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, marginBottom: 20 },
  eyebrow:   { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  title:     { fontFamily: 'Rajdhani-Bold', fontSize: 36, color: '#EEEEF5', letterSpacing: 0.5 },
  filterBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#0F1219', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: T.gold },

  statsCard:    { backgroundColor: '#0D1520', borderRadius: 20, borderWidth: 1, borderColor: T.gaming + '20', padding: 18, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  statsCardOrb: { position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: T.gaming, opacity: 0.08 },
  statsRow:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  winRateBox:   { alignItems: 'center', minWidth: 70 },
  winRateValue: { fontFamily: 'Rajdhani-Bold', fontSize: 38, color: T.gaming, letterSpacing: 1 },
  winRateLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, textAlign: 'center', lineHeight: 14, marginTop: 4 },
  statsDivider: { width: 1, height: 70, backgroundColor: 'rgba(255,255,255,0.06)' },
  statsDetails: { flex: 1 },

  statsDetailRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statsDetailIcon:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statsDetailLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },
  statsDetailValue: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
  statsDetailCount: { fontFamily: 'Rajdhani-Bold', fontSize: 16 },

  netRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  netLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2 },
  netValue:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 15, fontWeight: '700' },

  filtersWrap:         { marginBottom: 8 },
  filtersScroll:       { gap: 8, paddingVertical: 6 },
  filterChip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  filterChipActive:    { backgroundColor: T.gold, borderColor: T.gold },
  filterChipText:      { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, fontWeight: '700' },
  filterChipTextActive:{ color: '#000' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '700', letterSpacing: 1 },
  listReset:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.gaming },

  loadingState: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loadingText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },

  histCard:       { backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderLeftWidth: 3, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  histResultIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  histContent:    { flex: 1 },
  histRow1:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  histNom:        { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5', flex: 1, marginRight: 8 },
  histAmount:     { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, fontWeight: '700' },
  histCond:       { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginBottom: 8, lineHeight: 15 },
  histMeta:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  histBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  histBadgeCote:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  histBadgeText:  { fontFamily: 'Inter-Regular', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  histMise:       { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted },
  histDate:       { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, marginLeft: 'auto' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon:  { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#EEEEF5' },
  emptyText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30 },
});