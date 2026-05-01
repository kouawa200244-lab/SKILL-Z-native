// ============================================================
// src/services/betService.ts
// Service complet de gestion des paris SKILLBET
// Gère : création, résultat, wallet, historique
// ============================================================
// @ts-nocheck

import { supabase } from '../supabaseClient';

// ── Types ────────────────────────────────────────────────────
export type Outcome = 'win' | 'loss' | 'pending_review';
export type ValidationMode = 'room' | 'witness' | 'photo';

export interface BetPayload {
  userId:          string;
  sessionId?:      string;
  playerName:      string;
  game:            string;
  defiId:          string;
  defiNom:         string;
  palier:          string;
  cote:            number;
  mise:            number;
  outcome:         Outcome;
  filet?:          number;
  durationSecs?:   number;
  validationMode?: ValidationMode;
  witnessName?:    string;
}

export interface BetResult {
  success: boolean;
  betId?:  string;
  gain?:   number;
  error?:  string;
}

// ── Calcul du Filet SKILL ────────────────────────────────────
// Actif uniquement pour mises ≤ 1000 FCFA et cotes < ×2
export function calculateFilet(mise: number, cote: number): number {
  if (mise <= 1000 && cote < 2) {
    return Math.max(0, Math.round(mise * (2 - cote)));
  }
  return 0;
}

// ── Calcul du gain brut ──────────────────────────────────────
export function calculateGain(mise: number, cote: number): number {
  return Math.round(mise * cote);
}

// ── Vérifier que le wallet a assez de fonds ─────────────────
async function checkWalletBalance(
  userId: string,
  mise: number
): Promise<{ ok: boolean; balance: number; error?: string }> {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { ok: false, balance: 0, error: 'Wallet introuvable' };
  }

  if (data.balance < mise) {
    return {
      ok:      false,
      balance: data.balance,
      error:   `Solde insuffisant. Tu as ${data.balance} F, mise requise: ${mise} F`,
    };
  }

  return { ok: true, balance: data.balance };
}

