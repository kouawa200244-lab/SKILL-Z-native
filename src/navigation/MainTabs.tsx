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

import LobbyScreen               from '../screens/LobbyScreen';
import GamingChallengesScreen    from '../screens/GamingChallengesScreen';
import PhysicalChallengesScreen  from '../screens/PhysicalChallengesScreen';
import GameSelectScreen          from '../screens/GameSelectScreen';
import DefiSelectScreen          from '../screens/DefiSelectScreen';
import ConfigScreen              from '../screens/ConfigScreen';
import LiveScreen                from '../screens/LiveScreen';
import ResultScreen              from '../screens/ResultScreen';
import WalletScreen              from '../screens/WalletScreen';
import ProfileScreen             from '../screens/ProfileScreen';
import HistoryScreen             from '../screens/HistoryScreen';
import DuoLobbyScreen            from '../screens/DuoLobbyScreen';
import CategoryPickerModal       from '../components/CategoryPickerModal';
import DuoConfigScreen           from '../screens/DuoConfigScreen';
import DuelPickScreen            from '../screens/DuelPickScreen';
import DuelActiveScreen from '../screens/DuelActiveScreen';

/* ══════════════════════════════════════
   TRANSITIONS
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
   SCREENS OÙ LA TAB BAR DOIT ÊTRE CACHÉE
   (noms de routes dans les stacks)
══════════════════════════════════════ */
const HIDDEN_IN_DUEL = new Set([
  'DuelPickMain',
  'DuoConfigScreen',
  'DuoLobbyScreen',
  'DuelActiveScreen',
  ]);

/* ── Helper : trouver la route active la plus profonde ── */
function getActiveRouteName(state) {
  if (!state) return null;
  const route = state.routes[state.index ?? 0];
  if (route?.state) return getActiveRouteName(route.state);
  return route?.name ?? null;
}

/* ══════════════════════════════════════
   HOME STACK
══════════════════════════════════════ */
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={SLIDE}>
      <HomeStack.Screen name="Lobby"              component={LobbyScreen}             />
      <HomeStack.Screen name="GameSelect"         component={GameSelectScreen}        />
      <HomeStack.Screen name="DefiSelect"         component={DefiSelectScreen}        />
      <HomeStack.Screen name="Config"             component={ConfigScreen}   options={SLIDE_UP}  />
      <HomeStack.Screen name="Live"               component={LiveScreen}     options={FADE}      />
      <HomeStack.Screen name="Result"             component={ResultScreen}   options={FADE_LOCK} />
      <HomeStack.Screen name="PhysicalChallenges" component={PhysicalChallengesScreen}           />
      <HomeStack.Screen name="DuoConfig"          component={DuoConfigScreen}                    />
      <HomeStack.Screen name="DuoLobby"           component={DuoLobbyScreen}                     />
      <HomeStack.Screen name="DuelPick"           component={DuelPickScreen}                     />
    </HomeStack.Navigator>
  );
}

/* ══════════════════════════════════════
   HISTORIQUE STACK
══════════════════════════════════════ */
const HistoStack = createNativeStackNavigator();
function HistoStackScreen() {
  return (
    <HistoStack.Navigator screenOptions={SLIDE}>
      <HistoStack.Screen name="HistoryMain" component={HistoryScreen}   />
      <HistoStack.Screen name="DefiSelect"  component={DefiSelectScreen}/>
      <HistoStack.Screen name="Config"      component={ConfigScreen}    options={SLIDE_UP}  />
      <HistoStack.Screen name="Live"        component={LiveScreen}      options={FADE}      />
      <HistoStack.Screen name="Result"      component={ResultScreen}    options={FADE_LOCK} />
    </HistoStack.Navigator>
  );
}

/* ══════════════════════════════════════
   DUEL STACK — Tab bar cachée sur tout
   sauf DuelMain (lobby liste des duels)
══════════════════════════════════════ */
const DuelStack = createNativeStackNavigator();
function DuelStackScreen() {
  return (
    <DuelStack.Navigator screenOptions={SLIDE}>
      {/* ✅ Seul écran qui garde la tab bar visible */}
      <DuelStack.Screen name="DuelMain"       component={DuoLobbyScreen}      />

      {/* ✅ Ces screens cachent la tab bar */}
      <DuelStack.Screen name="DuelPickMain"   component={DuelPickScreen}   />
      <DuelStack.Screen
        name="DuoConfigScreen"
        component={DuoConfigScreen}
        options={SLIDE_UP}
      />
      <DuelStack.Screen
        name="DuoLobbyScreen"
        component={DuoLobbyScreen}
        options={SLIDE_UP}
      />
      <DuelStack.Screen
        name="DuelActiveScreen"
        component={DuelActiveScreen}
        
        options={FADE}
      />
      
      {/* Anciens écrans conservés */}
      <DuelStack.Screen name="DuoLobbyMain" component={DuoLobbyScreen}   />
      <DuelStack.Screen name="DefiSelect"   component={DefiSelectScreen}  />
      <DuelStack.Screen name="Config"       component={ConfigScreen}      options={SLIDE_UP}  />
      <DuelStack.Screen name="Live"         component={LiveScreen}        options={FADE}      />
      <DuelStack.Screen name="Result"       component={ResultScreen}      options={FADE_LOCK} />
    </DuelStack.Navigator>
  );
}

