// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Gamepad2, ChevronRight, User } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { GAMES } from '../constants/games';
import { DEFIS } from '../constants/defis';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';
import ChallengeHistoryItem from '../components/ChallengeHistoryItem';

const GAMING_ENTRIES = Object.entries(GAMES).filter(([key]) => key !== 'physique');

function GameCategoryCard({ gameKey, game, onPress }) {
  const defisCount = DEFIS[gameKey]?.length || 0;
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={styles.categoryCard}
    >
      <LinearGradient
        colors={['rgba(0,240,255,0.12)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.categoryGradient}
      />
      <View style={styles.categoryContent}>
        <View style={styles.categoryIcon}>
          <Gamepad2 size={28} color={T.gaming} />
        </View>
        <View style={styles.categoryTextBlock}>
          <Text style={styles.categoryTitle}>{game.label}</Text>
          <Text style={styles.categorySubtitle}>{game.short}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{defisCount} défis</Text>
          <ChevronRight size={16} color={T.gaming} />
        </View>
      </View>
    </Pressable>
  );
}

export default function GamingChallengesScreen() {
  const navigation = useNavigation();
  const { history } = useSession();

  const gamingHistory = history.filter(
    h => h.mode !== 'duo' && GAMING_ENTRIES.some(([key]) => key === h.game)
  );

  const goToDefiSelect = (gameKey) => {
    navigation.navigate('DefiSelect', { gameKey });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DÉFIS GAMING</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
          <View style={styles.avatar}>
            <User size={22} color={T.gold} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>CATÉGORIES DE JEUX</Text>
        {GAMING_ENTRIES.map(([key, game]) => (
          <GameCategoryCard
            key={key}
            gameKey={key}
            game={game}
            onPress={() => goToDefiSelect(key)}
          />
        ))}

        {gamingHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>HISTORIQUE DES JEUX</Text>
            {gamingHistory.map((h, index) => (
              <ChallengeHistoryItem key={h.id} item={h} index={index} type="gaming" />
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
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,240,255,0.08)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6,
  },
  categoryBadgeText: { fontFamily: T.fontBody, fontSize: 12, color: T.gaming, fontWeight: '500' },
  historySection: { marginTop: 24 },
});