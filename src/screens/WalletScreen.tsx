import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Coins, ArrowDown, ArrowUp, CreditCard, TrendingUp, TrendingDown } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';

export default function WalletScreen({ balance = 5000 }) {
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Barre de titre */}
      <View style={styles.titleBar}>
        <Text style={styles.appName}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Carte bancaire */}
        <View style={styles.creditCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Coins size={24} color={T.gold} />
            <Text style={{ fontFamily: T.fontBody, fontSize: 12, color: T.muted }}>SKILL'Z</Text>
          </View>
          <Text style={styles.cardBalance}>{fmt(balance)} FCFA</Text>
          <Text style={styles.cardLabel}>Solde disponible</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.cardButton}>
              <ArrowDown size={18} color={T.gold} />
              <Text style={styles.cardButtonText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButton}>
              <ArrowUp size={18} color={T.gold} />
              <Text style={styles.cardButtonText}>Retirer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dernières transactions */}
        <Text style={styles.sectionTitle}>DERNIÈRES TRANSACTIONS</Text>
        {[
          { label: 'Duel FIFA vs @Bolo', amount: '+2 000 F', color: T.success, icon: TrendingUp },
          { label: 'Défi Solo PES', amount: '-500 F', color: T.danger, icon: TrendingDown },
          { label: 'Bonus de bienvenue', amount: '+1 000 F', color: T.gold, icon: CreditCard },
        ].map((tx, i) => (
          <View key={i} style={styles.txRow}>
            <tx.icon size={18} color={tx.color} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.txLabel}>{tx.label}</Text>
              <Text style={styles.txDate}>Aujourd'hui</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.color }]}>{tx.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderColor: T.border,
  },
  appName: {
    fontFamily: T.fontTitle,
    fontSize: 24,
    color: T.gold,
    letterSpacing: 3,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  creditCard: {
    margin: 16,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 24,
  },
  cardBalance: {
    fontFamily: T.fontMono,
    fontSize: 34,
    fontWeight: '700',
    color: T.gold,
    marginBottom: 4,
  },
  cardLabel: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.muted,
    marginBottom: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    gap: 6,
  },
  cardButtonText: {
    fontFamily: T.fontTitle,
    fontSize: 14,
    color: T.text,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.muted,
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: T.border,
  },
  txLabel: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.text,
  },
  txDate: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.muted,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: T.fontMono,
    fontSize: 14,
    fontWeight: '600',
  },
});