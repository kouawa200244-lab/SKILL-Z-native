// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, ChevronRight } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { DEFIS } from '../constants/defis';
import { T } from '../utils/designTokens';
import { useNavigation } from '@react-navigation/native';

// Jeux gaming uniquement
const GAMING_ENTRIES = Object.entries(GAMES).filter(([key]) => key !== 'physique');

export default function GamingCategoriesScreen() {
  const navigation = useNavigation();

  const renderItem = ({ item }) => {
    const [key, g] = item;
    const defisCount = DEFIS[key]?.length || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DefiSelect', { gameKey: key })}
      >
        <LinearGradient
          colors={['rgba(0,240,255,0.15)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
        <View style={styles.content}>
          {/* Icône */}
          <View style={styles.iconContainer}>
            <Gamepad2 size={28} color={T.gaming} />
          </View>
          {/* Informations */}
          <View style={styles.textBlock}>
            <Text style={styles.title}>{g.label}</Text>
            <Text style={styles.subtitle}>{g.short}</Text>
          </View>
          {/* Badge nombre de défis */}
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: T.gaming }]}>{defisCount} défis</Text>
            <ChevronRight size={16} color={T.gaming} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.headerTitle}>DÉFIS GAMING</Text>
      <FlatList
        data={GAMING_ENTRIES}
        renderItem={renderItem}
        keyExtractor={([key]) => key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0A0A0A', paddingTop: 60 },
  headerTitle: {
    fontFamily: T.fontTitle,
    fontSize: 24,
    color: T.text,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    height: 90,
    backgroundColor: '#121212',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontFamily: T.fontTitle,
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: '#666',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,240,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.gaming,
    fontWeight: '500',
  },
});