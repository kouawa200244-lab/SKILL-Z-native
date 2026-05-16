// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { ArrowLeft, User, DollarSign, Shield, Zap, Gamepad2, Dumbbell, Swords } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { DUEL_TYPES } from '../constants/duelTypes';
import { T } from '../utils/designTokens';
import { fmt, filet as calcFilet } from '../utils/helper';
import CoteDisplay from '../components/CoteDisplay';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';

export default function DuoConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { addDuoToQueue } = useSession();

  const gameKey = route.params?.gameKey || 'fifa';
  const defi = route.params?.defi;

  const [player1, setPlayer1] = useState('');
  const [mise, setMise] = useState(1000);
  const [duelType, setDuelType] = useState('face_a_face');
  const [handicap, setHandicap] = useState(3);
  const [drawRule, setDrawRule] = useState('skillbet');

  if (!defi) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Aucun défi sélectionné</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const g = GAMES[gameKey];
  const Icon = gameKey === 'physique' ? Dumbbell : Gamepad2;
  const pc = PALIERS[defi.p] || {};
  const gain = mise * 2; // le gagnant prend le pot total
  const ok = player1.trim().length > 0;

  const availableTypes = Object.entries(DUEL_TYPES).filter(
    ([, t]) => !t.games || t.games.includes(gameKey)
  );

  const handleSubmit = () => {
    if (!ok) return;
    addDuoToQueue({
      player1: player1.trim(),
      mise,
      gameKey,
      defi,
      duelType,
      handicap,
      drawRule,
    });
    navigation.navigate('DuoLobby');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={T.muted} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        {/* En-tête du défi */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon size={24} color={g.color} style={{ marginRight: 8 }} />
            <Text style={[styles.gameLabel, { color: g.color }]}>{g.label}</Text>
            <View style={[styles.pill, { backgroundColor: pc.dim, borderColor: pc.color + '30', marginLeft: 12 }]}>
              <Text style={[styles.pillText, { color: pc.color }]}>{pc.label?.toUpperCase()}</Text>
            </View>
            <View style={{ marginLeft: 12, backgroundColor: '#3b82f620', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ fontFamily: T.fontBody, fontSize: 12, color: '#60A5FA' }}>DUEL</Text>
            </View>
          </View>
          <Text style={styles.defiName}>{defi.nom}</Text>
          <Text style={styles.defiCond}>{defi.cond}</Text>
          <CoteDisplay cote={2} size={22} />
        </View>

        {/* Joueur 1 */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <User size={16} color={T.muted} />
            <Text style={styles.label}>TON NOM (JOUEUR 1)</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Brael..."
            placeholderTextColor={T.muted}
            value={player1}
            onChangeText={setPlayer1}
          />
        </View>

        {/* Type de duel */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Swords size={16} color={T.muted} />
            <Text style={styles.label}>TYPE DE DUEL</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {availableTypes.map(([key, t]) => {
              const active = duelType === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeBtn, active && { borderColor: T.gold, backgroundColor: T.gold + '18' }]}
                  onPress={() => setDuelType(key)}
                >
                  <Text style={[styles.typeBtnText, active && { color: T.gold }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mise */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <DollarSign size={16} color={T.muted} />
            <Text style={styles.label}>MISE PAR JOUEUR (FCFA)</Text>
            <Text style={styles.miseValue}>{fmt(mise)} F</Text>
          </View>
          <TextInput
            style={styles.sliderInput}
            keyboardType="numeric"
            value={String(mise)}
            onChangeText={(txt) => {
              const val = Number(txt);
              if (!isNaN(val) && val >= 200 && val <= 20000) setMise(val);
            }}
          />
        </View>

        {/* Récapitulatif */}
        <View style={styles.recapCard}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Pot total</Text>
            <Text style={styles.recapValue}>{fmt(mise * 2)} F</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: T.success }]}>Gain si victoire</Text>
            <Text style={[styles.recapValue, { color: T.success }]}>+{fmt(gain)} F</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: T.danger }]}>Si personne ne réussit</Text>
            <Text style={[styles.recapValue, { color: T.danger }]}>SKILL'Z garde tout</Text>
          </View>
        </View>

        {/* Bouton */}
        <TouchableOpacity
          style={[styles.submitButton, !ok && styles.submitButtonDisabled]}
          disabled={!ok}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Zap size={20} color={ok ? T.textInverse : T.muted} />
          <Text style={[styles.submitText, !ok && { color: T.muted }]}>CRÉER LE DUEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontFamily: T.fontBody, fontSize: 14, color: T.muted },
  headerCard: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 18, marginBottom: 28 },
  gameLabel: { fontFamily: T.fontTitle, fontSize: 18, letterSpacing: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  pillText: { fontFamily: T.fontBody, fontSize: 11, fontWeight: '600' },
  defiName: { fontFamily: T.fontTitle, fontSize: 24, color: T.text, letterSpacing: 1, marginBottom: 8 },
  defiCond: { fontFamily: T.fontBody, fontSize: 14, color: T.muted, lineHeight: 22 },
  inputGroup: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label: { fontFamily: T.fontBody, fontSize: 13, color: T.muted, letterSpacing: 1 },
  textInput: { backgroundColor: T.card, borderRadius: 10, borderWidth: 1, borderColor: T.border, paddingHorizontal: 16, paddingVertical: 14, fontFamily: T.fontBody, fontSize: 16, color: T.text },
  miseValue: { fontFamily: T.fontMono, fontSize: 20, fontWeight: '700', color: T.gold, marginLeft: 'auto' },
  sliderInput: { backgroundColor: T.card, borderRadius: 8, borderWidth: 1, borderColor: T.border, paddingHorizontal: 12, paddingVertical: 10, fontFamily: T.fontMono, fontSize: 18, color: T.text, textAlign: 'center' },
  recapCard: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 18, marginBottom: 28 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recapLabel: { fontFamily: T.fontBody, fontSize: 14, color: T.muted },
  recapValue: { fontFamily: T.fontMono, fontSize: 16, fontWeight: '700', color: T.text },
  submitButton: { backgroundColor: T.gold, borderRadius: 14, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitButtonDisabled: { backgroundColor: T.card, borderColor: T.border },
  submitText: { fontFamily: T.fontTitle, fontSize: 18, color: T.textInverse, letterSpacing: 2 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  typeBtnText: { fontFamily: T.fontBody, fontSize: 12, color: T.muted },
  errorText: { color: T.text, fontSize: 18, textAlign: 'center', marginTop: 100, fontFamily: T.fontBody },
  backLink: { color: T.gold, textAlign: 'center', marginTop: 20, fontFamily: T.fontBody },
});