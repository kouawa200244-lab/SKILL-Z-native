// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, Dimensions,
} from 'react-native';
import {
  ArrowDownCircle, ArrowUpCircle, Shield, Coins,
  TrendingUp, TrendingDown, Trophy, Minus,
  ChevronRight, Zap, Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';

const { width: W } = Dimensions.get('window');

const FILTERS = ['Tout', 'Victoires', 'Défaites', 'Dépôts/Retraits'];

const MOCK_HISTORY = [
  { type: 'win',      label: 'Duel FIFA vs @Bolo',      amount: 2000, cote: 2.0,  game: 'FIFA'     },
  { type: 'deposit',  label: 'Recharge Wave',            amount: 5000,             game: null       },
  { type: 'loss',     label: 'Défi PES Solo',            amount: 500,  cote: 1.6,  game: 'PES'      },
  { type: 'win',      label: '30 Pompes — Physique',     amount: 900,  cote: 2.5,  game: 'PHYSIQUE' },
  { type: 'withdraw', label: 'Retrait Orange Money',     amount: 3000,             game: null       },
  { type: 'loss',     label: 'NBA 2K — Triple Double',   amount: 400,  cote: 3.5,  game: 'NBA'      },
];

export default function WalletScreen2({
  walletBalance = 0,
  username = 'Joueur',
  history = MOCK_HISTORY,
}) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('Tout');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleCard = useRef(new Animated.Value(0.97)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      Animated.spring(scaleCard, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    // Pulse sur le solde
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const totalGains  = history.filter(h => h.type === 'win').reduce((a, h) => a + h.amount, 0);
  const totalPertes = history.filter(h => h.type === 'loss').reduce((a, h) => a + h.amount, 0);
  const net         = totalGains - totalPertes;

  const defisGagnes = history.filter(h => h.type === 'win').length;
  const defisPerdus = history.filter(h => h.type === 'loss').length;

  const filtered = history.filter(h => {
    if (activeFilter === 'Tout')            return true;
    if (activeFilter === 'Victoires')       return h.type === 'win';
    if (activeFilter === 'Défaites')        return h.type === 'loss';
    if (activeFilter === 'Dépôts/Retraits') return h.type === 'deposit' || h.type === 'withdraw';
    return true;
  });

  const TX_CONFIG = {
    win:      { color: T.success, icon: TrendingUp,    prefix: '+', bg: T.success + '12' },
    loss:     { color: T.danger,  icon: TrendingDown,  prefix: '-', bg: T.danger  + '12' },
    deposit:  { color: T.gold,    icon: ArrowDownCircle,prefix: '+',bg: T.gold    + '12' },
    withdraw: { color: T.gaming,  icon: ArrowUpCircle, prefix: '-', bg: T.gaming  + '12' },
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.headerEyebrow}>SKILL'Z</Text>
            <Text style={styles.headerTitle}>Portefeuille</Text>
          </View>
          <View style={styles.securedBadge}>
            <Shield size={12} color={T.success} />
            <Text style={styles.securedText}>Sécurisé</Text>
          </View>
        </Animated.View>

        {/* ── CARTE SOLDE ── */}
        <Animated.View style={{ transform: [{ scale: scaleCard }], opacity: fadeAnim, marginBottom: 16 }}>
          <View style={styles.balanceCard}>
            {/* Orbes déco */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            {/* User row */}
            <View style={styles.cardUserRow}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{username[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardUsername}>{username}</Text>
                <Text style={styles.cardWalletLabel}>SKILLZ Wallet</Text>
              </View>
              <View style={styles.fcfaBadge}>
                <Coins size={11} color={T.gold} />
                <Text style={styles.fcfaText}>FCFA</Text>
              </View>
            </View>

            {/* Solde */}
            <Text style={styles.balanceEyebrow}>SOLDE DISPONIBLE</Text>
            <Animated.Text style={[styles.balanceAmount, { transform: [{ scale: pulseAnim }] }]}>
              {fmt(walletBalance)}
              <Text style={styles.balanceCurrency}> FCFA</Text>
            </Animated.Text>

            {/* Mini stats */}
            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <TrendingUp size={11} color={T.success} />
                <Text style={[styles.miniStatText, { color: T.success }]}>+{fmt(totalGains)}</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <TrendingDown size={11} color={T.danger} />
                <Text style={[styles.miniStatText, { color: T.danger }]}>-{fmt(totalPertes)}</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>NET </Text>
                <Text style={[styles.miniStatText, { color: net >= 0 ? T.success : T.danger }]}>
                  {net >= 0 ? '+' : ''}{fmt(net)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── ACTIONS ── */}
        <Animated.View style={[styles.actionsRow, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: T.gold + '18', borderColor: T.gold + '40' }]}>
              <ArrowDownCircle size={26} color={T.gold} />
            </View>
            <Text style={[styles.actionLabel, { color: T.gold }]}>RECHARGER</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: T.gaming + '18', borderColor: T.gaming + '40' }]}>
              <ArrowUpCircle size={26} color={T.gaming} />
            </View>
            <Text style={[styles.actionLabel, { color: T.gaming }]}>RETIRER</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── STATS TRIO ── */}
        <Animated.View style={[styles.trioRow, { opacity: fadeAnim }]}>
          {[
            { label: 'Défis gagnés', value: defisGagnes, color: T.success, icon: Trophy },
            { label: 'Défis perdus', value: defisPerdus, color: T.danger,  icon: Minus  },
            { label: 'Filets reçus', value: 0,           color: T.gold,    icon: Zap    },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <View key={i} style={styles.trioCard}>
                <Icon size={16} color={s.color} style={{ marginBottom: 6 }} />
                <Text style={[styles.trioValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.trioLabel}>{s.label}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* ── HISTORIQUE ── */}
        <Animated.View style={[styles.historyBlock, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>HISTORIQUE</Text>

          {/* Filtres */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
            {FILTERS.map(f => {
              const active = activeFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Transactions */}
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={28} color={T.muted} />
              <Text style={styles.emptyText}>Aucune transaction</Text>
            </View>
          ) : (
            filtered.map((tx, i) => {
              const cfg  = TX_CONFIG[tx.type];
              const Icon = cfg.icon;
              return (
                <View key={i} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: cfg.bg }]}>
                    <Icon size={16} color={cfg.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txLabel} numberOfLines={1}>{tx.label}</Text>
                    {tx.game && (
                      <Text style={styles.txGame}>{tx.game}{tx.cote ? ` · ×${tx.cote.toFixed(2)}` : ''}</Text>
                    )}
                  </View>
                  <Text style={[styles.txAmount, { color: cfg.color }]}>
                    {cfg.prefix}{fmt(tx.amount)} F
                  </Text>
                </View>
              );
            })
          )}
        </Animated.View>

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
    alignItems: 'flex-end', paddingTop: 16, marginBottom: 24,
  },
  headerEyebrow: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold,
    fontWeight: '800', letterSpacing: 3, marginBottom: 2,
  },
  headerTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 36, color: '#EEEEF5', letterSpacing: 0.5 },
  securedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.success + '12', borderWidth: 1,
    borderColor: T.success + '30', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  securedText: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.success, fontWeight: '700' },

  /* Balance card */
  balanceCard: {
    backgroundColor: '#0D1A14', borderRadius: 20,
    borderWidth: 1, borderColor: T.gold + '25',
    padding: 20, overflow: 'hidden', position: 'relative',
  },
  orb1: {
    position: 'absolute', top: -50, right: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: T.gold, opacity: 0.07,
  },
  orb2: {
    position: 'absolute', bottom: -40, left: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: T.gaming, opacity: 0.06,
  },

  cardUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: T.gold + '20', borderWidth: 1.5,
    borderColor: T.gold + '40', justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarText: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: T.gold },
  cardUsername: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5' },
  cardWalletLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, letterSpacing: 0.5 },
  fcfaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.gold + '12', borderWidth: 1,
    borderColor: T.gold + '30', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  fcfaText: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '700' },

  balanceEyebrow: {
    fontFamily: 'Inter-Regular', fontSize: 9, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2.5, fontWeight: '700', marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: 'Rajdhani-Bold', fontSize: 48, color: '#FFFFFF',
    letterSpacing: 1, marginBottom: 16,
  },
  balanceCurrency: { fontSize: 20, color: 'rgba(255,255,255,0.4)' },

  miniStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10, padding: 12, gap: 0,
  },
  miniStat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  miniDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  miniStatText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, fontWeight: '700' },
  miniStatLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },

  /* Actions */
  actionsRow: {
    flexDirection: 'row', backgroundColor: '#0F1219',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden',
  },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 20, gap: 10 },
  actionIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  actionLabel: { fontFamily: 'Rajdhani-Bold', fontSize: 14, letterSpacing: 1.5 },
  actionDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },

  /* Trio */
  trioRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  trioCard: {
    flex: 1, backgroundColor: '#0F1219', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 14, alignItems: 'center',
  },
  trioValue: { fontFamily: 'Rajdhani-Bold', fontSize: 26, letterSpacing: 0.5 },
  trioLabel: { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '600', textAlign: 'center', marginTop: 2 },

  /* History */
  historyBlock: {
    backgroundColor: '#0F1219', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18,
  },
  sectionTitle: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted,
    fontWeight: '800', letterSpacing: 2, marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterChipActive: { backgroundColor: T.gold, borderColor: T.gold },
  filterText: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '700' },
  filterTextActive: { color: '#000' },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },

  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5', fontWeight: '600' },
  txGame: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginTop: 2 },
  txAmount: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, fontWeight: '700' },
});