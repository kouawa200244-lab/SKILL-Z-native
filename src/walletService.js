import AsyncStorage from '@react-native-async-storage/async-storage';

// URL Supabase (stockée localement pour éviter les dépendances .env sur React Native)
const SUPABASE_URL = "https://rwuirfcejlgqkcmoxoyo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dWlyZmNlamxncWtjbW94b3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5MDEsImV4cCI6MjA5MjA4ODkwMX0._JwB35y906uiCfzdWK5vWMaaWJ8oPaQw52cgQo8oGV4";

// Headers communs
const getHeaders = async () => {
  const token = await AsyncStorage.getItem('skillz_token');
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
};

// Récupérer le wallet d'un utilisateur
export async function fetchWallet(userId) {
  try {
    const headers = await getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${userId}&select=*`,
      { headers }
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return data[0];
    }

    // Si le wallet n'existe pas, le créer
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, balance: 5000 }),
    });

    if (createResponse.ok) {
      const newWallet = await createResponse.json();
      return newWallet[0];
    }

    return null;
  } catch (error) {
    console.error('Erreur fetchWallet:', error);
    return null;
  }
}
/* ── Créditer gain après victoire ── */
export async function creditWin({ userId, gain, defiNom, mise, cote }) {
  const { data, error } = await supabase.rpc('deposit_funds', {
    p_user_id: userId,
    p_amount:  gain,
    p_label:   `Victoire — ${defiNom} ×${cote}`,
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Erreur crédit');

  // Mettre à jour le cache local
  const stored = await AsyncStorage.getItem('skillz_user');
  if (stored) {
    const u = JSON.parse(stored);
    u.balance = data.balance_new;
    await AsyncStorage.setItem('skillz_user', JSON.stringify(u));
  }

  return { balanceNew: data.balance_new };
}

// Mettre à jour le solde
export async function updateBalance(userId, newBalance) {
  try {
    const headers = await getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Erreur updateBalance:', error);
    return false;
  }
}

// Créer une transaction
export async function createTransaction(userId, type, amount, metadata = {}) {
  try {
    const headers = await getHeaders();
    await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        type,
        amount,
        metadata,
      }),
    });
    return true;
  } catch (error) {
    console.error('Erreur createTransaction:', error);
    return false;
  }
}