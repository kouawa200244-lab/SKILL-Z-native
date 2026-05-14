// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Gamepad2, Zap } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { navigate } from '../utils/navigationRef';

export default function GamesScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>🎮 GAMING</Text>
        <Text style={styles.screenSubtitle}>Choisis un jeu pour lancer un défi</Text>
        <View style={styles.card}>
          <Gamepad2 size={48} color={T.gaming} />
          <Text style={styles.cardText}>FIFA, PES, NBA 2K, NFS</Text>
          <Text style={styles.cardSubtext}>Sélectionne ton jeu et ton défi</Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: T.gaming }]}
          onPress={() => navigate('GameSelect')}
        >
          <Zap size={20} color={T.bg} />
          <Text style={styles.ctaText}>NOUVEAU DÉFI GAMING</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: T.bg },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120, alignItems: 'center' },
  screenTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 32, color: T.text, letterSpacing: 3, marginBottom: 8 },
  screenSubtitle:{ fontFamily: 'Inter-Regular', fontSize: 14, color: T.muted, marginBottom: 32 },
  card:          { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 32, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24, width: '100%' },
  cardText:      { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: T.text, marginTop: 16, letterSpacing: 1 },
  cardSubtext:   { fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted, marginTop: 6 },
  ctaButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 60, width: '100%' },
  ctaText:       { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: T.bg, letterSpacing: 2 },
});