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
import HistoryScreen    from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();

/* ── Options partagées ultra-fluides ── */
const BASE = {
  headerShown:  false,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  contentStyle: { backgroundColor: '#080A0F' },
};

/* ── Slide droite — navigation standard ── */
const SLIDE_RIGHT = {
  ...BASE,
  animation:         'slide_from_right',
  animationDuration: 180,   // ✅ réduit de 280 → 180ms
};

/* ── Slide bas — modals / config ── */
const SLIDE_BOTTOM = {
  ...BASE,
  animation:         'slide_from_bottom',
  animationDuration: 220,   // ✅ réduit de 320 → 220ms
};

/* ── Fade — écrans immersifs ── */
const FADE = {
  ...BASE,
  animation:         'fade',
  animationDuration: 200,   // ✅ réduit de 400 → 200ms
};

export default function AppNavigator({ onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        ...SLIDE_RIGHT,
        // Fond sombre entre toutes les transitions
        contentStyle: { backgroundColor: '#080A0F' },
      }}
    >
      {/* ── Tabs (entrée principale) ── */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ ...FADE, animationDuration: 250 }}
      />

      {/* ── Flow défi solo ── */}
      <Stack.Screen name="GameSelect"  component={GameSelectScreen} options={SLIDE_RIGHT}  />
      <Stack.Screen name="DefiSelect"  component={DefiSelectScreen} options={SLIDE_RIGHT}  />
      <Stack.Screen name="Config"      component={ConfigScreen}     options={SLIDE_BOTTOM} />
      
      {/* ── Flow Duel 1v1 ── */}
      <Stack.Screen name="DuelScreen"  component={DuoLobbyScreen}   options={SLIDE_RIGHT}  />
      <Stack.Screen name="DuelCreate"  component={DuoConfigScreen}  options={SLIDE_BOTTOM} />
      <Stack.Screen name="DuelLobby"   component={DuoLobbyScreen}   options={SLIDE_BOTTOM} />
      <Stack.Screen name="DuelRoom"    component={DuelActiveScreen} options={SLIDE_BOTTOM} />
      <Stack.Screen name="DuelActive"  component={DuelActiveScreen} options={FADE}         />
      <Stack.Screen name="DuelJoin"    component={DuelActiveScreen} options={FADE}         />

      {/* ── Live & Résultat ── */}
      <Stack.Screen name="Live"        component={LiveScreen}       options={FADE}         />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ ...FADE, gestureEnabled: false }}
      />

      {/* ── Historique ── */}
      <Stack.Screen name="Historique"  component={HistoryScreen}    options={SLIDE_RIGHT}  />
    </Stack.Navigator>
  );
}