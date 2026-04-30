// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Dumbbell,
  Timer,
  Smile,
  Footprints,
  Zap,
  TrendingUp,
  Shield,
  User,
  ChevronRight,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { DEFIS_PHYSIQUES } from '../constants/defisPhysiques';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';
import ChallengeHistoryItem from '../components/ChallengeHistoryItem';

// 8 catégories avec leurs icônes dédiées
const PHYSICAL_CATEGORIES = [
  { key: 'pompes',   label: 'POMPES',    icon: Dumbbell,   color: T.physique },
  { key: 'squats',   label: 'SQUATS',    icon: TrendingUp, color: T.physique },
  { key: 'planche',  label: 'PLANCHE',   icon: Shield,     color: T.physique },
  { key: 'abdos',    label: 'ABDOS',     icon: Smile,      color: T.physique },
  { key: 'burpees',  label: 'BURPEES',   icon: Zap,        color: T.physique },
  { key: 'sprint',   label: 'SPRINT',    icon: Timer,      color: T.physique },
  { key: 'saut',     label: 'SAUT',      icon: Footprints, color: T.physique },
  { key: 'gainage',  label: 'GAINAGE',   icon: Shield,     color: T.physique },
];

function CategoryCard({ category, onPress }) {
  const Icon = category.icon;
  const count = DEFIS_PHYSIQUES[category.key]?.length || 0;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={styles.categoryCard}
    >
      <LinearGradient
        colors={['rgba(255,107,0,0.12)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.categoryGradient}
      />
      <View style={styles.categoryContent}>
        <View style={[styles.categoryIcon, { backgroundColor: '#1a1a1a' }]}>
          <Icon size={28} color={T.physique} />
        </View>
        <View style={styles.categoryTextBlock}>
          <Text style={styles.categoryTitle}>{category.label}</Text>
          <Text style={styles.categorySubtitle}>{count} exercices disponibles</Text>
        </View>
        <ChevronRight size={18} color={T.physique} />
      </View>
    </Pressable>
  );
}

export default function PhysicalChallengesScreen() {
  const navigation = useNavigation();
  const { history } = useSession();

  const physicalHistory = history.filter(
    h => h.mode !== 'duo' && h.game === 'physique',
  );

  // Navigation vers DefiSelect avec la catégorie
  const goToDefiSelect = (categoryKey) => {
    navigation.navigate('DefiSelect', {
      gameKey: 'physique',
      category: categoryKey,
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DÉFIS PHYSIQUES</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
          <View style={styles.avatar}>
            <User size={22} color={T.gold} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>CATÉGORIES D'EXERCICES</Text>
        {PHYSICAL_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.key}
            category={cat}
            onPress={() => goToDefiSelect(cat.key)}
          />
        ))}

        {physicalHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>HISTORIQUE DES PERFORMANCES</Text>
            {physicalHistory.map((h, index) => (
              <ChallengeHistoryItem key={h.id} item={h} index={index} type="physique" />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14,
    backgroundColor: '#050505', borderBottomWidth: 1, borderBottomColor: '#222',
  },
  headerTitle: { fontFamily: T.fontTitle, fontSize: 22, color: '#fff', letterSpacing: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#121212',
    borderWidth: 1, borderColor: '#222', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100, marginTop: 20 },
  sectionLabel: { fontFamily: T.fontBody, fontSize: 13, color: '#666', letterSpacing: 1.5, marginBottom: 12, marginTop: 10 },
  categoryCard: {
    width: '100%', height: 90, backgroundColor: '#121212', borderRadius: 20,
    borderWidth: 1, borderColor: '#222', marginBottom: 12, overflow: 'hidden', position: 'relative',
  },
  categoryGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  categoryContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: '100%' },
  categoryIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  categoryTextBlock: { flex: 1 },
  categoryTitle: { fontFamily: T.fontTitle, fontSize: 20, color: '#fff', fontWeight: '600', marginBottom: 4 },
  categorySubtitle: { fontFamily: T.fontBody, fontSize: 13, color: '#666' },
  historySection: { marginTop: 24 },
});