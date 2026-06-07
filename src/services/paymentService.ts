// @ts-nocheck
import { supabase } from '../supabaseClient';
import { Linking } from 'react-native';

const SUPABASE_URL = 'https://rwuirfcejlgqkcmoxoyo.supabase.co';

/* ── Récupère le token actif (refresh si nécessaire) ── */
async function getValidToken() {
  // Essayer de récupérer la session active
  const { data: { session }, error } = await supabase.auth.getSession();

  if (session?.access_token) {
    return session.access_token;
  }

  // Essayer de rafraîchir
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (!refreshError && refreshed?.session?.access_token) {
    return refreshed.session.access_token;
  }

  throw new Error('Non connecté. Reconnecte-toi.');
}

/* ── Dépôt ── */
export async function initiateDeposit({ amount, method }) {
  const token = await getValidToken();

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/create-payment-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, type: 'DEPOSIT', method }),
    }
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Erreur paiement.');

  await Linking.openURL(data.sessionUrl);
  return data;
}

/* ── Retrait ── */
export async function initiateWithdrawal({ amount, method }) {
  const token = await getValidToken();

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/create-payment-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, type: 'WITHDRAWAL', method }),
    }
  );

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Erreur retrait.');

  await Linking.openURL(data.sessionUrl);
  return data;
}