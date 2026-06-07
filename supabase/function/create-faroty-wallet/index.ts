// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FAROTY_BASE_URL    = 'https://api-pay-prod.faroty.me/payments/api/v1';
const FAROTY_API_KEY = Deno.env.get('FAROTY_API_KEY')!;
const ACCOUNT_ID     = Deno.env.get('FAROTY_ACCOUNT_ID')!;
const LEGAL_ID       = Deno.env.get('FAROTY_LEGAL_ID')!;
const FAROTY_PRIVATE_KEY = Deno.env.get('FAROTY_PRIVATE_KEY')!;

serve(async (req) => {
  // Vérifier méthode
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Headers CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId manquant' }),
        { status: 400, headers }
      );
    }

    // Client Supabase admin (pour écrire dans la DB)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Vérifier si l'utilisateur a déjà un wallet Faroty
    const { data: profile } = await supabase
      .from('profiles')
      .select('faroty_wallet_id, username')
      .eq('id', userId)
      .single();

    if (profile?.faroty_wallet_id) {
      return new Response(
        JSON.stringify({ success: true, walletId: profile.faroty_wallet_id }),
        { status: 200, headers }
      );
    }

    // Créer le wallet Faroty
    const response = await fetch(`${FAROTY_BASE_URL}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY':    FAROTY_API_KEY,
        'X-Account-ID': ACCOUNT_ID,
      },
      body: JSON.stringify({
        accountId:       ACCOUNT_ID,
        currencyCode:    'XAF',
        walletType:      'PERSONAL',
        legalIdentifier: LEGAL_ID,
        refId:           REF_ID,
      }),
    });

    const data = await response.json();
    console.log('Faroty wallet response:', JSON.stringify(data));

    if (!response.ok || !data?.data?.id) {
      throw new Error(data?.message || 'Erreur création wallet Faroty');
    }

    const farotyWalletId = data.data.id;

    // Sauvegarder dans Supabase
    await supabase
      .from('profiles')
      .update({ faroty_wallet_id: farotyWalletId })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ success: true, walletId: farotyWalletId }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('create-faroty-wallet error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers }
    );
  }
});