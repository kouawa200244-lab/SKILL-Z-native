// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Eye, EyeOff, Zap, Mail, Lock,
  User, ArrowRight, Shield, Phone,
  CheckCircle, RefreshCw,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { supabase } from '../supabaseClient';
import { sendOTP, generateOTP } from '../utils/smsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: H, width: W } = Dimensions.get('window');

/* ══════════════════════════════════════
   INPUT FIELD CUSTOM
══════════════════════════════════════ */
function InputField({
  icon: Icon, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, rightIcon, onRightPress,
  editable = true,
}) {
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
    <Animated.View style={[
      styles.inputWrap,
      { borderColor, backgroundColor: bgColor },
      !editable && styles.inputDisabled,
    ]}>
      <Icon size={16} color={editable ? T.muted : 'rgba(255,255,255,0.2)'} style={{ marginRight: 12 }} />
      <TextInput
        style={[styles.input, !editable && { color: T.muted }]}
        placeholder={placeholder}
        placeholderTextColor={T.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        onFocus={onFocus}
        onBlur={onBlur}
        editable={editable}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={{ padding: 4 }}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   OTP INPUT — 6 cases
══════════════════════════════════════ */
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

/* ══════════════════════════════════════
   AUTH SCREEN PRINCIPAL
══════════════════════════════════════ */
export default function AuthScreen({ onLogin }) {
  // Mode
  const [mode,    setMode]    = useState('login'); // 'login' | 'register'
  const [step,    setStep]    = useState(1);        // 1=infos, 2=otp, 3=done

  // Champs
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone,    setPhone]    = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  // OTP
  const [otpCode,     setOtpCode]     = useState('');
  const [otpExpected, setOtpExpected] = useState('');
  const [otpError,    setOtpError]    = useState(false);
  const [countdown,   setCountdown]   = useState(0);

  // UI
  const [loading,     setLoading]     = useState(false);
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [error,       setError]       = useState('');

  // Animations
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(60)).current;
  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const orb1Anim    = useRef(new Animated.Value(0)).current;
  const stepAnim    = useRef(new Animated.Value(0)).current;

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

  /* ── Shake error ── */
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

  /* ── Transition step ── */
  const goToStep = (n) => {
    Animated.sequence([
      Animated.timing(stepAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(stepAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setStep(n));
  };

  /* ── Switch mode ── */
  const switchMode = (m) => {
    setError('');
    setStep(1);
    setOtpCode('');
    setOtpExpected('');
    setOtpError(false);
    setMode(m);
  };

  /* ══════════════════════════════════════
     CONNEXION
  ══════════════════════════════════════ */
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Remplis tous les champs.'); shake(); return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      if (!data.user)  throw new Error('Connexion échouée.');

      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        supabase.from('wallets').select('*').eq('user_id', data.user.id).single(),
      ]);

      // Créer wallet si absent
      if (!walletRes.data) {
        await supabase.from('wallets').insert({
          user_id: data.user.id, balance: 1000, total_depots: 1000,
        });
        await supabase.from('transactions').insert({
          user_id: data.user.id, type: 'bonus', amount: 1000,
          balance_before: 0, balance_after: 1000,
          label: 'Bonus de bienvenue SKILL\'Z 🎉',
        });
      }

      const session = {
        id:       data.user.id,
        email:    data.user.email,
        username: profileRes.data?.username || data.user.email.split('@')[0],
        rank:     profileRes.data?.rank     || 'RANG BRONZE',
        xp:       profileRes.data?.xp       || 0,
        balance:  walletRes.data?.balance   || 1000,
        phone:    profileRes.data?.phone    || '',
        token:    data.session?.access_token,
      };
      await AsyncStorage.setItem('skillz_user', JSON.stringify(session));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLogin(session);

    } catch (e) {
      const msg = e.message?.includes('Invalid login')
        ? 'Email ou mot de passe incorrect.'
        : e.message || 'Erreur de connexion.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════
     ÉTAPE 1 — Valider les infos
  ══════════════════════════════════════ */
  const handleStep1 = async () => {
    if (!username.trim()) { setError('Choisis un nom d\'utilisateur.'); shake(); return; }
    if (!email.trim())    { setError('Entre ton adresse email.');        shake(); return; }
    if (password.length < 6) { setError('Mot de passe : 6 caractères min.'); shake(); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setError('Entre un numéro valide (ex: 237674742929)'); shake(); return;
    }

    setLoading(true);
    setError('');
    try {
      // Vérifier username dispo
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', username.trim()).single();
      if (existing) { setError('Nom d\'utilisateur déjà pris.'); shake(); return; }

      // Vérifier email dispo
      const { data: existingEmail } = await supabase
        .from('profiles').select('id').eq('email', email.trim().toLowerCase()).single();
      if (existingEmail) { setError('Email déjà utilisé.'); shake(); return; }

      // Envoyer OTP
      await handleSendOTP();
      goToStep(2);

    } catch (e) {
      if (e.message !== 'OTP_SENT') {
        setError(e.message || 'Erreur. Réessaie.');
        shake();
      }
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════
     ENVOI OTP
  ══════════════════════════════════════ */
  const handleSendOTP = async () => {
    setOtpLoading(true);
    setOtpError(false);
    setOtpCode('');
    try {
      const code     = generateOTP();
      const phoneNum = phone.replace(/[\s\-\+]/g, '');
      await sendOTP(phoneNum, code);
      setOtpExpected(code);
      setCountdown(60); // 60s avant renvoi
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError('Impossible d\'envoyer le SMS. Vérifie le numéro.');
      shake();
      throw e;
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setError('');
    try {
      await handleSendOTP();
    } catch (_) {}
  };

  /* ══════════════════════════════════════
     ÉTAPE 2 — Vérifier OTP
  ══════════════════════════════════════ */
  const handleVerifyOTP = () => {
    if (otpCode.length < 6) {
      setOtpError(true); shake();
      setError('Entre le code à 6 chiffres.');
      return;
    }
    if (otpCode !== otpExpected) {
      setOtpError(true); shake();
      setError('Code incorrect. Réessaie.');
      return;
    }
    setOtpError(false);
    setError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleRegister();
  };

  /* ══════════════════════════════════════
     INSCRIPTION FINALE
  ══════════════════════════════════════ */
  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      // Créer compte Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: username.trim(),
            phone:    phone.replace(/[\s\-\+]/g, ''),
          },
        },
      });
      if (signUpError) throw signUpError;
      if (!data.user)  throw new Error('Erreur création de compte.');

      // Attendre le trigger SQL (profil + wallet créés auto)
      await new Promise(r => setTimeout(r, 900));

      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        supabase.from('wallets').select('*').eq('user_id', data.user.id).single(),
      ]);

      const session = {
        id:       data.user.id,
        email:    data.user.email,
        username: profileRes.data?.username || username.trim(),
        rank:     profileRes.data?.rank     || 'RANG BRONZE',
        xp:       profileRes.data?.xp       || 0,
        balance:  walletRes.data?.balance   || 1000,
        phone:    phone.replace(/[\s\-\+]/g, ''),
        token:    data.session?.access_token,
      };

      await AsyncStorage.setItem('skillz_user', JSON.stringify(session));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLogin(session);

    } catch (e) {
      const msg = e.message?.includes('already registered')
        ? 'Cet email est déjà utilisé.'
        : e.message || 'Erreur lors de l\'inscription.';
      setError(msg);
      shake();
      goToStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    setError('');
    if (mode === 'login') return handleLogin();
    if (step === 1)       return handleStep1();
    if (step === 2)       return handleVerifyOTP();
  };

  /* ── Indicateur d'étape ── */
  const StepIndicator = () => (
    <View style={styles.steps}>
      {[1, 2].map(s => (
        <View key={`step_${s}`} style={styles.stepRow}>
          <View style={[
            styles.stepDot,
            step >= s
              ? { backgroundColor: T.gaming, borderColor: T.gaming }
              : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)' }
          ]}>
            {step > s
              ? <CheckCircle size={10} color="#000" />
              : <Text style={[styles.stepNum, step === s && { color: '#000' }]}>{s}</Text>
            }
          </View>
          {s < 2 && (
            <View style={[styles.stepLine, step > s && { backgroundColor: T.gaming }]} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Orbes */}
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

          {/* Toggle mode */}
          <View style={styles.modeToggle}>
            {['login', 'register'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => switchMode(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <Text style={styles.formTitle}>Bon retour, champion 👊</Text>
              <Text style={styles.formSub}>Connecte-toi pour retrouver tes défis</Text>

              <View style={styles.fields}>
                <InputField
                  icon={Mail} placeholder="Adresse email"
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <InputField
                  icon={Lock} placeholder="Mot de passe"
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  rightIcon={showPwd
                    ? <EyeOff size={16} color={T.muted} />
                    : <Eye    size={16} color={T.muted} />
                  }
                  onRightPress={() => setShowPwd(!showPwd)}
                />
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── REGISTER STEP 1 — Informations ── */}
          {mode === 'register' && step === 1 && (
            <>
              <View style={styles.stepHeader}>
                <StepIndicator />
                <Text style={styles.formTitle}>Rejoins l'arène ⚡</Text>
                <Text style={styles.formSub}>Crée ton compte et reçois 1 000 FCFA offerts 🎁</Text>
              </View>

              {/* Bonus badge */}
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusText}>🎉 1 000 FCFA offerts à l'inscription</Text>
              </View>

              <View style={styles.fields}>
                <InputField
                  icon={User} placeholder="Nom d'utilisateur"
                  value={username} onChangeText={setUsername}
                />
                <InputField
                  icon={Mail} placeholder="Adresse email"
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <InputField
                  icon={Lock} placeholder="Mot de passe (6 caractères min.)"
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  rightIcon={showPwd
                    ? <EyeOff size={16} color={T.muted} />
                    : <Eye    size={16} color={T.muted} />
                  }
                  onRightPress={() => setShowPwd(!showPwd)}
                />

                {/* Téléphone */}
                <View style={styles.phoneSection}>
                  <Text style={styles.phoneLabel}>NUMÉRO DE TÉLÉPHONE</Text>
                  <Text style={styles.phoneSub}>Pour recevoir ton code de vérification SMS</Text>
                  <InputField
                    icon={Phone} placeholder="Ex: 237674742929"
                    value={phone} onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </>
          )}

          {/* ── REGISTER STEP 2 — OTP ── */}
          {mode === 'register' && step === 2 && (
            <>
              <View style={styles.stepHeader}>
                <StepIndicator />
                <Text style={styles.formTitle}>Vérifie ton numéro 📱</Text>
                <Text style={styles.formSub}>
                  Code envoyé au{'\n'}
                  <Text style={{ color: T.gaming, fontWeight: '700' }}>
                    +{phone.replace(/[\s\-\+]/g, '')}
                  </Text>
                </Text>
              </View>

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
                {otpLoading ? (
                  <ActivityIndicator size="small" color={T.gaming} />
                ) : countdown > 0 ? (
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
            </>
          )}

          {/* ── ERREUR ── */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── BOUTON SUBMIT ── */}
          <TouchableOpacity
            style={[styles.submitBtn, (loading || otpLoading) && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading || otpLoading}
          >
            <View style={styles.submitBtnInner}>
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {mode === 'login'
                      ? 'SE CONNECTER'
                      : step === 1
                        ? 'CONTINUER →'
                        : 'VÉRIFIER & CRÉER MON COMPTE'
                    }
                  </Text>
                  {!loading && mode === 'login' && (
                    <ArrowRight size={18} color="#000" />
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* ── SÉPARATEUR ── */}
          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>ou</Text>
            <View style={styles.sepLine} />
          </View>

          {/* ── SWITCH MODE ── */}
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.switchText}>
              {mode === 'login'
                ? 'Pas encore de compte ? '
                : 'Déjà un compte ? '
              }
              <Text style={styles.switchLink}>
                {mode === 'login' ? "S'inscrire" : 'Se connecter'}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* ── SÉCURITÉ ── */}
          <View style={styles.securityBadge}>
            <Shield size={11} color={T.muted} />
            <Text style={styles.securityText}>
              Connexion sécurisée · SMS via Infobip · Données chiffrées
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
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
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5, shadowRadius: 40, elevation: 20,
  },
  cardAccent: { height: 2, backgroundColor: T.gaming },

  /* Toggle */
  modeToggle: {
    flexDirection: 'row', margin: 18, marginBottom: 0,
    backgroundColor: '#080A0F', borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  modeBtn:         { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  modeBtnActive:   { backgroundColor: T.gaming + '20', borderWidth: 1, borderColor: T.gaming + '50' },
  modeBtnText:     { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '800', letterSpacing: 1.5 },
  modeBtnTextActive:{ color: T.gaming },

  /* Step indicator */
  stepHeader: { marginTop: 20, marginHorizontal: 20 },
  steps:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepRow:    { flexDirection: 'row', alignItems: 'center' },
  stepDot:    {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  stepNum:    { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800' },
  stepLine:   { width: 32, height: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },

  /* Formulaire */
  formTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 24, color: '#EEEEF5', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  formSub:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 18 },

  /* Bonus */
  bonusBadge: {
    marginHorizontal: 18, marginBottom: 14,
    backgroundColor: T.gold + '12', borderWidth: 1,
    borderColor: T.gold + '30', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bonusText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gold, fontWeight: '700', textAlign: 'center' },

  /* Champs */
  fields:       { paddingHorizontal: 18, gap: 12, marginBottom: 8 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  inputDisabled:{ opacity: 0.5 },
  input:        { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#EEEEF5', padding: 0 },

  /* Phone */
  phoneSection: { gap: 6 },
  phoneLabel:   { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 2 },
  phoneSub:     { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },

  /* OTP */
  otpSection: { paddingHorizontal: 18, marginBottom: 16, marginTop: 8 },
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

  changePhoneBtn: { alignItems: 'center', marginBottom: 8 },
  changePhoneText:{ fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },

  /* Forgot */
  forgotBtn:  { alignSelf: 'flex-end', marginRight: 18, marginTop: 4, marginBottom: 4 },
  forgotText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gaming },

  /* Erreur */
  errorBox: {
    marginHorizontal: 18, marginTop: 8,
    backgroundColor: T.danger + '15', borderWidth: 1,
    borderColor: T.danger + '40', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.danger },

  /* Submit */
  submitBtn: {
    marginHorizontal: 18, marginTop: 18,
    backgroundColor: T.gold, borderRadius: 16,
    shadowColor: T.gold, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  submitBtnText:  { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#000', letterSpacing: 2 },

  /* Separator */
  separator: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginTop: 20, gap: 12 },
  sepLine:   { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  sepText:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },

  /* Switch */
  switchBtn:  { alignItems: 'center', marginTop: 16, paddingHorizontal: 18 },
  switchText: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  switchLink: { color: T.gaming, fontWeight: '700' },

  /* Security */
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, marginBottom: 20 },
  securityText:  { fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 },
});