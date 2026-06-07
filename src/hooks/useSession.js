import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useSession() {
  const [session,  setSession]  = useState(null);
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        // 1. Essayer de récupérer la session depuis Supabase
        const { data: { session: activeSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Erreur getSession:', error.message);
        }

        if (activeSession && mounted) {
          setSession(activeSession);
          setUser(activeSession.user);

          // Synchroniser AsyncStorage avec la session réelle
          const stored = await AsyncStorage.getItem('skillz_user');
          if (stored) {
            const u = JSON.parse(stored);
            u.token = activeSession.access_token;
            await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
          }
        } else if (mounted) {
          // 2. Aucune session Supabase → essayer de restaurer depuis AsyncStorage
          const stored = await AsyncStorage.getItem('skillz_user');
          if (stored) {
            const u = JSON.parse(stored);

            if (u?.token) {
              // Tenter de rafraîchir la session avec le token stocké
              const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshed.session) {
                setSession(refreshed.session);
                setUser(refreshed.session.user);
              } else {
                // Token expiré → déconnecter proprement
                await AsyncStorage.removeItem('skillz_user');
                console.log('Session expirée, reconnexion requise');
              }
            }
          }
        }
      } catch (e) {
        console.warn('initSession error:', e.message);
      } finally {
        if (mounted) {
          setLoading(false);
          setReady(true);
        }
      }
    };

    initSession();

    // Écouter les changements de session en temps réel
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);

        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);

          // Mettre à jour le token dans AsyncStorage
          const stored = await AsyncStorage.getItem('skillz_user');
          if (stored) {
            const u = JSON.parse(stored);
            u.token = newSession.access_token;
            await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
          }

        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          await AsyncStorage.multiRemove(['skillz_user', 'skillz_queue']);

        } else if (event === 'USER_UPDATED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove(['skillz_user', 'skillz_queue', 'skillz_temp_otp']);
      setSession(null);
      setUser(null);
    } catch (e) {
      console.error('signOut error:', e.message);
    }
  };

  return { session, user, loading, ready, signOut };
}