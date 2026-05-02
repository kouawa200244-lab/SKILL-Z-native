// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Animated, StatusBar, Dimensions
} from 'react-native';
import {
  Search, User, Gamepad2, Dumbbell,
  ChevronRight, Zap, Flame
} from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { DEFIS } from '../constants/defis';
import { T } from '../utils/designTokens';
import { useNavigation } from '@react-navigation/native';

const { width: W } = Dimensions.get('window');

const GAME_META = {
  pes:      { icon: Gamepad2, gradient: ['#064E3B', '#022c22'], label: 'PES / eFOOTBALL',    sub: 'eFootball 2024' },
  fifa:     { icon: Gamepad2, gradient: ['#1E3A5F', '#0f1f35'], label: 'FIFA / EA FC',        sub: 'EA Sports FC 25' },
  nba:      { icon: Gamepad2, gradient: ['#7C2D12', '#431407'], label: 'NBA 2K',              sub: 'NBA 2K25' },
  nfs:      { icon: Gamepad2, gradient: ['#713F12', '#3f2006'], label: 'NEED FOR SPEED',      sub: 'NFS Unbound' },
};

const FILTERS = [
  { key: 'tous',     label: 'TOUS' },
  { key: 'gaming',   label: 'GAMING' },
  { key: 'physique', label: 'PHYSIQUE' },
];

export default function GameSelectScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');
  const searchAnim = useRef(new Animated.Value(0)).current;

  const games = Object.entries(GAMES).map(([key, g]) => ({
    key,
    ...g,
    ...GAME_META[key],
    count: (DEFIS[key] || []).length,
    category: key === 'physique' ? 'physique' : 'gaming',
  }));

  const filtered = games.filter(g => {
    const matchSearch = g.label.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'tous' || g.category === filter;
    return matchSearch && matchFilter;
  });

  const onSearchFocus = () => {
    Animated.spring(searchAnim, { toValue: 1, useNativeDriver: false }).start();
  };
  const onSearchBlur = () => {
    Animated.spring(searchAnim, { toValue: 0, useNativeDriver: false }).start();
  };

  const searchBorder = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.08)', T.gaming],
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEyebrow}>SKILL'Z</Text>
            <Text style={styles.headerTitle}>Arène</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <User size={20} color={T.gold} />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <Animated.View style={[styles.searchBox, { borderColor: searchBorder }]}>
          <Search size={16} color={T.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un jeu ou une catégorie..."
            placeholderTextColor={T.muted}
            value={search}
            onChangeText={setSearch}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: T.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filtres */}
        <View style={styles.filtersBlock}>
          <Text style={styles.filtersLabel}>FILTRER PAR :</Text>
          <View style={styles.filtersRow}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                  ]}
                >
                  {f.key === 'gaming' && <Gamepad2 size={11} color={active ? '#000' : T.muted} />}
                  {f.key === 'physique' && <Dumbbell size={11} color={active ? '#000' : T.muted} />}
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Compteur */}
        <Text style={styles.countLabel}>
          {filtered.length} catégorie{filtered.length > 1 ? 's' : ''}
        </Text>

        {/* Liste */}
        {filtered.map((g, i) => {
          const Icon = g.icon || Gamepad2;
          const isHot = g.count >= 16;

          return (
            <TouchableOpacity
              key={g.key}
              style={styles.card}
              onPress={() => navigation.navigate('DefiSelect', { gameKey: g.key })}
              activeOpacity={0.8}
            >
              {/* Icône avec fond coloré */}
              <View style={[styles.iconBox, { backgroundColor: g.gradient?.[0] || '#1A1D23' }]}>
                <Icon size={22} color={g.color || T.gold} />
              </View>

              {/* Texte */}
              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{g.label}</Text>
                  {isHot && (
                    <View style={styles.hotBadge}>
                      <Flame size={9} color="#FF6B00" />
                      <Text style={styles.hotText}>HOT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSub}>{g.sub}</Text>
              </View>

              {/* Défis count + chevron */}
              <View style={styles.cardRight}>
                <Text style={[styles.defiCount, { color: g.color || T.gold }]}>
                  {g.count} DÉFIS
                </Text>
                <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Aucun résultat pour "{search}"</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingTop: 60, paddingBottom: 120, paddingHorizontal: 18 },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 24,
  },
  headerLeft: {},
  headerEyebrow: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold,
    fontWeight: '800', letterSpacing: 3, marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'Rajdhani-Bold', fontSize: 38, color: '#EEEEF5',
    letterSpacing: 1, lineHeight: 40,
  },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.gold + '15', borderWidth: 1.5,
    borderColor: T.gold + '40', justifyContent: 'center', alignItems: 'center',
  },

  /* Recherche */
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 22,
  },
  searchInput: {
    flex: 1, fontFamily: 'Inter-Regular', fontSize: 14,
    color: '#EEEEF5', padding: 0,
  },

  /* Filtres */
  filtersBlock: { marginBottom: 20 },
  filtersLabel: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted,
    fontWeight: '700', letterSpacing: 2, marginBottom: 10,
  },
  filtersRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterChipActive: {
    backgroundColor: T.gaming, borderColor: T.gaming,
  },
  filterText: {
    fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '700',
    color: T.muted, letterSpacing: 0.5,
  },
  filterTextActive: { color: '#000' },

  /* Compteur */
  countLabel: {
    fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted,
    letterSpacing: 0.5, marginBottom: 14,
  },

  /* Cards */
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F1219', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 14, marginBottom: 10, gap: 14,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: {
    fontFamily: 'Rajdhani-Bold', fontSize: 17, color: '#EEEEF5', letterSpacing: 0.5,
  },
  cardSub: {
    fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted,
  },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  defiCount: {
    fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800', letterSpacing: 0.5,
  },

  /* Hot badge */
  hotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FF6B0015', borderWidth: 1,
    borderColor: '#FF6B0040', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  hotText: {
    fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800',
    color: '#FF6B00', letterSpacing: 1,
  },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: T.muted },
});