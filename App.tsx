// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen   from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { T }        from './src/utils/designTokens';
import { navigationRef } from './src/utils/navigationRef';

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('skillz_user')
      .then(s => { if (s) setUser(JSON.parse(s)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogin  = async (u: any) => {
    await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('skillz_user');
    setUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080A0F' }}>
        <ActivityIndicator size="large" color={T.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}           // ✅ ref branché ici
      onReady={() => {
        // Le ref est maintenant prêt — log pour debug
        console.log('[Nav] NavigationContainer ready');
      }}
    >
      {user
        ? <AppNavigator onLogout={handleLogout} />
        : <AuthScreen onLogin={handleLogin} />
      }
    </NavigationContainer>
  );
}