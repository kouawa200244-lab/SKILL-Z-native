// ══════════════════════════════════════
// SERVICE SMS — Infobip
// ══════════════════════════════════════

const INFOBIP_BASE_URL = 'https://4kjegm.api.infobip.com';
const INFOBIP_API_KEY  = '360484ecc76d7762c1342126b863cbfd-253fc5e8-560f-49bf-9e66-c8d92af3d6d8';
const INFOBIP_SENDER   = '447491163443';

/* ── Envoi SMS générique ── */
async function sendSMS(to, text) {
  // Formater le numéro (enlever +, espaces, tirets)
  const phone = to.replace(/[\s\-\+]/g, '');

  const response = await fetch(`${INFOBIP_BASE_URL}/sms/3/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `App ${INFOBIP_API_KEY}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    },
    body: JSON.stringify({
      messages: [{
        destinations: [{ to: phone }],
        sender:       INFOBIP_SENDER,
        content:      { text },
      }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.requestError?.serviceException?.text || 'Erreur envoi SMS');
  }

  // Vérifier le statut du message
  const msg = data.messages?.[0];
  if (msg?.status?.groupName === 'REJECTED') {
    throw new Error(`SMS rejeté : ${msg.status.description}`);
  }

  return {
    success:   true,
    messageId: msg?.messageId,
    status:    msg?.status?.name,
  };
}

/* ══════════════════════════════════════
   FONCTIONS MÉTIER SKILL'Z
══════════════════════════════════════ */

/* ── OTP inscription / connexion ── */
export async function sendOTP(phoneNumber, code) {
  const text =
    `⚡ SKILL'Z — Ton code de vérification : *${code}*\n` +
    `Valable 10 minutes. Ne le partage jamais.`;
  return sendSMS(phoneNumber, text);
}

/* ── Notification duel reçu ── */
export async function notifyDuelReceived(phoneNumber, { challengerName, defiNom, mise }) {
  const text =
    `⚔️ SKILL'Z — ${challengerName} te défie !\n` +
    `Défi : ${defiNom}\n` +
    `Mise : ${mise} FCFA\n` +
    `Ouvre l'app pour accepter avant expiration.`;
  return sendSMS(phoneNumber, text);
}

/* ── Notification duel accepté ── */
export async function notifyDuelAccepted(phoneNumber, { opponentName, defiNom }) {
  const text =
    `✅ SKILL'Z — ${opponentName} a rejoint ton duel !\n` +
    `Défi : ${defiNom}\n` +
    `Ouvre l'app — le combat commence maintenant.`;
  return sendSMS(phoneNumber, text);
}

/* ── Notification résultat validé par admin ── */
export async function notifyResult(phoneNumber, { outcome, defiNom, gain }) {
  const text = outcome === 'win'
    ? `🏆 SKILL'Z — Tu as GAGNÉ !\n` +
      `Défi : ${defiNom}\n` +
      `+${gain} FCFA crédités sur ton wallet.`
    : `💀 SKILL'Z — Duel terminé.\n` +
      `Défi : ${defiNom}\n` +
      `Résultat validé par l'admin. Ouvre l'app pour voir le détail.`;
  return sendSMS(phoneNumber, text);
}

/* ── Notification recharge wallet ── */
export async function notifyDeposit(phoneNumber, { amount, balance }) {
  const text =
    `💰 SKILL'Z — Recharge reçue !\n` +
    `+${amount} FCFA ajoutés.\n` +
    `Nouveau solde : ${balance} FCFA.`;
  return sendSMS(phoneNumber, text);
}

/* ── Notification retrait wallet ── */
export async function notifyWithdraw(phoneNumber, { amount, balance }) {
  const text =
    `💸 SKILL'Z — Retrait effectué.\n` +
    `-${amount} FCFA retirés.\n` +
    `Solde restant : ${balance} FCFA.`;
  return sendSMS(phoneNumber, text);
}

/* ── OTP numérique 6 chiffres ── */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}