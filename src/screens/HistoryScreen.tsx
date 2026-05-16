// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Trophy, Skull, TrendingUp, TrendingDown,
  Gamepad2, Dumbbell, Clock, Filter,
  ChevronRight, Zap, BarChart2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helper';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const FILTERS = [
  { key: 'tout',      label: 'Tout'      },
  { key: 'win',       label: 'Victoires' },
  { key: 'loss',      label: 'Défaites'  },
  { key: 'gaming',    label: 'Gaming'    },
  { key: 'physique',  label: 'Physique'  },
];

/* ─── Données mock tant que Supabase n'est pas branché ─── */
const MOCK_HISTORY = [
  {
    id: 'h1', outcome: 'win',  gameKey: 'fifa',
    defi: { nom: 'Victoire Amateur', cond: 'Gagner en difficulté Amateur', p: 'debutant' },
    mise: 1000, cote: 1.10, createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'h2', outcome: 'loss', gameKey: 'pes',
    defi: { nom: 'Hat-trick', cond: '3 buts avec le même joueur (diff. 2★)', p: 'intermediaire' },
    mise: 2000, cote: 2.00, createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'h3', outcome: 'win', gameKey: 'physique',
    defi: { nom: '20 Pompes', cond: 'Faire 20 pompes en moins de 45 secondes', p: 'intermediaire' },
    mise: 500, cote: 1.50, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'h4', outcome: 'win', gameKey: 'nba',
    defi: { nom: 'Victoire Rookie', cond: 'Gagner un match en difficulté Rookie', p: 'debutant' },
    mise: 800, cote: 1.10, createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
  },
  {
    id: 'h5', outcome: 'loss', gameKey: 'physique',
    defi: { nom: 'Planche 1min', cond: 'Tenir la planche 1 minute sans bouger', p: 'intermediaire' },
    mise: 1500, cote: 1.70, createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
  {
    id: 'h6', outcome: 'win', gameKey: 'nfs',
    defi: { nom: '1ère place', cond: 'Finir 1er dans une course (diff. débutant)', p: 'debutant' },
    mise: 600, cote: 1.10, createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
  },
];

/* ─── Formatter la date ─── */
function formatDate(iso) {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = (now - d) / 1000;

  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ─── Carte historique animée ─── */
function HistCard({ item, index }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 11,
        delay: index * 60, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350,
        delay: index * 60, useNativeDriver: true,
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
  const game   = GAMES[item.gameKey] || {};
  const palier = PALIERS[item.defi?.p] || {};
  const gain   = Math.round(item.mise * item.cote * 0.9);
  const color  = game.color || T.gold;

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      marginBottom: 10,
    }}>
      <TouchableOpacity
        style={[styles.histCard, { borderLeftColor: win ? T.success : T.danger }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Résultat icône */}
        <View style={[
          styles.histResultIcon,
          { backgroundColor: (win ? T.success : T.danger) + '15' },
        ]}>
          {win
            ? <Trophy size={18} color={T.success} />
            : <Skull  size={18} color={T.danger}  />
          }
        </View>

        {/* Contenu principal */}
        <View style={styles.histContent}>
          {/* Ligne 1 : nom défi + montant */}
          <View style={styles.histRow1}>
            <Text style={styles.histNom} numberOfLines={1}>{item.defi?.nom}</Text>
            <Text style={[styles.histAmount, { color: win ? T.success : T.danger }]}>
              {win ? '+' : '-'}{fmt(win ? gain : item.mise)} F
            </Text>
          </View>

          {/* Ligne 2 : condition */}
          <Text style={styles.histCond} numberOfLines={1}>{item.defi?.cond}</Text>

          {/* Ligne 3 : badges */}
          <View style={styles.histMeta}>
            {/* Jeu */}
            <View style={[styles.histBadge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
              {item.gameKey === 'physique'
                ? <Dumbbell size={9} color={color} />
                : <Gamepad2 size={9} color={color} />
              }
              <Text style={[styles.histBadgeText, { color }]}>
                {game.short || item.gameKey}
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

            {/* Cote */}
            <View style={styles.histBadgeCote}>
              <Zap size={8} color={T.gaming} />
              <Text style={[styles.histBadgeText, { color: T.gaming }]}>
                ×{item.cote?.toFixed(2)}
              </Text>
            </View>

            {/* Mise */}
            <Text style={styles.histMise}>{fmt(item.mise)} F misés</Text>

            {/* Date */}
            <Text style={styles.histDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─── ÉCRAN PRINCIPAL ─── */
export default function HistoriqueScreen() {
  const insets = useSafeAreaInsets();

  const [filter,      setFilter]      = useState('tout');
  const [history,     setHistory]     = useState(MOCK_HISTORY);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(20)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);
    Animated.spring(filterAnim, { toValue, tension: 80, friction: 10, useNativeDriver: false }).start();
  };

  const handleFilter = (key) => {
    Haptics.selectionAsync();
    setFilter(key);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  };

  /* Filtrage */
  const filtered = history.filter(h => {
    if (filter === 'tout')     return true;
    if (filter === 'win')      return h.outcome === 'win';
    if (filter === 'loss')     return h.outcome === 'loss';
    if (filter === 'gaming')   return h.gameKey !== 'physique';
    if (filter === 'physique') return h.gameKey === 'physique';
    return true;
  });

  /* Stats globales */
  const wins        = history.filter(h => h.outcome === 'win').length;
  const losses      = history.filter(h => h.outcome === 'loss').length;
  const winRate     = history.length ? Math.round(wins / history.length * 100) : 0;
  const totalGains  = history
    .filter(h => h.outcome === 'win')
    .reduce((acc, h) => acc + Math.round(h.mise * h.cote * 0.9), 0);
  const totalPertes = history
    .filter(h => h.outcome === 'loss')
    .reduce((acc, h) => acc + h.mise, 0);

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 52],
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Orbes */}
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

        {/* ── STATS RÉSUMÉ ── */}
        <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
          <View style={styles.statsCardOrb} />

          <View style={styles.statsRow}>
            {/* Win rate circulaire simulé */}
            <View style={styles.winRateBox}>
              <Text style={styles.winRateValue}>{winRate}%</Text>
              <Text style={styles.winRateLabel}>Taux de{'\n'}réussite</Text>
            </View>

            <View style={styles.statsDivider} />

            {/* Stats détaillées */}
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

              {/* Net */}
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>NET</Text>
                <Text style={[
                  styles.netValue,
                  { color: totalGains - totalPertes >= 0 ? T.success : T.danger }
                ]}>
                  {totalGains - totalPertes >= 0 ? '+' : ''}{fmt(totalGains - totalPertes)} F
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── FILTRES animés ── */}
        <Animated.View style={[styles.filtersWrap, { height: filterHeight, overflow: 'hidden' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
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

        {/* ── LISTE ── */}
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
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>
              {filter !== 'tout'
                ? 'Aucun défi ne correspond à ce filtre'
                : 'Lance ton premier défi pour voir ton historique ici'}
            </Text>
          </View>
        ) : (
          filtered.map((item, i) => (
            <HistCard
              key={`hist_${item.id}_${i}`}
              item={item}
              index={i}
            />
          ))
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

  /* Header */
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, marginBottom: 20 },
  eyebrow:    { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  title:      { fontFamily: 'Rajdhani-Bold', fontSize: 36, color: '#EEEEF5', letterSpacing: 0.5 },
  filterBtn:  { width: 42, height: 42, borderRadius: 12, backgroundColor: '#0F1219', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  filterDot:  { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: T.gold },

  /* Stats card */
  statsCard: {
    backgroundColor: '#0D1520', borderRadius: 20,
    borderWidth: 1, borderColor: T.gaming + '20',
    padding: 18, marginBottom: 16,
    overflow: 'hidden', position: 'relative',
  },
  statsCardOrb: {
    position: 'absolute', top: -40, right: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: T.gaming, opacity: 0.08,
  },
  statsRow:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  winRateBox:  { alignItems: 'center', minWidth: 70 },
  winRateValue:{ fontFamily: 'Rajdhani-Bold', fontSize: 38, color: T.gaming, letterSpacing: 1 },
  winRateLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, textAlign: 'center', lineHeight: 14, marginTop: 4 },
  statsDivider:{ width: 1, height: 70, backgroundColor: 'rgba(255,255,255,0.06)' },
  statsDetails:{ flex: 1 },

  statsDetailRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statsDetailIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statsDetailLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },
  statsDetailValue:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
  statsDetailCount:{ fontFamily: 'Rajdhani-Bold', fontSize: 16 },

  netRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  netLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2 },
  netValue:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 15, fontWeight: '700' },

  /* Filtres */
  filtersWrap:    { marginBottom: 8 },
  filtersScroll:  { gap: 8, paddingVertical: 6 },
  filterChip:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  filterChipActive:    { backgroundColor: T.gold,  borderColor: T.gold },
  filterChipText:      { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, fontWeight: '700' },
  filterChipTextActive:{ color: '#000' },

  /* List header */
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '700', letterSpacing: 1 },
  listReset:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.gaming },

  /* Hist card */
  histCard: {
    backgroundColor: '#0F1219', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
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

  /* Empty */
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon:  { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#EEEEF5' },
  emptyText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30 },
});