// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { checkTransactionStatus } from '../utils/paymentService';
import { supabase } from '../supabaseClient';
import { updateCachedUser } from '../utils/getCurrentUser';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentWebViewScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

  const { sessionUrl, transactionId, amount, type } = route.params || {};

  const [status,  setStatus]  = useState('idle');
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isDeposit = type === 'DEPOSIT';
  const color     = isDeposit ? T.gold : T.gaming;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Ouvrir automatiquement le navigateur
    openBrowser();
  }, []);

  /* ── Ouvrir le lien Faroty dans le navigateur par défaut ── */
  const openBrowser = async () => {
    try {
      const supported = await Linking.canOpenURL(sessionUrl);
      if (supported) {
        await Linking.openURL(sessionUrl);
      } else {
        setStatus('failed');
      }
    } catch (e) {
      console.error('[Linking] error:', e);
      setStatus('failed');
    }
  };

  /* ── Vérifier le résultat du paiement ── */
  const checkPaymentResult = async () => {
    setStatus('checking');
    let attempts = 0;

    while (attempts < 5) {
      try {
        await new Promise(r => setTimeout(r, 2000));
        const tx = await checkTransactionStatus(transactionId);
        console.log('[Check] status:', tx.status, '| attempt:', attempts + 1);

        if (tx.status === 'success') {
          // Rafraîchir le solde depuis Supabase
          const stored = await AsyncStorage.getItem('skillz_user');
          if (stored) {
            const u = JSON.parse(stored);
            const { data: wallet } = await supabase
              .from('wallets')
              .select('balance')
              .eq('user_id', u.id)
              .single();
            if (wallet) await updateCachedUser({ balance: wallet.balance });
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStatus('success');
          setTimeout(() => navigation.replace('WalletTab'), 2500);
          return;
        }

        if (tx.status === 'failed') {
          setStatus('failed');
          return;
        }

        attempts++;
      } catch (e) {
        attempts++;
      }
    }

    // Après 5 tentatives sans réponse
    setStatus('pending_manual');
  };

  /* ════════════════════════════════════
     ÉTATS
  ════════════════════════════════════ */
  if (status === 'checking') {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.stateCard}>
          <ActivityIndicator color={T.gold} size="large" />
          <Text style={styles.stateTitle}>Vérification...</Text>
          <Text style={styles.stateNote}>On confirme ton paiement avec Faroty</Text>
        </View>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <View style={[styles.stateCard, { borderColor: T.success + '40' }]}>
          <View style={[styles.stateIcon, { backgroundColor: T.success + '15' }]}>
            <CheckCircle size={52} color={T.success} />
          </View>
          <Text style={styles.stateTitle}>
            {isDeposit ? 'Recharge réussie ! 🎉' : 'Retrait effectué !'}
          </Text>
          <Text style={[styles.stateAmount, { color: T.success }]}>
            {isDeposit ? '+' : '-'}{fmt(amount)} FCFA
          </Text>
          <Text style={styles.stateNote}>
            {isDeposit ? 'Ton wallet a été crédité !' : 'Traitement en cours.'}
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <View style={[styles.stateCard, { borderColor: T.danger + '40' }]}>
          <View style={[styles.stateIcon, { backgroundColor: T.danger + '15' }]}>
            <AlertCircle size={52} color={T.danger} />
          </View>
          <Text style={styles.stateTitle}>Paiement annulé</Text>
          <Text style={styles.stateNote}>Ta mise n'a pas été débitée.</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: T.gold }]}
            onPress={() => navigation.goBack()}
          >
            <RefreshCw size={16} color="#000" />
            <Text style={styles.actionBtnText}>RÉESSAYER</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'pending_manual') {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <View style={[styles.stateCard, { borderColor: T.gold + '40' }]}>
          <Text style={{ fontSize: 48 }}>⏳</Text>
          <Text style={styles.stateTitle}>En attente</Text>
          <Text style={styles.stateNote}>
            Paiement en cours de traitement. Vérifie ton solde dans quelques minutes.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: T.gaming }]}
            onPress={checkPaymentResult}
          >
            <RefreshCw size={16} color="#000" />
            <Text style={styles.actionBtnText}>VÉRIFIER</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.replace('WalletTab')}
          >
            <Text style={styles.secondaryBtnText}>Retour au wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Idle — Navigateur ouvert ── */
  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color }]}>
          {isDeposit ? '💳 RECHARGER' : '💸 RETIRER'}
        </Text>
        <Text style={[styles.headerAmount]}>
          {fmt(amount)} <Text style={{ color: T.gold }}>FCFA</Text>
        </Text>
      </View>

      {/* Carte info */}
      <View style={[styles.mainCard, { borderColor: color + '30' }]}>
        <View style={[styles.cardAccent, { backgroundColor: color }]} />

        <Animated.View style={[
          styles.iconBox,
          { backgroundColor: color + '15', transform: [{ scale: pulseAnim }] },
        ]}>
          <ExternalLink size={36} color={color} />
        </Animated.View>

        <Text style={styles.mainTitle}>Page de paiement ouverte</Text>
        <Text style={styles.mainSub}>
          Le navigateur de ton téléphone s'est ouvert avec la page de paiement Faroty sécurisée.
        </Text>

        {/* Étapes */}
        <View style={styles.steps}>
          {[
            { n: '1', t: 'Choisis Orange Money ou MTN Money' },
            { n: '2', t: 'Entre ton numéro de téléphone'     },
            { n: '3', t: 'Confirme le paiement'              },
            { n: '4', t: 'Reviens ici et clique sur Vérifier'},
          ].map(s => (
            <View key={`s_${s.n}`} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: color + '20' }]}>
                <Text style={[styles.stepBadgeText, { color }]}>{s.n}</Text>
              </View>
              <Text style={styles.stepText}>{s.t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bouton rouvrir */}
      <TouchableOpacity
        style={[styles.reopenBtn, { borderColor: color + '60' }]}
        onPress={openBrowser}
        activeOpacity={0.8}
      >
        <ExternalLink size={16} color={color} />
        <Text style={[styles.reopenBtnText, { color }]}>
          ROUVRIR LA PAGE FAROTY
        </Text>
      </TouchableOpacity>

      {/* Bouton vérifier */}
      <TouchableOpacity
        style={[styles.verifyBtn, { backgroundColor: color }]}
        onPress={checkPaymentResult}
        activeOpacity={0.85}
      >
        <CheckCircle size={18} color="#000" />
        <Text style={styles.verifyBtnText}>J'AI PAYÉ — VÉRIFIER</Text>
      </TouchableOpacity>

      {/* Annuler */}
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelBtnText}>Annuler</Text>
      </TouchableOpacity>

      <Text style={styles.securityText}>🔒 Paiement sécurisé par Faroty</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#080A0F', paddingHorizontal: 20 },
  center:  { justifyContent: 'center' },
  orb1:    { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: T.gaming, opacity: 0.07 },
  orb2:    { position: 'absolute', bottom: 100, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: T.gold, opacity: 0.06 },

  header:       { alignItems: 'center', paddingTop: 28, marginBottom: 20 },
  headerTitle:  { fontFamily: 'Rajdhani-Bold', fontSize: 20, letterSpacing: 3, marginBottom: 6 },
  headerAmount: { fontFamily: 'Rajdhani-Bold', fontSize: 42, color: '#EEEEF5', letterSpacing: 1 },

  mainCard:   { backgroundColor: '#0F1219', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  cardAccent: { height: 3 },
  iconBox:    { width: 70, height: 70, borderRadius: 18, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 22, marginBottom: 14 },
  mainTitle:  { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#EEEEF5', textAlign: 'center', marginBottom: 8, paddingHorizontal: 20 },
  mainSub:    { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 18, marginBottom: 20, paddingHorizontal: 20 },

  steps:         { paddingHorizontal: 18, paddingBottom: 20, gap: 12 },
  stepRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge:     { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepBadgeText: { fontFamily: 'Rajdhani-Bold', fontSize: 14 },
  stepText:      { fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5', flex: 1 },

  reopenBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, marginBottom: 10 },
  reopenBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 13, letterSpacing: 1.5 },
  verifyBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16, marginBottom: 12, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  verifyBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 2 },
  cancelBtn:     { alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  cancelBtnText: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  securityText:  { fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 4 },

  stateCard:   { backgroundColor: '#0F1219', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 32, margin: 20, alignItems: 'center', gap: 14 },
  stateIcon:   { width: 78, height: 78, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stateTitle:  { fontFamily: 'Rajdhani-Bold', fontSize: 26, color: '#EEEEF5', textAlign: 'center' },
  stateAmount: { fontFamily: 'Rajdhani-Bold', fontSize: 42, letterSpacing: 1 },
  stateNote:   { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 20 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 6 },
  actionBtnText:   { fontFamily: 'Rajdhani-Bold', fontSize: 15, color: '#000', letterSpacing: 1.5 },
  secondaryBtn:    { paddingVertical: 12 },
  secondaryBtnText:{ fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
});