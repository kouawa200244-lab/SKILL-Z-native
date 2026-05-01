// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import {
  Search, ChevronRight,
  Gamepad2, Dumbbell, Brain, Rocket, Timer, Smile, Footprints, Zap, TrendingUp, Shield, User,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Toutes les catégories (Gaming + Physique)
const ALL_CATEGORIES = [
  // Gaming
  { key: 'fifa',      label: 'FIFA / EA SPORTS FC',    icon: Gamepad2,  color: '#00F0FF', defis: 12, type: 'gaming', gameKey: 'fifa' },
  { key: 'pes',       label: 'PES / eFOOTBALL',        icon: Gamepad2,  color: '#00F0FF', defis: 8,  type: 'gaming', gameKey: 'pes' },
  { key: 'nba',       label: 'NBA 2K / NBA 2K25',      icon: Gamepad2,  color: '#F97316', defis: 10, type: 'gaming', gameKey: 'nba' },
  { key: 'nfs',       label: 'NFS / JEUX DE COURSE',   icon: Rocket,    color: '#FACC15', defis: 7,  type: 'gaming', gameKey: 'nfs' },
  // Physique
  { key: 'pompes',    label: 'POMPES',                 icon: Dumbbell,  color: '#FF6B00', defis: 13, type: 'physique', category: 'pompes' },
  { key: 'squats',    label: 'SQUATS',                 icon: TrendingUp,color: '#FF6B00', defis: 12, type: 'physique', category: 'squats' },
  { key: 'planche',   label: 'PLANCHE',                icon: Shield,    color: '#FF6B00', defis: 11, type: 'physique', category: 'planche' },
  { key: 'abdos',     label: 'ABDOS',                  icon: Smile,     color: '#FF6B00', defis: 10, type: 'physique', category: 'abdos' },
  { key: 'burpees',   label: 'BURPEES',                icon: Zap,       color: '#FF6B00', defis: 10, type: 'physique', category: 'burpees' },
  { key: 'sprint',    label: 'SPRINT',                 icon: Timer,     color: '#FF6B00', defis: 9,  type: 'physique', category: 'sprint' },
  { key: 'saut',      label: 'SAUT',                   icon: Footprints,color: '#FF6B00', defis: 8,  type: 'physique', category: 'saut' },
  { key: 'gainage',   label: 'GAINAGE',                icon: Shield,    color: '#FF6B00', defis: 8,  type: 'physique', category: 'gainage' },
];

export default function GamesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialFilter = route.params?.initialFilter || 'tous';

  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState(initialFilter);

  // Filtrer les catégories selon la recherche et le filtre
  const filteredCategories = useMemo(() => {
    let result = ALL_CATEGORIES;
    if (filterType === 'gaming') result = result.filter(c => c.type === 'gaming');
    if (filterType === 'physique') result = result.filter(c => c.type === 'physique');
    if (searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      result = result.filter(c => c.label.toLowerCase().includes(query));
    }
    return result;
  }, [searchText, filterType]);

  // Navigation vers les défis
  const handleCategoryPress = (cat) => {
    if (cat.type === 'gaming') {
      navigation.navigate('DefiSelect', { gameKey: cat.gameKey });
    } else {
      navigation.navigate('DefiSelect', { gameKey: 'physique', category: cat.category });
    }
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color={T.gaming} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un jeu ou une catégorie..."
            placeholderTextColor="#555"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('ProfileTab')}>
          <User size={24} color={T.gold} />
        </TouchableOpacity>
      </View>

      {/* FILTRES */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>FILTRER PAR :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key: 'tous',     label: 'TOUS',          color: '#00F0FF' },
            { key: 'gaming',   label: 'GAMING',        color: '#00F0FF' },
            { key: 'physique', label: 'PHYSIQUE',      color: '#FF6B00' },
          ].map((f) => {
            const active = filterType === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: f.color },
                ]}
                onPress={() => setFilterType(f.key)}
              >
                <Text style={[styles.filterChipText, active && { color: '#0A0A0A' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LISTE DES CATÉGORIES */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;
          const accentColor = cat.color;
          return (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryCard}
              activeOpacity={0.8}
              onPress={() => handleCategoryPress(cat)}
            >
              {/* Icône */}
              <View style={[styles.categoryIcon, { backgroundColor: accentColor + '20' }]}>
                <Icon size={24} color={accentColor} />
              </View>

              {/* Infos */}
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{cat.label}</Text>
                <Text style={styles.categorySubtitle}>{cat.defis} DÉFIS</Text>
              </View>

              {/* Badge + chevron */}
              <View style={styles.categoryBadge}>
                <Text style={[styles.categoryBadgeText, { color: accentColor }]}>
                  {cat.defis} DÉFIS
                </Text>
                <ChevronRight size={16} color={accentColor} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontFamily: T.fontBody,
    fontSize: 14,
    color: '#fff',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: '#555',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  filterScroll: {
    maxHeight: 40,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 100,
  },
  categoryCard: {
    width: '100%',
    height: 90,
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontFamily: T.fontTitle,
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: '#888',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  categoryBadgeText: {
    fontFamily: T.fontTitle,
    fontSize: 12,
    fontWeight: '600',
  },
});