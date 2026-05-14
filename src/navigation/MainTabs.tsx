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
import { T }                    from '../utils/designTokens';

// Écrans
import LobbyScreen              from '../screens/LobbyScreen';
import GamingChallengesScreen   from '../screens/GamingChallengesScreen';
import PhysicalChallengesScreen from '../screens/PhysicalChallengesScreen';
import GameSelectScreen         from '../screens/GameSelectScreen';
import DefiSelectScreen         from '../screens/DefiSelectScreen';
import ConfigScreen             from '../screens/ConfigScreen';
import LiveScreen               from '../screens/LiveScreen';
import ResultScreen             from '../screens/ResultScreen';
import WalletScreen             from '../screens/WalletScreen';
import ProfileScreen            from '../screens/ProfileScreen';
import HistoryScreen            from '../screens/HistoryScreen';
import DuoLobbyScreen           from '../screens/DuoLobbyScreen';
import CategoryPickerModal      from '../components/CategoryPickerModal';


// ─── Stacks de navigation ────────────────────────────────────────────────────
const stackScreenOptions = { headerShown: false };

const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Lobby" component={LobbyScreen} />
      <HomeStack.Screen name="GameSelect" component={GameSelectScreen} />
      <HomeStack.Screen name="DefiSelect" component={DefiSelectScreen} />
      <HomeStack.Screen name="Config" component={ConfigScreen} />
      <HomeStack.Screen name="Live" component={LiveScreen} />
      <HomeStack.Screen name="Result" component={ResultScreen} />
      <HomeStack.Screen name="PhysicalMain" component={PhysicalChallengesScreen} />
    </HomeStack.Navigator>
  );
}

const GamingStack = createNativeStackNavigator();
function GamingStackScreen() {
  return (
    <GamingStack.Navigator screenOptions={stackScreenOptions}>
      <GamingStack.Screen name="GamingMain" component={GamingChallengesScreen} />
      <GamingStack.Screen name="DefiSelect" component={DefiSelectScreen} />
      <GamingStack.Screen name="Config" component={ConfigScreen} />
      <GamingStack.Screen name="Live" component={LiveScreen} />
      <GamingStack.Screen name="Result" component={ResultScreen} />
    </GamingStack.Navigator>
  );
}

const PhysiqueStack = createNativeStackNavigator();
function PhysiqueStackScreen() {
  return (
    <PhysiqueStack.Navigator screenOptions={stackScreenOptions}>
      <PhysiqueStack.Screen name="PhysicalMain" component={PhysicalChallengesScreen} />
      <PhysiqueStack.Screen name="DefiSelect" component={DefiSelectScreen} />
      <PhysiqueStack.Screen name="Config" component={ConfigScreen} />
      <PhysiqueStack.Screen name="Live" component={LiveScreen} />
      <PhysiqueStack.Screen name="Result" component={ResultScreen} />
    </PhysiqueStack.Navigator>
  );
}

const WalletStack = createNativeStackNavigator();
function WalletStackScreen() {
  return (
    <WalletStack.Navigator screenOptions={stackScreenOptions}>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'HomeTab',     label: 'Accueil',    Icon: Home,   color: T.gold     },
  { name: 'HistoTab',    label: 'Historique', Icon: Clock,  color: T.gaming   },
  { name: 'DuelTab',     label: 'Duels',      Icon: Swords, color: '#A855F7'  },
  { name: 'WalletTab',   label: 'Wallet',     Icon: Wallet, color: T.gold     },
  { name: 'ProfileTab',  label: 'Profil',     Icon: User,   color: T.gold     },
];

const LEFT_TABS  = TABS.slice(0, 2); // Accueil, Historique
const RIGHT_TABS = TABS.slice(3, 5); // Wallet, Profil

/* ══ BOUTON CENTRAL ⚡ ══ */
function CenterButton({ onPress }) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
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

/* ══ TAB ITEM avec rebond ══ */
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
          transform: [{ scale: dotAnim }],
        },
      ]} />
    </TouchableOpacity>
  );
}

/* ══ CUSTOM TAB BAR ══ */
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
    const event = navigation.emit({
      type: 'tabPress', target: routeKey, canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(tabName);
    }
  };

  return (
    <>
      <CategoryPickerModal visible={showPicker} onClose={() => setShowPicker(false)} />

      <Animated.View style={[
        styles.tabBarContainer,
        { opacity: barFade, transform: [{ translateY: barSlide }] },
      ]}>
        <View style={styles.tabBar}>

          {/* Gauche : Accueil + Historique */}
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

          {/* Droite : Wallet + Profil */}
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

/* ══ NAVIGATOR ══ */
export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"    component={HomeStackScreen}      />
      <Tab.Screen name="HistoTab"   component={HistoryScreen}        />
      <Tab.Screen name="DuelTab"    component={DuoLobbyScreen}       />
      <Tab.Screen name="WalletTab"  component={WalletStackScreen}    />
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen}   />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(10,12,18,0.97)',
    borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 8, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65, shadowRadius: 32, elevation: 24,
  },
  tabSide:     { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tabItem:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  tabIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  tabLabel:    { fontFamily: 'Inter-Regular', fontSize: 9, letterSpacing: 0.3, fontWeight: '600', marginTop: 1 },
  tabDot:      { position: 'absolute', bottom: -2, width: 4, height: 4, borderRadius: 2 },

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