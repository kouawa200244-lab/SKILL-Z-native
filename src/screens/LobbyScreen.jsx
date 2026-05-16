// @ts-nocheck
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helper';
import { DEFIS } from '../constants/defis';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { navigate } from '../utils/navigationRef';
import { useNavigation } from '@react-navigation/native';
import { getQueue, removeFromQueue } from '../utils/queueService';
import { queueEvents } from '../utils/queueEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

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
  const translateX = useRef(new Animated.Value(40)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const height     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0, tension: 80, friction: 12,
        delay: index * 50, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 250,
        delay: index * 50, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlay(item);
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // ✅ Optimistic — retire visuellement AVANT l'async
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -40, duration: 200, useNativeDriver: true }),
    ]).start(() => onRemove(item.queueId));
  };

  const game   = GAMES[item.gameKey] || {};
  const palier = PALIERS[item.p]     || {};
  const color  = game.color          || T.gold;
  const gain   = Math.round((item.mise || 1000) * (item.cote || 1) * 0.9);

  return (
    <Animated.View style={{
      opacity, transform: [{ translateX }, { scale }],
      marginBottom: 12,
    }}>
      <View style={[styles.queueCard, { borderLeftColor: color }]}>
        {/* Header */}
        <View style={styles.queueHeader}>
          <View style={styles.queueHeaderLeft}>
            <View style={[styles.queueDot, { backgroundColor: color }]} />
            <Text style={[styles.queueGame, { color }]}>
              {game.short || item.gameKey?.toUpperCase()}
            </Text>
            {palier.label && (
              <View style={[styles.queuePalier, {
                backgroundColor: palier.dim || '#111',
                borderColor: (palier.color || T.gold) + '40',
              }]}>
                <Text style={[styles.queuePalierTxt, { color: palier.color || T.gold }]}>
                  {palier.label.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.queueCote, { color: T.gaming }]}>
            ×{(item.cote || 1).toFixed(2)}
          </Text>
        </View>

        {/* Nom */}
        <Text style={styles.queueNom}>{item.nom}</Text>

        {/* Condition */}
        <View style={styles.queueCondRow}>
          <View style={[styles.queueCondBullet, { backgroundColor: color }]} />
          <Text style={styles.queueCond} numberOfLines={2}>{item.cond}</Text>
        </View>

        {/* Mise + Gain */}
        <View style={styles.queueFinance}>
          <Text style={styles.queueFinanceLabel}>Mise :</Text>
          <Text style={[styles.queueFinanceValue, { color: T.gold }]}>
            {fmt(item.mise || 1000)} F
          </Text>
          <Text style={styles.queueFinanceLabel}>  Gain :</Text>
          <Text style={[styles.queueFinanceValue, { color: T.success }]}>
            +{fmt(gain)} F
          </Text>
        </View>

        {/* Boutons */}
        <View style={styles.queueBtns}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: color }]}
            onPress={handlePlay}
            activeOpacity={0.8}
          >
            <Play size={14} color="#000" fill="#000" />
            <Text style={styles.playBtnTxt}>JOUER MAINTENANT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={handleRemove}
            activeOpacity={0.8}
          >
            <Trash2 size={14} color={T.danger} />
            <Text style={styles.removeBtnTxt}>SUPPR.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

