// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Home, Clock, Wallet, User, Swords } from 'lucide-react-native';
import { T } from '../utils/designTokens';

// Screens
import LobbyScreen      from '../screens/LobbyScreen';
import GameSelectScreen from '../screens/GameSelectScreen';
import DefiSelectScreen from '../screens/DefiSelectScreen';
import ConfigScreen     from '../screens/ConfigScreen';
import WalletScreen    from '../screens/WalletScreen';
import ProfileScreen  from '../screens/ProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DuoLobby     from '../screens/DuoLobbyScreen';
import CategoryPickerModal from '../components/CategoryPickerModal';

const Tab          = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();
const DuelStackNav = createNativeStackNavigator();

/* ══════════════════════════════════════
   HOME STACK — tab bar reste visible
══════════════════════════════════════ */
function HomeStack() {
  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#080A0F' },
      }}
    >
      <HomeStackNav.Screen
        name="Lobby"
        component={LobbyScreen}
      />
      <HomeStackNav.Screen
        name="GameSelect"
        component={GameSelectScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="DefiSelect"
        component={DefiSelectScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="Config"
        component={ConfigScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </HomeStackNav.Navigator>
    
  );
}

/* ══════════════════════════════════════
   DUEL STACK — tab bar reste visible
══════════════════════════════════════ */
function DuelStack() {
  return (
    <DuelStackNav.Navigator
      screenOptions={{
        headerShown:  false,
        contentStyle: { backgroundColor: '#080A0F' },
      }}
    >
      <DuelStackNav.Screen
        name="DuelList"
        component={DuoLobby}
      />
      <DuelStackNav.Screen
        name="DuelCreate"
        component={ConfigScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </DuelStackNav.Navigator>
  );
}

/* ══════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════ */
const TABS = [
  { name: 'HomeTab',       label: 'Accueil',    Icon: Home,   color: T.gold    },
  { name: 'HistoryTab',    label: 'Historique', Icon: Clock,  color: T.gaming  },
  { name: 'DuelTab',       label: 'Duels',      Icon: Swords, color: '#A855F7' },
  { name: 'WalletTab',     label: 'Wallet',     Icon: Wallet, color: T.gold    },
  { name: 'ProfileTab',    label: 'Profil',     Icon: User,   color: T.gold    },
];
const LEFT_TABS  = TABS.slice(0, 2);
const RIGHT_TABS = TABS.slice(3, 5);

/* ══════════════════════════════════════
   BOUTON CENTRAL ⚡
══════════════════════════════════════ */
function CenterButton({ onPress }) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.parallel([
      Animated.spring(scaleAnim,  { toValue: 0.85, tension: 300, friction: 6, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim,  { toValue: 1, tension: 150, friction: 5, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] });
  const spin        = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '25deg'] });

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.centerOuter}
    >
      <Animated.View style={[styles.centerBtn, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.centerGlow, { opacity: glowOpacity }]} />
        <Animated.Text style={[styles.centerEmoji, { transform: [{ rotate: spin }] }]}>
          ⚡
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ══════════════════════════════════════
   TAB ITEM — rebond 3 phases
