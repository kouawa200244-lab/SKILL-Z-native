// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

serve(async (req) => {
  try {
    const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              || "";
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const WEBHOOK_SECRET       = Deno.env.get("FAROTY_WEBHOOK_SECRET")     || "";

    const body      = await req.text();
    const signature = req.headers.get("x-faroty-signature") || "";

    console.log("=== faroty-webhook reçu ===");
    console.log("signature:", signature);
    console.log("body:", body);

    const payload = JSON.parse(body);

    const walletId = (payload.data && payload.data.walletId)
                   ? payload.data.walletId
                   : (payload.walletId || null);

    const amount   = (payload.data && payload.data.amount)
                   ? payload.data.amount
                   : (payload.amount || 0);

    const type     = (payload.data && payload.data.type)
                   ? payload.data.type
                   : (payload.type || "DEPOSIT");

    const status   = (payload.data && payload.data.status)
                   ? payload.data.status
                   : (payload.status || "PENDING");

    const sessionToken = (payload.data && payload.data.sessionToken)
                       ? payload.data.sessionToken
                       : (payload.sessionToken || null);

    console.log("walletId:", walletId, "| status:", status, "| amount:", amount);

    if (!walletId) {
      console.log("Pas de walletId — webhook ignoré");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Trouver le user par faroty_wallet_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("faroty_wallet_id", walletId)
      .maybeSingle();

    if (!profile) {
      console.error("Profil non trouvé pour walletId:", walletId);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const userId = profile.id;
    console.log("User trouvé:", userId);

    // Mettre à jour la transaction Faroty
    if (sessionToken) {
      await supabase
        .from("faroty_transactions")
        .update({
          status:       status.toLowerCase(),
          webhook_data: payload,
          updated_at:   new Date().toISOString(),
        })
        .eq("faroty_session_id", sessionToken);
    }

    // Si paiement réussi → mettre à jour wallet Supabase
    if (status === "SUCCESS") {
      const fnName = type === "DEPOSIT" ? "deposit_funds" : "withdraw_funds";
      const label  = type === "DEPOSIT"
                   ? "Recharge Faroty"
                   : "Retrait Faroty";

      const { data: result, error: fnError } = await supabase.rpc(fnName, {
        p_user_id: userId,
        p_amount:  amount,
        p_label:   label,
      });

      if (fnError) {
        console.error("Erreur mise à jour wallet:", fnError.message);
      } else {
        console.log("Wallet mis à jour, nouveau solde:", result ? result.balance_new : "?");
      }
    }

    console.log("=== faroty-webhook SUCCESS ===");

    return new Response(
      JSON.stringify({ success: true, received: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("=== faroty-webhook ERROR ===", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});