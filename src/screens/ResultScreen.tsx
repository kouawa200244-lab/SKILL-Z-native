// @ts-nocheck
// =======================
// =====================================
// src/screens/ResultScreen.tsx — VERSION BACKEND
// Appelle betService.playBet() au moment du résultat
// L'argent bouge en temps réel dans Supabase
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helper';
import { PALIERS } from '../constants/paliers';
import {
  playBet,
  calculateGain,
  calculateFilet,
  fetchWalletBalance,
} from '../services/betService';

export default function ResultScreen({ navigation, route }: any) {
  const {
    gameKey, defi, player, mise,
    outcome, userId, sessionId,
    durationSecs, validationMode, witnessName,
  } = route.params || {};

  const [processing, setProcessing] = useState(true);
  const [betResult,  setBetResult]  = useState<any>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const pc     = PALIERS[defi?.p] || {};
  const gain   = calculateGain(mise, defi?.cote || 1);
  const filet  = outcome === 'loss' ? calculateFilet(mise, defi?.cote || 1) : 0;
  const win    = outcome === 'win';
  const col    = win ? T.success : T.danger;

  // Appel backend au montage — une seule fois
  useEffect(() => {
    async function processBet() {
      const result = await playBet({
        userId,
        sessionId,
        playerName:     player,
        game:           gameKey,
        defiId:         defi?.id,
        defiNom:        defi?.nom,
        palier:         defi?.p,
        cote:           defi?.cote,
        mise,
        outcome,
        durationSecs:   durationSecs || 0,
        validationMode: validationMode || 'room',
        witnessName,
      });

      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible d\'enregistrer le résultat.');
      }

      // Récupérer le nouveau solde
      const balance = await fetchWalletBalance(userId);

      setBetResult(result);
      setNewBalance(balance);
      setProcessing(false);
    }

    processBet();
  }, []);

  // ── Écran de traitement ───────────────────────────────────
  if (processing) {
    return (
      <View style={s.screen}>
        <ActivityIndicator size="large" color={T.physique} />
        <Text style={s.processingTxt}>Enregistrement du résultat...</Text>
      </View>
    );
  }

  // ── Écran résultat final ──────────────────────────────────
  return (
    <View style={s.screen}>

      {/* Label victoire / défaite */}
      <Text style={[s.outcomeLabel, { color: col }]}>
        {win ? 'VICTOIRE' : 'DÉFAITE'}
      </Text>

      {/* Nom du joueur */}
      <Text style={s.playerName}>{player?.toUpperCase()}</Text>

      {/* Défi info */}
      <Text style={[s.defiNom, { color: pc.color || T.muted }]}>{defi?.nom}</Text>
      <Text style={s.defiMeta}>
        {gameKey?.toUpperCase()} · ×{defi?.cote?.toFixed(2)}
      </Text>

      {/* Montant principal */}
      <Text style={[s.amount, { color: col }]}>
        {win ? `+${fmt(gain)} F` : `-${fmt(mise - filet)} F`}
      </Text>

      {/* Filet SKILL si applicable */}
      {!win && filet > 0 && (
        <View style={s.filetBox}>
          <Text style={s.filetLabel}>FILET SKILL</Text>
          <Text style={s.filetAmount}>+{fmt(filet)} F remboursés</Text>
        </View>
      )}

      {/* Nouveau solde */}
      {newBalance !== null && (
        <View style={s.balanceBox}>
          <Text style={s.balanceLabel}>Nouveau solde</Text>
          <Text style={s.balanceValue}>{fmt(newBalance)} F</Text>
        </View>
      )}

      {/* Message */}
      <Text style={s.message}>
        {win
          ? 'Félicitations — tu as prouvé ta valeur !'
          : filet > 0
            ? `SKILLBET garde ${fmt(mise - filet)} F`
            : 'Pas cette fois. Reviens plus fort.'
        }
      </Text>

      {/* Boutons */}
      <View style={s.btnRow}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={s.primaryTxt}>+ NOUVEAU DÉFI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => navigation.navigate('HomeTab')}
          activeOpacity={0.85}
        >
          <Text style={s.secondaryTxt}>ACCUEIL</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex:1, backgroundColor:T.bg, justifyContent:'center', alignItems:'center', padding:24 },
  processingTxt: { fontFamily:T.fontBody, fontSize:14, color:T.muted, marginTop:20 },
  outcomeLabel:  { fontFamily:T.fontTitle, fontSize:14, letterSpacing:6, marginBottom:12 },
  playerName:    { fontFamily:T.fontTitle, fontSize:40, color:T.text, letterSpacing:3, marginBottom:6, textAlign:'center' },
  defiNom:       { fontFamily:T.fontTitle, fontSize:20, fontWeight:'700', marginBottom:4, textAlign:'center' },
  defiMeta:      { fontFamily:T.fontBody, fontSize:13, color:T.muted, marginBottom:24 },
  amount:        { fontFamily:T.fontMono, fontSize:64, fontWeight:'900', lineHeight:70, marginBottom:8 },
  filetBox:      { backgroundColor:'rgba(168,85,247,0.1)', borderRadius:12, padding:12, alignItems:'center', marginBottom:12, borderWidth:0.5, borderColor:'rgba(168,85,247,0.3)', width:'100%' },
  filetLabel:    { fontFamily:T.fontBody, fontSize:11, color:'#A855F7', letterSpacing:2, marginBottom:4 },
  filetAmount:   { fontFamily:T.fontMono, fontSize:18, fontWeight:'700', color:'#A855F7' },
  balanceBox:    { backgroundColor:T.card, borderRadius:12, padding:12, alignItems:'center', marginBottom:16, width:'100%', borderWidth:1, borderColor:T.border },
  balanceLabel:  { fontFamily:T.fontBody, fontSize:11, color:T.muted, letterSpacing:1, marginBottom:4 },
  balanceValue:  { fontFamily:T.fontMono, fontSize:24, fontWeight:'700', color:T.gold },
  message:       { fontFamily:T.fontBody, fontSize:13, color:T.muted, textAlign:'center', marginBottom:36 },
  btnRow:        { flexDirection:'row', gap:12, width:'100%' },
  primaryBtn:    { flex:1, backgroundColor:T.physique, borderRadius:60, padding:14, alignItems:'center' },
  primaryTxt:    { fontFamily:T.fontTitle, fontSize:16, color:'#fff', letterSpacing:2 },
  secondaryBtn:  { flex:1, backgroundColor:'transparent', borderRadius:60, padding:14, alignItems:'center', borderWidth:1, borderColor:T.border },
  secondaryTxt:  { fontFamily:T.fontTitle, fontSize:16, color:T.muted, letterSpacing:2 },
});