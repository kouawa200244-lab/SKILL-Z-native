// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ArrowLeft, User, DollarSign, Shield, Zap, Gamepad2, Dumbbell } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { T } from '../utils/designTokens';
import { fmt, filet as calcFilet } from '../utils/helpers';
import CoteDisplay from '../components/CoteDisplay';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';

export default function ConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { addToQueue } = useSession();

  const gameKey = route.params?.gameKey || 'fifa';
  const defi = route.params?.defi;

  const [player, setPlayer] = useState('');
  const [mise, setMise] = useState(1000);

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
  const f = calcFilet(mise, defi.cote);
  const gain = Math.round(mise * defi.cote);
  const ok = player.trim().length > 0;

  const handleSubmit = () => {
    if (!ok) return;
    addToQueue({ player: player.trim(), mise, gameKey, defi });
    navigation.navigate('Lobby'); // Retourne au Dashboard pour voir le défi en attente
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
          </View>
          <Text style={styles.defiName}>{defi.nom}</Text>
          <Text style={styles.defiCond}>{defi.cond}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
            <Text style={styles.tauxText}>Réussite estimée : ~{defi.taux}%</Text>
            <CoteDisplay cote={defi.cote} size={22} />
          </View>
        </View>

        {/* Nom du joueur */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <User size={16} color={T.muted} />
            <Text style={styles.label}>NOM DU JOUEUR</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Brael, Kevin..."
            placeholderTextColor={T.muted}
            value={player}
            onChangeText={setPlayer}
            autoCapitalize="words"
          />
        </View>

        {/* Slider de mise */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <DollarSign size={16} color={T.muted} />
            <Text style={styles.label}>MISE (FCFA)</Text>
            <Text style={styles.miseValue}>{fmt(mise)} F</Text>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderMin}>200</Text>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
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
            <Text style={styles.sliderMax}>20 000</Text>
          </View>
        </View>

        {/* Récapitulatif */}
        <View style={styles.recapCard}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Mise engagée</Text>
            <Text style={styles.recapValue}>{fmt(mise)} F</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: T.success }]}>Gain potentiel</Text>
            <Text style={[styles.recapValue, { color: T.success }]}>+{fmt(gain)} F</Text>
          </View>
          {f > 0 && (
            <View style={styles.recapRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Shield size={14} color={T.intellect} />
                <Text style={[styles.recapLabel, { color: T.intellect }]}>Filet SKILL'Z</Text>
              </View>
              <Text style={[styles.recapValue, { color: T.intellect }]}>{fmt(f)} F remboursés</Text>
            </View>
          )}
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: T.danger }]}>Perte max</Text>
            <Text style={[styles.recapValue, { color: T.danger }]}>-{fmt(mise - f)} F</Text>
          </View>
        </View>

        {/* Bouton de validation */}
        <TouchableOpacity
          style={[styles.submitButton, !ok && styles.submitButtonDisabled]}
          disabled={!ok}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Zap size={20} color={ok ? T.textInverse : T.muted} />
          <Text style={[styles.submitText, !ok && { color: T.muted }]}>
            AJOUTER À LA FILE D'ATTENTE
          </Text>
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
  tauxText: { fontFamily: T.fontBody, fontSize: 12, color: T.muted },
  inputGroup: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label: { fontFamily: T.fontBody, fontSize: 13, color: T.muted, letterSpacing: 1 },
  textInput: { backgroundColor: T.card, borderRadius: 10, borderWidth: 1, borderColor: T.border, paddingHorizontal: 16, paddingVertical: 14, fontFamily: T.fontBody, fontSize: 16, color: T.text },
  miseValue: { fontFamily: T.fontMono, fontSize: 20, fontWeight: '700', color: T.gold, marginLeft: 'auto' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center' },
  sliderMin: { fontFamily: T.fontBody, fontSize: 11, color: T.muted },
  sliderMax: { fontFamily: T.fontBody, fontSize: 11, color: T.muted },
  sliderInput: { backgroundColor: T.card, borderRadius: 8, borderWidth: 1, borderColor: T.border, paddingHorizontal: 12, paddingVertical: 10, fontFamily: T.fontMono, fontSize: 18, color: T.text, textAlign: 'center' },
  recapCard: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 18, marginBottom: 28 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recapLabel: { fontFamily: T.fontBody, fontSize: 14, color: T.muted },
  recapValue: { fontFamily: T.fontMono, fontSize: 16, fontWeight: '700', color: T.text },
  submitButton: { backgroundColor: T.gold, borderRadius: 14, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: T.gold },
  submitButtonDisabled: { backgroundColor: T.card, borderColor: T.border },
  submitText: { fontFamily: T.fontTitle, fontSize: 18, color: T.textInverse, letterSpacing: 2 },
  errorText: { color: T.text, fontSize: 18, textAlign: 'center', marginTop: 100, fontFamily: T.fontBody },
  backLink: { color: T.gold, textAlign: 'center', marginTop: 20, fontFamily: T.fontBody },
});