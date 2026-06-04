// @ts-nocheck
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

export default function AppNavigator({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab bar VISIBLE — on passe onLogout via la fonction fléchée */}
      <Stack.Screen name="MainTabs">
        {(props) => <MainTabs {...props} onLogout={onLogout} />}
      </Stack.Screen>

      {/* Tab bar CACHÉE — mode Duel uniquement */}
      <Stack.Screen
        name="DuoLobby"
        component={DuoLobbyScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 320 }}
      />
      <Stack.Screen
        name="DuoActive"
        component={DuelActiveScreen}
        options={{ animation: 'fade', animationDuration: 400 }}
      />
      <Stack.Screen
        name="DuoConfig"
        component={DuoConfigScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 320 }}
      />
      <Stack.Screen
        name="DuelPick"
        component={DuelPickScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 320 }}
      />
      <Stack.Screen
        name="DuelJoin"
        component={DuelActiveScreen}
        options={{ animation: 'fade', animationDuration: 300 }}
      />
      <Stack.Screen
        name="Live"
        component={LiveScreen}
        options={{ animation: 'fade', animationDuration: 400 }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          animation: 'fade',
          animationDuration: 400,
        }}
      />
    </Stack.Navigator>
  );
}