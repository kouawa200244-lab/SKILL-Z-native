// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import {
  Eye, EyeOff, Zap, Mail, Lock,
  User, ArrowRight, Shield,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: H } = Dimensions.get('window');

function InputField({ icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, rightIcon, onRightPress }) {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const onFocus = () => Animated.spring(focusAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: false }).start();
  const onBlur  = () => Animated.spring(focusAnim, { toValue: 0, tension: 120, friction: 8, useNativeDriver: false }).start();
  const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.07)', T.gaming] });
  const bgColor     = focusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#0D0F14', '#0D1A20'] });

  return (
    <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor: bgColor }]}>
      <Icon size={16} color={T.muted} style={{ marginRight: 12 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={T.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={{ padding: 4 }}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function AuthScreen({ onLogin }) {
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const orb1Anim  = useRef(new Animated.Value(0)).current;
  const orb2Anim  = useRef(new Animated.Value(0)).current;

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

  const orb1Y      = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  /* ── INSCRIPTION ── */
  const handleRegister = async () => {
    if (!username.trim()) { setError('Choisis un nom d\'utilisateur.'); shake(); return; }
    if (!email.trim())    { setError('Entre ton adresse email.');        shake(); return; }
    if (password.length < 6) { setError('Mot de passe : 6 caractères minimum.'); shake(); return; }

    setLoading(true);
    setError('');

    try {
      // 1. Vérifier username dispo
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .single();

      if (existing) {
        setError('Ce nom d\'utilisateur est déjà pris.');
        shake();
        setLoading(false);
        return;
      }

      // 2. Créer le compte Supabase Auth
      // Le trigger SQL crée automatiquement le profil + wallet
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { username: username.trim() }, // transmis au trigger via raw_user_meta_data
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user)  throw new Error('Erreur lors de la création du compte.');

      // 3. Attendre que le trigger ait créé le profil (petit délai)
      await new Promise(r => setTimeout(r, 800));

      // 4. Récupérer le profil + wallet créés par le trigger
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      // 5. Sauvegarder en local
      const userSession = {
        id:       data.user.id,
        email:    data.user.email,
        username: profile?.username || username.trim(),
        rank:     profile?.rank    || 'RANG BRONZE',
        xp:       profile?.xp      || 0,
        balance:  wallet?.balance  || 1000,
        token:    data.session?.access_token,
      };

      await AsyncStorage.setItem('skillz_user', JSON.stringify(userSession));
      onLogin(userSession);

    } catch (e) {
      const msg = e.message?.includes('already registered')
        ? 'Cet email est déjà utilisé.'
        : e.message || 'Erreur lors de l\'inscription.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  /* ── CONNEXION ── */
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Remplis tous les champs.');
      shake();
      return;
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

      // Récupérer profil + wallet
      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        supabase.from('wallets').select('*').eq('user_id', data.user.id).single(),
      ]);

      const profile = profileRes.data;
      const wallet  = walletRes.data;

      // Si wallet manquant (ancien compte), le créer
      if (!wallet) {
        await supabase.from('wallets').insert({
          user_id:      data.user.id,
          balance:      1000,
          total_depots: 1000,
        });
        await supabase.from('transactions').insert({
          user_id:        data.user.id,
          type:           'bonus',
          amount:         1000,
          balance_before: 0,
          balance_after:  1000,
          label:          'Bonus de bienvenue SKILL\'Z 🎉',
        });
      }

      const userSession = {
        id:       data.user.id,
        email:    data.user.email,
        username: profile?.username || data.user.email.split('@')[0],
        rank:     profile?.rank    || 'RANG BRONZE',
        xp:       profile?.xp      || 0,
        balance:  wallet?.balance  || 1000,
        token:    data.session?.access_token,
      };

      await AsyncStorage.setItem('skillz_user', JSON.stringify(userSession));
      onLogin(userSession);

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

  const handleSubmit = () => mode === 'login' ? handleLogin() : handleRegister();

  const switchMode = (newMode) => { setError(''); setMode(newMode); };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
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

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
          <View style={styles.cardAccent} />

          {/* Toggle */}
          <View style={styles.modeToggle}>
            {['login', 'register'].map(m => (
              <TouchableOpacity key={m} style={[styles.modeBtn, mode === m && styles.modeBtnActive]} onPress={() => switchMode(m)} activeOpacity={0.7}>
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Bon retour, champion 👊' : 'Rejoins l\'arène ⚡'}
          </Text>
          <Text style={styles.formSub}>
            {mode === 'login'
              ? 'Connecte-toi pour retrouver tes défis'
              : 'Crée ton compte et reçois 1 000 FCFA offerts 🎁'}
          </Text>

          {/* Bonus badge inscription */}
          {mode === 'register' && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>🎉 1 000 FCFA offerts à l'inscription</Text>
            </View>
          )}

          {/* Champs */}
          <View style={styles.fields}>
            {mode === 'register' && (
              <InputField icon={User} placeholder="Nom d'utilisateur" value={username} onChangeText={setUsername} />
            )}
            <InputField icon={Mail} placeholder="Adresse email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <InputField
              icon={Lock} placeholder="Mot de passe" value={password}
              onChangeText={setPassword} secureTextEntry={!showPwd}
              rightIcon={showPwd ? <EyeOff size={16} color={T.muted} /> : <Eye size={16} color={T.muted} />}
              onRightPress={() => setShowPwd(!showPwd)}
            />
          </View>

          {mode === 'login' && (
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} activeOpacity={0.85} disabled={loading}>
            <View style={styles.submitBtnInner}>
              {loading
                ? <ActivityIndicator color="#000" size="small" />
                : <>
                    <Text style={styles.submitBtnText}>
                      {mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
                    </Text>
                    <ArrowRight size={18} color="#000" />
                  </>
              }
            </View>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>ou</Text>
            <View style={styles.sepLine} />
          </View>

          <TouchableOpacity style={styles.switchBtn} onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
              <Text style={styles.switchLink}>
                {mode === 'login' ? "S'inscrire" : "Se connecter"}
              </Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.securityBadge}>
            <Shield size={11} color={T.muted} />
            <Text style={styles.securityText}>Connexion sécurisée · Données chiffrées</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080A0F' },
  orb1: { position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: T.gaming, opacity: 0.09 },
  orb2: { position: 'absolute', top: H * 0.3, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: T.physique, opacity: 0.08 },
  orb3: { position: 'absolute', bottom: 60, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: T.gold, opacity: 0.06 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },

  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoWrap: { position: 'relative', marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  logoGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: T.gold },
  logoBadge: { width: 76, height: 76, borderRadius: 22, backgroundColor: '#0F1219', borderWidth: 1.5, borderColor: T.gold + '50', justifyContent: 'center', alignItems: 'center', shadowColor: T.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  logoTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 42, color: '#EEEEF5', letterSpacing: 6 },
  logoTagline: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, letterSpacing: 2, marginTop: 4 },

  card: { backgroundColor: '#0C0E14', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 20 },
  cardAccent: { height: 2, backgroundColor: T.gaming },

  modeToggle: { flexDirection: 'row', margin: 18, marginBottom: 0, backgroundColor: '#080A0F', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  modeBtnActive: { backgroundColor: T.gaming + '20', borderWidth: 1, borderColor: T.gaming + '50' },
  modeBtnText: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, fontWeight: '800', letterSpacing: 1.5 },
  modeBtnTextActive: { color: T.gaming },

  formTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 24, color: '#EEEEF5', letterSpacing: 0.5, marginTop: 22, marginHorizontal: 20 },
  formSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, marginTop: 4, marginHorizontal: 20, marginBottom: 16, lineHeight: 18 },

  bonusBadge: { marginHorizontal: 18, marginBottom: 16, backgroundColor: T.gold + '12', borderWidth: 1, borderColor: T.gold + '30', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  bonusText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gold, fontWeight: '700', textAlign: 'center' },

  fields: { paddingHorizontal: 18, gap: 12, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#EEEEF5', padding: 0 },

  forgotBtn: { alignSelf: 'flex-end', marginRight: 18, marginTop: 4, marginBottom: 4 },
  forgotText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.gaming },

  errorBox: { marginHorizontal: 18, marginTop: 8, backgroundColor: T.danger + '15', borderWidth: 1, borderColor: T.danger + '40', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.danger },

  submitBtn: { marginHorizontal: 18, marginTop: 18, backgroundColor: T.gold, borderRadius: 16, shadowColor: T.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  submitBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#000', letterSpacing: 2 },

  separator: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginTop: 20, gap: 12 },
  sepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  sepText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },

  switchBtn: { alignItems: 'center', marginTop: 16, paddingHorizontal: 18 },
  switchText: { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  switchLink: { color: T.gaming, fontWeight: '700' },

  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, marginBottom: 20 },
  securityText: { fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 },
});