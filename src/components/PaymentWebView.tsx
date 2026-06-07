// src/components/PaymentWebView.tsx
// @ts-nocheck
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ActivityIndicator, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { X, RefreshCw, Shield } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';

interface PaymentWebViewProps {
  visible:      boolean;
  sessionUrl:   string;
  amount:       number;
  onSuccess:    () => void;
  onCancel:     () => void;
  onClose:      () => void;
}

export default function PaymentWebView({
  visible, sessionUrl, amount,
  onSuccess, onCancel, onClose,
}: PaymentWebViewProps) {
  const [loading,  setLoading]  = useState(true);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleNavigationChange = (navState: any) => {
    const url = navState.url || '';
    console.log('WebView URL:', url);

    // Détecter l'URL de succès FAROTY
    if (
      url.includes('skillz.app/payment/success') ||
      url.includes('success=true') ||
      url.includes('/payment/success')
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      return;
    }

    // Détecter l'URL d'annulation
    if (
      url.includes('skillz.app/payment/cancel') ||
      url.includes('cancel=true') ||
      url.includes('/payment/cancel')
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCancel();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Paiement FAROTY</Text>
            <Text style={styles.headerAmount}>{fmt(amount)} FCFA</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.secureTag}>
              <Shield size={11} color={T.success} />
              <Text style={styles.secureText}>Sécurisé</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={T.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barre de progression */}
        {loading && (
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}

        {/* WebView */}
        {sessionUrl ? (
          <WebView
            source={{ uri: sessionUrl }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={()  => setLoading(false)}
            onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
            onNavigationStateChange={handleNavigationChange}
            onError={(e) => {
              console.error('WebView error:', e.nativeEvent);
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={T.gold} size="large" />
                <Text style={styles.loadingText}>Connexion à FAROTY...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>URL de paiement invalide.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onClose}>
              <RefreshCw size={16} color={T.gold} />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info bas */}
        <View style={styles.footer}>
          <Shield size={12} color={T.muted} />
          <Text style={styles.footerText}>
            Paiement traité par FAROTY · Données sécurisées SSL
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#080A0F' },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle:  { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#EEEEF5' },
  headerAmount: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: T.gold, fontWeight: '700' },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secureTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.success + '12', borderWidth: 1, borderColor: T.success + '30', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  secureText:   { fontFamily: 'Inter-Regular', fontSize: 10, color: T.success, fontWeight: '700' },
  closeBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  progressBar:  { height: 2, backgroundColor: 'rgba(255,255,255,0.05)' },
  progressFill: { height: '100%', backgroundColor: T.gold },
  webview:      { flex: 1 },
  loadingOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080A0F', gap: 16 },
  loadingText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted },
  errorState:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText:    { fontFamily: 'Inter-Regular', fontSize: 14, color: T.danger },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.gold + '15', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  retryText:    { fontFamily: 'Inter-Regular', fontSize: 13, color: T.gold, fontWeight: '700' },
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  footerText:   { fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted },
});