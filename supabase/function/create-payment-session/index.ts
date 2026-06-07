// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FAROTY_URL     = 'https://api-pay-prod.faroty.me/payments/api/v1';
const FAROTY_API_KEY = Deno.env.get('FAROTY_API_KEY')!;
const APP_URL        = 'https://skillz.app'; // ton URL ou deep link

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Récupérer le token d'authentification de l'utilisateur
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non authentifié' }),
        { status: 401, headers }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Vérifier l'utilisateur
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide' }),
        { status: 401, headers }
      );
    }

    const body = await req.json();
    const { amount, type, method } = body;
    // type: 'DEPOSIT' | 'WITHDRAWAL'
    // method: 'orange_money' | 'mtn_money'

    // Validation
    if (!amount || amount < 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Montant minimum : 500 FCFA' }),
        { status: 400, headers }
      );
    }
    if (!['DEPOSIT', 'WITHDRAWAL'].includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Type invalide' }),
        { status: 400, headers }
      );
    }

    // Récupérer le wallet Faroty de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('faroty_wallet_id, username')
      .eq('id', user.id)
      .single();

    if (!profile?.faroty_wallet_id) {
      // Créer le wallet s'il n'existe pas encore
      const walletRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/create-faroty-wallet`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        }
      );
      const walletData = await walletRes.json();
      if (!walletData.success) {
        throw new Error('Impossible de créer le wallet de paiement.');
      }
      profile.faroty_wallet_id = walletData.walletId;
    }

    // Pour les retraits : vérifier le solde Supabase
    if (type === 'WITHDRAWAL') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.balance < amount) {
        return new Response(
          JSON.stringify({ success: false, error: 'Solde insuffisant' }),
          { status: 400, headers }
        );
      }
    }

    // Créer la session Faroty
    const methodLabel = method === 'orange_money' ? 'Orange Money' : 'MTN Money';
    const typeLabel   = type === 'DEPOSIT' ? 'Recharge' : 'Retrait';

    const sessionBody = {
      walletId:     profile.faroty_wallet_id,
      currencyCode: 'XAF',
      cancelUrl:    `${APP_URL}/payment/cancel`,
      successUrl:   `${APP_URL}/payment/success`,
      type,
      amount,
      contentType:  'CAMPAIGN_SIMPLE',
      dynamicContentData: {
        title:       `SKILL'Z — ${typeLabel}`,
        description: `${typeLabel} via ${methodLabel} — ${amount} FCFA`,
        target:      `${amount} XAF`,
        imageUrl:    'https://media.faroty.me/api/media/public/default.png',
      },
    };

    const farotyRes = await fetch(`${FAROTY_URL}/payment-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY':    FAROTY_API_KEY,
      },
      body: JSON.stringify(sessionBody),
    });

    const farotyData = await farotyRes.json();
    console.log('Faroty session response:', JSON.stringify(farotyData));

    if (!farotyRes.ok || !farotyData?.data?.sessionToken) {
      throw new Error(farotyData?.message || 'Erreur création session Faroty');
    }

    const { sessionToken, sessionUrl } = farotyData.data;

    // Enregistrer la session dans Supabase
    await supabase.from('payment_sessions').insert({
      user_id:      user.id,
      faroty_token: sessionToken,
      type,
      amount,
      method,
      status:       'pending',
      faroty_data:  farotyData.data,
    });

    // Pour les retraits : bloquer le montant immédiatement
    if (type === 'WITHDRAWAL') {
      await supabase.rpc('withdraw_funds', {
        p_user_id: user.id,
        p_amount:  amount,
        p_label:   `Retrait ${methodLabel} (en cours)`,
      });
    }

    return new Response(
      JSON.stringify({
        success:      true,
        sessionToken,
        sessionUrl,
        amount,
        type,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('create-payment-session error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers }
    );
  }
});