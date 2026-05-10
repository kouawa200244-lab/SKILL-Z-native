import { supabase } from '../supabaseClient';

/* ── Créer un duel ── */
export async function createDuel({ creatorId, creatorUsername, gameKey, defi, mise, duelType = 'face_a_face' }) {
  // 1. Vérifier le solde
  const { data: wallet, error: wErr } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', creatorId)
    .single();

  if (wErr || !wallet) throw new Error('Impossible de lire ton solde.');
  if (wallet.balance < mise) throw new Error('Solde insuffisant pour cette mise.');

  // 2. Débiter le créateur
  const { error: debitErr } = await supabase
    .from('wallets')
    .update({ balance: wallet.balance - mise, updated_at: new Date().toISOString() })
    .eq('user_id', creatorId);

  if (debitErr) throw new Error('Erreur lors du débit.');

  // 3. Créer le duel
  const { data, error } = await supabase
    .from('duels')
    .insert({
      creator_id: creatorId,
      creator_username: creatorUsername,
      game_key: gameKey,
      defi_id: defi.id,
      defi_nom: defi.nom,
      defi_cond: defi.cond,
      duel_type: duelType,
      mise,
      cote: 2.0,
      status: 'waiting',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Rembourser si création échoue
    await supabase.from('wallets').update({ balance: wallet.balance }).eq('user_id', creatorId);
    throw new Error('Erreur lors de la création du duel.');
  }

  return data;
}

/* ── Rejoindre un duel ── */
export async function joinDuel({ duelId, opponentId, opponentUsername }) {
  // 1. Récupérer le duel
  const { data: duel, error: dErr } = await supabase
    .from('duels')
    .select('*')
    .eq('id', duelId)
    .single();

  if (dErr || !duel) throw new Error('Duel introuvable.');
  if (duel.status !== 'waiting') throw new Error('Ce duel n\'est plus disponible.');
  if (duel.creator_id === opponentId) throw new Error('Tu ne peux pas rejoindre ton propre duel.');
  if (new Date(duel.expires_at) < new Date()) throw new Error('Ce duel a expiré.');

  // 2. Vérifier le solde de l'adversaire
  const { data: wallet, error: wErr } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', opponentId)
    .single();

  if (wErr || !wallet) throw new Error('Impossible de lire ton solde.');
  if (wallet.balance < duel.mise) throw new Error('Solde insuffisant pour rejoindre ce duel.');

  // 3. Débiter l'adversaire
  const { error: debitErr } = await supabase
    .from('wallets')
    .update({ balance: wallet.balance - duel.mise, updated_at: new Date().toISOString() })
    .eq('user_id', opponentId);

  if (debitErr) throw new Error('Erreur lors du débit.');

  // 4. Activer le duel
  const { data, error } = await supabase
    .from('duels')
    .update({
      opponent_id: opponentId,
      opponent_username: opponentUsername,
      status: 'active',
    })
    .eq('id', duelId)
    .select()
    .single();

  if (error) {
    await supabase.from('wallets').update({ balance: wallet.balance }).eq('user_id', opponentId);
    throw new Error('Erreur lors de la jonction au duel.');
  }

  return data;
}

/* ── Soumettre un résultat ── */
export async function submitResult({ duelId, userId, result, score, proof }) {
  const { data: duel, error: dErr } = await supabase
    .from('duels').select('*').eq('id', duelId).single();

  if (dErr || !duel) throw new Error('Duel introuvable.');
  if (duel.status !== 'active') throw new Error('Ce duel n\'est pas actif.');

  const isCreator  = duel.creator_id  === userId;
  const isOpponent = duel.opponent_id === userId;
  if (!isCreator && !isOpponent) throw new Error('Tu ne fais pas partie de ce duel.');

  const updateData = isCreator
    ? { creator_result: result, creator_score: score, creator_proof: proof }
    : { opponent_result: result, opponent_score: score, opponent_proof: proof };

  const { data: updated, error } = await supabase
    .from('duels')
    .update(updateData)
    .eq('id', duelId)
    .select()
    .single();

  if (error) throw new Error('Erreur lors de la soumission.');

  // Les deux ont soumis → résoudre
  const bothSubmitted =
    (isCreator  && updated.opponent_result) ||
    (isOpponent && updated.creator_result);

  if (bothSubmitted) {
    await resolveDuel(updated);
  }

  return updated;
}

/* ── Résoudre le duel et distribuer les gains ── */
async function resolveDuel(duel) {
  const creatorWon  = duel.creator_result  === 'win';
  const opponentWon = duel.opponent_result === 'win';

  let winnerId   = null;
  let newStatus  = 'completed';
  const pot      = duel.mise * 2;
  const gain     = Math.round(pot * 0.9); // 10% commission SKILL'Z
  const commission = pot - gain;

  if (creatorWon && !opponentWon) {
    winnerId = duel.creator_id;
  } else if (opponentWon && !creatorWon) {
    winnerId = duel.opponent_id;
  } else {
    // Les deux déclarent gagner → litige
    newStatus = 'disputed';
  }

  // Mettre à jour le duel
  await supabase.from('duels').update({
    status: newStatus,
    winner_id: winnerId,
    gain_winner: winnerId ? gain : null,
  }).eq('id', duel.id);

  // Créditer le gagnant
  if (winnerId) {
    const { data: winnerWallet } = await supabase
      .from('wallets').select('balance').eq('user_id', winnerId).single();

    if (winnerWallet) {
      await supabase.from('wallets').update({
        balance: winnerWallet.balance + gain,
        updated_at: new Date().toISOString(),
      }).eq('user_id', winnerId);
    }
  }

  // Si nul : rembourser les deux
  if (!winnerId && newStatus !== 'disputed') {
    for (const uid of [duel.creator_id, duel.opponent_id]) {
      const { data: w } = await supabase.from('wallets').select('balance').eq('user_id', uid).single();
      if (w) await supabase.from('wallets').update({ balance: w.balance + duel.mise }).eq('user_id', uid);
    }
  }
}

/* ── Annuler un duel (avant qu'un adversaire rejoigne) ── */
export async function cancelDuel({ duelId, userId }) {
  const { data: duel } = await supabase.from('duels').select('*').eq('id', duelId).single();
  if (!duel) throw new Error('Duel introuvable.');
  if (duel.creator_id !== userId) throw new Error('Seul le créateur peut annuler.');
  if (duel.status !== 'waiting') throw new Error('Impossible d\'annuler un duel déjà actif.');

  // Rembourser
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
  if (wallet) {
    await supabase.from('wallets').update({ balance: wallet.balance + duel.mise }).eq('user_id', userId);
  }

  await supabase.from('duels').update({ status: 'cancelled' }).eq('id', duelId);
}

/* ── Récupérer les duels d'un utilisateur ── */
export async function getUserDuels(userId) {
  const { data, error } = await supabase
    .from('duels')
    .select('*')
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erreur lors de la récupération des duels.');
  return data || [];
}

/* ── Récupérer les duels ouverts (lobby) ── */
export async function getOpenDuels() {
  const { data, error } = await supabase
    .from('duels')
    .select('*')
    .eq('status', 'waiting')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error('Erreur lors de la récupération.');
  return data || [];
}

/* ── Récupérer le solde ── */
export async function getWalletBalance(userId) {
  const { data, error } = await supabase
    .from('wallets').select('balance').eq('user_id', userId).single();
  if (error) return 0;
  return data?.balance || 0;
}