// ── Débiter le wallet ────────────────────────────────────────
async function debitWallet(
  userId:     string,
  montant:    number,
  currentBalance: number
): Promise<boolean> {
  const { error } = await supabase
    .from('wallets')
    .update({
      balance:    currentBalance - montant,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return !error;
}

// ── Créditer le wallet ───────────────────────────────────────
async function creditWallet(
  userId:         string,
  montant:        number,
  currentBalance: number
): Promise<boolean> {
  const { error } = await supabase
    .from('wallets')
    .update({
      balance:    currentBalance + montant,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return !error;
}

// ── Enregistrer une transaction ──────────────────────────────
async function logTransaction(
  userId:  string,
  type:    string,
  amount:  number,
  meta:    object
): Promise<void> {
  await supabase.from('transactions').insert({
    user_id:    userId,
    type,
    amount,
    metadata:   meta,
    created_at: new Date().toISOString(),
  });
}

// ── Mettre à jour les stats du joueur ───────────────────────
async function updatePlayerStats(
  userId:  string,
  outcome: Outcome
): Promise<void> {
  const { data: player } = await supabase
    .from('players')
    .select('total_bets, total_wins')
    .eq('id', userId)
    .single();

  if (!player) return;

  await supabase
    .from('players')
    .update({
      total_bets: player.total_bets + 1,
      total_wins: outcome === 'win' ? player.total_wins + 1 : player.total_wins,
    })
    .eq('id', userId);
}

// ════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE — Jouer un défi
// C'est la seule fonction que les écrans appellent
// ════════════════════════════════════════════════════════════
export async function playBet(payload: BetPayload): Promise<BetResult> {
  const {
    userId, sessionId, playerName, game, defiId, defiNom,
    palier, cote, mise, outcome, durationSecs = 0,
    validationMode = 'room', witnessName,
  } = payload;

  const gain  = calculateGain(mise, cote);
  const filet = outcome === 'loss' ? calculateFilet(mise, cote) : 0;

  try {
    // ── 1. Vérifier le solde ──────────────────────────────
    const { ok, balance, error: balanceError } = await checkWalletBalance(userId, mise);
    if (!ok) return { success: false, error: balanceError };

    // ── 2. Débiter la mise ────────────────────────────────
    const debited = await debitWallet(userId, mise, balance);
    if (!debited) return { success: false, error: 'Erreur débit wallet' };

    // ── 3. Enregistrer le bet ─────────────────────────────
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id:         userId,
        session_id:      sessionId || null,
        player_name:     playerName,
        game,
        defi_id:         defiId,
        defi_nom:        defiNom,
        palier,
        cote,
        mise,
        outcome,
        gain:            outcome === 'win' ? gain : 0,
        filet,
        duration_secs:   durationSecs,
        validation_mode: validationMode,
        witness_name:    witnessName || null,
        created_at:      new Date().toISOString(),
      })
      .select()
      .single();

    if (betError) {
      // Rembourser si l'enregistrement échoue
      await creditWallet(userId, mise, balance - mise);
      return { success: false, error: 'Erreur enregistrement pari' };
    }

    // ── 4. Créditer si victoire ───────────────────────────
    if (outcome === 'win') {
      const { balance: currentBalance } = await checkWalletBalance(userId, 0)
        .then(r => ({ balance: r.balance }));
      await creditWallet(userId, gain, currentBalance);

      await logTransaction(userId, 'bet_win', gain, {
        bet_id:   bet.id,
        defi_nom: defiNom,
        cote,
      });
    }

    // ── 5. Rembourser le filet si défaite ─────────────────
    if (outcome === 'loss' && filet > 0) {
      const { balance: currentBalance } = await checkWalletBalance(userId, 0)
        .then(r => ({ balance: r.balance }));
      await creditWallet(userId, filet, currentBalance);

      await logTransaction(userId, 'filet_skill', filet, {
        bet_id:   bet.id,
        defi_nom: defiNom,
      });
    }

    // ── 6. Logger la mise dans tous les cas ───────────────
    await logTransaction(userId, 'bet_placed', -mise, {
      bet_id:   bet.id,
      game,
      defi_nom: defiNom,
      outcome,
    });

    // ── 7. Mettre à jour les stats joueur ─────────────────
    await updatePlayerStats(userId, outcome);

    return {
      success: true,
      betId:   bet.id,
      gain:    outcome === 'win' ? gain : filet,
    };

  } catch (e: any) {
    console.error('playBet error:', e);
    return { success: false, error: e.message || 'Erreur inattendue' };
  }
}

// ════════════════════════════════════════════════════════════
// FONCTIONS DE LECTURE
// ════════════════════════════════════════════════════════════

// Historique des bets d'un joueur
export async function fetchUserBets(
  userId: string,
  limit:  number = 20
): Promise<any[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchUserBets error:', error);
    return [];
  }

  return data || [];
}

// Stats globales d'un joueur
export async function fetchPlayerStats(userId: string): Promise<{
  totalBets:  number;
  totalWins:  number;
  totalLoses: number;
  winRate:    number;
  totalGain:  number;
  totalLost:  number;
  bestCote:   number;
} | null> {
  const { data, error } = await supabase
    .from('bets')
    .select('outcome, gain, mise, cote')
    .eq('user_id', userId);

  if (error || !data) return null;

  const wins   = data.filter(b => b.outcome === 'win');
  const losses = data.filter(b => b.outcome === 'loss');

  return {
    totalBets:  data.length,
    totalWins:  wins.length,
    totalLoses: losses.length,
    winRate:    data.length ? Math.round(wins.length / data.length * 100) : 0,
    totalGain:  wins.reduce((s, b) => s + b.gain, 0),
    totalLost:  losses.reduce((s, b) => s + b.mise, 0),
    bestCote:   data.length ? Math.max(...data.map(b => b.cote)) : 0,
  };
}

// Solde du wallet
export async function fetchWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error || !data) return 0;
  return data.balance;
}

export async function fetchWallet(userId: string): Promise<{ balance: number } | null> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${userId}&select=*`, { headers });
    const data = await response.json();
    if (data && data.length > 0) return data[0];

    // Création automatique si inexistant
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
  } catch (e) {
    console.error('fetchWallet error', e);
    return null;
  }
}
// Créer un wallet si inexistant (appelé à la première connexion)
export async function ensureWalletExists(userId: string): Promise<void> {
  const { data } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!data) {
    await supabase.from('wallets').insert({
      user_id:    userId,
      balance:    0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}