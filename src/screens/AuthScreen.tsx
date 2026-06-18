// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Phone, User, ArrowRight, Zap,
  Shield, RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T }            from '../utils/designTokens';
import { supabase }     from '../supabaseClient';
import { farotyAuth }   from '../utils/paymentService';
import AsyncStorage     from '@react-native-async-storage/async-storage';

/* ✅ H déclaré ici — c'était l'erreur */
const { width: W, height: H } = Dimensions.get('window');

/* ══════════════════════════════════════
   INPUT FIELD
══════════════════════════════════════ */
function InputField({ icon: Icon, placeholder, value, onChangeText, keyboardType, maxLength, prefix }) {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => Animated.spring(focusAnim, {
    toValue: 1, tension: 120, friction: 8, useNativeDriver: false,
  }).start();

  const onBlur = () => Animated.spring(focusAnim, {
    toValue: 0, tension: 120, friction: 8, useNativeDriver: false,
  }).start();

  const borderColor = focusAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(255,255,255,0.07)', T.gaming],
  });
  const bgColor = focusAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#0D0F14', '#0D1A20'],
  });

  return (
    <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor: bgColor }]}>
      <View style={styles.inputIconBox}>
        <Icon size={16} color={T.muted} />
      </View>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={T.muted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   OTP 6 CASES
══════════════════════════════════════ */
function OTPInput({ value, onChange, hasError }) {
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const digits  = value.split('');
    digits[index] = text.replace(/\D/g, '').slice(-1);
    const newVal  = digits.join('');
    onChange(newVal);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <TextInput
          key={`otp_${i}`}
          ref={ref => inputs.current[i] = ref}
          style={[
            styles.otpBox,
            value[i]  && styles.otpBoxFilled,
            hasError  && styles.otpBoxError,
          ]}
          value={value[i] || ''}
          onChangeText={t => handleChange(t, i)}
          onKeyPress={e => handleKeyPress(e, i)}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

/* ══════════════════════════════════════
   AUTH SCREEN
══════════════════════════════════════ */
export default function AuthScreen({ onLogin }) {
  const insets = useSafeAreaInsets();

  const [step,      setStep]      = useState(1);
  const [phone,     setPhone]     = useState('');
  const [username,  setUsername]  = useState('');
  const [otpCode,   setOtpCode]   = useState('');
  const [otpSim,    setOtpSim]    = useState('');
  const [otpError,  setOtpError]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const orb1Anim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 45, friction: 9, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(orb1Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
      Animated.timing(orb1Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const orb1Y       = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  /* ── ÉTAPE 1 ── */
  const handleStep1 = async () => {
    setError('');

    if (!username.trim() || username.trim().length < 2) {
      setError('Entre un nom d\'utilisateur (2 caractères min.)');
      shake(); return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setError('Entre un numéro valide (ex: 677438521)');
      shake(); return;
    }

    setLoading(true);
    try {
      const phoneFormatted = formatPhone(phone);
      const res = await farotyAuth({ phone: phoneFormatted, username: username.trim() });

      if (!res.success) throw new Error(res.error || 'Erreur de connexion.');

      await AsyncStorage.setItem('skillz_auth_tmp', JSON.stringify({
        ...res,
        phoneFormatted,
      }));

      setIsNewUser(res.isNew);

      const simCode = generateSimOTP();
      setOtpSim(simCode);

      await AsyncStorage.setItem('skillz_otp_sim', JSON.stringify({
        code:      simCode,
        phone:     phoneFormatted,
        expiresAt: Date.now() + 10 * 60 * 1000,
      }));

      setCountdown(60);
      setStep(2);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (e) {
      setError(e.message || 'Erreur. Réessaie.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  /* ── ÉTAPE 2 ── */
  const handleVerifyOTP = async () => {
    setError('');

    if (otpCode.length < 6) {
      setOtpError(true); shake();
      setError('Entre le code à 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const storedOtp = await AsyncStorage.getItem('skillz_otp_sim');
      if (!storedOtp) throw new Error('Code expiré. Recommence.');

      const { code, expiresAt } = JSON.parse(storedOtp);

      if (Date.now() > expiresAt) {
        throw new Error('Code expiré. Clique sur "Renvoyer".');
      }
      if (otpCode !== code) {
        setOtpError(true); shake();
        setError('Code incorrect.');
        setLoading(false);
        return;
      }

      const tmpData = await AsyncStorage.getItem('skillz_auth_tmp');
      if (!tmpData) throw new Error('Session expirée. Recommence.');

      const authData = JSON.parse(tmpData);

      const userSession = {
        id:             authData.userId      || authData.profile?.id,
        username:       authData.username    || authData.profile?.username,
        phone:          authData.phoneFormatted,
        rank:           authData.profile?.rank    || 'RANG BRONZE',
        xp:             authData.profile?.xp      || 0,
        balance:        authData.wallet?.balance  || authData.balance || 1000,
        farotyWalletId: authData.farotyWalletId  || authData.profile?.faroty_wallet_id,
        farotyUserId:   authData.farotyUserId,
        token:          authData.token,
        refreshToken:   authData.refreshToken,
        isNew:          authData.isNew,
      };

      await AsyncStorage.setItem('skillz_user', JSON.stringify(userSession));
      await AsyncStorage.removeItem('skillz_auth_tmp');
      await AsyncStorage.removeItem('skillz_otp_sim');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLogin(userSession);

    } catch (e) {
      setOtpError(true);
      setError(e.message || 'Erreur de vérification.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    const simCode = generateSimOTP();
    setOtpSim(simCode);
    setOtpCode('');
    setOtpError(false);
    setError('');
    await AsyncStorage.setItem('skillz_otp_sim', JSON.stringify({
      code:      simCode,
      phone:     formatPhone(phone),
      expiresAt: Date.now() + 10 * 60 * 1000,
    }));
    setCountdown(60);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = () => step === 1 ? handleStep1() : handleVerifyOTP();

  const StepDots = () => (
    <View style={styles.stepDots}>
      {[1, 2].map(s => (
        <View
          key={`dot_${s}`}
          style={[
            styles.stepDot,
            step >= s
              ? { backgroundColor: T.gaming, width: 24 }
              : { backgroundColor: 'rgba(255,255,255,0.15)', width: 8 },
          ]}
        />
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Orbes déco */}
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── LOGO ── */}
        <Animated.View style={[
          styles.logoSection,
          { opacity: fadeAnim, transform: [{ scale: logoScale }] },
        ]}>
          <View style={styles.logoWrap}>
            <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
            <View style={styles.logoBadge}>
              <Zap size={36} color={T.gold} strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.logoTitle}>SKILL'Z</Text>
          <Text style={styles.logoTagline}>Défie. Mise. Domine.</Text>
        </Animated.View>

        {/* ── CARD ── */}
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] },
        ]}>
          <View style={[styles.cardAccent, { backgroundColor: T.gaming }]} />

          <View style={styles.cardTop}>
            <StepDots />
          </View>

          {/* ════════ STEP 1 ════════ */}
          {step === 1 && (
            <>
              <Text style={styles.cardTitle}>Bienvenue ⚡</Text>
              <Text style={styles.cardSub}>
                Entre ton numéro et ton pseudo pour jouer
              </Text>

              <View style={styles.bonusBadge}>
                <Zap size={12} color={T.gold} />
                <Text style={styles.bonusText}>1 000 FCFA offerts à l'inscription</Text>
              </View>

              <View style={styles.fields}>
                <View>
                  <Text style={styles.fieldLabel}>TON PSEUDO</Text>
                  <InputField
                    icon={User}
                    placeholder="Ex: Brael, TigerCam, Flash..."
                    value={username}
                    onChangeText={setUsername}
                  />
                  <Text style={styles.fieldHint}>Ce nom sera visible par tous les joueurs</Text>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>TON NUMÉRO</Text>
                  <InputField
                    icon={Phone}
                    placeholder="677 438 521"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={12}
                    prefix="+237"
                  />
                  <Text style={styles.fieldHint}>Cameroun · Orange Money ou MTN Money</Text>
                </View>
              </View>
            </>
          )}

          {/* ════════ STEP 2 ════════ */}
          {step === 2 && (
            <>
              <Text style={styles.cardTitle}>
                {isNewUser ? 'Compte créé ! 🎉' : 'Content de te revoir 👋'}
              </Text>
              <Text style={styles.cardSub}>
                Code envoyé au{' '}
                <Text style={{ color: T.gaming }}>+237 {phone}</Text>
              </Text>

              {/* Code simulé — à supprimer en production */}
              <View style={styles.simCodeCard}>
                <View style={styles.simCodeBadge}>
                  <Text style={styles.simCodeBadgeText}>🧪 MODE TEST</Text>
                </View>
                <Text style={styles.simCodeLabel}>TON CODE DE VÉRIFICATION</Text>
                <Text style={styles.simCode}>{otpSim}</Text>
                <Text style={styles.simCodeNote}>
                  En production, ce code sera envoyé par SMS
                </Text>
              </View>

              <View style={styles.otpSection}>
                <OTPInput
                  value={otpCode}
                  onChange={(v) => { setOtpCode(v); setOtpError(false); setError(''); }}
                  hasError={otpError}
                />
              </View>

              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.resendWait}>
                    Renvoyer dans{' '}
                    <Text style={{ color: T.gaming }}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity style={styles.resendBtn} onPress={handleResend}>
                    <RefreshCw size={13} color={T.gaming} />
                    <Text style={styles.resendText}>Renvoyer le code</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => { setStep(1); setOtpCode(''); setError(''); setOtpSim(''); }}
              >
                <Text style={styles.changeBtnText}>← Changer le numéro</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Erreur ── */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── Bouton principal ── */}
          <TouchableOpacity
            style={[styles.mainBtn, loading && styles.mainBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={styles.mainBtnText}>
                  {step === 1 ? 'CONTINUER' : 'ENTRER DANS L\'ARÈNE'}
                </Text>
                {step === 1
                  ? <ArrowRight size={18} color="#000" />
                  : <Zap size={18} color="#000" fill="#000" />
                }
              </>
            )}
          </TouchableOpacity>

          <View style={styles.securityRow}>
            <Shield size={11} color={T.muted} />
            <Text style={styles.securityText}>
              Paiements sécurisés par Faroty · Données chiffrées
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.payInfo, { opacity: fadeAnim }]}>
          <Text style={styles.payInfoText}>
            💳 Orange Money · MTN Money · Faroty Wallet
          </Text>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Helpers ── */
function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('237')) return `+${digits}`;
  if (digits.startsWith('6') || digits.startsWith('2')) return `+237${digits}`;
  return `+237${digits}`;
}

function generateSimOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 20, alignItems: 'center' },

  /* ✅ H utilisé ici — maintenant déclaré en haut du fichier */
  orb1: { position: 'absolute', top: -80,      right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: T.gaming,   opacity: 0.09 },
  orb2: { position: 'absolute', top: H * 0.35, left: -80,  width: 200, height: 200, borderRadius: 100, backgroundColor: T.physique, opacity: 0.07 },
  orb3: { position: 'absolute', bottom: 80,    right: -40, width: 160, height: 160, borderRadius: 80,  backgroundColor: T.gold,     opacity: 0.06 },

  /* Logo */
  logoSection: { alignItems: 'center', marginBottom: 28, width: '100%' },
  logoWrap:    { position: 'relative', marginBottom: 14, alignItems: 'center', justifyContent: 'center' },
  logoGlow:    { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: T.gold },
  logoBadge:   {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: '#0F1219', borderWidth: 2,
    borderColor: T.gold + '50',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: T.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 14,
  },
  logoTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 46, color: '#EEEEF5', letterSpacing: 8 },
  logoTagline: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, letterSpacing: 2.5, marginTop: 6 },

  /* Card */
  card: {
    width: '100%', backgroundColor: '#0C0E14',
    borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5, shadowRadius: 40, elevation: 20,
  },
  cardAccent: { height: 2.5 },
  cardTop:    { paddingHorizontal: 20, paddingTop: 18, marginBottom: 4 },

  stepDots: { flexDirection: 'row', gap: 6 },
  stepDot:  { height: 4, borderRadius: 2 },

  cardTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 28, color: '#EEEEF5', letterSpacing: 0.5, paddingHorizontal: 20, marginTop: 12, marginBottom: 6 },
  cardSub:   { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, lineHeight: 20, paddingHorizontal: 20, marginBottom: 18 },

  bonusBadge: { marginHorizontal: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.gold + '12', borderWidth: 1, borderColor: T.gold + '30', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  bonusText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: T.gold, fontWeight: '700', flex: 1 },

  fields:      { paddingHorizontal: 20, gap: 18, marginBottom: 10 },
  fieldLabel:  { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  fieldHint:   { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 },

  inputWrap:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  inputIconBox: { marginRight: 10 },
  inputPrefix:  { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: T.gaming, marginRight: 6, fontWeight: '700' },
  input:        { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: '#EEEEF5', padding: 0 },

  otpSection:   { paddingHorizontal: 20, marginBottom: 14, marginTop: 8 },
  otpRow:       { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpBox:       { width: (W - 80) / 6, height: 54, borderRadius: 12, backgroundColor: '#0D0F14', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center', fontFamily: 'JetBrainsMono-Regular', fontSize: 22, color: '#EEEEF5', fontWeight: '700' },
  otpBoxFilled: { borderColor: T.gaming, backgroundColor: T.gaming + '10' },
  otpBoxError:  { borderColor: T.danger,  backgroundColor: T.danger  + '10' },

  simCodeCard:      { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#080A0F', borderRadius: 16, borderWidth: 1.5, borderColor: T.gaming + '40', padding: 20, alignItems: 'center', gap: 8 },
  simCodeBadge:     { backgroundColor: T.gaming + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  simCodeBadgeText: { fontFamily: 'Inter-Regular', fontSize: 9, color: T.gaming, fontWeight: '800', letterSpacing: 1.5 },
  simCodeLabel:     { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 2 },
  simCode:          { fontFamily: 'JetBrainsMono-Regular', fontSize: 44, color: T.gold, fontWeight: '700', letterSpacing: 10 },
  simCodeNote:      { fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' },

  resendRow:  { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  resendWait: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  resendBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resendText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gaming, fontWeight: '700' },

  changeBtn:     { alignSelf: 'center', marginBottom: 8 },
  changeBtnText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },

  errorBox:  { marginHorizontal: 20, marginTop: 4, marginBottom: 4, backgroundColor: T.danger + '15', borderWidth: 1, borderColor: T.danger + '40', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.danger },

  mainBtn:         { marginHorizontal: 20, marginTop: 16, marginBottom: 6, backgroundColor: T.gold, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: T.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  mainBtnDisabled: { opacity: 0.7 },
  mainBtnText:     { fontFamily: 'Rajdhani-Bold', fontSize: 19, color: '#000', letterSpacing: 2 },

  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 20 },
  securityText:{ fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 },

  payInfo:     { marginTop: 16 },
  payInfoText: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: 0.5 },
});