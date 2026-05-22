// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Home, Clock, Wallet, User, Swords } from 'lucide-react-native';
import { T } from '../utils/designTokens';

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

/* ══════════════════════════════════════
   OPTIONS TRANSITIONS FLUIDES
══════════════════════════════════════ */
const STACK_BASE = {
  headerShown:      false,
  gestureEnabled:   true,
  gestureDirection: 'horizontal',
  contentStyle:     { backgroundColor: '#080A0F' },
};

const SLIDE    = { ...STACK_BASE, animation: 'slide_from_right',  animationDuration: 180 };
const SLIDE_UP = { ...STACK_BASE, animation: 'slide_from_bottom', animationDuration: 200 };
const FADE     = { ...STACK_BASE, animation: 'fade',              animationDuration: 180 };
const FADE_LOCK= { ...FADE,       gestureEnabled: false };

/* ══════════════════════════════════════
   STACKS
══════════════════════════════════════ */
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={SLIDE}>
      <HomeStack.Screen name="Lobby"        component={LobbyScreen}              />
      <HomeStack.Screen name="GameSelect"   component={GameSelectScreen}         />
      <HomeStack.Screen name="DefiSelect"   component={DefiSelectScreen}         />
      <HomeStack.Screen name="Config"       component={ConfigScreen}    options={SLIDE_UP} />
      <HomeStack.Screen name="Live"         component={LiveScreen}      options={FADE}     />
      <HomeStack.Screen name="Result"       component={ResultScreen}    options={FADE_LOCK}/>
      <HomeStack.Screen name="PhysicalChallenges" component={PhysicalChallengesScreen} />
    </HomeStack.Navigator>
  );
}

const HistoStack = createNativeStackNavigator();
function HistoStackScreen() {
  return (
    <HistoStack.Navigator screenOptions={SLIDE}>
      <HistoStack.Screen name="HistoryMain" component={HistoryScreen}    />
      <HistoStack.Screen name="DefiSelect"  component={DefiSelectScreen} />
      <HistoStack.Screen name="Config"      component={ConfigScreen}    options={SLIDE_UP} />
      <HistoStack.Screen name="Live"        component={LiveScreen}      options={FADE}     />
      <HistoStack.Screen name="Result"      component={ResultScreen}    options={FADE_LOCK}/>
    </HistoStack.Navigator>
  );
}

const DuelStack = createNativeStackNavigator();
function DuelStackScreen() {
  return (
    <DuelStack.Navigator screenOptions={SLIDE}>
      <DuelStack.Screen name="DuoLobbyMain" component={DuoLobbyScreen}   />
      <DuelStack.Screen name="DefiSelect"   component={DefiSelectScreen}  />
      <DuelStack.Screen name="Config"       component={ConfigScreen}     options={SLIDE_UP} />
      <DuelStack.Screen name="Live"         component={LiveScreen}       options={FADE}     />
      <DuelStack.Screen name="Result"       component={ResultScreen}     options={FADE_LOCK}/>
    </DuelStack.Navigator>
  );
}

const WalletStack = createNativeStackNavigator();
function WalletStackScreen() {
  return (
    <WalletStack.Navigator screenOptions={SLIDE}>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={SLIDE}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

/* ══════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════ */
const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'HomeTab',    label: 'Accueil',    Icon: Home,   color: T.gold    },
  { name: 'HistoTab',   label: 'Historique', Icon: Clock,  color: T.gaming  },
  { name: 'DuelTab',    label: 'Duels',      Icon: Swords, color: '#A855F7' },
  { name: 'WalletTab',  label: 'Wallet',     Icon: Wallet, color: T.gold    },
  { name: 'ProfileTab', label: 'Profil',     Icon: User,   color: T.gold    },
];

const LEFT_TABS  = TABS.slice(0, 2);
const RIGHT_TABS = TABS.slice(3, 5);

