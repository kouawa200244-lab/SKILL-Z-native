// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Gamepad2, ArrowLeft } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { DEFIS } from '../constants/defis';
import { T } from '../utils/designTokens';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const GAME_ENTRIES = Object.entries(GAMES).filter(([key]) => key !== 'physique');

export default function GameSelectScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }) => {
    const [key, g] = item;
    const accentColor = g.color;
    return (
      <TouchableOpacity
        style={[styles.card, { borderTopColor: accentColor }]}
        onPress={() => navigation.navigate('DefiSelect', { gameKey: key })}
        activeOpacity={0.8}
      >
        <Gamepad2 size={32} color={accentColor} style={{ marginBottom: 10 }} />
        <Text style={styles.gameShort}>{g.short}</Text>
        <Text style={styles.gameLabel}>{g.label}</Text>
        <Text style={styles.gameDefisCount}>{DEFIS[key]?.length || 0} défis</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Bouton retour discret */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={T.text} />
      </TouchableOpacity>

      <FlatList
        data={GAME_ENTRIES}
        renderItem={renderItem}
        keyExtractor={([key]) => key}
        numColumns={2}
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 10, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  gameShort: {
    fontFamily: T.fontTitle,
    fontSize: 20,
    fontWeight: '600',
    color: T.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  gameLabel: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  gameDefisCount: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.muted,
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: 160,
    backgroundColor: T.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    borderTopWidth: 4,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});