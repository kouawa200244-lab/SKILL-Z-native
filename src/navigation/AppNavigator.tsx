// @ts-nocheck
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Easing } from 'react-native';

import MainTabs         from './MainTabs';
import GameSelectScreen from '../screens/GameSelectScreen';
import DefiSelectScreen from '../screens/DefiSelectScreen';
import ConfigScreen     from '../screens/ConfigScreen';
import LiveScreen       from '../screens/LiveScreen';
import ResultScreen     from '../screens/ResultScreen';
import DuoLobbyScreen   from '../screens/DuoLobbyScreen';
import DuelActiveScreen from '../screens/DuelActiveScreen';
import DuoConfigScreen  from '../screens/DuoConfigScreen';
import DuelPickScreen   from '../screens/DuelPickScreen';
import HistoryScreen    from '../screens/HistoryScreen';
import DefiChallengeScreen from '../screens/DefiChallengeScreen';
import ViralShareScreen    from '../screens/ViralShareScreen';
import ViralResultScreen   from '../screens/ViralResultScreen';

const Stack = createNativeStackNavigator();

/* ── Presets d'animation ── */
const RIGHT  = { headerShown: false, animation: 'slide_from_right',   animationDuration: 220 };
const BOTTOM = { headerShown: false, animation: 'slide_from_bottom',  animationDuration: 260 };
const FADE   = { headerShown: false, animation: 'fade',               animationDuration: 250 };
const NONE   = { headerShown: false, animation: 'none' };

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown:       false,
        animation:         'slide_from_right',
        animationDuration: 220,           // ✅ réduit pour moins de lag perçu
        gestureEnabled:    true,
        gestureDirection:  'horizontal',
        contentStyle:      { backgroundColor: '#0B0E13' },
      }}
    >
      {/* ── Tabs ── */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={FADE}
      />

      {/* ── Solo ── */}
      <Stack.Screen name="GameSelect"  component={GameSelectScreen}  options={RIGHT}  />
      <Stack.Screen name="DefiSelect"  component={DefiSelectScreen}  options={RIGHT}  />
      <Stack.Screen name="Config"      component={ConfigScreen}      options={BOTTOM} />
      <Stack.Screen name="Live"        component={LiveScreen}        options={FADE}   />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ ...FADE, gestureEnabled: false }}
      />

      {/* ── Duel ── */}
      <Stack.Screen name="DuelPick"    component={DuelPickScreen}    options={RIGHT}  />
      <Stack.Screen name="DuoConfig"  component={DuoConfigScreen}  options={BOTTOM} />
      <Stack.Screen name="DuelLobby"   component={DuoLobbyScreen}   options={BOTTOM} />
      <Stack.Screen name="DuelActive"    component={DuelActiveScreen}    options={FADE}   />
      <Stack.Screen name="DuelJoin"    component={DuelActiveScreen}    options={FADE}   />
      <Stack.Screen name="DefiChallenge" component={DefiChallengeScreen} options={{ ...FADE, gestureEnabled: false }} />
      <Stack.Screen name="ViralShare"    component={ViralShareScreen}    options={BOTTOM} />
      <Stack.Screen name="ViralResult"   component={ViralResultScreen}   options={{ ...FADE, gestureEnabled: false }} />

      {/* ── Historique ── */}
      <Stack.Screen name="Historique"  component={HistoryScreen}  options={RIGHT}  />
    </Stack.Navigator>
  );
}