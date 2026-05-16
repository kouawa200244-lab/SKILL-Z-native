// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Trophy, X, Zap, Users,
  CheckCircle, XCircle, Shield, Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helper';
import { submitResult } from '../utils/duelService';
import { supabase } from '../utils/SupabaseClient';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DuelActiveScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();
  const { duel, user } = route.params || {};

  const [submitted, setSubmitted] = useState(false);
  const [myResult,  setMyResult]  = useState(null); // 'win' | 'loss'
  const [loading,   setLoading]   = useState(false);
  const [waitingOther, setWaitingOther] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();

    // Pulse sur le VS
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Realtime — écoute quand l'adversaire soumet aussi
    const channel = supabase
      .channel(`duel_active_${duel?.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'duels', filter: `id=eq.${duel?.id}`,
      }, (payload) => {
        const updated = payload.new;
        if (updated.status === 'completed' || updated.status === 'disputed') {
          navigation.replace('Result', { duel: updated, user });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleSubmit = async (result) => {
    Haptics.impactAsync(
      result === 'win'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium
    );

    Alert.alert(
      result === 'win' ? '🏆 Tu as gagné ?' : '💀 Tu as perdu ?',
      'Confirme ton résultat. Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: result === 'win' ? 'default' : 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const stored = await AsyncStorage.getItem('skillz_user');
              const u      = JSON.parse(stored || '{}');

              await submitResult({
                duelId: duel.id,
                userId: u.id,
                result,
                score: '',
                proof: '',
              });

              setMyResult(result);
              setSubmitted(true);
              setWaitingOther(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Erreur', e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const isCreator  = user?.id === duel?.creator_id;
  const myName     = isCreator ? duel?.creator_username  : duel?.opponent_username;
  const otherName  = isCreator ? duel?.opponent_username : duel?.creator_username;
  const gain       = Math.round((duel?.mise || 0) * 2 * 0.9);

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top, opacity: fadeAnim }]}>
      {/* Orbes */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.eyebrow}>DUEL EN COURS</Text>
            <Text style={styles.title}>Combat !</Text>
          </View>
          <View style={[styles.liveBadge]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </Animated.View>

        {/* ── JOUEURS VS ── */}
        <Animated.View style={[styles.vsSection, { transform: [{ translateY: slideAnim }] }]}>
          {/* Joueur 1 */}
          <View style={styles.playerBox}>
            <View style={[styles.playerAvatar, { borderColor: T.gaming }]}>
              <Text style={styles.playerAvatarText}>
                {myName?.[0]?.toUpperCase() || 'M'}
              </Text>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{myName || 'Moi'}</Text>
            <Text style={[styles.playerTag, { color: T.gaming }]}>MOI</Text>
          </View>

          {/* VS central */}
          <Animated.View style={[styles.vsCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.vsText}>VS</Text>
          </Animated.View>

          {/* Joueur 2 */}
          <View style={styles.playerBox}>
            <View style={[styles.playerAvatar, { borderColor: T.physique }]}>
              <Text style={styles.playerAvatarText}>
                {otherName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{otherName || 'Adversaire'}</Text>
            <Text style={[styles.playerTag, { color: T.physique }]}>ADV</Text>
          </View>
        </Animated.View>

        {/* ── DÉFI ── */}
        <View style={styles.defiCard}>
          <View style={styles.defiAccent} />
          <View style={styles.defiInner}>
            <Text style={styles.defiLabel}>DÉFI EN COURS</Text>
            <Text style={styles.defiNom}>{duel?.defi_nom}</Text>
            <Text style={styles.defiCond}>{duel?.defi_cond}</Text>
            <View style={styles.defiFooter}>
              <View style={styles.defiMise}>
                <Text style={styles.defiMiseLabel}>Mise :</Text>
                <Text style={styles.defiMiseValue}>{fmt(duel?.mise || 0)} F</Text>
              </View>
              <View style={styles.defiGain}>
                <Trophy size={12} color={T.success} />
                <Text style={styles.defiGainValue}>+{fmt(gain)} F</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── ÉTAT SOUMIS ── */}
        {submitted ? (
          <View style={styles.submittedCard}>
            <View style={[
              styles.submittedIcon,
              { backgroundColor: myResult === 'win' ? T.success + '15' : T.danger + '15' },
            ]}>
              {myResult === 'win'
                ? <CheckCircle size={32} color={T.success} />
                : <XCircle    size={32} color={T.danger}  />
              }
            </View>
            <Text style={styles.submittedTitle}>
              {myResult === 'win' ? 'Victoire déclarée !' : 'Défaite déclarée'}
            </Text>
            <Text style={styles.submittedSub}>
              En attente du résultat de {otherName || 'l\'adversaire'}...
            </Text>
            <View style={styles.submittedLoader}>
              <ActivityIndicator color={T.gaming} size="small" />
              <Text style={styles.submittedLoaderText}>Résolution en cours</Text>
            </View>
          </View>
        ) : (
          /* ── BOUTONS RÉSULTAT ── */
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>DÉCLARE TON RÉSULTAT</Text>
            <Text style={styles.resultSub}>
              Sois honnête — les litiges sont tranchés par l'admin SKILL'Z
            </Text>

            {loading ? (
              <ActivityIndicator color={T.gold} size="large" style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.resultBtns}>
                {/* Victoire */}
                <TouchableOpacity
                  style={styles.winBtn}
                  onPress={() => handleSubmit('win')}
                  activeOpacity={0.85}
                >
                  <View style={styles.winBtnGlow} />
                  <Trophy size={24} color="#000" />
                  <Text style={styles.winBtnText}>J'AI GAGNÉ</Text>
                  <Text style={styles.winBtnAmount}>+{fmt(gain)} F</Text>
                </TouchableOpacity>

                {/* Défaite */}
                <TouchableOpacity
                  style={styles.lossBtn}
                  onPress={() => handleSubmit('loss')}
                  activeOpacity={0.85}
                >
                  <X size={20} color={T.danger} />
                  <Text style={styles.lossBtnText}>J'AI PERDU</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── RÈGLES ── */}
        <View style={styles.rulesCard}>
          <Shield size={14} color={T.muted} />
          <Text style={styles.rulesText}>
            Les deux joueurs doivent déclarer leur résultat. En cas de conflit, l'admin tranche sous 24h.
          </Text>
        </View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#080A0F' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  orb1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: T.gaming,   opacity: 0.08 },
  orb2: { position: 'absolute', bottom: 100, left: -60, width: 160, height: 160, borderRadius: 80,  backgroundColor: T.physique, opacity: 0.07 },

  /* Header */
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, marginBottom: 28 },
  eyebrow:   { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  title:     { fontFamily: 'Rajdhani-Bold', fontSize: 36, color: '#EEEEF5' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.danger + '20', borderWidth: 1, borderColor: T.danger + '50', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: T.danger },
  liveText:  { fontFamily: 'Inter-Regular', fontSize: 11, color: T.danger, fontWeight: '800', letterSpacing: 1 },

  /* VS */
  vsSection:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  playerBox:   { flex: 1, alignItems: 'center', gap: 8 },
  playerAvatar:{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { fontFamily: 'Rajdhani-Bold', fontSize: 26, color: '#EEEEF5' },
  playerName:  { fontFamily: 'Rajdhani-Bold', fontSize: 15, color: '#EEEEF5', textAlign: 'center' },
  playerTag:   { fontFamily: 'Inter-Regular', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  vsCircle:    { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0F1219', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  vsText:      { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: T.muted, letterSpacing: 2 },

  /* Défi card */
  defiCard:  { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: T.gaming + '30', overflow: 'hidden', marginBottom: 20 },
  defiAccent:{ height: 2, backgroundColor: T.gaming },
  defiInner: { padding: 16 },
  defiLabel: { fontFamily: 'Inter-Regular', fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  defiNom:   { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#EEEEF5', marginBottom: 6 },
  defiCond:  { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, lineHeight: 18, marginBottom: 12 },
  defiFooter:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  defiMise:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  defiMiseLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },
  defiMiseValue: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: T.gold, fontWeight: '700' },
  defiGain:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.success + '12', borderWidth: 1, borderColor: T.success + '30', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  defiGainValue: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, color: T.success, fontWeight: '700' },

  /* Résultat */
  resultSection: { marginBottom: 20 },
  resultTitle:   { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 6, textAlign: 'center' },
  resultSub:     { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  resultBtns:    { gap: 12 },

  winBtn: {
    backgroundColor: T.gold, borderRadius: 16,
    paddingVertical: 20, alignItems: 'center',
    gap: 4, overflow: 'hidden', position: 'relative',
    shadowColor: T.gold, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
  },
  winBtnGlow:   { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)' },
  winBtnText:   { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: '#000', letterSpacing: 2 },
  winBtnAmount: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: 'rgba(0,0,0,0.6)', fontWeight: '700' },

  lossBtn:     { backgroundColor: T.danger + '10', borderWidth: 1, borderColor: T.danger + '35', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  lossBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: T.danger, letterSpacing: 1 },

  /* Soumis */
  submittedCard:   { backgroundColor: '#0F1219', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 28, alignItems: 'center', gap: 12, marginBottom: 20 },
  submittedIcon:   { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  submittedTitle:  { fontFamily: 'Rajdhani-Bold', fontSize: 22, color: '#EEEEF5' },
  submittedSub:    { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, textAlign: 'center' },
  submittedLoader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  submittedLoaderText: { fontFamily: 'Inter-Regular', fontSize: 12, color: T.muted },

  /* Règles */
  rulesCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  rulesText: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, flex: 1, lineHeight: 17 },
});