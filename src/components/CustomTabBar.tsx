// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home, List, Wallet, User, Zap, Gamepad2, Dumbbell,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';

const TAB_ITEMS = [
  { key: 'HomeTab',    label: 'Accueil',      icon: Home,   initialScreen: 'Lobby' },
  { key: 'HistoryTab', label: 'Historique',   icon: List,   initialScreen: 'HistoryMain' },
  { key: 'WalletTab',  label: 'Portefeuille', icon: Wallet, initialScreen: 'WalletMain' },
  { key: 'ProfileTab', label: 'Profil',       icon: User,   initialScreen: 'ProfileMain' },
];

export default function CustomTabBar({ state, descriptors, navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCentralPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
    ]).start();
    setMenuVisible(true);
  };

  const selectChallenge = (type: 'gaming' | 'physique' | 'duel') => {
    setMenuVisible(false);
    if (type === 'gaming') {
      // On garde la même pile (HomeTab) mais on change d'écran
      navigation.navigate('HomeTab', { screen: 'GameSelect' });
    } else if (type === 'physique') {
      navigation.navigate('HomeTab', { screen: 'PhysicalChallenges' });
    } else if (type === 'duel') {
      navigation.navigate('HomeTab', { screen: 'DuoLobby',  });
    }
  };

  // Onglets normaux
  const handleTabPress = (tabKey, initialScreen) => {
    // Réinitialise la pile de l'onglet sur son écran d'accueil
    navigation.navigate(tabKey, { screen: initialScreen });
  };

  const leftTabs = TAB_ITEMS.slice(0, 2);
  const rightTabs = TAB_ITEMS.slice(2);

  return (
    <>
      {/* Menu contextuel */}
      {menuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: '#00F0FF20' }]}
              onPress={() => selectChallenge('gaming')}
            >
              <Gamepad2 size={24} color="#00F0FF" />
              <Text style={styles.menuItemText}>Défi Gaming</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: '#FF6B0020' }]}
              onPress={() => selectChallenge('physique')}
            >
              <Dumbbell size={24} color="#FF6B00" />
              <Text style={styles.menuItemText}>Défi Physique</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: '#A855F720' }]}
              onPress={() => selectChallenge('duel')}
            >
              <Gamepad2 size={24} color="#A855F7" />
              <Text style={styles.menuItemText}>Défi DUEL</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Barre flottante */}
      <View style={styles.container}>
        {/* Groupe de gauche */}
        <View style={styles.side}>
          {leftTabs.map(tab => {
            const isFocused = state.index === TAB_ITEMS.findIndex(t => t.key === tab.key);
            const Icon = tab.icon;
            const color = isFocused ? '#00F0FF' : '#666';
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabPress(tab.key, tab.initialScreen)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Icon size={22} color={color} />
                <Text style={[styles.label, { color }]}>{tab.label}</Text>
                {isFocused && <View style={[styles.indicator, { backgroundColor: '#00F0FF' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bouton central */}
        <Animated.View style={[styles.centralButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity onPress={handleCentralPress} activeOpacity={0.9}>
            <LinearGradient
              colors={['#00F0FF', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.centralButton}
            >
              <Zap size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Groupe de droite */}
        <View style={styles.side}>
          {rightTabs.map(tab => {
            const isFocused = state.index === TAB_ITEMS.findIndex(t => t.key === tab.key);
            const Icon = tab.icon;
            const color = isFocused ? '#00F0FF' : '#666';
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabPress(tab.key, tab.initialScreen)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Icon size={22} color={color} />
                <Text style={[styles.label, { color }]}>{tab.label}</Text>
                {isFocused && <View style={[styles.indicator, { backgroundColor: '#00F0FF' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    height: 70,
    backgroundColor: '#121212',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  label: {
    fontFamily: T.fontBody,
    fontSize: 10,
    marginTop: 2,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  centralButtonWrapper: {
    marginTop: -30,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#1A1D23',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  menuItemText: {
    fontFamily: T.fontTitle,
    fontSize: 18,
    color: '#fff',
    letterSpacing: 1,
  },
});