// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Trophy, Skull } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { useSession } from '../context/SessionContext';

export default function HistoryScreen() {
  const { history } = useSession();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>HISTORIQUE DES DÉFIS</Text>

      {history.length === 0 ? (
        <Text style={styles.empty}>Aucun défi joué pour le moment.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {history.map((h, i) => {
            const win = h.outcome === 'win';
            return (
              <View key={i} style={styles.item}>
                <View style={styles.itemLeft}>
                  {win ? <Trophy size={16} color={T.success} /> : <Skull size={16} color={T.danger} />}
                  <Text style={styles.itemName}>{h.defi?.nom || 'Défi inconnu'}</Text>
                </View>
                <Text style={[styles.itemAmount, { color: win ? T.success : T.danger }]}>
                  {win ? '+' : '-'}{fmt(win ? Math.round(h.mise * h.cote) : h.mise)} F
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg, paddingTop: 60, paddingHorizontal: 16 },
  title: { fontFamily: T.fontTitle, fontSize: 24, color: T.text, letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  empty: { fontFamily: T.fontBody, color: T.muted, textAlign: 'center', marginTop: 40 },
  list: { paddingBottom: 100 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: T.card, borderRadius: 12, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: T.border,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemName: { fontFamily: T.fontTitle, fontSize: 16, color: T.text },
  itemAmount: { fontFamily: T.fontMono, fontSize: 16, fontWeight: '700', marginLeft: 12 },
});