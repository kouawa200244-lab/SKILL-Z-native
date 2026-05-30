// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, Dimensions,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import {
  User, Trophy, TrendingDown, TrendingUp,
  Coins, LogOut, ChevronRight, Shield,
  Star, Zap, Target, Medal, Camera,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const RANK_CONFIG = {
  'RANG BRONZE':   { color: '#CD7F32', glow: '#CD7F3240', label: 'BRONZE' },
  'RANG ARGENT':   { color: '#C0C0C0', glow: '#C0C0C040', label: 'ARGENT' },
  'RANG OR II':    { color: T.gold,    glow: T.gold + '40', label: 'OR II' },
  'RANG OR I':     { color: T.gold,    glow: T.gold + '60', label: 'OR I' },
  'RANG PLATINE':  { color: '#A855F7', glow: '#A855F740', label: 'PLATINE' },
  'RANG LÉGENDE':  { color: '#EF4444', glow: '#EF444440', label: 'LÉGENDE' },
};

export default function ProfileScreen({
  username = 'brael',
  rank = 'RANG OR II',
  walletBalance = 12500,
  history = [],
  onLogout,
}) {
  const insets = useSafeAreaInsets();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAvatar = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // ══════════════════════════════════════
  // ÉTAT POUR L'AVATAR
  // ══════════════════════════════════════
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Charger l'avatar existant depuis AsyncStorage
    const loadAvatar = async () => {
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) {
        const user = JSON.parse(stored);
        setUserId(user.id);
        if (user.avatar_url) {
          setAvatarUrl(user.avatar_url);
        }
      }
    };
    loadAvatar();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.spring(scaleAvatar, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
      ),
    ]).start();
  }, []);

  // ══════════════════════════════════════
  // FONCTION UPLOAD AVATAR
  // ══════════════════════════════════════
  const handlePickImage = async () => {
    if (uploading) return;

    setUploading(true);
    const url = await pickProfileImage();

    if (url) {
      setAvatarUrl(url);

      // Mettre à jour dans Supabase
      if (userId) {
        await updateProfileAvatar(userId, url);
      }

      // Mettre à jour dans AsyncStorage
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) {
        const user = JSON.parse(stored);
        user.avatar_url = url;
        await AsyncStorage.setItem('skillz_user', JSON.stringify(user));
      }
    }

    setUploading(false);
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const wins     = history.filter(h => h.outcome === 'win').length;
  const losses   = history.filter(h => h.outcome !== 'win').length;
  const winRate  = history.length ? Math.round(wins / history.length * 100) : 0;
  const gains    = history
    .filter(h => h.outcome === 'win')
    .reduce((acc, h) => acc + Math.round(h.mise * (h.cote || 2)), 0);

  const rankCfg  = RANK_CONFIG[rank] || RANK_CONFIG['RANG OR II'];

  const STATS = [
    { label: 'Victoires',      value: wins,            icon: Trophy,       color: T.success },
    { label: 'Défaites',       value: losses,          icon: TrendingDown, color: T.danger  },
    { label: 'Taux réussite',  value: `${winRate}%`,   icon: TrendingUp,   color: T.gaming  },
    { label: 'Gains totaux',   value: `${fmt(gains)} F`, icon: Coins,      color: T.gold    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HERO SECTION ── */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.orb1, { backgroundColor: rankCfg.color }]} />
          <View style={styles.orb2} />

          {/* Avatar avec bouton upload */}
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploading}
            activeOpacity={0.8}
            style={styles.avatarTouchable}
          >
            <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: scaleAvatar }] }]}>
              <Animated.View style={[styles.avatarRing, { borderColor: rankCfg.color, transform: [{ rotate: spin }] }]} />

              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarInner, { backgroundColor: rankCfg.color + '15' }]}>
                  <User size={44} color={rankCfg.color} />
                </View>
              )}

              {/* Badge appareil photo */}
              <View style={styles.cameraBadge}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Camera size={14} color="#fff" />
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.username}>{username}</Text>

          <View style={[styles.rankBadge, { backgroundColor: rankCfg.glow, borderColor: rankCfg.color + '60' }]}>
            <Shield size={11} color={rankCfg.color} />
            <Text style={[styles.rankText, { color: rankCfg.color }]}>{rank}</Text>
          </View>

          <View style={[styles.balancePill, { borderColor: T.gold + '30' }]}>
            <Coins size={14} color={T.gold} />
            <Text style={styles.balanceText}>{fmt(walletBalance)} FCFA</Text>
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* ── STATS GRID ── */}
        <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: s.color + '12' }]}>
                  <Icon size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* ── PROGRESSION RANG ── */}
        <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.sectionTitle}>PROGRESSION</Text>
              <Text style={styles.progressSub}>Vers {rank} → Rang suivant</Text>
            </View>
            <View style={[styles.xpBadge, { backgroundColor: rankCfg.color + '15' }]}>
              <Star size={11} color={rankCfg.color} />
              <Text style={[styles.xpText, { color: rankCfg.color }]}>{wins * 100} XP</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, {
                width: `${Math.min(winRate, 100)}%`,
                backgroundColor: rankCfg.color,
              }]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>0%</Text>
            <Text style={[styles.progressLabelText, { color: rankCfg.color }]}>{winRate}% accompli</Text>
            <Text style={styles.progressLabelText}>100%</Text>
          </View>
        </Animated.View>

        {/* ── DERNIÈRES MISES ── */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>DERNIÈRES MISES</Text>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={32} color={T.muted} />
              <Text style={styles.emptyText}>Aucun défi joué</Text>
              <Text style={styles.emptySub}>Lance ton premier défi !</Text>
            </View>
          ) : (
            history.slice(0, 5).map((h, i) => {
              const win  = h.outcome === 'win';
              const gain = Math.round(h.mise * (h.cote || 2));
              return (
                <View key={i} style={styles.histRow}>
                  <View style={[styles.histDot, { backgroundColor: win ? T.success : T.danger }]} />
                  <View style={styles.histInfo}>
                    <Text style={styles.histName} numberOfLines={1}>
                      {h.defi?.nom || h.player || 'Défi'}
                    </Text>
                    <Text style={styles.histGame}>{h.game || '—'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.histAmount, { color: win ? T.success : T.danger }]}>
                      {win ? '+' : '-'}{fmt(win ? gain : h.mise)} F
                    </Text>
                    <Text style={styles.histCote}>×{(h.cote || 2).toFixed(2)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── DÉCONNEXION ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <LogOut size={16} color={T.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },

  /* Hero */
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 32, position: 'relative', overflow: 'hidden' },
  orb1: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, opacity: 0.08 },
  orb2: { position: 'absolute', bottom: 0, left: -80, width: 160, height: 160, borderRadius: 80, backgroundColor: T.gaming, opacity: 0.06 },

  avatarTouchable: { marginBottom: 16 },

  avatarWrapper: { position: 'relative', width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderStyle: 'dashed' },
  avatarImage: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: T.gold + '40' },
  avatarInner: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center' },

  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: T.gold, justifyContent: 'center',
    alignItems: 'center', borderWidth: 3,
    borderColor: '#080A0F',
  },

  username: { fontFamily: 'Rajdhani-Bold', fontSize: 34, color: '#EEEEF5', letterSpacing: 1, marginBottom: 10 },

  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14,
  },
  rankText: { fontFamily: 'Inter-Regular', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },

  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: T.gold + '08',
  },
  balanceText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 16, color: T.gold, fontWeight: '700' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },

  /* Stats grid */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: (W - 46) / 2,
    backgroundColor: '#0F1219', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 18, alignItems: 'center', gap: 8,
  },
  statIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontFamily: 'Rajdhani-Bold', fontSize: 28, letterSpacing: 1 },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '600' },

  /* Progression */
  progressCard: {
    backgroundColor: '#0F1219', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 18, marginBottom: 16,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted,
    fontWeight: '800', letterSpacing: 2, marginBottom: 4,
  },
  progressSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#EEEEF5' },
  xpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  xpText: { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelText: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },

  /* History */
  historyCard: {
    backgroundColor: '#0F1219', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 18, marginBottom: 16,
  },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#EEEEF5' },
  emptySub: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },

  histRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  histDot: { width: 8, height: 8, borderRadius: 4 },
  histInfo: { flex: 1 },
  histName: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5', fontWeight: '600' },
  histGame: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginTop: 2 },
  histAmount: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
  histCote: { fontFamily: 'JetBrainsMono-Regular', fontSize: 10, color: T.muted, marginTop: 2 },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: T.danger + '30',
    borderRadius: 14, padding: 16,
    backgroundColor: T.danger + '08',
  },
  logoutText: { fontFamily: 'Inter-Regular', fontSize: 15, color: T.danger, fontWeight: '700', letterSpacing: 0.5 },
});