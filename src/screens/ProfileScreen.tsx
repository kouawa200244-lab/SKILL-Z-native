// @ts-nocheck
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, Dimensions,
  Image, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  User, Trophy, TrendingDown, TrendingUp,
  Coins, LogOut, Shield, Star, Zap,
  Target, Medal, Camera, Swords, Settings,
  ChevronRight, BarChart2, Clock, CheckCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const RANK_CONFIG = {
  'RANG BRONZE':  { color: '#CD7F32', glow: '#CD7F3220', next: 'RANG ARGENT',  xpNeeded: 400,   label: 'BRONZE'  },
  'RANG ARGENT':  { color: '#C0C0C0', glow: '#C0C0C020', next: 'RANG OR II',   xpNeeded: 1000,  label: 'ARGENT'  },
  'RANG OR II':   { color: T.gold,    glow: T.gold+'20',  next: 'RANG OR I',    xpNeeded: 2000,  label: 'OR II'   },
  'RANG OR I':    { color: T.gold,    glow: T.gold+'30',  next: 'RANG PLATINE', xpNeeded: 5000,  label: 'OR I'    },
  'RANG PLATINE': { color: '#A855F7', glow: '#A855F720', next: 'RANG LÉGENDE', xpNeeded: 10000, label: 'PLATINE' },
  'RANG LÉGENDE': { color: '#EF4444', glow: '#EF444420', next: null,            xpNeeded: 99999, label: 'LÉGENDE' },
};

const XP_PREV = {
  'RANG BRONZE':  0,
  'RANG ARGENT':  400,
  'RANG OR II':   1000,
  'RANG OR I':    2000,
  'RANG PLATINE': 5000,
  'RANG LÉGENDE': 10000,
};

/* ── Progress XP ── */
function xpProgress(rank, xp) {
  const cfg    = RANK_CONFIG[rank];
  if (!cfg || !cfg.next) return 100;
  const prev   = XP_PREV[rank] || 0;
  const needed = cfg.xpNeeded - prev;
  const done   = xp - prev;
  return Math.min(100, Math.max(0, Math.round(done / needed * 100)));
}

