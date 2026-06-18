// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              || "";
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const FAROTY_PAY_URL       = "https://api-pay-prod.faroty.me";
  const FAROTY_API_KEY       = Deno.env.get("FAROTY_API_KEY")            || "";

  try {
    const body           = await req.json();
    const userId         = body.userId         || "";
    const farotyWalletId = body.farotyWalletId || "";
    const amount         = body.amount         || 0;
    const type           = body.type           || "DEPOSIT";
    const username       = body.username       || "Joueur";

    console.log("=== create-payment-session START ===");
    console.log("userId:", userId, "| amount:", amount, "| type:", type);
    console.log("farotyWalletId:", farotyWalletId);
    console.log("FAROTY_API_KEY ok:", !!FAROTY_API_KEY);

    if (!userId)         throw new Error("userId requis");
    if (!farotyWalletId) throw new Error("farotyWalletId requis");
    if (amount < 500)    throw new Error("Montant minimum : 500 XAF");
    if (type !== "DEPOSIT" && type !== "WITHDRAW") throw new Error("type invalide");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const successUrl = "skillz://payment-success";
    const cancelUrl  = "skillz://payment-cancel";

    const sessionBody = {
      walletId:     farotyWalletId,
      currencyCode: "XAF",
      cancelUrl,
      successUrl,
      type,
      amount,
      contentType:  "CAMPAIGN_SIMPLE",
      dynamicContentData: {
        title:       type === "DEPOSIT"
                       ? "Recharge SKILL'Z - " + username
                       : "Retrait SKILL'Z - " + username,
        description: type === "DEPOSIT"
                       ? "Recharge ton wallet pour jouer des défis"
                       : "Retrait de tes gains SKILL'Z",
        target:      amount + " XAF",
        imageUrl:    "https://skillz.app/logo.png",
      },
    };

    console.log("Session body:", JSON.stringify(sessionBody));

    const res = await fetch(
      `${FAROTY_PAY_URL}/payments/api/v1/payment-sessions`,
      {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY":    FAROTY_API_KEY,
        },
        body: JSON.stringify(sessionBody),
      }
    );

    const text = await res.text();
    console.log("Faroty session status:", res.status);
    console.log("Faroty session body:", text);

    const data = JSON.parse(text);

    if (!res.ok || !data.success) {
      throw new Error("Faroty error: " + (data.message || text));
    }

    const sessionToken = data.data && data.data.sessionToken ? data.data.sessionToken : null;
    const sessionUrl   = data.data && data.data.sessionUrl   ? data.data.sessionUrl   : null;

    if (!sessionUrl) throw new Error("sessionUrl non reçue de Faroty");

    // Enregistrer transaction pending
    const { data: txData } = await supabase
      .from("faroty_transactions")
      .insert({
        user_id:           userId,
        faroty_session_id: sessionToken,
        faroty_wallet_id:  farotyWalletId,
        type:              type.toLowerCase(),
        amount,
        currency:          "XAF",
        status:            "pending",
      })
      .select()
      .single();

    console.log("Transaction pending créée:", txData ? txData.id : "erreur");
    console.log("=== create-payment-session SUCCESS ===");

    return new Response(
      JSON.stringify({
        success:       true,
        sessionToken,
        sessionUrl,
        transactionId: txData ? txData.id : null,
        amount,
        type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("=== create-payment-session ERROR ===", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});