/* ══════════════════════════════════════
   WALLET STACK
══════════════════════════════════════ */
const WalletStack = createNativeStackNavigator();
function WalletStackScreen() {
  return (
    <WalletStack.Navigator screenOptions={SLIDE}>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

/* ══════════════════════════════════════
   PROFILE STACK
══════════════════════════════════════ */
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
  { name: 'HomeTab',   label: 'Accueil',    Icon: Home,   color: T.gaming  },
  { name: 'HistoTab',  label: 'Historique', Icon: Clock,  color: T.gaming  },
  { name: 'DuelTab',   label: 'Duels',      Icon: Swords, color: '#A855F7' },
  { name: 'WalletTab', label: 'Wallet',     Icon: Wallet, color: T.gaming  },
  { name: 'ProfileTab',label: 'Profil',     Icon: User,   color: T.gaming  },
];

const LEFT_TABS  = TABS.slice(0, 2);
const RIGHT_TABS = TABS.slice(3, 5);

/* ══ BOUTON CENTRAL  ══ */
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
  const bg     = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(dot, { toValue: focused ? 1 : 0, duration: 180, useNativeDriver: true  }).start();
    Animated.timing(bg,  { toValue: focused ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focused]);

  const { Icon, label, color } = tab;
  const iconBg = bg.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', color + '22'] });

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
        Animated.sequence([
          Animated.timing(bounce, { toValue: 0.78, duration: 55,  useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 1.12, tension: 400, friction: 5, useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 1,    tension: 300, friction: 8, useNativeDriver: true }),
        ]).start();
      }}
      activeOpacity={1}
      style={styles.tabItem}
    >
      <Animated.View style={[
        styles.tabIconWrap,
        focused && { borderColor: color + '30', borderWidth: 1 },
        { backgroundColor: iconBg },
      ]}>
        <Animated.View style={{ transform: [{ scale: bounce }] }}>
          <Icon size={20} color={focused ? color : T.muted} strokeWidth={focused ? 2.3 : 1.6} />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[
        styles.tabLabel,
        {
          color:   focused ? color : T.muted,
          opacity: dot,
          transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
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
function CustomTabBar({ state, descriptors, navigation }) {
  const [showPicker, setShowPicker] = useState(false);
  const barSlideAnim = useRef(new Animated.Value(100)).current;
  const barFadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(barSlideAnim, { toValue: 0, tension: 55, friction: 12, delay: 400, useNativeDriver: true }),
      Animated.timing(barFadeAnim,  { toValue: 1, duration: 400, delay: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  /* ✅ Déterminer si on doit cacher la tab bar
     → On regarde la route active la plus profonde du DuelTab */
  const duelTabRoute    = state.routes.find(r => r.name === 'DuoLobbyScreen' || r.name === 'DuelPickMain' || r.name === 'DuoConfigScreen' || r.name === 'DuelActiveScreen');
  const activeInDuel    = duelTabRoute?.state
    ? getActiveRouteName(duelTabRoute.state)
    : null;
  const shouldHideTabBar = activeInDuel !== null && HIDDEN_IN_DUEL.has(activeInDuel);

  /* ✅ Slide out au lieu d'un brusque display:none */
  const hideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(hideAnim, {
      toValue: shouldHideTabBar ? 120 : 0,
      tension: 80, friction: 12,
      useNativeDriver: true,
    }).start();
  }, [shouldHideTabBar]);

  const navigateTab = (tabName, routeKey, isFocused) => {
    if (tabName === 'HomeTab') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] });
      return;
    }
    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(tabName);
  };

  return (
    <>
      <CategoryPickerModal visible={showPicker} onClose={() => setShowPicker(false)} />

      <Animated.View style={[
        styles.tabBarContainer,
        {
          opacity:   barFadeAnim,
          transform: [
            { translateY: Animated.add(barSlideAnim, hideAnim) },
          ],
        },
      ]}>
        <View style={styles.tabBar}>

          {/* Gauche */}
          <View style={styles.tabSide}>
            {LEFT_TABS.map(tab => {
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
            {RIGHT_TABS.map(tab => {
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

/* ══ NAVIGATOR PRINCIPAL ══ */
export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="HomeTab"
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
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