/* ══ BOUTON CENTRAL ⚡ ══ */
function CenterButton({ onPress }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const glow   = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOp = glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.26] });
  const spin   = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] });

  return (
    <TouchableOpacity
      onPressIn={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Animated.parallel([
          Animated.spring(scale,  { toValue: 0.88, tension: 300, friction: 7, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }}
      onPressOut={() => {
        // ✅ Action IMMÉDIATE
        onPress?.();
        Animated.parallel([
          Animated.spring(scale,  { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();
      }}
      activeOpacity={1}
      style={styles.centerOuter}
    >
      <Animated.View style={[styles.centerBtn, { transform: [{ scale }] }]}>
        <Animated.View style={[styles.centerGlow, { opacity: glowOp }]} />
        <Animated.Text style={[styles.centerEmoji, { transform: [{ rotate: spin }] }]}>
          {'⚡'}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ══ TAB ITEM ══ */
function TabItem({ tab, focused, onPress }) {
  const bounce = useRef(new Animated.Value(1)).current;
  const dot    = useRef(new Animated.Value(focused ? 1 : 0)).current;
  // ✅ bg séparé avec useNativeDriver: false (backgroundColor)
  const bg     = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    // ✅ Animations séparées — pas de mix natif/non-natif dans parallel
    Animated.timing(dot, {
      toValue: focused ? 1 : 0, duration: 180, useNativeDriver: true,
    }).start();
    Animated.timing(bg, {
      toValue: focused ? 1 : 0, duration: 180, useNativeDriver: false,
    }).start();
  }, [focused]);

  const { Icon, label, color } = tab;

  const iconBg = bg.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(0,0,0,0)', color + '18'],
  });

  return (
    <TouchableOpacity
      onPress={() => {
        // ✅ 1. Action immédiate
        Haptics.selectionAsync();
        onPress?.();
        // ✅ 2. Animation après
        Animated.sequence([
          Animated.timing(bounce, { toValue: 0.78, duration: 55, useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 1.12, tension: 400, friction: 5, useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 1,    tension: 300, friction: 8, useNativeDriver: true }),
        ]).start();
      }}
      activeOpacity={1}
      style={styles.tabItem}
    >
      {/*
        ✅ 2 Animated.View séparés :
        - Externe : backgroundColor (useNativeDriver: false)
        - Interne : scale/transform (useNativeDriver: true)
      */}
      <Animated.View style={[
        styles.tabIconWrap,
        focused && { borderColor: color + '30', borderWidth: 1 },
        { backgroundColor: iconBg },
      ]}>
        <Animated.View style={{ transform: [{ scale: bounce }] }}>
          <Icon
            size={20}
            color={focused ? color : T.muted}
            strokeWidth={focused ? 2.3 : 1.6}
          />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[
        styles.tabLabel,
        {
          color:   focused ? color : T.muted,
          opacity: dot,
          transform: [{
            scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
          }],
        },
      ]}>
        {label}
      </Animated.Text>

      <Animated.View style={[
        styles.tabDot,
        { backgroundColor: color, opacity: dot, transform: [{ scale: dot }] },
      ]} />
    </TouchableOpacity>
  );
}

/* ══ CUSTOM TAB BAR ══ */
function CustomTabBar({ state, navigation }) {
  const [showPicker, setShowPicker] = useState(false);
  const barSlide = useRef(new Animated.Value(80)).current;
  const barFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(barSlide, {
        toValue: 0, tension: 60, friction: 13, delay: 280, useNativeDriver: true,
      }),
      Animated.timing(barFade, {
        toValue: 1, duration: 280, delay: 280, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const goTo = (name, key, focused) => {
    if (focused) return;
    const ev = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!ev.defaultPrevented) navigation.navigate(name);
  };

  return (
    <>
      {/* ✅ Modal globale — accessible depuis tous les tabs */}
      <CategoryPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
      />

      <Animated.View style={[
        styles.tabBarContainer,
        { opacity: barFade, transform: [{ translateY: barSlide }] },
      ]}>
        <View style={styles.tabBar}>

          <View style={styles.tabSide}>
            {LEFT_TABS.map(tab => {
              const idx     = state.routes.findIndex(r => r.name === tab.name);
              if (idx === -1) return null;
              const focused = state.index === idx;
              return (
                <TabItem
                  key={tab.name}
                  tab={tab}
                  focused={focused}
                  onPress={() => goTo(tab.name, state.routes[idx].key, focused)}
                />
              );
            })}
          </View>

          <CenterButton onPress={() => setShowPicker(true)} />

          <View style={styles.tabSide}>
            {RIGHT_TABS.map(tab => {
              const idx     = state.routes.findIndex(r => r.name === tab.name);
              if (idx === -1) return null;
              const focused = state.index === idx;
              return (
                <TabItem
                  key={tab.name}
                  tab={tab}
                  focused={focused}
                  onPress={() => goTo(tab.name, state.routes[idx].key, focused)}
                />
              );
            })}
          </View>

        </View>
      </Animated.View>
    </>
  );
}

/* ══ NAVIGATOR PRINCIPAL ══ */
export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="HomeTab"
      // ✅ PAS de lazy: false global — évite de charger tous les screens au démarrage
      // ce qui causait "Text strings must be rendered within a <Text> component" × 4
    >
      <Tab.Screen name="HomeTab"    component={HomeStackScreen}   />
      <Tab.Screen name="HistoTab"   component={HistoStackScreen}  />
      <Tab.Screen name="DuelTab"    component={DuelStackScreen}   />
      <Tab.Screen name="WalletTab"  component={WalletStackScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen}/>
    </Tab.Navigator>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
  },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(10,12,18,0.97)',
    borderRadius: 28, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 8, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6, shadowRadius: 28, elevation: 22,
  },

  tabSide:     { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tabItem:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  tabIconWrap: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
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