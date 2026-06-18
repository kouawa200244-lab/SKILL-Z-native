// @ts-nocheck
// supabase/functions/faroty-auth/index.ts
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
  const FAROTY_AUTH_URL      = "https://api-prod.faroty.com";
  const FAROTY_PAY_URL       = "https://api-pay-prod.faroty.me";
  const FAROTY_API_KEY       = Deno.env.get("FAROTY_API_KEY")            || "";
  const FAROTY_ACCOUNT_ID    = Deno.env.get("FAROTY_ACCOUNT_ID")         || "";
  const FAROTY_LEGAL_ID      = Deno.env.get("FAROTY_LEGAL_ID")           || "";

  try {
    const body     = await req.json();
    const phone    = body.phone    || "";
    const username = body.username || "";

    console.log("=== START ===", { phone, username });
    console.log("SUPABASE_URL:", !!SUPABASE_URL);
    console.log("SERVICE_KEY:", !!SUPABASE_SERVICE_KEY);
    console.log("FAROTY_API_KEY:", FAROTY_API_KEY ? "OK (" + FAROTY_API_KEY.slice(0,8) + "...)" : "MANQUANT");
    console.log("FAROTY_ACCOUNT_ID:", FAROTY_ACCOUNT_ID ? "OK" : "MANQUANT");

    if (!phone || !username) {
      return new Response(
        JSON.stringify({ success: false, error: "phone et username requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 1. Utilisateur existant ?
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, username, phone, rank, xp, faroty_user_id, faroty_wallet_id")
      .eq("phone", phone)
      .maybeSingle();

    console.log("Profil existant:", existingProfile ? "OUI" : "NON");

    if (existingProfile) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", existingProfile.id)
        .maybeSingle();

      const fakeEmail    = phone.replace(/\D/g, "") + "@skillz.app";
      const fakePassword = "SKILLZ_PWD_" + phone.replace(/\D/g, "");

      const { data: signIn } = await supabase.auth.signInWithPassword({
        email: fakeEmail, password: fakePassword,
      });

      return new Response(
        JSON.stringify({
          success:        true,
          isNew:          false,
          userId:         existingProfile.id,
          username:       existingProfile.username,
          phone,
          rank:           existingProfile.rank || "RANG BRONZE",
          xp:             existingProfile.xp   || 0,
          balance:        wallet ? wallet.balance : 0,
          farotyUserId:   existingProfile.faroty_user_id,
          farotyWalletId: existingProfile.faroty_wallet_id,
          token:          signIn && signIn.session ? signIn.session.access_token  : null,
          refreshToken:   signIn && signIn.session ? signIn.session.refresh_token : null,
          profile:        existingProfile,
          wallet,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Nouveau utilisateur
    let farotyUserId   = null;
    let farotyWalletId = null;

    // 2a. Faroty get-or-create
    console.log("Appel Faroty get-or-create...");
    try {
      const farotyRes = await fetch(
        `${FAROTY_AUTH_URL}/auth/api/public/users/get-or-create`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ fullName: username, phoneNumber: phone }),
        }
      );
      const farotyText = await farotyRes.text();
      console.log("Faroty user status:", farotyRes.status);
      console.log("Faroty user body:", farotyText);

      const farotyData = JSON.parse(farotyText);
      farotyUserId = (farotyData && farotyData.data && farotyData.data.id)
                  ? farotyData.data.id
                  : (farotyData && farotyData.id ? farotyData.id : null);
      console.log("Faroty user ID:", farotyUserId);
    } catch (e) {
      console.error("Faroty user ERREUR:", e.message);
    }

    // 2b. Supabase Auth
    const fakeEmail    = phone.replace(/\D/g, "") + "@skillz.app";
    const fakePassword = "SKILLZ_PWD_" + phone.replace(/\D/g, "");

    console.log("Création Supabase Auth:", fakeEmail);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email:         fakeEmail,
      password:      fakePassword,
      email_confirm: true,
      user_metadata: { username, phone, faroty_user_id: farotyUserId },
    });

    if (authError) {
      console.error("Auth error:", authError.message);
      throw new Error("Erreur création compte: " + authError.message);
    }

    const userId = authData.user.id;
    console.log("User créé:", userId);

    // 2c. Attendre trigger
    await new Promise((r) => setTimeout(r, 1500));

    // 2d. Upsert profil
    const { error: profErr } = await supabase.from("profiles").upsert({
      id:             userId,
      username,
      phone,
      full_name:      username,
      email:          fakeEmail,
      faroty_user_id: farotyUserId,
      rank:           "RANG BRONZE",
      xp:             0,
    }, { onConflict: "id" });

    if (profErr) console.error("Profile upsert error:", profErr.message);
    else console.log("Profil OK");

    // 2e. Faroty wallet
    if (farotyUserId && FAROTY_API_KEY && FAROTY_ACCOUNT_ID) {
      console.log("Création wallet Faroty...");
      try {
        const wRes = await fetch(
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
        const wText = await wRes.text();
        console.log("Faroty wallet status:", wRes.status);
        console.log("Faroty wallet body:", wText);

        const wData = JSON.parse(wText);
        farotyWalletId = (wData && wData.data && wData.data.id)
                       ? wData.data.id
                       : (wData && wData.id ? wData.id : null);
        console.log("Faroty wallet ID:", farotyWalletId);

        if (farotyWalletId) {
          await supabase.from("profiles").update({ faroty_wallet_id: farotyWalletId }).eq("id", userId);
          await supabase.from("wallets").update({ faroty_wallet_id: farotyWalletId, faroty_synced: true }).eq("user_id", userId);
        }
      } catch (e) {
        console.error("Faroty wallet ERREUR:", e.message);
      }
    } else {
      console.log("Wallet Faroty ignoré - manque:", {
        farotyUserId: !!farotyUserId,
        FAROTY_API_KEY: !!FAROTY_API_KEY,
        FAROTY_ACCOUNT_ID: !!FAROTY_ACCOUNT_ID,
      });
    }

    // 2f. SignIn avec retry
    let signInData = null;
    for (let i = 0; i < 3; i++) {
      const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
        email: fakeEmail, password: fakePassword,
      });
      if (!siErr && si && si.session) {
        signInData = si;
        console.log("SignIn OK tentative", i + 1);
        break;
      }
      console.log("SignIn tentative", i + 1, "échouée:", siErr ? siErr.message : "?");
      await new Promise((r) => setTimeout(r, 500));
    }

    // 2g. Wallet avec retry
    let supaWallet = null;
    for (let i = 0; i < 3; i++) {
      const { data: w } = await supabase
        .from("wallets").select("*").eq("user_id", userId).maybeSingle();
      if (w) {
        supaWallet = w;
        console.log("Wallet OK tentative", i + 1, "balance:", w.balance);
        break;
      }
      console.log("Wallet pas prêt tentative", i + 1);
      await new Promise((r) => setTimeout(r, 500));
    }

    // Wallet toujours null → créer manuellement
    if (!supaWallet) {
      console.log("Création wallet manuelle...");
      const { data: nw } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 1000, total_depots: 1000 })
        .select().single();
      supaWallet = nw;

      await supabase.from("transactions").insert({
        user_id:        userId,
        type:           "bonus",
        amount:         1000,
        balance_before: 0,
        balance_after:  1000,
        label:          "Bonus de bienvenue SKILL'Z 🎉",
      });
    }

    console.log("=== SUCCESS ===");

    return new Response(
      JSON.stringify({
        success:        true,
        isNew:          true,
        userId,
        username,
        phone,
        farotyUserId,
        farotyWalletId,
        rank:           "RANG BRONZE",
        xp:             0,
        balance:        supaWallet ? supaWallet.balance : 1000,
        token:          signInData && signInData.session ? signInData.session.access_token  : null,
        refreshToken:   signInData && signInData.session ? signInData.session.refresh_token : null,
        profile: {
          id:               userId,
          username,
          phone,
          full_name:        username,
          faroty_user_id:   farotyUserId,
          faroty_wallet_id: farotyWalletId,
          rank:             "RANG BRONZE",
          xp:               0,
        },
        wallet: supaWallet,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("=== FATAL ERROR ===", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});