══════════════════════════════════════ */
function TabItem({ tab, focused, onPress }) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const dotAnim    = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const bgAnim     = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dotAnim, { toValue: focused ? 1 : 0, duration: 220, useNativeDriver: true }),
      Animated.timing(bgAnim,  { toValue: focused ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  const handlePress = () => {
    Haptics.selectionAsync();
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 0.72, duration: 75,  useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1.18, tension: 320, friction: 4, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  const { Icon, label, color } = tab;
  const iconBg = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(0,0,0,0)', color + '18'],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.tabItem}>
      <Animated.View style={[
        styles.tabIconWrap,
        focused && { borderColor: color + '30', borderWidth: 1 },
        { backgroundColor: iconBg, transform: [{ scale: bounceAnim }] },
      ]}>
        <Icon size={20} color={focused ? color : T.muted} strokeWidth={focused ? 2.3 : 1.6} />
      </Animated.View>

      <Animated.Text style={[
        styles.tabLabel,
        {
          color:   focused ? color : T.muted,
          opacity: dotAnim,
          transform: [{ scale: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        },
      ]}>
        {label}
      </Animated.Text>

      <Animated.View style={[
        styles.tabDot,
        {
          backgroundColor: color,
          opacity:   dotAnim,
          transform: [{ scale: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }],
        },
      ]} />
    </TouchableOpacity>
  );
}

/* ══════════════════════════════════════
   CUSTOM TAB BAR — passe navigation au modal
══════════════════════════════════════ */
function CustomTabBar({ state, descriptors, navigation }) {
  const [showPicker, setShowPicker] = useState(false);
  const barSlide = useRef(new Animated.Value(100)).current;
  const barFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(barSlide, { toValue: 0, tension: 55, friction: 12, delay: 400, useNativeDriver: true }),
      Animated.timing(barFade,  { toValue: 1, duration: 400, delay: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const navigateTab = (tabName, routeKey, isFocused) => {
    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(tabName);
    }
  };

  return (
    <>
      {/* ✅ navigation passé en prop pour que le modal navigue correctement */}
      <CategoryPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        navigation={navigation}
      />

      <Animated.View style={[
        styles.tabBarContainer,
        { opacity: barFade, transform: [{ translateY: barSlide }] },
      ]}>
        <View style={styles.tabBar}>

          {/* Gauche */}
          <View style={styles.tabSide}>
            {LEFT_TABS.map((tab) => {
              const routeIndex = state.routes.findIndex(r => r.name === tab.name);
              if (routeIndex === -1) return null;
              const focused = state.index === routeIndex;
              return (
                <TabItem
                  key={`left_${tab.name}`}
                  tab={tab}
                  focused={focused}
                  onPress={() => navigateTab(tab.name, state.routes[routeIndex].key, focused)}
                />
              );
            })}
          </View>

          {/* Centre ⚡ */}
          <CenterButton onPress={() => setShowPicker(true)} />

          {/* Droite */}
          <View style={styles.tabSide}>
            {RIGHT_TABS.map((tab) => {
              const routeIndex = state.routes.findIndex(r => r.name === tab.name);
              if (routeIndex === -1) return null;
              const focused = state.index === routeIndex;
              return (
                <TabItem
                  key={`right_${tab.name}`}
                  tab={tab}
                  focused={focused}
                  onPress={() => navigateTab(tab.name, state.routes[routeIndex].key, focused)}
                />
              );
            })}
          </View>

        </View>
      </Animated.View>
    </>
  );
}

/* ══════════════════════════════════════
   MAIN TABS NAVIGATOR
══════════════════════════════════════ */
export default function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      
      {/* HomeStack contient : Lobby → GameSelect → DefiSelect → Config */}
      <Tab.Screen name="HomeTab"       component={HomeStack}       />

      {/* Onglets simples */}
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />

      {/* DuelStack contient : DuelList → DuelCreate */}
      <Tab.Screen name="DuelTab"       component={DuelStack}        />

      <Tab.Screen name="WalletTab"     component={WalletScreen}    />
  
      <Tab.Screen name="ProfileTab">
  {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
</Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
  },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(10,12,18,0.97)',
    borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 8, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65, shadowRadius: 32, elevation: 24,
  },
  tabSide: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  tabIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  tabLabel:   { fontFamily: 'Inter-Regular', fontSize: 9, letterSpacing: 0.3, fontWeight: '600', marginTop: 1 },
  tabDot:     { position: 'absolute', bottom: -2, width: 4, height: 4, borderRadius: 2 },
  centerOuter: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', marginTop: -24 },
  centerBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#0E1015',
    borderWidth: 1.5, borderColor: T.gaming + '65',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: T.gaming, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75, shadowRadius: 18, elevation: 18,
    overflow: 'hidden', position: 'relative',
  },
  centerGlow:  { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: T.gaming },
  centerEmoji: { fontSize: 26 },
});