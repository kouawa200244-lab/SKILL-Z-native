import { supabase } from '../supabaseClient';
import { getCurrentUser, updateCachedUser } from './getCurrentUser';

/* ── Appel Edge Function ── */
async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    console.error(`[${name}] erreur brute:`, JSON.stringify(error));
    let message = error.message || `Erreur fonction ${name}`;
    try {
      if (error.context) {
        const json = await error.context.json();
        console.error(`[${name}] détail:`, JSON.stringify(json));
        message = json?.error || json?.message || message;
      }
    } catch (_) {}
    throw new Error(message);
  }

  console.log(`[${name}] réponse:`, JSON.stringify(data));
  return data;
}

/* ══════════════════════════════════════
   AUTH — Connexion / Inscription
══════════════════════════════════════ */
export async function farotyAuth({ phone, username }) {
  const data = await callFunction('faroty-auth', { phone, username });
  if (!data?.success) throw new Error(data?.error || 'Erreur d\'authentification');
  return data;
}

/* ══════════════════════════════════════
   WALLET — Créer wallet Faroty
══════════════════════════════════════ */
export async function createFarotyWallet({ userId, farotyUserId }) {
  const data = await callFunction('create-faroty-wallet', { userId, farotyUserId });
  if (!data?.success) throw new Error(data?.error || 'Erreur création wallet');
  await updateCachedUser({ farotyWalletId: data.farotyWalletId });
  return data;
}

/* ══════════════════════════════════════
   PAIEMENT — Créer session Faroty
══════════════════════════════════════ */
export async function createPaymentSession({ amount, type }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Non connecté');

  if (!user.farotyWalletId) {
    const walletResult = await createFarotyWallet({
      userId:       user.id,
      farotyUserId: user.farotyUserId,
    });
    user.farotyWalletId = walletResult.farotyWalletId;
  }

  if (!user.farotyWalletId) {
    throw new Error('Wallet de paiement non configuré. Contacte le support.');
  }
  if (amount < 500) {
    throw new Error('Montant minimum : 500 FCFA');
  }
  if (type === 'WITHDRAW' && amount > (user.balance || 0)) {
    throw new Error(`Solde insuffisant (${user.balance} FCFA disponibles)`);
  }

  const data = await callFunction('create-payment-session', {
    userId:         user.id,
    farotyWalletId: user.farotyWalletId,
    amount,
    type,
    username:       user.username,
  });

  if (!data?.success) throw new Error(data?.error || 'Erreur session paiement');

  return {
    sessionUrl:    data.sessionUrl,
    sessionToken:  data.sessionToken,
    transactionId: data.transactionId,
    amount,
    type,
  };
}

/* ══════════════════════════════════════
   VÉRIFIER statut transaction
══════════════════════════════════════ */
export async function checkTransactionStatus(transactionId) {
  const { data, error } = await supabase
    .from('faroty_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error) throw new Error('Transaction introuvable');
  return data;
}