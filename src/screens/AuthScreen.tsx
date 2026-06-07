// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Phone, Zap, Shield, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: H, width: W } = Dimensions.get('window');

// ══════════════════════════════════════
// OTP INPUT — 6 cases
// ══════════════════════════════════════
function OTPInput({ value, onChange, hasError }) {
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const digits = value.split('');
    digits[index] = text.replace(/\D/g, '').slice(-1);
    const newVal = digits.join('');
    onChange(newVal);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
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
            value[i] && styles.otpBoxFilled,
            hasError && styles.otpBoxError,
          ]}
          value={value[i] || ''}
          onChangeText={text => handleChange(text, i)}
          onKeyPress={e => handleKeyPress(e, i)}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}


// ══════════════════════════════════════
// AUTH SCREEN — TÉLÉPHONE + OTP UNIQUEMENT
// ══════════════════════════════════════
export default function AuthScreen({ onLogin }) {
  const [step,    setStep]    = useState(1);  // 1 = téléphone, 2 = OTP
  const [phone,   setPhone]   = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpExpected, setOtpExpected] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Animations
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
      Animated.timing(orb1Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
      Animated.timing(orb1Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  // Countdown renvoi OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const orb1Y      = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

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

  // ══════════════════════════════════════
  // ÉTAPE 1 — Envoyer OTP
  // ══════════════════════════════════════
  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    if (cleanPhone.length < 9) {
      setError('Entre un numéro valide (ex: 237674742929)');
      shake();
      return;
    }

    setLoading(true);
    setError('');

    // MODE DEV : OTP fixe 123456
    const code = '123456';
    setOtpExpected(code);

    // Simuler l'envoi SMS (1 seconde)
    setTimeout(() => {
      setStep(2);
      setLoading(false);
      setCountdown(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
  };

  const handleResendOTP = () => {
    if (countdown > 0) return;
    setOtpCode('');
    setOtpError(false);
    setError('');
    handleSendOTP();
  };

  // ══════════════════════════════════════
  // ÉTAPE 2 — Vérifier OTP et connecter
  // ══════════════════════════════════════
  async function handleVerify() {
  if (!code) return;
  setLoading(true);

  const storedOTP = await AsyncStorage.getItem('skillz_temp_otp');
  const formatted = phone.startsWith('+') ? phone : `+237${phone.replace(/^0+/, '')}`;

  if (code !== storedOTP) {
    Alert.alert('Erreur', 'Code incorrect.');
    setLoading(false);
    return;
  }

  try {
    // Vérifier si le joueur existe déjà dans la table players
    const { data: existingPlayer, error: selectError } = await supabase
      .from('players')
      .select('id, name')
      .eq('phone', formatted)
      .single();

    let player;

    if (existingPlayer) {
      // Joueur existant → mettre à jour last_login_at
      player = existingPlayer;
      await supabase
        .from('players')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', player.id);
    } else {
      // Nouveau joueur → inscription
      const { data: newPlayer, error: insertError } = await supabase
        .from('players')
        .insert({
          phone: formatted,
          name: name.trim(),
          last_login_at: new Date().toISOString(),
        })
        .select('id, name')
        .single();

      if (insertError) {
        Alert.alert('Erreur', "Impossible de créer le compte.");
        setLoading(false);
        return;
      }
      player = newPlayer;

      // Créer un wallet initial avec 5000 FCFA
      await supabase.from('wallets').insert({
        user_id: player.id,
        balance: 5000,
      });
    }

    // ✅ C'EST ICI que tu mets le bloc
    const user = {
      id: player.id,
      phone: formatted,
      user_metadata: { name: player.name },
    };
    await AsyncStorage.setItem('skillz_user', JSON.stringify(user));
    await AsyncStorage.removeItem('skillz_temp_otp');
    onLogin(user);

  } catch (e) {
    console.error(e);
    Alert.alert('Erreur', 'Une erreur est survenue.');
  } finally {
    setLoading(false);
  }
}
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Orbes décoratives */}
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── LOGO ── */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoWrap}>
            <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
            <View style={styles.logoBadge}>
              <Zap size={32} color={T.gold} strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.logoTitle}>SKILL'Z</Text>
          <Text style={styles.logoTagline}>Défie. Mise. Domine.</Text>
        </Animated.View>

        {/* ── CARD ── */}
        <Animated.View style={[
          styles.card,
          {
            opacity:   fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
          },
        ]}>
          <View style={styles.cardAccent} />

          {/* ── ÉTAPE 1 : TÉLÉPHONE ── */}
          {step === 1 && (
            <>
              <Text style={styles.formTitle}>Bienvenue sur SKILL'Z ⚡</Text>
              <Text style={styles.formSub}>
                Entre ton numéro de téléphone pour recevoir un code de vérification.
              </Text>

              <View style={styles.fields}>
                <View style={styles.phoneInputWrap}>
                  <Phone size={18} color={T.muted} style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Ex: 237674742929"
                    placeholderTextColor={T.muted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>

              {/* Bouton envoyer OTP */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSendOTP}
                activeOpacity={0.85}
                disabled={loading}
              >
                <View style={styles.submitBtnInner}>
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>RECEVOIR LE CODE</Text>
                      <ArrowRight size={18} color="#000" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* ── ÉTAPE 2 : OTP ── */}
          {step === 2 && (
            <>
              <Text style={styles.formTitle}>Vérifie ton numéro 📱</Text>
              <Text style={styles.formSub}>
                Code envoyé au{' '}
                <Text style={{ color: T.gaming, fontWeight: '700' }}>
                  +{phone.replace(/[\s\-\+]/g, '')}
                </Text>
              </Text>

              {/* OTP 6 cases */}
              <View style={styles.otpSection}>
                <OTPInput
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val);
                    setOtpError(false);
                    setError('');
                  }}
                  hasError={otpError}
                />
              </View>

              {/* Renvoi OTP */}
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.resendWait}>
                    Renvoyer dans <Text style={{ color: T.gaming }}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOTP} style={styles.resendBtn}>
                    <RefreshCw size={13} color={T.gaming} />
                    <Text style={styles.resendText}>Renvoyer le code</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Changer numéro */}
              <TouchableOpacity
                style={styles.changePhoneBtn}
                onPress={() => { setStep(1); setOtpCode(''); setError(''); }}
              >
                <Text style={styles.changePhoneText}>← Changer le numéro</Text>
              </TouchableOpacity>

              {/* Bouton vérifier */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleVerifyOTP}
                activeOpacity={0.85}
                disabled={loading}
              >
                <View style={styles.submitBtnInner}>
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>VÉRIFIER & SE CONNECTER</Text>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* ── ERREUR ── */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── SÉCURITÉ ── */}
          <View style={styles.securityBadge}>
            <Shield size={11} color={T.muted} />
            <Text style={styles.securityText}>
              Connexion sécurisée · Code OTP unique · Données chiffrées
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════
// STYLES
// ══════════════════════════════════════
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080A0F' },

  /* Orbes */
  orb1: { position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: T.gaming,   opacity: 0.09 },
  orb2: { position: 'absolute', top: H * 0.3, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: T.physique, opacity: 0.08 },
  orb3: { position: 'absolute', bottom: 60, right: -40, width: 150, height: 150, borderRadius: 75,  backgroundColor: T.gold,     opacity: 0.06 },

  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },

  /* Logo */
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoWrap:    { position: 'relative', marginBottom: 14, alignItems: 'center', justifyContent: 'center' },
  logoGlow:    { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: T.gold },
  logoBadge:   {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: '#0F1219',
    borderWidth: 1.5, borderColor: T.gold + '50',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: T.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  logoTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 42, color: '#EEEEF5', letterSpacing: 6 },
  logoTagline: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, letterSpacing: 2, marginTop: 4 },

  /* Card */
  card: {
    backgroundColor: '#0C0E14', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden', paddingHorizontal: 18, paddingBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5, shadowRadius: 40, elevation: 20,
  },
  cardAccent: { height: 2, backgroundColor: T.gaming, marginHorizontal: -18, marginBottom: 20 },

  /* Formulaire */
  formTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 24, color: '#EEEEF5', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  formSub:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, marginBottom: 20, lineHeight: 18 },

  fields: { gap: 12, marginBottom: 8 },

  /* Phone input */
  phoneInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#0D0F14',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  phoneInput: {
    flex: 1, fontFamily: 'Inter-Regular',
    fontSize: 16, color: '#EEEEF5', padding: 0,
  },

  /* OTP */
  otpSection: { marginBottom: 16 },
  otpRow:     { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpBox:     {
    width: (W - 76) / 6, height: 52, borderRadius: 12,
    backgroundColor: '#0D0F14', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    textAlign: 'center', fontFamily: 'JetBrainsMono-Regular',
    fontSize: 22, color: '#EEEEF5', fontWeight: '700',
  },
  otpBoxFilled: { borderColor: T.gaming, backgroundColor: T.gaming + '10' },
  otpBoxError:  { borderColor: T.danger,  backgroundColor: T.danger  + '10' },

  /* Resend */
  resendRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  resendWait: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  resendBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resendText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gaming, fontWeight: '700' },

  changePhoneBtn:  { alignItems: 'center', marginBottom: 8 },
  changePhoneText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },

  /* Erreur */
  errorBox: {
    marginTop: 12,
    backgroundColor: T.danger + '15', borderWidth: 1,
    borderColor: T.danger + '40', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.danger },

  /* Submit */
  submitBtn: {
    marginTop: 16,
    backgroundColor: T.gold, borderRadius: 16,
    shadowColor: T.gold, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  submitBtnInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 16,
  },
  submitBtnText: {
    fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#000', letterSpacing: 2,
  },

  /* Security */
  securityBadge: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginTop: 20,
  },
  securityText: {
    fontFamily: 'Inter-Regular', fontSize: 10,
    color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3,
  },
});