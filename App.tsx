// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Rajdhani_700Bold }        from '@expo-google-fonts/rajdhani';
import { Inter_400Regular }        from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { StatusBar } from 'expo-status-bar';
import { supabase }     from './src/supabaseClient';
import AppNavigator     from './src/navigation/AppNavigator';
import AuthScreen       from './src/screens/AuthScreen';
import { T }            from './src/utils/designTokens';
 
export default function App() {
  const [user,         setUser]         = useState(null);
  const [initializing, setInitializing] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* ── Fonts ── */
  const [fontsLoaded] = useFonts({
    'Rajdhani-Bold':         Rajdhani_700Bold,
    'Inter-Regular':         Inter_400Regular,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
  });

  /* ── Vérification session au démarrage ── */
  useEffect(() => {
    checkExistingSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[App] Auth event:', event);
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const checkExistingSession = async () => {
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) {
        const localUser = JSON.parse(stored);
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const freshUser = await refreshUserData(localUser.id || session.user.id);
          const finalUser = freshUser || localUser;
          setUser(finalUser);
          await AsyncStorage.setItem('skillz_user', JSON.stringify(finalUser));
        } else {
          const refreshed = await tryRefreshSession(localUser);
          if (refreshed) {
            setUser(refreshed);
          } else {
            await AsyncStorage.removeItem('skillz_user');
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('[App] checkExistingSession error:', e);
      setUser(null);
    } finally {
      setInitializing(false);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();
    }
  };

  const refreshUserData = async (userId) => {
    try {
      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallets').select('*').eq('user_id', userId).single(),
      ]);
      if (!profileRes.data) return null;
      return {
        id:             userId,
        username:       profileRes.data.username,
        phone:          profileRes.data.phone,
        rank:           profileRes.data.rank           || 'RANG BRONZE',
        xp:             profileRes.data.xp             || 0,
        balance:        walletRes.data?.balance        || 0,
        farotyWalletId: profileRes.data.faroty_wallet_id,
        farotyUserId:   profileRes.data.faroty_user_id,
        avatarUrl:      profileRes.data.avatar_url,
      };
    } catch (e) {
      console.error('[App] refreshUserData:', e);
      return null;
    }
  };

  const tryRefreshSession = async (localUser) => {
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      const u      = JSON.parse(stored || '{}');
      if (u.refreshToken) {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: u.refreshToken,
        });
        if (!error && data.session) {
          const fresh = await refreshUserData(data.session.user.id);
          if (fresh) {
            const updated = {
              ...fresh,
              token:        data.session.access_token,
              refreshToken: data.session.refresh_token,
            };
            await AsyncStorage.setItem('skillz_user', JSON.stringify(updated));
            return updated;
          }
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const handleLogin  = async (userData) => setUser(userData);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove([
        'skillz_user',
        'skillz_queue',
        'skillz_otp_sim',
        'skillz_auth_tmp',
      ]);
      setUser(null);
    } catch (e) {
      console.error('[App] logout error:', e);
      setUser(null);
    }
  };

  /* ── Splash pendant chargement ── */
  if (!fontsLoaded || initializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.splashScreen}>
          <ActivityIndicator color={T.gold} size="large" />
        </View>
      </SafeAreaProvider>
    );
  }
  
  return (
    <SafeAreaProvider>
      <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
        <StatusBar style="light" />
        {user ? (
          <NavigationContainer>
            <AppNavigator
              user={user}
              onLogout={handleLogout}
              onUserUpdate={setUser}
            />
          </NavigationContainer>
        ) : (
          <AuthScreen onLogin={handleLogin} />
        )}
      </Animated.View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#080A0F' },
  splashScreen:{ flex: 1, backgroundColor: '#080A0F', justifyContent: 'center', alignItems: 'center' },
});