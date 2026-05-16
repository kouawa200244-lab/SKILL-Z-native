// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, StatusBar,
} from 'react-native';
import {
  User, Gamepad2, Dumbbell, Zap, Trophy,
  TrendingUp, ChevronRight, Flame, Target,
  Swords, Clock, BarChart2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helper';
import { useNavigation } from '@react-navigation/native';

const { width: W } = Dimensions.get('window');

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const ACTIVITY = [3, 7, 2, 8, 4, 9, 5]; // données simulées

const QUICK_ACTIONS = [
  { key: 'gaming',   label: 'Gaming',   icon: Gamepad2,  color: T.gaming,   route: 'GameSelect',  params: {} },
  { key: 'physique', label: 'Physique', icon: Dumbbell,  color: T.physique, route: 'DefiSelect',  params: { gameKey: 'physique' } },
  { key: 'duel',     label: 'Duel 1v1', icon: Swords,    color: '#A855F7',  route: 'GameSelect',  params: {} },
  { key: 'chrono',   label: 'Chrono',   icon: Clock,     color: T.gold,     route: 'GameSelect',  params: {} },
];

export default function LobbyScreen({ walletBalance = 0, history = [], activeBets = [] }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleCard = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleCard, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const wins = history.filter(h => h.outcome === 'win').length;
  const winRate = history.length ? Math.round(wins / history.length * 100) : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dayStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const maxActivity = Math.max(...ACTIVITY);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.dateText}>{dayStr}</Text>
            <Text style={styles.greetingText}>{greeting}, <Text style={styles.greetingName}>Brael</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <User size={20} color={T.gold} />
            {activeBets.length > 0 && (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>{activeBets.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ── CARTE SOLDE ── */}
        <Animated.View style={{ transform: [{ scale: scaleCard }], opacity: fadeAnim }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.balanceCard}
            onPress={() => navigation.navigate('WalletTab')}
          >
            {/* Fond dégradé simulé avec overlays */}
            <View style={styles.balanceBg1} />
            <View style={styles.balanceBg2} />

            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>MON SOLDE TOTAL</Text>
              <View style={styles.balanceTrend}>
                <TrendingUp size={11} color="#00E676" />
                <Text style={styles.balanceTrendText}>+12.4%</Text>
              </View>
            </View>

            <Text style={styles.balanceAmount}>
              {fmt(walletBalance)} <Text style={styles.balanceCurrency}>FCFA</Text>
            </Text>

            <View style={styles.balanceFooter}>
              <Text style={styles.balanceFooterText}>Appuyer pour gérer →</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── STATS RAPIDES ── */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.statBox} activeOpacity={0.8}>
            <View style={[styles.statIcon, { backgroundColor: T.gaming + '20' }]}>
              <Gamepad2 size={18} color={T.gaming} />
            </View>
            <Text style={styles.statValue}>{activeBets.length}</Text>
            <Text style={styles.statLabel}>Duels Actifs</Text>
            <Text style={styles.statSub}>
              {activeBets.length === 0 ? 'Aucun en cours' : `${activeBets.length} en cours`}
            </Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity style={styles.statBox} activeOpacity={0.8}>
            <View style={[styles.statIcon, { backgroundColor: T.physique + '20' }]}>
              <Trophy size={18} color={T.physique} />
            </View>
            <Text style={styles.statValue}>Top 142</Text>
            <Text style={styles.statLabel}>Classement</Text>
            <Text style={styles.statSub}>{winRate}% victoires</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── CTA PRINCIPAL ── */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={styles.ctaMain}
            onPress={() => navigation.navigate('GameSelect')}
            activeOpacity={0.85}
          >
            <View style={styles.ctaGlow} />
            <View style={styles.ctaInner}>
              <View style={styles.ctaLeft}>
                <Text style={styles.ctaLabel}>PRÊT À JOUER ?</Text>
                <Text style={styles.ctaSub}>Lance un défi maintenant</Text>
              </View>
              <View style={styles.ctaZap}>
                <Zap size={24} color="#000" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── ACTIONS RAPIDES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCÈS RAPIDE</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={action.key}
                  style={styles.quickCard}
                  onPress={() => navigation.navigate(action.route, action.params)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickIcon, { backgroundColor: action.color + '18', borderColor: action.color + '30' }]}>
                    <Icon size={20} color={action.color} />
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── ACTIVITÉ 7 JOURS ── */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View>
              <Text style={styles.sectionTitle}>ACTIVITÉ DÉFIS</Text>
              <Text style={styles.activitySub}>7 derniers jours</Text>
            </View>
            <TouchableOpacity
              style={styles.activityBtn}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <BarChart2 size={13} color={T.gold} />
              <Text style={styles.activityBtnText}>Profil complet</Text>
              <ChevronRight size={11} color={T.gold} />
            </TouchableOpacity>
          </View>

          <View style={styles.barsRow}>
            {ACTIVITY.map((val, i) => {
              const h = Math.max(6, (val / maxActivity) * 72);
              const isToday = i === new Date().getDay() - 1;
              const isWin = val > 5;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      {
                        height: h,
                        backgroundColor: isToday ? T.gold : isWin ? T.gaming : T.physique,
                        opacity: isToday ? 1 : 0.75,
                      }
                    ]} />
                  </View>
                  <Text style={[styles.barDay, isToday && { color: T.gold, fontWeight: '700' }]}>
                    {DAYS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── HISTORIQUE ── */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DERNIERS RÉSULTATS</Text>
            {history.slice(0, 4).map((h, i) => {
              const win = h.outcome === 'win';
              const gain = Math.round(h.mise * (h.cote || 2));
              return (
                <View key={i} style={styles.histRow}>
                  <View style={[styles.histDot, { backgroundColor: win ? T.success : T.danger }]} />
                  <Text style={styles.histName} numberOfLines={1}>
                    {h.player || h.defi?.nom || 'Défi'}
                  </Text>
                  <Text style={[styles.histAmount, { color: win ? T.success : T.danger }]}>
                    {win ? '+' : '-'}{fmt(win ? gain : h.mise)} F
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 16, marginBottom: 24,
  },
  dateText: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, letterSpacing: 0.5, marginBottom: 4 },
  greetingText: { fontFamily: 'Rajdhani-Bold', fontSize: 32, color: '#EEEEF5', letterSpacing: 0.5 },
  greetingName: { color: T.gold },
  avatarBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: T.gold + '12', borderWidth: 1.5,
    borderColor: T.gold + '35', justifyContent: 'center', alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: T.danger, justifyContent: 'center', alignItems: 'center',
  },
  avatarBadgeText: { fontFamily: 'Inter-Regular', fontSize: 9, color: '#fff', fontWeight: '800' },

  /* Balance card */
  balanceCard: {
    borderRadius: 20, padding: 22, marginBottom: 16,
    overflow: 'hidden', position: 'relative',
    minHeight: 130,
    backgroundColor: '#0D1F2D',
    borderWidth: 1, borderColor: 'rgba(0,240,255,0.15)',
  },
  balanceBg1: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: T.gaming, opacity: 0.18,
  },
  balanceBg2: {
    position: 'absolute', bottom: -30, left: 60,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: T.physique, opacity: 0.15,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  balanceLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, fontWeight: '700' },
  balanceTrend: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#00E67618', borderWidth: 1, borderColor: '#00E67630',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  balanceTrendText: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#00E676', fontWeight: '700' },
  balanceAmount: { fontFamily: 'Rajdhani-Bold', fontSize: 42, color: '#FFFFFF', letterSpacing: 1 },
  balanceCurrency: { fontSize: 20, color: 'rgba(255,255,255,0.5)' },
  balanceFooter: { marginTop: 8 },
  balanceFooterText: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)' },

  /* Stats */
  statsRow: {
    flexDirection: 'row', backgroundColor: '#0F1219',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16,
    overflow: 'hidden',
  },
  statBox: { flex: 1, padding: 18, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },
  statIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontFamily: 'Rajdhani-Bold', fontSize: 22, color: '#EEEEF5', letterSpacing: 0.5 },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#EEEEF5', fontWeight: '600', marginTop: 2 },
  statSub: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, marginTop: 2 },

  /* CTA */
  ctaMain: {
    borderRadius: 16, marginBottom: 24,
    backgroundColor: T.gold, overflow: 'hidden',
    position: 'relative',
  },
  ctaGlow: {
    position: 'absolute', top: -20, right: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  ctaInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 20,
  },
  ctaLeft: {},
  ctaLabel: { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#000', letterSpacing: 2 },
  ctaSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(0,0,0,0.6)', marginTop: 2 },
  ctaZap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Quick actions */
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted,
    fontWeight: '800', letterSpacing: 2, marginBottom: 12,
  },
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: '#0F1219', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 16, alignItems: 'center', gap: 10,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  quickLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#EEEEF5', fontWeight: '600' },

  /* Activity */
  activityCard: {
    backgroundColor: '#0F1219', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 18, marginBottom: 20,
  },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  activitySub: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, marginTop: 4 },
  activityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.gold + '12', borderWidth: 1,
    borderColor: T.gold + '25', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  activityBtnText: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '700' },

  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: 10, height: 72, justifyContent: 'flex-end', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)' },
  barFill: { width: '100%', borderRadius: 5 },
  barDay: { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, letterSpacing: 0.3 },

  /* Historique */
  histRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  histDot: { width: 6, height: 6, borderRadius: 3 },
  histName: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5' },
  histAmount: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
});