// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Zap, Shield, Target, Clock, Star } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { DEFIS } from '../constants/defis';
import { T } from '../utils/designTokens';
import { coteCol } from '../utils/helper';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: W } = Dimensions.get('window');

const PALIER_ICONS = {
  debutant: Star,
  intermediaire: Target,
  avance: Zap,
  expert: Shield,
  legendaire: Clock,
};

export default function DefiSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const gameKey = route.params?.gameKey || 'fifa';
  const [palier, setPalier] = useState('tous');
  const scrollY = useRef(new Animated.Value(0)).current;

  const g = GAMES[gameKey];
  const allDefis = DEFIS[gameKey] || [];
  const shown = palier === 'tous' ? allDefis : allDefis.filter(d => d.p === palier);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Sticky header blur simulé */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <Text style={[styles.stickyTitle, { color: g?.color || T.gold }]}>
          {g?.short || gameKey.toUpperCase()}
        </Text>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={T.muted} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        {/* Hero Header */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { backgroundColor: (g?.color || T.gold) + '15', borderColor: (g?.color || T.gold) + '30' }]}>
            <Text style={[styles.heroBadgeText, { color: g?.color || T.gold }]}>
              {allDefis.length} DÉFIS
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {g?.label || gameKey}
          </Text>
          <View style={[styles.heroLine, { backgroundColor: g?.color || T.gold }]} />
          <Text style={styles.heroSub}>Choisis ton niveau de défi</Text>
        </View>

        {/* Filtres palier */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
          {['tous', ...Object.keys(PALIERS)].map(p => {
            const cfg = p === 'tous' ? { label: 'Tous', color: T.gold } : PALIERS[p];
            const active = palier === p;
            const Icon = p !== 'tous' ? PALIER_ICONS[p] : Star;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPalier(p)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: cfg.color + '20', borderColor: cfg.color },
                ]}
                activeOpacity={0.7}
              >
                <Icon size={11} color={active ? cfg.color : T.muted} />
                <Text style={[styles.filterText, active && { color: cfg.color }]}>
                  {cfg.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Compteur */}
        <Text style={styles.countText}>
          {shown.length} défi{shown.length > 1 ? 's' : ''} disponible{shown.length > 1 ? 's' : ''}
        </Text>

        {/* Cartes */}
        {shown.map((d, index) => {
          const pc = PALIERS[d.p] || {};
          const col = coteCol(d.cote);
          const isHigh = d.cote >= 3;

          return (
            <TouchableOpacity
              key={d.id}
              onPress={() => navigation.navigate('Config', { gameKey, defi: d })}
              activeOpacity={0.85}
              style={styles.cardWrapper}
            >
              {/* Glow border effect pour les hautes cotes */}
              {isHigh && (
                <View style={[styles.cardGlow, { shadowColor: col }]} />
              )}

              <View style={[styles.card, isHigh && { borderColor: col + '40' }]}>
                {/* Top accent line */}
                <View style={[styles.cardAccent, { backgroundColor: pc.color || T.gold }]} />

                <View style={styles.cardInner}>
                  {/* Left content */}
                  <View style={styles.cardLeft}>
                    {/* Palier badge */}
                    <View style={[styles.palierBadge, { backgroundColor: pc.dim || '#111', borderColor: (pc.color || T.gold) + '40' }]}>
                      <View style={[styles.palierDot, { backgroundColor: pc.color || T.gold }]} />
                      <Text style={[styles.palierLabel, { color: pc.color || T.gold }]}>
                        {pc.label?.toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.defiNom}>{d.nom}</Text>
                    <Text style={styles.defiCond} numberOfLines={2}>{d.cond}</Text>

                    {/* Taux réussite */}
                    <View style={styles.tauxRow}>
                      <View style={styles.tauxBar}>
                        <View style={[styles.tauxFill, { width: `${d.taux}%`, backgroundColor: pc.color || T.gold }]} />
                      </View>
                      <Text style={styles.tauxLabel}>{d.taux}%</Text>
                    </View>
                  </View>

                  {/* Right — Cote */}
                  <View style={[styles.coteBubble, { borderColor: col + '50', backgroundColor: col + '08' }]}>
                    <Zap size={14} color={col} style={{ marginBottom: 2 }} />
                    <Text style={[styles.coteValue, { color: col }]}>
                      ×{d.cote.toFixed(2)}
                    </Text>
                    {isHigh && (
                      <Text style={[styles.coteHot, { color: col }]}>HOT</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {shown.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun défi pour ce palier</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080A0F' },

  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99,
    height: 56, backgroundColor: 'rgba(8,10,15,0.95)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  stickyTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 16, letterSpacing: 3 },

  scrollContent: { paddingTop: 56, paddingBottom: 120, paddingHorizontal: 18 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28, paddingTop: 4 },
  backText: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },

  /* Hero */
  hero: { marginBottom: 28 },
  heroBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  heroBadgeText: { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  heroTitle: {
    fontFamily: 'Rajdhani-Bold', fontSize: 36, color: '#EEEEF5',
    letterSpacing: 1, lineHeight: 40, marginBottom: 10,
  },
  heroLine: { width: 40, height: 3, borderRadius: 2, marginBottom: 10 },
  heroSub: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },

  /* Filtres */
  filtersScroll: { marginBottom: 8 },
  filtersContent: { gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterText: { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '700', color: T.muted, letterSpacing: 1 },

  countText: {
    fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted,
    letterSpacing: 0.5, marginBottom: 16, marginTop: 8,
  },

  /* Cartes */
  cardWrapper: { marginBottom: 12, position: 'relative' },
  cardGlow: {
    position: 'absolute', inset: 0, borderRadius: 16,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 8,
  },
  card: {
    backgroundColor: '#0F1219',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  cardAccent: { height: 2, width: '100%' },
  cardInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, gap: 14,
  },
  cardLeft: { flex: 1 },

  palierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10,
  },
  palierDot: { width: 5, height: 5, borderRadius: 3 },
  palierLabel: { fontFamily: 'Inter-Regular', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  defiNom: {
    fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#E8E8EE',
    letterSpacing: 0.5, marginBottom: 5,
  },
  defiCond: {
    fontFamily: 'Inter-Regular', fontSize: 12, color: '#5A5A6B',
    lineHeight: 18, marginBottom: 14,
  },

  tauxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tauxBar: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, overflow: 'hidden',
  },
  tauxFill: { height: '100%', borderRadius: 2 },
  tauxLabel: { fontFamily: 'JetBrainsMono-Regular', fontSize: 10, color: T.muted },

  /* Cote */
  coteBubble: {
    width: 72, height: 72, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  coteValue: { fontFamily: 'JetBrainsMono-Regular', fontSize: 17, fontWeight: '700' },
  coteHot: { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: T.muted },
});