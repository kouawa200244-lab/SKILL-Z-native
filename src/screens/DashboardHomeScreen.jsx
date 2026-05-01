// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import {
  User,
  Zap,
  TrendingUp,
  TrendingDown,
  Gamepad2,
  Dumbbell,
  ChevronRight,
  BarChart3,
  Clock,
  CheckCircle,
  Target,
  Star,
  Users,
  ArrowRight,
  Coins,
  Timer,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import Pill from '../components/Pill';
import CoteDisplay from '../components/CoteDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const TODAY = new Date();
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const DATE_STRING = `${DAYS[TODAY.getDay()]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}`;

const MOCK_SOLDE = 154600;
const MOCK_GAINS_GAMING = 28400;
const MOCK_GAINS_PHYSIQUE = 14193;
const MOCK_TREND_PERCENT = 8.2;
const MOCK_ACTIVE_DUELS = 3;
const MOCK_RANK = 142;

const WEEKLY_ACTIVITY = [
  { day: 'Lun', value: 3, color: '#00F0FF' },
  { day: 'Mar', value: 5, color: '#00F0FF' },
  { day: 'Mer', value: 2, color: '#FF6B00' },
  { day: 'Jeu', value: 7, color: '#00F0FF' },
  { day: 'Ven', value: 4, color: '#FF6B00' },
  { day: 'Sam', value: 8, color: '#00F0FF' },
  { day: 'Dim', value: 6, color: '#FF6B00' },
];