/* ══════════════════════════════════════
   STAT CARD
══════════════════════════════════════ */
function StatCard({ label, value, icon: Icon, color, index }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 10, delay: index * 80, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.statCard,
      { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
    ]}>
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   PROFILE SCREEN
══════════════════════════════════════ */
export default function ProfileScreen({ onLogout }) {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation();

  // Données réelles
  const [profile,     setProfile]     = useState(null);
  const [wallet,      setWallet]      = useState(null);
  const [bets,        setBets]        = useState([]);
  const [duels,       setDuels]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [avatarUrl,   setAvatarUrl]   = useState(null);

  // Animations
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const scaleAvatar = useRef(new Animated.Value(0.85)).current;
  const rotateAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,    { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim,   { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.spring(scaleAvatar, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(useCallback(() => {
    loadProfileData();
  }, []));

  /* ── Charger tout depuis Supabase ── */
  const loadProfileData = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      if (!stored) { setLoading(false); return; }
      const u = JSON.parse(stored);

      const [profileRes, walletRes, betsRes, duelsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', u.id).single(),
        supabase.from('wallets').select('*').eq('user_id', u.id).single(),
        supabase.from('bets').select('*').eq('user_id', u.id)
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('duels').select('*')
          .or(`creator_id.eq.${u.id},opponent_id.eq.${u.id}`)
          .not('status', 'eq', 'waiting')
          .order('created_at', { ascending: false }).limit(10),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        if (profileRes.data.avatar_url) setAvatarUrl(profileRes.data.avatar_url);
      }
      if (walletRes.data) setWallet(walletRes.data);
      if (betsRes.data)   setBets(betsRes.data);
      if (duelsRes.data)  setDuels(duelsRes.data);

    } catch (e) {
      console.error('loadProfileData:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadProfileData();
    setRefreshing(false);
  };

  /* ── Upload avatar ── */
  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission refusée', 'Autorise l\'accès à ta galerie dans les paramètres.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploading(true);
      const asset = result.assets[0];
      const ext   = asset.uri.split('.').pop() || 'jpg';
      const path  = `avatars/${profile?.id || 'unknown'}_${Date.now()}.${ext}`;

      // Lire le fichier en blob
      const response    = await fetch(asset.uri);
      const blob        = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('URL publique non trouvée.');

      // Mettre à jour le profil Supabase
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile?.id);

      // Mettre à jour AsyncStorage
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) {
        const u    = JSON.parse(stored);
        u.avatar_url = publicUrl;
        await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
      }

      setAvatarUrl(publicUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Photo mise à jour !', 'Ton avatar a été modifié.');

    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', e.message || 'Impossible de mettre à jour la photo.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Déconnexion ── */
  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Se déconnecter ?',
      'Tu devras te reconnecter pour accéder à ton compte.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              // Déconnexion Supabase Auth
              await supabase.auth.signOut();
              // Vider AsyncStorage
              await AsyncStorage.multiRemove(['skillz_user', 'skillz_queue', 'skillz_temp_otp']);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // Callback vers App.tsx
              if (onLogout) onLogout();
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de se déconnecter. Réessaie.');
            }
          },
        },
      ]
    );
  };

  /* ── Données calculées ── */
  const username    = profile?.username    || 'Joueur';
  const rank        = profile?.rank        || 'RANG BRONZE';
  const xp          = profile?.xp          || 0;
  const balance     = wallet?.balance      || 0;
  const totalGains  = wallet?.total_gains  || 0;
  const totalDepots = wallet?.total_depots || 0;
  const rankCfg     = RANK_CONFIG[rank]    || RANK_CONFIG['RANG BRONZE'];
  const xpPct       = xpProgress(rank, xp);

  // Stats combinées bets + duels
  const allResults    = [
    ...bets.map(b => ({ outcome: b.status, mise: b.mise, cote: b.cote, nom: b.defi_nom, game: b.game_key, source: 'solo' })),
    ...duels.filter(d => d.status === 'completed').map(d => {
      const stored = null;
      const isWin  = d.winner_id === profile?.id;
      return { outcome: isWin ? 'win' : 'loss', mise: d.mise, cote: d.cote, nom: d.defi_nom, game: d.game_key, source: 'duel' };
    }),
  ];
  const wins     = allResults.filter(r => r.outcome === 'win').length;
  const losses   = allResults.filter(r => r.outcome === 'loss').length;
  const total    = wins + losses;
  const winRate  = total > 0 ? Math.round(wins / total * 100) : 0;
  const duelsPlayed = duels.filter(d => d.status === 'completed').length;

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.gold} colors={[T.gold]} />
        }
      >
        {/* ── HERO ── */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.heroBgOrb1, { backgroundColor: rankCfg.color }]} />
          <View style={styles.heroBgOrb2} />

          {/* Avatar */}
          <TouchableOpacity onPress={handlePickImage} disabled={uploading} activeOpacity={0.85} style={styles.avatarTouchable}>
            <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: scaleAvatar }] }]}>
              {/* Anneau rotatif */}
              <Animated.View style={[styles.avatarRingOuter, { borderColor: rankCfg.color + '40', transform: [{ rotate: spin }] }]} />
              <Animated.View style={[styles.avatarRingInner, { borderColor: rankCfg.color + '70', transform: [{ scale: pulseAnim }] }]} />

              {/* Photo ou initiale */}
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatarImg, { borderColor: rankCfg.color + '60' }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: rankCfg.color + '15', borderColor: rankCfg.color + '40' }]}>
                  <Text style={[styles.avatarInitial, { color: rankCfg.color }]}>
                    {username[0]?.toUpperCase() || 'S'}
                  </Text>
                </View>
              )}

              {/* Badge caméra */}
              <View style={[styles.cameraBadge, { backgroundColor: rankCfg.color }]}>
                {uploading
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Camera size={13} color="#000" />
                }
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Nom + rang */}
          <Text style={styles.username}>{username}</Text>

          <View style={[styles.rankBadge, { backgroundColor: rankCfg.glow, borderColor: rankCfg.color + '50' }]}>
            <Shield size={12} color={rankCfg.color} />
            <Text style={[styles.rankText, { color: rankCfg.color }]}>{rankCfg.label}</Text>
          </View>

          {/* Solde */}
          <Animated.View style={[styles.balancePill, { borderColor: T.gold + '35' }]}>
            <Coins size={14} color={T.gold} />
            <Text style={styles.balanceText}>{fmt(balance)} FCFA</Text>
          </Animated.View>

          {/* Badges rapides */}
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Zap size={11} color={T.gaming} />
              <Text style={[styles.heroBadgeText, { color: T.gaming }]}>{xp} XP</Text>
            </View>
            <View style={styles.heroBadge}>
              <Swords size={11} color='#A855F7' />
              <Text style={[styles.heroBadgeText, { color: '#A855F7' }]}>{duelsPlayed} duels</Text>
            </View>
            <View style={styles.heroBadge}>
              <Trophy size={11} color={T.success} />
              <Text style={[styles.heroBadgeText, { color: T.success }]}>{winRate}% win</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── STATS 2×2 ── */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Victoires',     value: wins,              icon: Trophy,       color: T.success  },
            { label: 'Défaites',      value: losses,            icon: TrendingDown, color: T.danger   },
            { label: 'Taux réussite', value: `${winRate}%`,     icon: TrendingUp,   color: T.gaming   },
            { label: 'Gains totaux',  value: `${fmt(totalGains)} F`, icon: Coins,  color: T.gold     },
          ].map((s, i) => (
            <StatCard key={`stat_${i}`} {...s} index={i} />
          ))}
        </View>

        {/* ── PROGRESSION XP ── */}
        <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
          <View style={[styles.progressAccent, { backgroundColor: rankCfg.color }]} />
          <View style={styles.progressInner}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.sectionLabel}>PROGRESSION</Text>
                <Text style={styles.progressCurrent}>
                  <Text style={{ color: rankCfg.color }}>{rankCfg.label}</Text>
                  {rankCfg.next && <Text style={{ color: T.muted }}> → {RANK_CONFIG[rankCfg.next]?.label}</Text>}
                </Text>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: rankCfg.color + '15', borderColor: rankCfg.color + '30' }]}>
                <Star size={11} color={rankCfg.color} />
                <Text style={[styles.xpText, { color: rankCfg.color }]}>{xp} XP</Text>
              </View>
            </View>

            {/* Barre */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${xpPct}%`, backgroundColor: rankCfg.color }]}>
                <View style={[styles.progressGlow, { backgroundColor: rankCfg.color }]} />
              </View>
            </View>

            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>{XP_PREV[rank]} XP</Text>
              <Text style={[styles.progressLabelText, { color: rankCfg.color }]}>{xpPct}% accompli</Text>
              <Text style={styles.progressLabelText}>{RANK_CONFIG[rank]?.xpNeeded} XP</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── RÉSUMÉ FINANCIER ── */}
        <Animated.View style={[styles.financeCard, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>RÉSUMÉ FINANCIER</Text>
          {[
            { label: 'Total dépôts',  value: fmt(totalDepots),                color: T.gold    },
            { label: 'Total gains',   value: fmt(totalGains),                 color: T.success },
            { label: 'Total pertes',  value: fmt(wallet?.total_pertes || 0),  color: T.danger  },
            { label: 'Total retraits',value: fmt(wallet?.total_retraits || 0),color: T.gaming  },
          ].map((row, i) => (
            <View key={`fin_${i}`} style={styles.financeRow}>
              <Text style={styles.financeLabel}>{row.label}</Text>
              <Text style={[styles.financeValue, { color: row.color }]}>{row.value} F</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── DERNIÈRES ACTIVITÉS ── */}
        <Animated.View style={[styles.activityCard, { opacity: fadeAnim }]}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionLabel}>DERNIÈRES ACTIVITÉS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')}>
              <Text style={styles.seeAllText}>Tout voir →</Text>
            </TouchableOpacity>
          </View>

          {allResults.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Target size={28} color={T.muted} />
              <Text style={styles.emptyText}>Lance ton premier défi !</Text>
            </View>
          ) : (
            allResults.slice(0, 5).map((r, i) => {
              const win   = r.outcome === 'win';
              const color = win ? T.success : T.danger;
              return (
                <View key={`act_${i}`} style={styles.activityRow}>
                  {/* Icône */}
                  <View style={[styles.activityIcon, { backgroundColor: color + '12' }]}>
                    {win
                      ? <Trophy size={14} color={T.success} />
                      : <TrendingDown size={14} color={T.danger} />
                    }
                  </View>
                  {/* Info */}
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityNom} numberOfLines={1}>
                      {r.nom || 'Défi'}
                    </Text>
                    <View style={styles.activityMeta}>
                      <Text style={styles.activityGame}>{r.game?.toUpperCase()}</Text>
                      {r.source === 'duel' && (
                        <View style={styles.duelBadge}>
                          <Swords size={8} color='#A855F7' />
                          <Text style={styles.duelBadgeText}>DUEL</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {/* Montant */}
                  <View style={styles.activityAmount}>
                    <Text style={[styles.activityAmountText, { color }]}>
                      {win ? '+' : '-'}{fmt(win ? Math.round(r.mise * r.cote * 0.9) : r.mise)} F
                    </Text>
                    <Text style={styles.activityCote}>×{parseFloat(r.cote || 1).toFixed(2)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

        {/* ── MENU PARAMÈTRES ── */}
        <Animated.View style={[styles.menuCard, { opacity: fadeAnim }]}>
          {[
            { label: 'Modifier le profil',    icon: User,     color: T.gaming,  action: () => {} },
            { label: 'Historique complet',    icon: BarChart2,color: T.gold,    action: () => navigation.navigate('HistoryTab') },
            { label: 'Paramètres',            icon: Settings, color: T.muted,   action: () => {} },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={`menu_${i}`}
                style={[styles.menuRow, i < 2 && styles.menuRowBorder]}
                onPress={() => { Haptics.selectionAsync(); item.action(); }}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Icon size={16} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight size={14} color={T.muted} />
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── DÉCONNEXION ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconWrap}>
            <LogOut size={18} color={T.danger} />
          </View>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>SKILL'Z v1.0.0 · Tous droits réservés</Text>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },

  /* Hero */
  hero: {
    alignItems: 'center', paddingTop: 20,
    paddingBottom: 28, position: 'relative', overflow: 'hidden',
  },
  heroBgOrb1: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, opacity: 0.09 },
  heroBgOrb2: { position: 'absolute', bottom: 0, left: -60, width: 150, height: 150, borderRadius: 75, backgroundColor: T.gaming, opacity: 0.06 },

  avatarTouchable: { marginBottom: 16 },
  avatarWrapper:   { width: 110, height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarRingOuter: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1.5, borderStyle: 'dashed' },
  avatarRingInner: { position: 'absolute', width: 92,  height: 92,  borderRadius: 46, borderWidth: 1 },
  avatarImg:       { width: 80, height: 80, borderRadius: 40, borderWidth: 2 },
  avatarPlaceholder:{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatarInitial:   { fontFamily: 'Rajdhani-Bold', fontSize: 34 },
  cameraBadge:     { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#080A0F' },

  username:     { fontFamily: 'Rajdhani-Bold', fontSize: 32, color: '#EEEEF5', letterSpacing: 1, marginBottom: 10 },
  rankBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12 },
  rankText:     { fontFamily: 'Inter-Regular', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  balancePill:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: T.gold + '08', marginBottom: 14 },
  balanceText:  { fontFamily: 'JetBrainsMono-Regular', fontSize: 16, color: T.gold, fontWeight: '700' },

  heroBadges:     { flexDirection: 'row', gap: 8 },
  heroBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeText:  { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '700' },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard:  { width: (W - 46) / 2, backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, alignItems: 'center', gap: 8 },
  statIconBox:{ width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue:  { fontFamily: 'Rajdhani-Bold', fontSize: 26, letterSpacing: 1 },
  statLabel:  { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '600', textAlign: 'center' },

  /* Progression */
  progressCard:  { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 14 },
  progressAccent:{ height: 2 },
  progressInner: { padding: 18 },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionLabel:  { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  progressCurrent:{ fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5' },
  xpBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  xpText:        { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill:  { height: '100%', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  progressGlow:  { position: 'absolute', right: 0, top: 0, bottom: 0, width: 12, opacity: 0.6, borderRadius: 6 },
  progressLabels:{ flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelText: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },

  /* Finance */
  financeCard: { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18, marginBottom: 14 },
  financeRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  financeLabel:{ fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  financeValue:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },

  /* Activités */
  activityCard:    { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18, marginBottom: 14 },
  activityHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seeAllText:      { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gaming, fontWeight: '600' },
  emptyActivity:   { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyText:       { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  activityRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  activityIcon:    { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  activityInfo:    { flex: 1 },
  activityNom:     { fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5', fontWeight: '600' },
  activityMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  activityGame:    { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '700', letterSpacing: 1 },
  duelBadge:       { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#A855F715', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  duelBadgeText:   { fontFamily: 'Inter-Regular', fontSize: 8, color: '#A855F7', fontWeight: '800' },
  activityAmount:  { alignItems: 'flex-end' },
  activityAmountText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
  activityCote:    { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, marginTop: 1 },

  /* Menu */
  menuCard:      { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 14 },
  menuRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuIcon:      { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel:     { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#EEEEF5', fontWeight: '600' },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: 1, borderColor: T.danger + '35', borderRadius: 16,
    paddingVertical: 16, backgroundColor: T.danger + '08', marginBottom: 14,
  },
  logoutIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: T.danger + '15', justifyContent: 'center', alignItems: 'center' },
  logoutText:     { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: T.danger, letterSpacing: 1.5 },

  version: { fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.15)', textAlign: 'center', letterSpacing: 0.5 },
});