// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Search, ChevronRight, Gamepad2, Dumbbell, User,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { GAMES } from '../constants/games';
import { DEFIS } from '../constants/defis';
import { useNavigation } from '@react-navigation/native';

export default function GamesScreen() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('tous'); // 'tous', 'gaming', 'physique'

  // Construit dynamiquement toutes les catégories
  const allCategories = useMemo(() => {
    const cats = [];
    Object.entries(GAMES).forEach(([key, game]) => {
      const defisCount = DEFIS[key]?.length || 0;
      const isPhysique = key === 'physique';
      cats.push({
        key,
        label: game.label.toUpperCase(),
        short: game.short,
        defis: defisCount,
        color: isPhysique ? '#FF6B00' : game.color || '#00F0FF',
        type: isPhysique ? 'physique' : 'gaming',
        gameKey: key,
        category: isPhysique ? key : undefined,
      });
    });
    return cats;
  }, []);

  // Filtrage
  const filteredCategories = useMemo(() => {
    let result = allCategories;
    if (filterType === 'gaming') result = result.filter(c => c.type === 'gaming');
    if (filterType === 'physique') result = result.filter(c => c.type === 'physique');
    if (searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      result = result.filter(c => c.label.toLowerCase().includes(query));
    }
    return result;
  }, [searchText, filterType, allCategories]);

  const handleCategoryPress = (cat) => {
    if (cat.type === 'gaming') {
      navigation.navigate('DefiSelect', { gameKey: cat.gameKey });
    } else {
      navigation.navigate('DefiSelect', { gameKey: 'physique', category: cat.key });
    }
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color="#00F0FF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un jeu ou une catégorie..."
            placeholderTextColor="#555"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.avatar}>
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
                style={[styles.filterChip, active && { backgroundColor: f.color }]}
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
          const accentColor = cat.color;
          const Icon = cat.type === 'physique' ? Dumbbell : Gamepad2;
          return (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryCard}
              activeOpacity={0.8}
              onPress={() => handleCategoryPress(cat)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: accentColor + '20' }]}>
                <Icon size={24} color={accentColor} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{cat.label}</Text>
                <Text style={styles.categorySubtitle}>{cat.defis} DÉFIS</Text>
              </View>
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
  screen: { flex: 1, backgroundColor: '#0A0A0A', paddingTop: 60, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontFamily: T.fontBody, fontSize: 14, color: '#fff' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginLeft: 12, borderWidth: 1, borderColor: '#222' },
  filterSection: { marginBottom: 16 },
  filterLabel: { fontFamily: T.fontBody, fontSize: 11, color: '#555', letterSpacing: 1.5, marginBottom: 8 },
  filterScroll: { maxHeight: 40 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterChipText: { fontFamily: T.fontBody, fontSize: 12, color: '#fff', fontWeight: '600' },
  listContainer: { paddingBottom: 100 },
  categoryCard: { width: '100%', height: 90, backgroundColor: '#121212', borderRadius: 16, borderWidth: 1, borderColor: '#222', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, overflow: 'hidden' },
  categoryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  categoryInfo: { flex: 1 },
  categoryTitle: { fontFamily: T.fontTitle, fontSize: 16, color: '#fff', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  categorySubtitle: { fontFamily: T.fontBody, fontSize: 12, color: '#888' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  categoryBadgeText: { fontFamily: T.fontTitle, fontSize: 12, fontWeight: '600' },
});