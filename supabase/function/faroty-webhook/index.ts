// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const WEBHOOK_SECRET = Deno.env.get('FAROTY_WEBHOOK_SECRET')!;

/* ── Vérifier la signature Faroty ── */
function verifySignature(payload: string, signature: string): boolean {
  try {
    const hmac     = createHmac('sha256', WEBHOOK_SECRET);
    const expected = hmac.update(payload).digest('hex');
    return expected === signature;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const headers = { 'Content-Type': 'application/json' };

  try {
    // Lire le body
    const rawBody  = await req.text();
    const signature = req.headers.get('x-faroty-signature') || '';

    // Vérifier l'authenticité
    if (!verifySignature(rawBody, signature)) {
      console.error('Signature webhook invalide');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers }
      );
    }

    const payload = JSON.parse(rawBody);
    console.log('Webhook Faroty reçu:', JSON.stringify(payload));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extraire les infos importantes
    const sessionToken = payload?.data?.sessionToken || payload?.sessionToken;
    const status       = payload?.data?.status       || payload?.status;
    const amount       = payload?.data?.amount       || payload?.amount;

    if (!sessionToken) {
      console.error('sessionToken manquant dans le webhook');
      return new Response(JSON.stringify({ received: true }), { status: 200, headers });
    }

    // Trouver la session dans Supabase
    const { data: session } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('faroty_token', sessionToken)
      .single();

    if (!session) {
      console.error('Session introuvable:', sessionToken);
      return new Response(JSON.stringify({ received: true }), { status: 200, headers });
    }

    // Éviter le double traitement
    if (session.status !== 'pending') {
      console.log('Session déjà traitée:', sessionToken);
      return new Response(JSON.stringify({ received: true }), { status: 200, headers });
    }

    const isSuccess = ['SUCCESS', 'COMPLETED', 'PAID'].includes(status?.toUpperCase());
    const isFailed  = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(status?.toUpperCase());

    if (isSuccess) {
      // ── PAIEMENT RÉUSSI ──

      if (session.type === 'DEPOSIT') {
        // Créditer le wallet Supabase
        const { data: result } = await supabase.rpc('deposit_funds', {
          p_user_id: session.user_id,
          p_amount:  session.amount,
          p_label:   `Recharge ${session.method === 'orange_money' ? 'Orange Money' : 'MTN Money'} — ${session.amount} FCFA`,
        });
        console.log('Dépôt crédité:', result);
      }
      // Pour WITHDRAWAL : déjà débité à la création de session

      // Mettre à jour la session
      await supabase
        .from('payment_sessions')
        .update({
          status:      'success',
          faroty_data: payload,
          resolved_at: new Date().toISOString(),
        })
        .eq('faroty_token', sessionToken);

    } else if (isFailed) {
      // ── PAIEMENT ÉCHOUÉ ──

      if (session.type === 'WITHDRAWAL') {
        // Rembourser le retrait bloqué
        await supabase.rpc('deposit_funds', {
          p_user_id: session.user_id,
          p_amount:  session.amount,
          p_label:   `Remboursement retrait échoué — ${session.amount} FCFA`,
        });
        console.log('Retrait remboursé:', session.amount);
      }

      // Mettre à jour la session
      await supabase
        .from('payment_sessions')
        .update({
          status:      'failed',
          faroty_data: payload,
          resolved_at: new Date().toISOString(),
        })
        .eq('faroty_token', sessionToken);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers });

  } catch (error) {
    console.error('faroty-webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
});