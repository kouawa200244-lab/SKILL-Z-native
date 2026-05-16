// src/services/smsService.ts

const INFOBIP_BASE_URL = 'https://4kjegm.api.infobip.com';
const INFOBIP_API_KEY = '360484ecc76d7762c1342126b863cbfd-253fc5e8-560f-49bf-9e66-c8d92af3d6d8';
const INFOBIP_SENDER = '447491163443';

interface SmsResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

async function sendSMS(to: string, text: string): Promise<SmsResponse> {
  const phone = to.replace(/[\s\-\+]/g, '');

  try {
    const response = await fetch(`${INFOBIP_BASE_URL}/sms/3/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          destinations: [{ to: phone }],
          sender: INFOBIP_SENDER,
          content: { text },
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.requestError?.serviceException?.text || 'Erreur envoi SMS');
    }

    const msg = data.messages?.[0];
    if (msg?.status?.groupName === 'REJECTED') {
      throw new Error(`SMS rejeté : ${msg.status.description}`);
    }

    return {
      success: true,
      messageId: msg?.messageId,
      status: msg?.status?.name,
    };
  } catch (error: any) {
    console.error('Erreur sendSMS:', error);
    return { success: false, error: error.message };
  }
}

// ─── FONCTIONS MÉTIER ────────────────────────────────────

export async function sendOTP(phoneNumber: string, code: string): Promise<SmsResponse> {
  const text = `⚡ SKILL'Z — Ton code de vérification : *${code}*\nValable 10 minutes. Ne le partage jamais.`;
  return sendSMS(phoneNumber, text);
}

export async function notifyDuelReceived(phoneNumber: string, { challengerName, defiNom, mise }: any): Promise<SmsResponse> {
  const text = `⚔️ SKILL'Z — ${challengerName} te défie !\nDéfi : ${defiNom}\nMise : ${mise} FCFA\nOuvre l'app pour accepter avant expiration.`;
  return sendSMS(phoneNumber, text);
}

export async function notifyDuelAccepted(phoneNumber: string, { opponentName, defiNom }: any): Promise<SmsResponse> {
  const text = `✅ SKILL'Z — ${opponentName} a rejoint ton duel !\nDéfi : ${defiNom}\nOuvre l'app — le combat commence maintenant.`;
  return sendSMS(phoneNumber, text);
}

export async function notifyResult(phoneNumber: string, { outcome, defiNom, gain }: any): Promise<SmsResponse> {
  const text = outcome === 'win'
    ? `🏆 SKILL'Z — Tu as GAGNÉ !\nDéfi : ${defiNom}\n+${gain} FCFA crédités sur ton wallet.`
    : `💀 SKILL'Z — Duel terminé.\nDéfi : ${defiNom}\nRésultat validé par l'admin. Ouvre l'app pour voir le détail.`;
  return sendSMS(phoneNumber, text);
}

export async function notifyDeposit(phoneNumber: string, { amount, balance }: any): Promise<SmsResponse> {
  const text = `💰 SKILL'Z — Recharge reçue !\n+${amount} FCFA ajoutés.\nNouveau solde : ${balance} FCFA.`;
  return sendSMS(phoneNumber, text);
}

export async function notifyWithdraw(phoneNumber: string, { amount, balance }: any): Promise<SmsResponse> {
  const text = `💸 SKILL'Z — Retrait effectué.\n-${amount} FCFA retirés.\nSolde restant : ${balance} FCFA.`;
  return sendSMS(phoneNumber, text);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}