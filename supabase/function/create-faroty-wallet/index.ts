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
  const FAROTY_ACCOUNT_ID    = Deno.env.get("FAROTY_ACCOUNT_ID")         || "";
  const FAROTY_LEGAL_ID      = Deno.env.get("FAROTY_LEGAL_ID")           || "";

  try {
    const body          = await req.json();
    const userId        = body.userId        || "";
    const farotyUserId  = body.farotyUserId  || "";

    console.log("=== create-faroty-wallet START ===");
    console.log("userId:", userId, "| farotyUserId:", farotyUserId);
    console.log("FAROTY_API_KEY ok:", !!FAROTY_API_KEY);
    console.log("FAROTY_ACCOUNT_ID ok:", !!FAROTY_ACCOUNT_ID);

    if (!userId || !farotyUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId et farotyUserId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Créer le wallet Faroty
    const res = await fetch(
      `${FAROTY_PAY_URL}/payments/api/v1/wallets`,
      {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY":    FAROTY_API_KEY,
        },
        body: JSON.stringify({
          accountId:       FAROTY_ACCOUNT_ID,
          currencyCode:    "XAF",
          walletType:      "PERSONAL",
          legalIdentifier: FAROTY_LEGAL_ID,
          refId:           farotyUserId,
        }),
      }
    );

    const text = await res.text();
    console.log("Faroty wallet status:", res.status);
    console.log("Faroty wallet body:", text);

    const data = JSON.parse(text);

    if (!res.ok) {
      throw new Error("Faroty error: " + (data.message || text));
    }

    const farotyWalletId = (data && data.data && data.data.id)
                         ? data.data.id
                         : (data && data.id ? data.id : null);

    if (!farotyWalletId) {
      throw new Error("Wallet ID non reçu de Faroty");
    }

    // Mettre à jour Supabase
    await Promise.all([
      supabase.from("profiles").update({ faroty_wallet_id: farotyWalletId }).eq("id", userId),
      supabase.from("wallets").update({ faroty_wallet_id: farotyWalletId, faroty_synced: true }).eq("user_id", userId),
    ]);

    console.log("=== create-faroty-wallet SUCCESS ===", farotyWalletId);

    return new Response(
      JSON.stringify({ success: true, farotyWalletId, walletData: data.data || data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("=== create-faroty-wallet ERROR ===", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});