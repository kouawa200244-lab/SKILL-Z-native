// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Gamepad2, ArrowLeft } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { DEFIS } from '../constants/defis';
import { T } from '../utils/designTokens';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
// On ajuste le calcul pour avoir des marges plus propres
const CARD_WIDTH = (width - 40) / 2; 

const GAME_ENTRIES = Object.entries(GAMES).filter(([key]) => key !== 'physique');

export default function GameSelectScreen() {
  const navigation = useNavigation();

  const renderItem = ({ item }) => {
    const [key, g] = item;
    const accentColor = g.color;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DefiSelect', { gameKey: key })}
        activeOpacity={0.7}
      >
        {/* Petit indicateur de couleur sur le côté ou en haut pour le rappel Gaming */}
        <View style={[styles.colorBadge, { backgroundColor: accentColor }]} />
        
        <Gamepad2 size={32} color={accentColor} style={{ marginBottom: 12 }} />
        
        <Text style={styles.gameShort}>{g.short}</Text>
        <Text style={styles.gameLabel}>{g.label}</Text>
        
        <View style={styles.badgeCount}>
           <Text style={[styles.gameDefisCount, { color: accentColor }]}>
             {DEFIS[key]?.length || 0} DÉFIS
           </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GAMING</Text>
      </View>

      <FlatList
        data={GAME_ENTRIES}
        renderItem={renderItem}
        keyExtractor={([key]) => key}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#050505' // Noir pur pour le contraste
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50, // Pour éviter l'encoche du tel
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: T.fontTitle,
    fontSize: 24,
    color: '#fff',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  backBtn: { marginRight: 15 },
  listContainer: { 
    paddingHorizontal: 15, 
    paddingBottom: 40 
  },
  columnWrapper: { 
    justifyContent: 'space-between', 
    marginBottom: 15 
  },
  card: {
    width: CARD_WIDTH,
    height: 180,
    backgroundColor: '#121212', // Gris très sombre
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222', // Bordure subtile
    position: 'relative',
    overflow: 'hidden',
  },
  colorBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4, // Fine ligne de couleur en haut
  },
  gameShort: {
    fontFamily: T.fontTitle,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  gameLabel: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  badgeCount: {
    marginTop: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  gameDefisCount: {
    fontFamily: T.fontBody,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});