/* ══ QUICK CARD ══ */
function QuickCard({ defi, index, onPress }) {
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 90, friction: 11, delay: index * 55, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 280, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  const color  = defi.game?.color || T.gold;
  const palier = PALIERS[defi.p]  || {};

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.quickCard, { borderColor: color + '35' }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(defi); // ✅ immédiat
        }}
        activeOpacity={0.75}
        hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
      >
        <View style={[styles.quickAccent, { backgroundColor: color }]} />
        {defi.count > 1 && (
          <View style={[styles.quickBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Flame size={8} color={color} />
            <Text style={[styles.quickBadgeTxt, { color }]}>×{defi.count}</Text>
          </View>
        )}
        <Text style={styles.quickNom} numberOfLines={2}>{defi.nom}</Text>
        <Text style={[styles.quickGame, { color }]}>{defi.game?.short || defi.gameKey}</Text>
        <View style={styles.quickFooter}>
          <View style={[styles.quickPalierDot, { backgroundColor: palier.color || T.gold }]} />
          <Text style={[styles.quickCote, { color: T.gaming }]}>
            ×{(defi.cote || 1).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ══ LOBBY SCREEN ══ */
export default function LobbyScreen({ history = [] }) {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation();

  const [queue,      setQueue]      = useState([]);
  const [quickDefis, setQuickDefis] = useState(DEFAULT_QUICK);
  const [username,   setUsername]   = useState('Joueur');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  /* ── Charger la queue ── */
  const loadQueue = useCallback(async () => {
    const q = await getQueue();
    setQueue(q);
  }, []);

  /* ── Mount ── */
  useEffect(() => {
    // Animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }),
    ]).start();

    // Charger user
    AsyncStorage.getItem('skillz_user').then(s => {
      if (s) setUsername(JSON.parse(s).username || 'Joueur');
    });

    // Charger queue initiale
    loadQueue();

    // ✅ Abonnement temps réel — mise à jour instantanée
    const unsub = queueEvents.subscribe(loadQueue);
    return unsub;
  }, []);

  /* ── Focus (retour sur l'écran) ── */
  useFocusEffect(useCallback(() => {
    loadQueue();
  }, []));

  /* ── Défis rapides ── */
  useEffect(() => {
    const top = getTopDefis(history);
    setQuickDefis(top.length >= 2 ? top : DEFAULT_QUICK);
  }, [history]);

  /* ── Supprimer avec optimistic update ── */
  const handleRemove = useCallback((queueId) => {
    // ✅ Mise à jour UI immédiate
    setQueue(prev => prev.filter(q => q.queueId !== queueId));
    // Async en arrière-plan
    removeFromQueue(queueId);
  }, []);

  const handlePlay = useCallback((item) => {
    navigate('Config', { gameKey: item.gameKey, defi: item });
  }, []);

  const wins    = history.filter(h => h.outcome === 'win').length;
  const losses  = history.filter(h => h.outcome !== 'win').length;
  const winRate = history.length ? Math.round(wins / history.length * 100) : 0;
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
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
            activeOpacity={0.8}
          >
            <User size={20} color={T.gold} />
          </TouchableOpacity>
        </Animated.View>

        {/* STATS */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {[
            { Icon: Gamepad2,   color: T.gaming,  val: history.length, label: 'Duels'     },
            { Icon: Trophy,     color: T.success,  val: wins,           label: 'Victoires' },
            { Icon: TrendingUp, color: T.gold,     val: `${winRate}%`,  label: 'Taux'      },
            { Icon: Skull,      color: T.danger,   val: losses,         label: 'Défaites'  },
          ].map((s, i) => (
            <React.Fragment key={`s${i}`}>
              {i > 0 && <View style={styles.statDiv} />}
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
                  <s.Icon size={15} color={s.color} />
                </View>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>

        {/* BANNER DUEL */}
        <Animated.View style={[styles.duelBanner, { opacity: fadeAnim }]}>
          <View style={styles.duelBannerL}>
            <Swords size={18} color="#A855F7" />
            <View>
              <Text style={styles.duelBannerTitle}>Duels 1v1</Text>
              <Text style={styles.duelBannerSub}>Affronte un joueur en direct</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.duelBannerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('DuelTab');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.duelBannerBtnTxt}>VOIR</Text>
            <ChevronRight size={13} color="#A855F7" />
          </TouchableOpacity>
        </Animated.View>

        {/* ACCÈS RAPIDE */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>ACCÈS RAPIDE</Text>
              <Text style={styles.sectionSub}>
                {history.length > 0 ? 'Tes défis les plus joués' : 'Défis populaires'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAll}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigate('GameSelect');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAllTxt}>Voir tout</Text>
              <ChevronRight size={12} color={T.gold} />
            </TouchableOpacity>
          </View>
          <View style={styles.quickGrid}>
            {quickDefis.slice(0, 4).map((defi, i) => (
              <QuickCard
                key={`q${defi.id}${i}`}
                defi={defi}
                index={i}
                onPress={(d) => navigate('Config', { gameKey: d.gameKey, defi: d })}
              />
            ))}
          </View>
        </Animated.View>

        {/* FILE D'ATTENTE */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHead}>
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
                <Text style={styles.queueBadgeTxt}>{queue.length}</Text>
              </View>
            )}
          </View>

          {queue.length === 0 ? (
            <View style={styles.emptyQueue}>
              <Clock size={28} color={T.muted} />
              <Text style={styles.emptyQueueTitle}>File vide</Text>
              <Text style={styles.emptyQueueTxt}>
                Configure un défi et appuie sur{'\n'}"Ajouter à la file"
              </Text>
            </View>
          ) : (
            queue.map((item, i) => (
              <QueueCard
                key={item.queueId}
                item={item}
                index={i}
                onPlay={handlePlay}
                onRemove={handleRemove}
              />
            ))
          )}
        </Animated.View>

        {/* HISTORIQUE */}
        {history.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>DERNIERS RÉSULTATS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('HistoTab')}>
                <Text style={styles.seeAllTxt}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {history.slice(0, 4).map((h, i) => {
              const win  = h.outcome === 'win';
              const gain = Math.round(h.mise * (h.cote || 2));
              return (
                <View key={`h${i}`} style={styles.histRow}>
                  <View style={[styles.histDot, { backgroundColor: win ? T.success : T.danger }]} />
                  <Text style={styles.histName} numberOfLines={1}>{h.defi?.nom || 'Défi'}</Text>
                  <Text style={[styles.histAmt, { color: win ? T.success : T.danger }]}>
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
  screen: { flex: 1, backgroundColor: '#080A0F' },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },
  orb1:   { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: T.gaming,   opacity: 0.07 },
  orb2:   { position: 'absolute', top: 300, left: -80,  width: 180, height: 180, borderRadius: 90,  backgroundColor: T.physique, opacity: 0.06 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, marginBottom: 18 },
  greetingDate: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginBottom: 4 },
  greetingText: { fontFamily: 'Rajdhani-Bold', fontSize: 30, color: '#EEEEF5' },
  greetingName: { color: T.gold },
  avatarBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: T.gold + '12', borderWidth: 1.5, borderColor: T.gold + '35', justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' },
  statBox:  { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 5 },
  statDiv:  { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 12 },
  statIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  statVal:  { fontFamily: 'Rajdhani-Bold', fontSize: 19, color: '#EEEEF5' },
  statLbl:  { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '600' },

  duelBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, borderColor: '#A855F7' + '30', padding: 14, marginBottom: 20 },
  duelBannerL:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  duelBannerTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5' },
  duelBannerSub:   { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginTop: 2 },
  duelBannerBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#A855F7' + '15', borderWidth: 1, borderColor: '#A855F7' + '40', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  duelBannerBtnTxt:{ fontFamily: 'Rajdhani-Bold', fontSize: 13, color: '#A855F7', letterSpacing: 1 },

  section:     { marginBottom: 22 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2 },
  sectionSub:  { fontFamily: 'Inter-Regular', fontSize: 12, color: '#EEEEF5', marginTop: 3 },
  seeAll:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllTxt:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gold, fontWeight: '600' },

  quickGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard:     { width: (W - 46) / 2, backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 14, position: 'relative' },
  quickAccent:   { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  quickBadge:    { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  quickBadgeTxt: { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800' },
  quickNom:      { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5', marginTop: 8, marginBottom: 4, lineHeight: 20 },
  quickGame:     { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  quickFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quickPalierDot:{ width: 6, height: 6, borderRadius: 3 },
  quickCote:     { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, fontWeight: '700' },

  queueBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.gold + '15', borderWidth: 1, borderColor: T.gold + '30', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  queueBadgeTxt: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.gold, fontWeight: '800' },

  emptyQueue:      { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 32, alignItems: 'center', gap: 10 },
  emptyQueueTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5' },
  emptyQueueTxt:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 18 },

  queueCard:       { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 3, padding: 16 },
  queueHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  queueHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  queueDot:        { width: 7, height: 7, borderRadius: 4 },
  queueGame:       { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  queuePalier:     { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  queuePalierTxt:  { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  queueCote:       { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, fontWeight: '700' },
  queueNom:        { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5', marginBottom: 6 },
  queueCondRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  queueCondBullet: { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  queueCond:       { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, flex: 1, lineHeight: 17 },
  queueFinance:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12, flexWrap: 'wrap' },
  queueFinanceLabel:{ fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },
  queueFinanceValue:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 12, fontWeight: '700' },
  queueBtns:       { flexDirection: 'row', gap: 10 },
  playBtn:         { flex: 1, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  playBtnTxt:      { fontFamily: 'Rajdhani-Bold', fontSize: 13, color: '#000', letterSpacing: 1.2 },
  removeBtn:       { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: T.danger + '10', borderWidth: 1, borderColor: T.danger + '30', flexDirection: 'row', alignItems: 'center', gap: 5 },
  removeBtnTxt:    { fontFamily: 'Rajdhani-Bold', fontSize: 11, color: T.danger },

  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  histDot: { width: 7, height: 7, borderRadius: 4 },
  histName:{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5' },
  histAmt: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, fontWeight: '700' },
});