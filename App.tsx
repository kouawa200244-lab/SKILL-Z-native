// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen    from './src/screens/AuthScreen';
import AppNavigator  from './src/navigation/AppNavigator';
import { T }         from './src/utils/designTokens';
import { navigationRef } from './src/utils/navigationRef';

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('skillz_user');
        if (stored) setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogin = async (loggedUser: any) => {
    await AsyncStorage.setItem('skillz_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
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
  <NavigationContainer ref={navigationRef}>
    {user ? <AppNavigator /> : <AuthScreen onLogin={handleLogin} />}
  </NavigationContainer>
);
}