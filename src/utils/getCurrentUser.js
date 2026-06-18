import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';

/* ══════════════════════════════════════
   Récupère le user courant
   Priorité : AsyncStorage > Supabase
══════════════════════════════════════ */
export async function getCurrentUser() {
  try {
    const stored = await AsyncStorage.getItem('skillz_user');
    if (stored) {
      return JSON.parse(stored);
    }

    // Fallback Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const [profileRes, walletRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('wallets').select('*').eq('user_id', session.user.id).single(),
    ]);

    if (!profileRes.data) return null;

    const user = {
      id:             session.user.id,
      username:       profileRes.data.username,
      phone:          profileRes.data.phone,
      rank:           profileRes.data.rank           || 'RANG BRONZE',
      xp:             profileRes.data.xp             || 0,
      balance:        walletRes.data?.balance        || 0,
      farotyWalletId: profileRes.data.faroty_wallet_id,
      farotyUserId:   profileRes.data.faroty_user_id,
      avatarUrl:      profileRes.data.avatar_url,
      token:          session.access_token,
      refreshToken:   session.refresh_token,
    };

    await AsyncStorage.setItem('skillz_user', JSON.stringify(user));
    return user;

  } catch (e) {
    console.error('[getCurrentUser]', e);
    return null;
  }
}

/* ── Mettre à jour le user en cache ── */
export async function updateCachedUser(updates) {
  try {
    const stored = await AsyncStorage.getItem('skillz_user');
    if (!stored) return;
    const user    = JSON.parse(stored);
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem('skillz_user', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('[updateCachedUser]', e);
    return null;
  }
}

/* ── Vider la session ── */
export async function clearSession() {
  await AsyncStorage.multiRemove([
    'skillz_user',
    'skillz_queue',
    'skillz_otp_sim',
    'skillz_auth_tmp',
  ]);
}