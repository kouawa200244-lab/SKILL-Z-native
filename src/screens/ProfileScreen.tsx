import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { User, Trophy, Timer, LogOut } from 'lucide-react-native';
import { T } from '../utils/designTokens';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <User size={48} color={T.gold} />
        </View>
        <Text style={styles.profileName}>Joueur SKILL'Z</Text>
        <Text style={styles.profileRank}>RANG OR II</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Trophy size={20} color={T.success} />
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Victoires</Text>
          </View>
          <View style={styles.statBox}>
            <Timer size={20} color={T.gaming} />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Défis en cours</Text>
          </View>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn}>
          <LogOut size={18} color={T.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120, alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.gold + '15', borderWidth: 2, borderColor: T.gold,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  profileName: { fontFamily: T.fontTitle, fontSize: 28, color: T.text, letterSpacing: 2 },
  profileRank: {
    fontFamily: T.fontBody, fontSize: 14, color: T.gold, fontWeight: '600',
    marginBottom: 32, backgroundColor: T.gold + '15',
    paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, overflow: 'hidden',
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32, width: '100%' },
  statBox: {
    flex: 1, backgroundColor: T.card, borderRadius: T.radius,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: T.border,
  },
  statValue: { fontFamily: T.fontMono, fontSize: 24, fontWeight: '700', color: T.text, marginTop: 8 },
  statLabel: { fontFamily: T.fontBody, fontSize: 11, color: T.muted, marginTop: 4 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: T.danger + '50', borderRadius: T.radiusSm,
    padding: 14, width: '100%',
  },
  logoutText: { fontFamily: T.fontTitle, fontSize: 16, color: T.danger, letterSpacing: 1 },
});