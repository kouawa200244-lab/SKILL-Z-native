// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Trophy, Skull, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { navigate } from '../utils/navigationRef';
import { supabase } from '../supabaseClient';
import { formatPerformance } from '../utils/deepLinking';

const C = {
  bg:     '#0B0E13',
  card:   '#161B22',
  violet: '#A259FF',
  text:   '#F5F7FA',
  muted:  '#8B949E',
  success:'#2ECC71',
  danger: '#E74C3C',
  gold:   '#F0C040',
};

export default function ViralResultScreen() {
  const insets = useSafeAreaInsets();
  const route  = useRoute();
  const {
    viralDefiId, challengerPerf, creatorPerf,
    defi, mise, user,
  } = route.params || {};

  const [result,  setResult]  = useState(null); // 'win' | 'loss' | 'tie'
  const [loading, setLoading] = useState(true);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    resolveResult();
  }, []);

  const resolveResult = async () => {
    // Comparer les performances
    const isPhysique = defi?.gameKey === 'physique';
    let outcome;

    if (isPhysique) {
      // Plus de reps = gagnant
      const myReps      = challengerPerf?.reps || 0;
      const creatorReps = creatorPerf?.reps     || 0;
      outcome = myReps > creatorReps ? 'win' : myReps < creatorReps ? 'loss' : 'tie';
    } else {
      // Moins de temps = gagnant
      const myTime      = challengerPerf?.time || 9999;
      const creatorTime = creatorPerf?.time     || 9999;
      outcome = myTime < creatorTime ? 'win' : myTime > creatorTime ? 'loss' : 'tie';
    }

    setResult(outcome);

    // Sauvegarder résultat + créditer si gagné
    if (user?.id) {
      const winnerId = outcome === 'win'
        ? user.id
        : outcome === 'loss'
          ? null // créateur gagne — à gérer côté admin ou trigger
          : null;

      await supabase
        .from('viral_defis')
        .update({
          winner_id: winnerId,
          status:    'completed',
        })
        .eq('id', viralDefiId);

      // Créditer le gagnant
      if (outcome === 'win') {
        const gain = Math.round(mise * 2 * 0.9);
        const { data: wallet } = await supabase
          .from('wallets').select('balance').eq('user_id', user.id).single();
        if (wallet) {
          await supabase.from('wallets')
            .update({ balance: wallet.balance + gain })
            .eq('user_id', user.id);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    setLoading(false);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={C.violet} size="large" />
        <Text style={styles.loadingText}>Calcul du résultat...</Text>
      </View>
    );
  }

  const isWin  = result === 'win';
  const isTie  = result === 'tie';
  const gain   = Math.round((mise || 0) * 2 * 0.9);
  const color  = isWin ? C.success : isTie ? C.gold : C.danger;
  const emoji  = isWin ? '🏆' : isTie ? '🤝' : '💀';
  const title  = isWin ? 'VICTOIRE !' : isTie ? 'ÉGALITÉ' : 'DÉFAITE';

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <View style={[styles.orb, { backgroundColor: color }]} />

      <View style={styles.content}>
        {/* Icône résultat */}
        <Animated.View style={[styles.resultIcon, { backgroundColor: color + '15', borderColor: color + '40', transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.resultEmoji}>{emoji}</Text>
        </Animated.View>

        <Text style={[styles.resultTitle, { color }]}>{title}</Text>

        {/* Perfs comparées */}
        <View style={styles.perfCompare}>
          <View style={styles.perfBox}>
            <Text style={styles.perfBoxLabel}>Adversaire</Text>
            <Text style={styles.perfBoxValue}>{formatPerformance(creatorPerf)}</Text>
          </View>
          <View style={styles.perfVs}>
            <Text style={styles.perfVsText}>VS</Text>
          </View>
          <View style={[styles.perfBox, isWin && { borderColor: C.success + '50', backgroundColor: C.success + '08' }]}>
            <Text style={styles.perfBoxLabel}>Toi</Text>
            <Text style={[styles.perfBoxValue, isWin && { color: C.success }]}>
              {formatPerformance(challengerPerf)}
            </Text>
          </View>
        </View>

        {/* Gain */}
        {isWin && (
          <View style={styles.gainCard}>
            <Trophy size={16} color={C.gold} />
            <Text style={styles.gainLabel}>Gain crédité</Text>
            <Text style={styles.gainValue}>+{gain.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        )}

        {/* Boutons */}
        <View style={styles.btns}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: color }]}
            onPress={() => navigate('MainTabs')}
          >
            <Text style={styles.primaryBtnText}>RETOUR À L'ACCUEIL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  content:      { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', gap: 20 },
  loadingScreen:{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText:  { fontFamily: 'Inter-Regular', fontSize: 14, color: C.muted },
  orb: { position: 'absolute', top: -100, left: W / 2 - 100, width: 200, height: 200, borderRadius: 100, opacity: 0.12 },

  resultIcon:  { width: 100, height: 100, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  resultEmoji: { fontSize: 48 },
  resultTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 42, letterSpacing: 3 },

  perfCompare: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  perfBox:     { flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14, alignItems: 'center', gap: 6 },
  perfBoxLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, fontWeight: '700' },
  perfBoxValue:{ fontFamily: 'Rajdhani-Bold', fontSize: 22, color: C.text },
  perfVs:      { width: 36, alignItems: 'center' },
  perfVsText:  { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.muted, letterSpacing: 2 },

  gainCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.gold + '10', borderRadius: 12, borderWidth: 1, borderColor: C.gold + '30', padding: 14, width: '100%' },
  gainLabel:   { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted, flex: 1 },
  gainValue:   { fontFamily: 'Rajdhani-Bold', fontSize: 20, color: C.gold },

  btns:        { width: '100%', gap: 10 },
  primaryBtn:  { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#fff', letterSpacing: 2 },
});

const { width: W } = require('react-native').Dimensions.get('window');