// @ts-nocheck
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, Dimensions,
  Modal, TextInput, ActivityIndicator, Alert,
  RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowDownCircle, ArrowUpCircle, Shield, Coins,
  TrendingUp, TrendingDown, Trophy, Minus,
  Zap, Clock, X, CheckCircle, AlertCircle,
  Gamepad2, Dumbbell, RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { Linking } from 'react-native';
import { createPaymentSession } from '../utils/paymentService';
import { useNavigation } from '@react-navigation/native';
import PaymentWebView from '../components/PaymentWebView';
import { initiateDeposit, initiateWithdrawal } from '../services/paymentService';
import { getCurrentUser} from '../utils/getCurrentUser';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const FILTERS = ['Tout', 'Victoires', 'Défaites', 'Dépôts', 'Retraits'];

const MONTANTS_RAPIDES = [1000, 2000, 5000, 10000];

/* ══════════════════════════════════════
   MODAL DÉPÔT / RETRAIT
══════════════════════════════════════ */
function TransactionModal({ visible, type, walletBalance, userId, onClose, onSuccess }) {
  const [amount,   setAmount]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState(1); // 1=saisie, 2=confirmation, 3=succès
  const [method,   setMethod]   = useState(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [sessionUrl,     setSessionUrl]     = useState('');
  const [pendingAmount,  setPendingAmount]  = useState(0);
  const [pendingRef,     setPendingRef]     = useState('');
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const METHODS = type === 'deposit' ? [
    { key: 'wave',    label: 'Wave',         emoji: '🌊', color: '#00B8D9' },
    { key: 'orange',      label: 'Orange Money', emoji: '🟠', color: '#FF6600' },
    { key: 'mtn',     label: 'MTN Money',    emoji: '🟡', color: '#FFCC00' },
  ] : [
    { key: 'wave',    label: 'Wave',         emoji: '🌊', color: '#00B8D9' },
    { key: 'orange',      label: 'Orange Money', emoji: '🟠', color: '#FF6600' },
    { key: 'mtn',     label: 'MTN Money',    emoji: '🟡', color: '#FFCC00' },
  ];

  useEffect(() => {
    if (visible) {
      setStep(1);
      setAmount('');
      setMethod(null);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const parsedAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const isDeposit    = type === 'deposit';
  const color        = isDeposit ? T.gold : T.gaming;
  const title        = isDeposit ? 'RECHARGER' : 'RETIRER';

  const handleConfirm = async () => {
    if (parsedAmount < 500) {
      Alert.alert('Montant invalide', 'Minimum 500 FCFA.'); return;
    }
    if (!isDeposit && parsedAmount > walletBalance) {
      Alert.alert('Solde insuffisant', `Ton solde est de ${fmt(walletBalance)} FCFA.`); return;
    }
    if (!method) {
      Alert.alert('Méthode requise', 'Choisis une méthode de paiement.'); return;
    }
    if (step === 1) { setStep(2); return; 

    }

    // ── Étape 2 → créer session Faroty
  setLoading(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

  try {
    const session = await createPaymentSession({
      amount: parsedAmount,
      type:   isDeposit ? 'DEPOSIT' : 'WITHDRAW',
    });

    onClose(); // Fermer la modal

    // Naviguer vers le WebView de paiement
    navigation.navigate('PaymentWebView', {
      sessionUrl:    session.sessionUrl,
      sessionToken:  session.sessionToken,
      transactionId: session.transactionId,
      amount:        parsedAmount,
      type:          isDeposit ? 'DEPOSIT' : 'WITHDRAW',
    });
  } catch (e) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Erreur', e.message || 'Impossible de créer la session de paiement.');
  } finally {
    setLoading(false);
  };

    if (step === 2) {
  setLoading(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  try {
    const u = await getCurrentUser();
    if (!u?.id) {
      Alert.alert('Non connecté', 'Reconnecte-toi.'); return;
    }

    // ✅ Récupérer le numéro de téléphone du profil
    const phone  = u.phone || '';
    if (!phone) {
      Alert.alert('Numéro requis', 'Ajoute ton numéro dans ton profil.');
      setLoading(false);
      return;
    }

    let result;
    if (isDeposit) {
      result = await initiateDeposit({ amount: parsedAmount, method: method as 'orange' | 'mtn' });
    } else {
      result = await initiateWithdrawal({ amount: parsedAmount, method: method as 'orange' | 'mtn' });
    }

    if (!result.success || !result.sessionUrl) {
      Alert.alert('Erreur', result.error || 'Session FAROTY impossible.'); return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep(3);

    // Pour un retrait, le solde est mis à jour immédiatement
    if (!isDeposit && result.newBalance !== undefined) {
      onSuccess(result.newBalance);
    }

    // Pour un dépôt, le solde sera mis à jour par le webhook
    setTimeout(() => onClose(), 2500);

  } catch (e: any) {
    Alert.alert('Erreur', e.message);
  } finally {
    setLoading(false);
  }
}
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalKAV}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalHeaderIcon, { backgroundColor: color + '20', borderColor: color + '40' }]}>
              {isDeposit
                ? <ArrowDownCircle size={20} color={color} />
                : <ArrowUpCircle   size={20} color={color} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color }]}>{title}</Text>
              {!isDeposit && (
                <Text style={styles.modalSoldeDispo}>
                  Dispo : <Text style={{ color: T.gold }}>{fmt(walletBalance)} F</Text>
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <X size={15} color={T.muted} />
            </TouchableOpacity>
          </View>

          {/* ── ÉTAPE 1 : Saisie ── */}
          {step === 1 && (
            <>
              {/* Montants rapides */}
              <Text style={styles.modalLabel}>MONTANT RAPIDE</Text>
              <View style={styles.quickAmounts}>
                {MONTANTS_RAPIDES.map(m => (
                  <TouchableOpacity
                    key={`amt_${m}`}
                    style={[styles.quickAmountChip, parsedAmount === m && { backgroundColor: color + '20', borderColor: color }]}
                    onPress={() => { Haptics.selectionAsync(); setAmount(String(m)); }}
                  >
                    <Text style={[styles.quickAmountText, parsedAmount === m && { color }]}>
                      {fmt(m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Saisie libre */}
              <Text style={styles.modalLabel}>OU SAISIR UN MONTANT</Text>
              <View style={[styles.amountInputWrap, { borderColor: color + '50' }]}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={t => setAmount(t.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={T.muted}
                  selectTextOnFocus
                />
                <Text style={styles.amountCurrency}>FCFA</Text>
              </View>

              {/* Méthode paiement */}
              <Text style={styles.modalLabel}>MÉTHODE</Text>
              <View style={styles.methodsRow}>
                {METHODS.map(m => (
                  <TouchableOpacity
                    key={`method_${m.key}`}
                    style={[styles.methodCard, method === m.key && { borderColor: m.color, backgroundColor: m.color + '15' }]}
                    onPress={() => { Haptics.selectionAsync(); setMethod(m.key); }}
                  >
                    <Text style={styles.methodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.methodLabel, method === m.key && { color: m.color }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── ÉTAPE 2 : Confirmation ── */}
          {step === 2 && (
            <View style={styles.confirmSection}>
              <View style={[styles.confirmIcon, { backgroundColor: color + '15' }]}>
                <AlertCircle size={36} color={color} />
              </View>
              <Text style={styles.confirmTitle}>Confirmer ?</Text>
              <View style={styles.confirmDetails}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Opération</Text>
                  <Text style={[styles.confirmValue, { color }]}>{title}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Montant</Text>
                  <Text style={[styles.confirmValue, { color: T.gold }]}>{fmt(parsedAmount)} FCFA</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Via</Text>
                  <Text style={styles.confirmValue}>
                    {METHODS.find(m => m.key === method)?.emoji} {METHODS.find(m => m.key === method)?.label}
                  </Text>
                </View>
                {!isDeposit && (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Solde après</Text>
                    <Text style={[styles.confirmValue, { color: T.success }]}>
                      {fmt(walletBalance - parsedAmount)} FCFA
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── ÉTAPE 3 : Succès ── */}
          {step === 3 && (
            <View style={styles.successSection}>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color={T.success} />
              </View>
              <Text style={styles.successTitle}>
                {isDeposit ? 'Recharge réussie !' : 'Retrait effectué !'}
              </Text>
              <Text style={styles.successAmount}>
                {isDeposit ? '+' : '-'}{fmt(parsedAmount)} FCFA
              </Text>
            </View>
          )}

          {/* Bouton action */}
          {step !== 3 && (
            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: color }, loading && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.modalActionBtnText}>
                    {step === 1 ? 'CONTINUER →' : 'CONFIRMER'}
                  </Text>
              }
            </TouchableOpacity>
          )}

          {step === 2 && !loading && (
            <TouchableOpacity style={styles.modalBackBtn} onPress={() => setStep(1)}>
              <Text style={styles.modalBackText}>← Modifier</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 20 }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ══════════════════════════════════════
   WALLET SCREEN PRINCIPAL
══════════════════════════════════════ */
export default function WalletScreen() {
  const insets = useSafeAreaInsets();

  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tout');
  const [showDeposit,  setShowDeposit]  = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleCard = useRef(new Animated.Value(0.97)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /* ── Animations entrée ── */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      Animated.spring(scaleCard, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  /* ── Charger données ── */
  useFocusEffect(useCallback(() => {
    loadWalletData();
    setupRealtime();
  }, []));

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // ✅ Utilise getCurrentUser qui garantit un vrai UUID Supabase
    const u = await getCurrentUser();
    if (!u) {
      console.warn('Non connecté', 'Reconnecte-toi.');
      setLoading(false);
      return;
    }

    // Vérifier que l'ID est valide
    if (!isValidUUID(u.id)) {
      cAlert.alert(
        'Session expirée',
        'Ta session a expiré. Reconnecte-toi.',
        [{ text: 'OK', onPress: () => {
          supabase.auth.signOut();
          AsyncStorage.removeItem('skillz_user');
        }}]
      );
      setLoading(false);
      return;
    }

    // Récupérer le numéro de téléphone
    let phoneNumber = currentUser.phone || '';
    if (!phoneNumber) {
      // Si pas de téléphone dans le profil, demander
      Alert.alert(
        'Numéro manquant',
        'Ajoute ton numéro de téléphone dans ton profil pour effectuer des transactions.'
      );
      setLoading(false);
      return;
    }
    // S'assurer que le numéro commence par 237 (Cameroun)
    if (!phoneNumber.startsWith('237')) {
      phoneNumber = `237${phoneNumber.replace(/^0/, '')}`;
    }

console.log('Transaction:', {
      userId:   currentUser.id,
      amount:   parsedAmount,
      phone:    phoneNumber,
      provider: method,
      type:     isDeposit ? 'deposit' : 'withdrawal',
    });

    let result;
    if (isDeposit) {
      result = await depositMoney(currentUser.id, parsedAmount, phoneNumber, method as 'orange' | 'mtn');
    } else {
      result = await withdrawMoney(currentUser.id, parsedAmount, phoneNumber, method as 'orange' | 'mtn');
    }

    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Transaction échouée.');
      setLoading(false);
      return;
    }

     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep(3);

    if (!isDeposit && result.newBalance !== undefined) {
      onSuccess(result.newBalance);
    } else if (isDeposit && result.newBalance !== undefined) {
      onSuccess(result.newBalance);
    }

    setTimeout(() => onClose(), 2500);

    setUser(u);
    // ... reste du chargement
  } catch (e: any) {
    Alert.alert('Erreur', e.message || 'Transaction impossible.');
  } finally {
    setLoading(false);
  }
};

  /* ── Realtime solde ── */
  const setupRealtime = () => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`wallet_rt_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'wallets', filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setWallet(payload.new);
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'transactions', filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setTransactions(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleTransactionSuccess = (newBalance) => {
    setWallet(prev => ({ ...prev, balance: newBalance }));
    loadWalletData(); // recharger tout
  };

  /* ── Config par type de transaction ── */
  const TX_CONFIG = {
    win:        { color: T.success, Icon: TrendingUp,     prefix: '+', bg: T.success + '12', label: 'Victoire'  },
    loss:       { color: T.danger,  Icon: TrendingDown,   prefix: '-', bg: T.danger  + '12', label: 'Défaite'   },
    deposit:    { color: T.gold,    Icon: ArrowDownCircle,prefix: '+', bg: T.gold    + '12', label: 'Recharge'  },
    withdraw:   { color: T.gaming,  Icon: ArrowUpCircle,  prefix: '-', bg: T.gaming  + '12', label: 'Retrait'   },
    bet:        { color: T.danger,  Icon: TrendingDown,   prefix: '-', bg: T.danger  + '12', label: 'Mise'      },
    bonus:      { color: '#A855F7', Icon: Zap,            prefix: '+', bg: '#A855F7' + '12', label: 'Bonus'     },
    commission: { color: T.muted,   Icon: Minus,          prefix: '-', bg: 'rgba(255,255,255,0.05)', label: 'Commission' },
  };

  /* ── Filtre transactions ── */
  const filtered = transactions.filter(tx => {
    if (activeFilter === 'Tout')      return true;
    if (activeFilter === 'Victoires') return tx.type === 'win';
    if (activeFilter === 'Défaites')  return tx.type === 'loss' || tx.type === 'bet';
    if (activeFilter === 'Dépôts')    return tx.type === 'deposit' || tx.type === 'bonus';
    if (activeFilter === 'Retraits')  return tx.type === 'withdraw';
    return true;
  });

  /* ── Stats calculées ── */
  const totalGains  = wallet?.total_gains  || 0;
  const totalPertes = wallet?.total_pertes || 0;
  const net         = totalGains - totalPertes;
  const balance     = wallet?.balance      || 0;
  const username    = user?.username       || 'Joueur';

  const defisGagnes = transactions.filter(t => t.type === 'win').length;
  const defisPerdus = transactions.filter(t => t.type === 'loss').length;

  const formatDate = (iso) => {
    const d    = new Date(iso);
    const now  = new Date();
    const diff = (now - d) / 1000;
    if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 172800) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading && !wallet) {
    return (
      <View style={[styles.screen, styles.loadingCenter]}>
        <ActivityIndicator color={T.gold} size="large" />
        <Text style={styles.loadingText}>Chargement du wallet...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── MODALS ── */}
      <TransactionModal
        visible={showDeposit}
        type="deposit"
        walletBalance={balance}
        userId={user?.id}
        onClose={() => setShowDeposit(false)}
        onSuccess={handleTransactionSuccess}
      />
      <TransactionModal
        visible={showWithdraw}
        type="withdraw"
        walletBalance={balance}
        userId={user?.id}
        onClose={() => setShowWithdraw(false)}
        onSuccess={handleTransactionSuccess}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={T.gold}
            colors={[T.gold]}
          />
        }
      >
        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.headerEyebrow}>SKILL'Z</Text>
            <Text style={styles.headerTitle}>Portefeuille</Text>
          </View>
          <View style={styles.securedBadge}>
            <Shield size={12} color={T.success} />
            <Text style={styles.securedText}>Sécurisé</Text>
          </View>
        </Animated.View>

        {/* ── CARTE SOLDE ── */}
        <Animated.View style={{ transform: [{ scale: scaleCard }], opacity: fadeAnim, marginBottom: 16 }}>
          <View style={styles.balanceCard}>
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            {/* User row */}
            <View style={styles.cardUserRow}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{username[0]?.toUpperCase() || 'S'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardUsername}>{username}</Text>
                <Text style={styles.cardWalletLabel}>SKILL'Z Wallet</Text>
              </View>
              <View style={styles.fcfaBadge}>
                <Coins size={11} color={T.gold} />
                <Text style={styles.fcfaText}>FCFA</Text>
              </View>
            </View>

            {/* Solde */}
            <Text style={styles.balanceEyebrow}>SOLDE DISPONIBLE</Text>
            <Animated.Text style={[styles.balanceAmount, { transform: [{ scale: pulseAnim }] }]}>
              {fmt(balance)}
              <Text style={styles.balanceCurrency}> FCFA</Text>
            </Animated.Text>

            {/* Mini stats */}
            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <TrendingUp size={11} color={T.success} />
                <Text style={[styles.miniStatText, { color: T.success }]}>+{fmt(totalGains)}</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <TrendingDown size={11} color={T.danger} />
                <Text style={[styles.miniStatText, { color: T.danger }]}>-{fmt(totalPertes)}</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>NET </Text>
                <Text style={[styles.miniStatText, { color: net >= 0 ? T.success : T.danger }]}>
                  {net >= 0 ? '+' : ''}{fmt(net)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── ACTIONS ── */}
        <Animated.View style={[styles.actionsRow, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowDeposit(true);
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: T.gold + '18', borderColor: T.gold + '40' }]}>
              <ArrowDownCircle size={26} color={T.gold} />
            </View>
            <Text style={[styles.actionLabel, { color: T.gold }]}>RECHARGER</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowWithdraw(true);
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: T.gaming + '18', borderColor: T.gaming + '40' }]}>
              <ArrowUpCircle size={26} color={T.gaming} />
            </View>
            <Text style={[styles.actionLabel, { color: T.gaming }]}>RETIRER</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── STATS TRIO ── */}
        <Animated.View style={[styles.trioRow, { opacity: fadeAnim }]}>
          {[
            { label: 'Défis gagnés',  value: defisGagnes,             color: T.success, Icon: Trophy },
            { label: 'Défis perdus',  value: defisPerdus,             color: T.danger,  Icon: Minus  },
            { label: 'Total dépôts',  value: fmt(wallet?.total_depots || 0) + ' F', color: T.gold, Icon: Zap, small: true },
          ].map((s, i) => {
            const Icon = s.Icon;
            return (
              <View key={`trio_${i}`} style={styles.trioCard}>
                <Icon size={16} color={s.color} style={{ marginBottom: 6 }} />
                <Text style={[styles.trioValue, { color: s.color, fontSize: s.small ? 14 : 26 }]}>
                  {s.value}
                </Text>
                <Text style={styles.trioLabel}>{s.label}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* ── HISTORIQUE ── */}
        <Animated.View style={[styles.historyBlock, { opacity: fadeAnim }]}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>TRANSACTIONS</Text>
            <TouchableOpacity onPress={onRefresh}>
              <RefreshCw size={14} color={T.muted} />
            </TouchableOpacity>
          </View>

          {/* Filtres */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {FILTERS.map(f => {
              const active = activeFilter === f;
              return (
                <TouchableOpacity
                  key={`filter_${f}`}
                  onPress={() => { Haptics.selectionAsync(); setActiveFilter(f); }}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Transactions */}
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={28} color={T.muted} />
              <Text style={styles.emptyText}>Aucune transaction</Text>
              <Text style={styles.emptySubText}>
                {activeFilter !== 'Tout'
                  ? 'Pas de résultat pour ce filtre'
                  : 'Tes transactions apparaîtront ici'}
              </Text>
            </View>
          ) : (
            filtered.map((tx, i) => {
              const cfg  = TX_CONFIG[tx.type] || TX_CONFIG.bet;
              const Icon = cfg.Icon;
              return (
                <View key={`tx_${tx.id || i}`} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: cfg.bg }]}>
                    <Icon size={16} color={cfg.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txLabel} numberOfLines={1}>
                      {tx.label || cfg.label}
                    </Text>
                    <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: cfg.color }]}>
                      {cfg.prefix}{fmt(tx.amount)} F
                    </Text>
                    {tx.balance_after != null && (
                      <Text style={styles.txBalance}>
                        → {fmt(tx.balance_after)} F
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
  loadingCenter: { justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText:   { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingTop: 16, marginBottom: 24,
  },
  headerEyebrow: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  headerTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 36, color: '#EEEEF5', letterSpacing: 0.5 },
  securedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.success + '12', borderWidth: 1, borderColor: T.success + '30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  securedText:   { fontFamily: 'Inter-Regular', fontSize: 11, color: T.success, fontWeight: '700' },

  /* Balance card */
  balanceCard: { backgroundColor: '#0D1A14', borderRadius: 20, borderWidth: 1, borderColor: T.gold + '25', padding: 20, overflow: 'hidden', position: 'relative' },
  orb1: { position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: T.gold, opacity: 0.07 },
  orb2: { position: 'absolute', bottom: -40, left: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: T.gaming, opacity: 0.06 },

  cardUserRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardAvatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: T.gold + '20', borderWidth: 1.5, borderColor: T.gold + '40', justifyContent: 'center', alignItems: 'center' },
  cardAvatarText: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: T.gold },
  cardUsername:   { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5' },
  cardWalletLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, letterSpacing: 0.5 },
  fcfaBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.gold + '12', borderWidth: 1, borderColor: T.gold + '30', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  fcfaText:       { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '700' },

  balanceEyebrow: { fontFamily: 'Inter-Regular', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2.5, fontWeight: '700', marginBottom: 6 },
  balanceAmount:  { fontFamily: 'Rajdhani-Bold', fontSize: 48, color: '#FFFFFF', letterSpacing: 1, marginBottom: 16 },
  balanceCurrency:{ fontSize: 20, color: 'rgba(255,255,255,0.4)' },

  miniStats:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12 },
  miniStat:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  miniDivider:  { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  miniStatText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, fontWeight: '700' },
  miniStatLabel:{ fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },

  /* Actions */
  actionsRow:    { flexDirection: 'row', backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' },
  actionBtn:     { flex: 1, alignItems: 'center', paddingVertical: 20, gap: 10 },
  actionIcon:    { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionLabel:   { fontFamily: 'Rajdhani-Bold', fontSize: 14, letterSpacing: 1.5 },
  actionDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },

  /* Trio */
  trioRow:   { flexDirection: 'row', gap: 10, marginBottom: 20 },
  trioCard:  { flex: 1, backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14, alignItems: 'center' },
  trioValue: { fontFamily: 'Rajdhani-Bold', fontSize: 26, letterSpacing: 0.5 },
  trioLabel: { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '600', textAlign: 'center', marginTop: 2 },

  /* History */
  historyBlock:  { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2 },

  filterChip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  filterChipActive: { backgroundColor: T.gold, borderColor: T.gold },
  filterText:       { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '700' },
  filterTextActive: { color: '#000' },

  emptyState:   { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText:    { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#EEEEF5' },
  emptySubText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, textAlign: 'center' },

  txRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  txIcon:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txInfo:   { flex: 1 },
  txLabel:  { fontFamily: 'Inter-Regular', fontSize: 13, color: '#EEEEF5', fontWeight: '600' },
  txDate:   { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, marginTop: 2 },
  txRight:  { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, fontWeight: '700' },
  txBalance:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },

  /* ── MODAL ── */
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  modalKAV:     { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalSheet:   {
    backgroundColor: '#0C0E15', borderTopLeftRadius: 28,
    borderTopRightRadius: 28, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 0,
    paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.5, shadowRadius: 30, elevation: 30,
  },
  modalHandle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center', marginTop: 12, marginBottom: 6 },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', marginBottom: 20 },
  modalHeaderIcon: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  modalTitle:      { fontFamily: 'Rajdhani-Bold', fontSize: 22, letterSpacing: 1 },
  modalSoldeDispo: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, marginTop: 2 },
  modalClose:      { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  modalLabel:      { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },

  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickAmountChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
  quickAmountText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: T.muted, fontWeight: '700' },

  amountInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0F14', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },
  amountInput:     { flex: 1, fontFamily: 'Rajdhani-Bold', fontSize: 32, color: '#FFFFFF', padding: 0 },
  amountCurrency:  { fontFamily: 'Inter-Regular', fontSize: 14, color: T.muted, fontWeight: '700' },

  methodsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodCard: { flex: 1, backgroundColor: '#0F1219', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12, alignItems: 'center', gap: 6 },
  methodEmoji:{ fontSize: 22 },
  methodLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '700', textAlign: 'center' },

  confirmSection: { alignItems: 'center', paddingVertical: 20, gap: 16, marginBottom: 8 },
  confirmIcon:    { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  confirmTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 24, color: '#EEEEF5' },
  confirmDetails: { width: '100%', backgroundColor: '#0F1219', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 0 },
  confirmRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  confirmLabel:   { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  confirmValue:   { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, color: '#EEEEF5', fontWeight: '700' },

  successSection: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  successIcon:    { width: 80, height: 80, borderRadius: 20, backgroundColor: T.success + '12', justifyContent: 'center', alignItems: 'center' },
  successTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 24, color: '#EEEEF5' },
  successAmount:  { fontFamily: 'Rajdhani-Bold', fontSize: 32, color: T.success },

  modalActionBtn:     { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  modalActionBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 17, color: '#000', letterSpacing: 2 },
  modalBackBtn:       { alignItems: 'center', paddingVertical: 12 },
  modalBackText:      { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
});