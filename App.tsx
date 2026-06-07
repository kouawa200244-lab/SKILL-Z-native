// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/supabaseClient';
import { getCurrentUser } from './src/utils/getCurrentUser';
import { navigationRef } from './src/utils/navigationRef';
import { LINKING_CONFIG } from './src/utils/deepLinking';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { T } from './src/utils/designTokens';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [user,       setUser]       = useState(null);
  const [ready,      setReady]      = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* ── Fonts (Google Fonts via expo-font) ── */
  const [fontsLoaded] = useFonts({
    'Rajdhani-Bold':         Rajdhani_700Bold,
    'Inter-Regular':         Inter_400Regular,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
  });

  /* ── Synchroniser AsyncStorage avec la session Supabase ── */
  const syncUserStorage = async (session) => {
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      let u = stored ? JSON.parse(stored) : {};

      if (!u.username || u.balance == null) {
        // Données manquantes → tout récupérer depuis Supabase
        const [profileRes, walletRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('wallets').select('balance').eq('user_id', session.user.id).single(),
        ]);
        if (profileRes.data) {
          u = {
            ...u,
            id:       session.user.id,
            email:    session.user.email,
            username: profileRes.data.username,
            rank:     profileRes.data.rank,
            xp:       profileRes.data.xp,
            phone:    profileRes.data.phone || u.phone || '',
            balance:  walletRes.data?.balance || 0,
            token:    session.access_token,
          };
          await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
        }
      } else {
        // Juste rafraîchir le token et l'id
        u.token = session.access_token;
        u.id    = session.user.id;
        await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
      }
    } catch (e) {
      console.warn('syncUserStorage error:', e.message);
    }
  };

  /* ── Initialisation auth (après fonts) ── */
  useEffect(() => {
    if (!fontsLoaded) return;
    initAuth();
  }, [fontsLoaded]);

  const initAuth = async () => {
    try {
      // 1. Session Supabase active ?
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await syncUserStorage(session);
        const fullUser = await getCurrentUser();
        if (fullUser) {
          setUser(fullUser);
          setIsLoggedIn(true);
          setReady(true);
          await SplashScreen.hideAsync();
          return;
        }
      }

      // 2. Token stocké → essayer de rafraîchir
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.token) {
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshed?.session) {
            await syncUserStorage(refreshed.session);
            const fullUser = await getCurrentUser();
            if (fullUser) {
              setUser(fullUser);
              setIsLoggedIn(true);
              setReady(true);
              await SplashScreen.hideAsync();
              return;
            }
          }
        }
        // Token invalide/expiré
        await AsyncStorage.multiRemove(['skillz_user', 'skillz_queue', 'skillz_temp_otp']);
      }

      setIsLoggedIn(false);
    } catch (e) {
      console.error('initAuth error:', e.message);
      setIsLoggedIn(false);
    } finally {
      setReady(true);
      await SplashScreen.hideAsync();
    }
  };

  /* ── Écouter les changements auth Supabase ── */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          await syncUserStorage(session);
          const fullUser = await getCurrentUser();
          if (fullUser) {
            setUser(fullUser);
            setIsLoggedIn(true);
          }

        } else if (event === 'TOKEN_REFRESHED' && session) {
          const stored = await AsyncStorage.getItem('skillz_user');
          if (stored) {
            const u = JSON.parse(stored);
            u.token = session.access_token;
            await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
          }

        } else if (event === 'SIGNED_OUT') {
          await AsyncStorage.multiRemove(['skillz_user', 'skillz_queue', 'skillz_temp_otp']);
          setUser(null);
          setIsLoggedIn(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  /* ── Callbacks login / logout ── */
  const handleLogin = async (userData: any) => {
    const userToStore = {
    id: userData.id,
    phone: userData.phone || userData.user_metadata?.phone,
    username: userData.user_metadata?.name || userData.username || 'Joueur',
    token: userData.token || userData.access_token || null,
  };
    await AsyncStorage.setItem('skillz_user', JSON.stringify(userToStore));
    setUser(userToStore);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    await AsyncStorage.multiRemove(['skillz_user', 'skillz_queue', 'skillz_temp_otp']);
    setUser(null);
    setIsLoggedIn(false);
  };

  /* ── Loader (fonts + init auth) ── */
  if (!ready || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={T.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={LINKING_CONFIG}
      >
        {isLoggedIn && user ? (
          <AppNavigator onLogout={handleLogout} />
        ) : (
          <AuthScreen onLogin={handleLogin} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#080A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});