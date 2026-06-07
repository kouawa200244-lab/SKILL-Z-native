// src/utils/getCurrentUser.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';

export interface SkillzUser {
  id:        string;
  email:     string;
  username:  string;
  rank:      string;
  xp:        number;
  balance:   number;
  phone:     string;
  token:     string;
}

/* ══════════════════════════════════════
   Récupère l'utilisateur courant
   Priorité : Supabase Auth > AsyncStorage
══════════════════════════════════════ */
export async function getCurrentUser(): Promise<SkillzUser | null> {
  try {
    // 1. Récupérer la session Supabase Auth (source de vérité)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      // Pas de session active → essayer de refresh
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (!refreshed?.session?.user) {
        console.warn('Pas de session Supabase active');
        return null;
      }
    }

    const authUser = session?.user || (await supabase.auth.getUser()).data.user;
    if (!authUser) return null;

    // 2. Récupérer profil + wallet depuis Supabase
    const [profileRes, walletRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).single(),
      supabase.from('wallets').select('balance').eq('user_id', authUser.id).single(),
    ]);

    const profile = profileRes.data;
    const wallet  = walletRes.data;

    const user: SkillzUser = {
      id:       authUser.id,          // ✅ UUID Supabase réel
      email:    authUser.email || '',
      username: profile?.username || authUser.email?.split('@')[0] || 'Joueur',
      rank:     profile?.rank    || 'RANG BRONZE',
      xp:       profile?.xp      || 0,
      balance:  wallet?.balance  || 0,
      phone:    profile?.phone   || '',
      token:    session?.access_token || '',
    };

    // 3. Synchroniser AsyncStorage avec les vraies données
    await AsyncStorage.setItem('skillz_user', JSON.stringify(user));

    return user;

  } catch (e) {
    console.error('getCurrentUser error:', e);

    // Fallback AsyncStorage (si offline)
    const stored = await AsyncStorage.getItem('skillz_user');
    if (stored) return JSON.parse(stored);
    return null;
  }
}

/* ── Vérifier si l'ID est un vrai UUID Supabase ── */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}