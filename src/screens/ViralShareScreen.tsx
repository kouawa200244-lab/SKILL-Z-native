// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Share, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import {
  Share2, MessageCircle, Copy, Check,
  Trophy, Clock, Zap, Link,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { navigate } from '../utils/navigationRef';
import {
  generateDefiUrl,
  generateWhatsAppMessage,
  shareViaWhatsApp,
  formatPerformance,
} from '../utils/deepLinking';
import * as Clipboard from 'expo-clipboard';

const { width: W } = Dimensions.get('window');

const C = {
  bg:     '#0B0E13',
  card:   '#161B22',
  violet: '#A259FF',
  vDim:   'rgba(162,89,255,0.12)',
  text:   '#F5F7FA',
  muted:  '#8B949E',
  success:'#2ECC71',
  gold:   '#F0C040',
};

export default function ViralShareScreen() {
  const insets    = useSafeAreaInsets();
  const route     = useRoute();
  const { viralDefi, performance, defi, user } = route.params || {};

  const [copied,  setCopied]  = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const shareUrl = generateDefiUrl(viralDefi?.id);
  const perfStr  = formatPerformance(performance);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }),
    ]).start();

    // Glow pulsant sur QR
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
    ])).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });

  const handleWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = generateWhatsAppMessage({
      defiId:      viralDefi?.id,
      creatorName: user?.username || 'Un joueur',
      defiNom:     defi?.nom,
      mise:        viralDefi?.mise,
      performance,
    });
    await shareViaWhatsApp(msg);
  };

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: generateWhatsAppMessage({
        defiId:      viralDefi?.id,
        creatorName: user?.username,
        defiNom:     defi?.nom,
        mise:        viralDefi?.mise,
        performance,
      }),
      url: shareUrl,
    });
  };

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <View style={styles.orb} />

      <View style={styles.scrollContent}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>DÉFI VIRAL</Text>
          <Text style={styles.headerTitle}>Partage ton défi !</Text>
        </View>

        {/* ── PERF BADGE ── */}
        <Animated.View style={[styles.perfBadge, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.perfBadgeOrb} />
          <Trophy size={20} color={C.gold} />
          <View>
            <Text style={styles.perfBadgeLabel}>TA PERFORMANCE</Text>
            <Text style={styles.perfBadgeValue}>{perfStr}</Text>
          </View>
          <View style={styles.perfBadgeCote}>
            <Zap size={10} color={C.violet} />
            <Text style={styles.perfBadgeCoteText}>×{defi?.cote?.toFixed(2)}</Text>
          </View>
        </Animated.View>

        {/* ── DÉFI INFO ── */}
        <View style={styles.defiCard}>
          <Text style={styles.defiCardNom}>{defi?.nom}</Text>
          <Text style={styles.defiCardCond} numberOfLines={2}>{defi?.cond}</Text>
          <View style={styles.defiCardMise}>
            <Text style={styles.defiCardMiseLabel}>Mise :</Text>
            <Text style={styles.defiCardMiseValue}>
              {viralDefi?.mise?.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        </View>

        {/* ── QR CODE ── */}
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>QR CODE</Text>
          <View style={styles.qrWrap}>
            <Animated.View style={[styles.qrGlow, { opacity: glowOpacity }]} />
            <View style={styles.qrInner}>
              <QRCode
                value={shareUrl}
                size={160}
                color="#FFFFFF"
                backgroundColor="#0B0E13"
              />
            </View>
          </View>
          <Text style={styles.qrHint}>Scanne pour relever le défi</Text>
        </View>

        {/* ── BOUTONS PARTAGE ── */}
        <View style={styles.shareButtons}>
          {/* WhatsApp */}
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.88}>
            <MessageCircle size={20} color="#000" />
            <Text style={styles.whatsappBtnText}>PARTAGER VIA WHATSAPP</Text>
          </TouchableOpacity>

          {/* Autres */}
          <View style={styles.shareRow}>
            <TouchableOpacity style={styles.shareSecBtn} onPress={handleCopyLink} activeOpacity={0.85}>
              {copied
                ? <Check size={16} color={C.success} />
                : <Copy  size={16} color={C.violet}  />
              }
              <Text style={[styles.shareSecBtnText, copied && { color: C.success }]}>
                {copied ? 'Copié !' : 'Copier le lien'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareSecBtn} onPress={handleShare} activeOpacity={0.85}>
              <Share2 size={16} color={C.violet} />
              <Text style={styles.shareSecBtnText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Retour accueil */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigate('MainTabs')}
        >
          <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  scrollContent:{ paddingHorizontal: 20, paddingBottom: 40 },
  orb: { position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: C.violet, opacity: 0.07 },

  header:      { paddingTop: 16, marginBottom: 20 },
  headerSub:   { fontFamily: 'Inter-Regular', fontSize: 9, color: C.violet, fontWeight: '800', letterSpacing: 3, marginBottom: 4 },
  headerTitle: { fontFamily: 'Rajdhani-Bold', fontSize: 30, color: C.text },

  perfBadge:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.gold + '10', borderRadius: 14, borderWidth: 1, borderColor: C.gold + '30', padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden' },
  perfBadgeOrb:  { position: 'absolute', right: -30, top: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: C.gold, opacity: 0.08 },
  perfBadgeLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1 },
  perfBadgeValue:{ fontFamily: 'Rajdhani-Bold', fontSize: 24, color: C.gold },
  perfBadgeCote: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3 },
  perfBadgeCoteText: { fontFamily: 'Rajdhani-Bold', fontSize: 14, color: C.violet },

  defiCard:      { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, marginBottom: 20, gap: 8 },
  defiCardNom:   { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: C.text },
  defiCardCond:  { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted, lineHeight: 17 },
  defiCardMise:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  defiCardMiseLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted },
  defiCardMiseValue: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.gold },

  qrSection: { alignItems: 'center', marginBottom: 24 },
  qrLabel:   { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },
  qrWrap:    { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  qrGlow:    { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.violet },
  qrInner:   { backgroundColor: '#0B0E13', borderRadius: 16, borderWidth: 2, borderColor: C.violet + '40', padding: 16 },
  qrHint:    { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted, marginTop: 12 },

  shareButtons: { gap: 10, marginBottom: 16 },
  whatsappBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 16, shadowColor: '#25D366', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  whatsappBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 1.5 },
  shareRow:     { flexDirection: 'row', gap: 10 },
  shareSecBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.vDim, paddingVertical: 13 },
  shareSecBtnText: { fontFamily: 'Inter-Regular', fontSize: 13, color: C.violet, fontWeight: '600' },

  homeBtn:     { alignItems: 'center', paddingVertical: 14 },
  homeBtnText: { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted },
});