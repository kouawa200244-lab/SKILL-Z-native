// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Gamepad2, Dumbbell, Zap, Skull } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { DEFIS } from '../constants/defis';
import { DEFIS_PHYSIQUES, ALL_DEFIS_PHYSIQUES } from '../constants/defisPhysiques';
import { T } from '../utils/designTokens';
import { coteCol } from '../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── CARTE STEALTH OBSIDIAN ──────────────────────────────────────────────────
function DefiCard({ defi, onPress, isPhysique }) {
  const pc = PALIERS[defi.p] || {};
  const difficultyColor = pc.color || T.gold;
  const isHard = defi.p === 'avance' || defi.p === 'expert' || defi.p === 'legendaire';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Couleur de rappel : cote cyan pour physique, orange pour gaming
  const coteColor = isPhysique ? T.gaming : T.physique;

  // Dégradé de fond de la carte (stealth)
  const cardGradient = isPhysique
    ? ['#FF6B0008', '#0A0A0A']
    : ['#00F0FF08', '#0A0A0A'];

  // Icône de catégorie
  const CategoryIcon = isPhysique ? Dumbbell : Gamepad2;

  return (
    <TouchableOpacity
      style={styles.obsidianCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Fond sombre + lueur intérieure */}
      <LinearGradient
        colors={cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Lueur subtile sur la bordure supérieure */}
      <View style={[styles.topGlow, { backgroundColor: isPhysique ? T.physique : T.gaming }]} />

      {/* Image masquée progressivement (à gauche) */}
      <View style={styles.imageMask}>
        <LinearGradient
          colors={[isPhysique ? T.physique : T.gaming, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        <CategoryIcon size={64} color="#ffffff20" style={{ position: 'absolute', left: 10, top: 10 }} />
      </View>

      <View style={styles.cardContent}>
        {/* Icône de catégorie en contour */}
        <CategoryIcon size={18} color={isPhysique ? T.physique : T.gaming} style={{ marginBottom: 8, opacity: 0.7 }} />

        {/* Titre (en majuscules si difficile) */}
        <Text style={[styles.defiName, isHard && { textTransform: 'uppercase', letterSpacing: 2 }]}>
          {defi.nom}
        </Text>
        <Text style={styles.defiCond}>{defi.cond}</Text>

        {/* Badge de difficulté : point LED + nom du palier */}
        <View style={styles.difficultyRow}>
          <View style={[styles.led, { backgroundColor: difficultyColor, shadowColor: difficultyColor }]} />
          <Text style={[styles.difficultyLabel, { color: difficultyColor }]}>{pc.label?.toUpperCase()}</Text>
        </View>

        {/* Cote animée */}
        <Animated.View style={[styles.coteContainer, { transform: [{ scale: pulseAnim }], borderColor: coteColor + '40' }]}>
          <Zap size={14} color={coteColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.coteText, { color: coteColor, textShadowColor: coteColor + '60' }]}>
            ×{defi.cote.toFixed(2)}
          </Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// ─── ÉCRAN PRINCIPAL ──────────────────────────────────────────────────────────
export default function DefiSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const gameKey = route.params?.gameKey || 'fifa';
  const category = route.params?.category;
  const insets = useSafeAreaInsets();

  const isPhysique = gameKey === 'physique';
  const g = GAMES[gameKey];
  const Icon = isPhysique ? Dumbbell : Gamepad2;
  const accentColor = isPhysique ? T.physique : g.color;

  const allDefis = isPhysique
    ? (category ? DEFIS_PHYSIQUES[category] || [] : ALL_DEFIS_PHYSIQUES)
    : DEFIS[gameKey] || [];

  const renderDefi = ({ item }) => (
    <DefiCard
      defi={item}
      isPhysique={isPhysique}
      onPress={() => navigation.navigate('Config', { gameKey, defi: item })}
    />
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.titleRow, { marginTop: insets.top + 20 }]}>
        <Icon size={28} color={accentColor} style={{ marginRight: 10 }} />
        <Text style={[styles.titleText, { color: accentColor }]}>
          {isPhysique ? 'DÉFIS PHYSIQUES' : g.label} — CHOISIR LE DÉFI
        </Text>
      </View>

      <FlatList
        data={allDefis}
        renderItem={renderDefi}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050505' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  titleText: { fontFamily: T.fontTitle, fontSize: 20, letterSpacing: 2, flex: 1 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  obsidianCard: {
    width: '100%',
    height: 180,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.3,
  },
  imageMask: {
    width: '40%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    position: 'relative',
    zIndex: 1,
  },
  defiName: {
    fontFamily: T.fontTitle,
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  defiCond: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
    marginBottom: 12,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  led: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  difficultyLabel: {
    fontFamily: T.fontBody,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  coteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderWidth: 1,
  },
  coteText: {
    fontFamily: T.fontMono,
    fontSize: 20,
    fontWeight: '800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginTop: 2,
  },
});