function SimpleBarChart({ data }) {
  return (
    <View style={chartStyles.container}>
      {data.map((item, index) => (
        <View key={index} style={chartStyles.barWrapper}>
          <View style={[chartStyles.bar, { height: item.value * 8, backgroundColor: item.color, width: 16, borderRadius: 6 }]} />
          <Text style={chartStyles.label}>{item.day}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { marginBottom: 6 },
  label: { fontFamily: T.fontBody, fontSize: 11, color: T.muted, marginTop: 4 },
});

function CircleProgress({ percent = 0, color = T.success, size = 36 }) {
  const borderRadius = size / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: borderRadius, borderWidth: 3, borderColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size - 6, height: size - 6, borderRadius: borderRadius - 1.5, backgroundColor: percent > 0 ? color : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: T.fontBody, fontSize: 10, color: percent > 0 ? '#fff' : T.muted, fontWeight: '600' }}>
          {percent > 0 ? `${percent}%` : '--'}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { walletBalance, history, activeBets, duoBets, playBet } = useSession();
  const balance = walletBalance ?? MOCK_SOLDE;

  const wins = history.filter(h => h.outcome === 'win').length;
  const rate = history.length ? Math.round((wins / history.length) * 100) : 0;
  const soloPending = activeBets || [];

  const animValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animValue, { toValue: 1, duration: 600, useNativeDriver: false }).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{DATE_STRING}</Text>
            <Text style={styles.greeting}>Bonjour, Brael</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
            <View style={styles.avatar}>
              <User size={24} color={T.gold} />
            </View>
          </TouchableOpacity>
        </View>

        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>MON SOLDE TOTAL</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color={T.success} />
              <Text style={styles.trendText}>+{MOCK_TREND_PERCENT}%</Text>
            </View>
          </View>
          <Text style={styles.heroAmount}>{fmt(balance)} FCFA</Text>
          <View style={styles.heroSubRow}>
            <View style={styles.heroSubCol}>
              <Text style={styles.heroSubLabel}>GAINS GAMING</Text>
              <Text style={[styles.heroSubValue, { color: T.gaming }]}>{fmt(MOCK_GAINS_GAMING)} F</Text>
            </View>
            <View style={styles.heroSubCol}>
              <Text style={styles.heroSubLabel}>GAINS PHYSIQUE</Text>
              <Text style={[styles.heroSubValue, { color: T.physique }]}>{fmt(MOCK_GAINS_PHYSIQUE)} F</Text>
            </View>
          </View>
        </View>

        {/* KPI GRID */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconWrapper}>
              <Gamepad2 size={24} color={T.gaming} />
            </View>
            <Text style={styles.kpiTitle}>Duels Actifs</Text>
            <Text style={styles.kpiSubtitle}>{MOCK_ACTIVE_DUELS} en cours</Text>
            <View style={styles.kpiTrend}>
              <TrendingUp size={12} color={T.success} />
              <Text style={[styles.kpiTrendText, { color: T.success }]}>2 de plus</Text>
            </View>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconWrapper}>
              <Dumbbell size={24} color={T.physique} />
            </View>
            <Text style={styles.kpiTitle}>Classement</Text>
            <Text style={styles.kpiSubtitle}>Top {MOCK_RANK}</Text>
            <View style={styles.kpiTrend}>
              <TrendingUp size={12} color={T.success} />
              <Text style={[styles.kpiTrendText, { color: T.success }]}>+5 places</Text>
            </View>
          </View>
        </View>

        {/* DÉFIS EN ATTENTE */}
        {soloPending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DÉFIS EN ATTENTE ({soloPending.length})</Text>
            {soloPending.map(bet => (
              <TouchableOpacity
                key={bet.id}
                style={[styles.pendingCard, { borderLeftColor: GAMES[bet.game]?.color || T.gold }]}
                onPress={() => navigation.navigate('Live', { bet })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <User size={14} color={T.muted} />
                  <Text style={styles.pendingPlayer}>{bet.player}</Text>
                  <Pill
                    label={PALIERS[bet.defi?.p]?.label || '?'}
                    color={PALIERS[bet.defi?.p]?.color || T.gold}
                    dim={PALIERS[bet.defi?.p]?.dim || T.card}
                  />
                  <CoteDisplay cote={bet.cote} size={14} />
                </View>
                <Text style={styles.pendingInfo}>
                  {GAMES[bet.game]?.label || ''} · {bet.defi?.nom} · {fmt(bet.mise)} F
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* GRAPHIQUE ACTIVITÉ */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>ACTIVITÉ DÉFIS (7 JOURS)</Text>
          <SimpleBarChart data={WEEKLY_ACTIVITY} />
          <TouchableOpacity style={styles.viewReportBtn}>
            <BarChart3 size={16} color={T.gold} />
            <Text style={styles.viewReportText}>Voir mon historique complet</Text>
            <ChevronRight size={16} color={T.gold} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BOUTON FLOTTANT */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
        onPress={() => navigation.navigate('GameSelect')}
          activeOpacity={0.85}
        >
          <Zap size={20} color="#fff" />
          <Text style={styles.floatingButtonText}>LANCER UN DÉFI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  dateText: { fontFamily: T.fontBody, fontSize: 13, color: '#666' },
  greeting: { fontFamily: T.fontTitle, fontSize: 28, color: '#fff', marginTop: 4, letterSpacing: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#121212', borderWidth: 1, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
  heroCard: { backgroundColor: '#121212', borderRadius: 20, borderWidth: 1, borderColor: '#222', marginHorizontal: 16, marginTop: 20, padding: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroLabel: { fontFamily: T.fontBody, fontSize: 12, color: '#666', letterSpacing: 1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#052e16', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  trendText: { fontFamily: T.fontBody, fontSize: 12, color: T.success, marginLeft: 4, fontWeight: '600' },
  heroAmount: { fontFamily: T.fontMono, fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 4 },
  heroSubRow: { flexDirection: 'row', marginTop: 20 },
  heroSubCol: { flex: 1 },
  heroSubLabel: { fontFamily: T.fontBody, fontSize: 11, color: '#666', marginBottom: 4 },
  heroSubValue: { fontFamily: T.fontMono, fontSize: 16, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 12 },
  kpiCard: { flex: 1, backgroundColor: '#121212', borderRadius: 20, borderWidth: 1, borderColor: '#222', padding: 16 },
  kpiIconWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  kpiTitle: { fontFamily: T.fontTitle, fontSize: 18, color: '#fff', fontWeight: '600' },
  kpiSubtitle: { fontFamily: T.fontBody, fontSize: 13, color: '#666', marginTop: 4 },
  kpiTrend: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  kpiTrendText: { fontFamily: T.fontBody, fontSize: 12, marginLeft: 4, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginTop: 28 },
  sectionTitle: { fontFamily: T.fontTitle, fontSize: 16, color: '#fff', letterSpacing: 1.5, marginBottom: 12 },
  pendingCard: { backgroundColor: '#121212', borderRadius: 16, borderWidth: 1, borderColor: '#222', borderLeftWidth: 4, padding: 14, marginBottom: 8 },
  pendingPlayer: { fontFamily: T.fontTitle, fontSize: 15, color: '#fff' },
  pendingInfo: { fontFamily: T.fontBody, fontSize: 12, color: '#666', marginTop: 4 },
  chartCard: { backgroundColor: '#121212', borderRadius: 20, borderWidth: 1, borderColor: '#222', marginHorizontal: 16, marginTop: 16, padding: 20 },
  viewReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 12, gap: 6, borderWidth: 1, borderColor: '#222' },
  viewReportText: { fontFamily: T.fontBody, fontSize: 13, color: T.gold, fontWeight: '600' },
  floatingButtonContainer: { position: 'absolute', bottom: 80, left: 16, right: 16 },
  floatingButton: { backgroundColor: '#FF6B00', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  floatingButtonText: { fontFamily: T.fontTitle, fontSize: 18, color: '#fff', letterSpacing: 2 },
}); 
