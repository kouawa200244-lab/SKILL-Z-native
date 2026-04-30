// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ArrowLeft, Gamepad2, Dumbbell } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { DEFIS } from '../constants/defis';
import { DEFIS_PHYSIQUES, ALL_DEFIS_PHYSIQUES } from '../constants/defisPhysiques';
import { T } from '../utils/designTokens';
import { coteCol } from '../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';
import Pill from '../components/Pill';
import CoteDisplay from '../components/CoteDisplay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DefiSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const gameKey = route.params?.gameKey || 'fifa';
  const category = route.params?.category;
  const [palier, setPalier] = useState('tous');
  const insets = useSafeAreaInsets();

  const isPhysique = gameKey === 'physique';
  const g = GAMES[gameKey];
  const Icon = isPhysique ? Dumbbell : Gamepad2;
  const accentColor = isPhysique ? T.physique : g.color;

  // Récupérer les défis selon le jeu (gaming ou physique)
  const allDefis = isPhysique
    ? (category ? DEFIS_PHYSIQUES[category] || [] : ALL_DEFIS_PHYSIQUES)
    : DEFIS[gameKey] || [];

  const shown = palier === 'tous' ? allDefis : allDefis.filter(d => d.p === palier);

  // Rendu d'un défi
  const renderDefi = ({ item: d }) => {
    const pc = PALIERS[d.p] || {};
    const col = coteCol(d.cote);
    return (
      <TouchableOpacity
        style={styles.defiCard}
        onPress={() => navigation.navigate('Config', { gameKey, defi: d })}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.defiNom}>{d.nom}</Text>
            <Text style={styles.defiCond}>{d.cond}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Pill label={pc.label || ''} color={pc.color} dim={pc.dim} />
              <Text style={styles.tauxText}>~{d.taux}%</Text>
            </View>
          </View>
          <CoteDisplay cote={d.cote} size={16} />
        </View>
      </TouchableOpacity>
    );
  };

  // Rendu d'un bouton de palier
  const renderPalier = ({ item: p }) => {
    const cfg = p === 'tous' ? { label: 'Tous', color: T.gold } : PALIERS[p];
    const active = palier === p;
    return (
      <TouchableOpacity
        style={[styles.palierBtn, active && { borderColor: cfg.color, backgroundColor: cfg.color + '18' }]}
        onPress={() => setPalier(p)}
      >
        <Text style={[styles.palierText, active && { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Bouton retour */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={T.text} />
      </TouchableOpacity>

      {/* En-tête avec icône et nom du jeu */}
      <View style={[styles.titleRow, { marginTop: insets.top + 50 }]}>
        <Icon size={28} color={accentColor} style={{ marginRight: 10 }} />
        <Text style={[styles.titleText, { color: accentColor }]}>
          {isPhysique ? 'DÉFIS PHYSIQUES' : g.label} — CHOISIR LE DÉFI
        </Text>
      </View>

      {/* Paliers horizontaux */}
      <FlatList
        data={['tous', ...Object.keys(PALIERS)]}
        renderItem={renderPalier}
        keyExtractor={(p) => p}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.palierList}
        contentContainerStyle={styles.palierContainer}
      />

      {/* Liste verticale des défis */}
      <FlatList
        data={shown}
        renderItem={renderDefi}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleText: {
    fontFamily: T.fontTitle,
    fontSize: 20,
    letterSpacing: 2,
    flex: 1,
  },
  palierList: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  palierContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  palierBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.card,
  },
  palierText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.muted,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  defiCard: {
    backgroundColor: T.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    borderLeftWidth: 4,
    borderLeftColor: T.gold,
    padding: 16,
    marginBottom: 10,
  },
  defiNom: {
    fontFamily: T.fontTitle,
    fontSize: 17,
    color: T.text,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  defiCond: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.muted,
    lineHeight: 20,
  },
  tauxText: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.muted,
  },
});