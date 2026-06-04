// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, ActivityIndicator,
  Dimensions, StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import {
  Video, Square, CheckCircle, X,
  Clock, Zap, Trophy, ChevronRight,
  RotateCcw, Shield, Upload,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

/* ── Timer formaté ── */
function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ══════════════════════════════════════
   LIVE SCREEN
══════════════════════════════════════ */
export default function LiveScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

  const { betId, defi, gameKey, mise, cote, user } = route.params || {};

  // Permissions
  const [cameraPermission, requestCameraPermission]     = useCameraPermissions();
  const [micPermission,    requestMicPermission]        = useMicrophonePermissions();

  // State caméra
  const [facing,      setFacing]      = useState('back');
  const [recording,   setRecording]   = useState(false);
  const [videoUri,    setVideoUri]    = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [timer,       setTimer]       = useState(0);
  const [phase,       setPhase]       = useState('ready'); // ready | recording | preview | uploading | done

  // Refs
  const cameraRef  = useRef(null);
  const timerRef   = useRef(null);

  // Animations
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const recAnim    = useRef(new Animated.Value(1)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  const game   = GAMES[gameKey]   || {};
  const palier = PALIERS[defi?.p] || {};
  const color  = game.color       || T.gold;
  const gain   = Math.round(mise * cote * 0.9);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    requestAllPermissions();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Pulse bouton REC
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(recAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recAnim.setValue(1);
    }
  }, [recording]);

  const requestAllPermissions = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted)    await requestMicPermission();
  };

  /* ── Démarrer l'enregistrement ── */
  const startRecording = async () => {
    if (!cameraRef.current || recording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRecording(true);
    setPhase('recording');
    setTimer(0);

    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 120, // max 2 minutes
        quality:     '720p',
      });
      setVideoUri(video.uri);
    } catch (e) {
      console.error('Erreur enregistrement:', e);
      stopRecording();
    }
  };

  /* ── Arrêter l'enregistrement ── */
  const stopRecording = () => {
    if (!recording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerRef.current) clearInterval(timerRef.current);
    cameraRef.current?.stopRecording();
    setRecording(false);
    setPhase('preview');
  };

  /* ── Recommencer ── */
  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVideoUri(null);
    setTimer(0);
    setPhase('ready');
  };

  /* ── Soumettre la preuve ── */
  const handleSubmit = async () => {
    if (!videoUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUploading(true);
    setPhase('uploading');

    try {
      const stored  = await AsyncStorage.getItem('skillz_user');
      const u       = JSON.parse(stored || '{}');

      // 1. Upload vidéo vers Supabase Storage
      let proofUrl = null;
      try {
        const ext      = videoUri.split('.').pop() || 'mp4';
        const path     = `proofs/${betId}_${Date.now()}.${ext}`;
        const response = await fetch(videoUri);
        const blob     = await response.blob();
        const buffer   = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('proofs')
          .upload(path, buffer, { contentType: `video/${ext}`, upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path);
          proofUrl = urlData?.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Upload vidéo échoué (non bloquant):', uploadErr);
      }

      // 2. Mettre à jour le bet avec la preuve + status pending_validation
      const { error: betError } = await supabase
        .from('bets')
        .update({
          status:     'pending_validation',
          proof_url:  proofUrl,
          proof_time: timer,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', betId);

      if (betError) throw betError;

      // 3. Enregistrer une notification pour l'admin
      await supabase.from('admin_validations').insert({
        bet_id:       betId,
        user_id:      u.id,
        game_key:     gameKey,
        defi_nom:     defi?.nom,
        defi_cond:    defi?.cond,
        mise,
        cote,
        gain_potentiel: gain,
        proof_url:    proofUrl,
        proof_duration: timer,
        status:       'pending',
      }).maybeSingle(); // maybeSingle car la table peut ne pas exister encore

      setPhase('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 4. Naviguer vers Result après 1.5s
      setTimeout(() => {
        navigation.replace('Result', {
          betId,
          defi,
          gameKey,
          mise,
          cote,
          gain,
          user: u,
          status: 'pending_validation',
          proofUrl,
        });
      }, 1500);

    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', e.message || 'Impossible de soumettre la preuve.');
      setPhase('preview');
    } finally {
      setUploading(false);
    }
  };

  /* ── Abandon ── */
  const handleAbandon = () => {
    Alert.alert(
      'Abandonner ?',
      `Ta mise de ${fmt(mise)} FCFA est déjà débitée.\nElle sera perdue si tu abandonnes.`,
      [
        { text: 'Continuer le défi', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('bets').update({ status: 'loss' }).eq('id', betId);
            } catch (_) {}
            navigation.replace('Result', {
              betId, defi, gameKey, mise, cote, gain: 0,
              user, status: 'loss',
            });
          },
        },
      ]
    );
  };

  /* ── Pas de permission ── */
  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.permScreen}>
        <View style={styles.permIcon}>
          <Video size={40} color={T.gold} />
        </View>
        <Text style={styles.permTitle}>Accès requis</Text>
        <Text style={styles.permText}>
          SKILL'Z a besoin de ta caméra et du micro pour enregistrer ta performance.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestAllPermissions}>
          <Text style={styles.permBtnText}>AUTORISER L'ACCÈS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.screen, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />

      {/* ── CAMÉRA ── */}
      {(phase === 'ready' || phase === 'recording') && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="video"
        >
          {/* Overlay sombre en haut */}
          <View style={styles.topOverlay}>
            <View style={[styles.topOverlayBg]} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity style={styles.abandonBtn} onPress={handleAbandon}>
                <X size={16} color="#fff" />
                <Text style={styles.abandonText}>Abandonner</Text>
              </TouchableOpacity>

              {recording && (
                <Animated.View style={[styles.recBadge, { transform: [{ scale: recAnim }] }]}>
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>REC {formatTimer(timer)}</Text>
                </Animated.View>
              )}

              <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
                <RotateCcw size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Info défi */}
            <View style={styles.defiOverlay}>
              <View style={[styles.defiOverlayCard, { borderColor: color + '50' }]}>
                <View style={[styles.defiOverlayAccent, { backgroundColor: color }]} />
                <View style={{ padding: 14 }}>
                  <Text style={[styles.defiOverlayGame, { color }]}>
                    {game.short || gameKey?.toUpperCase()} · {palier.label?.toUpperCase()}
                  </Text>
                  <Text style={styles.defiOverlayNom}>{defi?.nom}</Text>
                  <Text style={styles.defiOverlayCond} numberOfLines={2}>{defi?.cond}</Text>
                  <View style={styles.defiOverlayFooter}>
                    <Text style={styles.defiOverlayMise}>Mise : <Text style={{ color: T.gold }}>{fmt(mise)} F</Text></Text>
                    <View style={styles.defiOverlayGain}>
                      <Trophy size={11} color={T.success} />
                      <Text style={styles.defiOverlayGainText}>+{fmt(gain)} F</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Grille viewfinder */}
          <View style={styles.viewfinderGrid} pointerEvents="none">
            <View style={styles.vfCornerTL} />
            <View style={styles.vfCornerTR} />
            <View style={styles.vfCornerBL} />
            <View style={styles.vfCornerBR} />
          </View>

          {/* Contrôles bas */}
          <View style={[styles.controls, { paddingBottom: insets.bottom + 30 }]}>
            {!recording ? (
              <TouchableOpacity style={[styles.recBtn, { borderColor: color }]} onPress={startRecording} activeOpacity={0.85}>
                <View style={[styles.recBtnInner, { backgroundColor: color }]}>
                  <Video size={28} color="#000" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.stopBtn]} onPress={stopRecording} activeOpacity={0.85}>
                <View style={styles.stopBtnInner}>
                  <Square size={28} color="#fff" fill="#fff" />
                </View>
              </TouchableOpacity>
            )}
            <Text style={styles.controlsHint}>
              {!recording ? 'Appuie pour commencer' : 'Appuie pour arrêter'}
            </Text>
          </View>
        </CameraView>
      )}

      {/* ── PREVIEW / UPLOAD ── */}
      {(phase === 'preview' || phase === 'uploading' || phase === 'done') && (
        <View style={[styles.previewScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* Header */}
          <View style={styles.previewHeader}>
            <Text style={styles.previewEyebrow}>PREUVE ENREGISTRÉE</Text>
            <Text style={styles.previewTitle}>
              {phase === 'done' ? 'Envoyé ! ✅' : 'Soumettre ta preuve'}
            </Text>
          </View>

          {/* Aperçu vidéo simulé */}
          <View style={[styles.videoPreview, { borderColor: color + '40' }]}>
            <View style={styles.videoPreviewBg} />
            <View style={styles.videoPreviewContent}>
              {phase === 'uploading' ? (
                <>
                  <ActivityIndicator color={color} size="large" />
                  <Text style={[styles.videoPreviewLabel, { color }]}>Envoi en cours...</Text>
                </>
              ) : phase === 'done' ? (
                <>
                  <CheckCircle size={48} color={T.success} />
                  <Text style={[styles.videoPreviewLabel, { color: T.success }]}>Preuve envoyée !</Text>
                </>
              ) : (
                <>
                  <Video size={48} color={color} />
                  <Text style={[styles.videoPreviewLabel, { color }]}>Vidéo enregistrée</Text>
                  <Text style={styles.videoPreviewDuration}>Durée : {formatTimer(timer)}</Text>
                </>
              )}
            </View>
          </View>

          {/* Récap défi */}
          <View style={[styles.previewDefiCard, { borderColor: color + '30' }]}>
            <View style={[styles.previewDefiAccent, { backgroundColor: color }]} />
            <View style={{ padding: 16 }}>
              <Text style={[styles.previewDefiGame, { color }]}>{game.short} · {palier.label}</Text>
              <Text style={styles.previewDefiNom}>{defi?.nom}</Text>
              <Text style={styles.previewDefiCond}>{defi?.cond}</Text>
              <View style={styles.previewDefiFooter}>
                <Text style={styles.previewDefiMise}>Mise : <Text style={{ color: T.gold, fontWeight: '700' }}>{fmt(mise)} F</Text></Text>
                <Text style={[styles.previewDefiGain, { color: T.success }]}>Gain potentiel : +{fmt(gain)} F</Text>
              </View>
            </View>
          </View>

          {/* Info validation */}
          <View style={styles.validationInfo}>
            <Shield size={14} color={T.gold} />
            <Text style={styles.validationText}>
              Ta vidéo sera examinée par l'équipe SKILL'Z dans un délai de 24h. Si ton défi est validé, <Text style={{ color: T.success }}>+{fmt(gain)} FCFA</Text> seront crédités sur ton wallet.
            </Text>
          </View>

          {/* Boutons */}
          {phase === 'preview' && (
            <View style={styles.previewBtns}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                <RotateCcw size={16} color={T.muted} />
                <Text style={styles.retakeBtnText}>Recommencer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: color, shadowColor: color }]}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Upload size={18} color="#000" />
                <Text style={styles.submitBtnText}>SOUMETTRE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  /* Permission */
  permScreen: { flex: 1, backgroundColor: '#080A0F', justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  permIcon:   { width: 80, height: 80, borderRadius: 20, backgroundColor: T.gold + '15', justifyContent: 'center', alignItems: 'center' },
  permTitle:  { fontFamily: 'Rajdhani-Bold', fontSize: 28, color: '#EEEEF5' },
  permText:   { fontFamily: 'Inter-Regular', fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 22 },
  permBtn:    { backgroundColor: T.gold, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  permBtnText:{ fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 2 },

  /* Overlay haut */
  topOverlay:   { flex: 0.6 },
  topOverlayBg: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
  },
  abandonBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,0,0,0.2)', borderWidth: 1, borderColor: T.danger + '50', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  abandonText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.danger, fontWeight: '700' },
  recBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,0,0,0.25)', borderWidth: 1, borderColor: T.danger, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  recDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: T.danger },
  recText:     { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, color: T.danger, fontWeight: '700' },
  flipBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  defiOverlay: { paddingHorizontal: 16 },
  defiOverlayCard:   { backgroundColor: 'rgba(10,12,18,0.92)', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  defiOverlayAccent: { height: 2 },
  defiOverlayGame:   { fontFamily: 'Inter-Regular', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  defiOverlayNom:    { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5', marginBottom: 4 },
  defiOverlayCond:   { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, lineHeight: 16, marginBottom: 10 },
  defiOverlayFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  defiOverlayMise:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  defiOverlayGain:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.success + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  defiOverlayGainText:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: T.success, fontWeight: '700' },

  /* Viewfinder */
  viewfinderGrid: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' },
  vfCornerTL: { position: 'absolute', top: '25%', left: 30, width: 24, height: 24, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  vfCornerTR: { position: 'absolute', top: '25%', right: 30, width: 24, height: 24, borderTopWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  vfCornerBL: { position: 'absolute', bottom: '25%', left: 30, width: 24, height: 24, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  vfCornerBR: { position: 'absolute', bottom: '25%', right: 30, width: 24, height: 24, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },

  /* Contrôles */
  controls:     { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 12 },
  controlsHint: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  recBtn:       { width: 80, height: 80, borderRadius: 40, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  recBtnInner:  { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  stopBtn:      { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: T.danger, justifyContent: 'center', alignItems: 'center' },
  stopBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.danger, justifyContent: 'center', alignItems: 'center' },

  /* Preview */
  previewScreen: { flex: 1, backgroundColor: '#080A0F', paddingHorizontal: 20 },
  orb1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: T.gaming, opacity: 0.07 },
  orb2: { position: 'absolute', bottom: 100, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: T.physique, opacity: 0.06 },

  previewHeader:  { paddingTop: 20, marginBottom: 20 },
  previewEyebrow: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  previewTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 28, color: '#EEEEF5' },

  videoPreview:        { height: 180, borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  videoPreviewBg:      { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0C10' },
  videoPreviewContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  videoPreviewLabel:   { fontFamily: 'Rajdhani-Bold', fontSize: 18, letterSpacing: 0.5 },
  videoPreviewDuration:{ fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: T.muted },

  previewDefiCard:   { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  previewDefiAccent: { height: 2 },
  previewDefiGame:   { fontFamily: 'Inter-Regular', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  previewDefiNom:    { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5', marginBottom: 4 },
  previewDefiCond:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, lineHeight: 17, marginBottom: 10 },
  previewDefiFooter: { gap: 4 },
  previewDefiMise:   { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  previewDefiGain:   { fontFamily: 'Inter-Regular', fontSize: 12, fontWeight: '700' },

  validationInfo: { flexDirection: 'row', gap: 10, backgroundColor: T.gold + '08', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: T.gold + '25', marginBottom: 20 },
  validationText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, lineHeight: 18 },

  previewBtns: { flexDirection: 'row', gap: 12 },
  retakeBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingVertical: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  retakeBtnText:{ fontFamily: 'Rajdhani-Bold', fontSize: 14, color: T.muted, letterSpacing: 1 },
  submitBtn:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 15, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  submitBtnText:{ fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#000', letterSpacing: 2 },
});