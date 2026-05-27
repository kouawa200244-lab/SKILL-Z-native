// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { navigationRef } from './src/utils/navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T } from './src/utils/designTokens';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Un seul useFonts, avec toutes les polices dedans
  const [fontsLoaded] = useFonts({
    'Rajdhani-Bold': Rajdhani_700Bold,
    'Inter-Regular': Inter_400Regular,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
  });

  useEffect(() => {
    AsyncStorage.getItem('skillz_user').then(s => {
      if (s) setUser(JSON.parse(s));
      setReady(true);
    });
  }, []);

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={T.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        {user
          ? <AppNavigator />
          : <AuthScreen onLogin={(u) => setUser(u)} />
        }
      </NavigationContainer>
    </SafeAreaProvider>
  );
}