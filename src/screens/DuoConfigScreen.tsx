// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, TextInput, Alert,
  ActivityIndicator, Share, Dimensions, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, Swords, Globe, Lock, Users,
  Clock, Shield, Zap, Check, AlertTriangle,
  ChevronDown, Trophy, Link,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDuelCondition } from '../constants/duelTypes';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { navigate } from '../utils/navigationRef';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const C = {
  bg:      '#0B0E13',
  card:    '#161B22',
  card2:   '#1C2230',
  violet:  '#A259FF',
  vDim:    'rgba(162,89,255,0.12)',
  vBorder: 'rgba(162,89,255,0.30)',
  blue:    '#3BAFFF',
  text:    '#F5F7FA',
  muted:   '#8B949E',
  success: '#2ECC71',
  danger:  '#E74C3C',
  gold:    '#F0C040',
  line:    'rgba(255,255,255,0.05)',
};

const PALIER_COLORS = {
  debutant:      '#2ECC71',
  intermediaire: '#3BAFFF',
  avance:        '#F0C040',
  expert:        '#FF6B35',
  legendaire:    '#A259FF',
};

/* ── Options temps max ── */
const TEMPS_OPTIONS = [
  { value: 2,  label: '2 heures'  },
  { value: 4,  label: '4 heures'  },
  { value: 6,  label: '6 heures'  },
  { value: 8,  label: '8 heures'  },
  { value: 12, label: '12 heures' },
  { value: 24, label: '24 heures' },
];

/* ── Options rounds ── */
const ROUNDS_OPTIONS = [
  { value: 1,  label: 'BO1',  sub: '1 manche · rapide'         },
  { value: 3,  label: 'BO3',  sub: '3 manches · standard'      },
  { value: 5,  label: 'BO5',  sub: '5 manches · intensif'      },
  { value: 7,  label: 'BO7',  sub: '7 manches · tournoi'       },
];

/* ── Mises rapides ── */
const MISES_RAPIDES = [500, 1000, 2000, 5000, 10000];

/* ══════════════════════════════════════
   DROPDOWN TEMPS
══════════════════════════════════════ */
function TempsDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rotateAnim      = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Haptics.selectionAsync();
    Animated.spring(rotateAnim, {
      toValue: open ? 0 : 1, tension: 120, friction: 8, useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const selected = TEMPS_OPTIONS.find(t => t.value === value) || TEMPS_OPTIONS[1];

  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={toggle} activeOpacity={0.85}>
        <Clock size={16} color={C.violet} />
        <Text style={styles.dropdownValue}>{selected.label}</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <ChevronDown size={16} color={C.muted} />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          {TEMPS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.dropdownItem, opt.value === value && styles.dropdownItemActive]}
              onPress={() => { Haptics.selectionAsync(); onChange(opt.value); toggle(); }}
            >
              <Text style={[styles.dropdownItemText, opt.value === value && { color: C.violet }]}>
                {opt.label}
              </Text>
              {opt.value === value && <Check size={14} color={C.violet} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ══════════════════════════════════════
   ÉCRAN PRINCIPAL
══════════════════════════════════════ */
export default function DuoConfigScreen() {
  const insets = useSafeAreaInsets();
  const route  = useRoute();
  const { defi, gameKey } = route.params || {};

  /* État */
  const [mise,        setMise]        = useState(1000);
  const [rounds,      setRounds]      = useState(1);
  const [tempsMax,    setTempsMax]    = useState(4);
  const [mode,        setMode]        = useState('public');  // 'public' | 'private'
  const [maxPlayers,  setMaxPlayers]  = useState(2);
  const [loading,     setLoading]     = useState(false);

  /* Animations */
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const miseAnim  = useRef(new Animated.Value(1)).current;
  const btnAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const game   = GAMES[gameKey]  || {};
  const palier = PALIERS[defi?.p] || {};
  const cond   = defi ? getDuelCondition(defi.id) : { label: 'Duel', desc: '' };
  const color  = PALIER_COLORS[defi?.p] || C.violet;
  const gain   = Math.round(mise * maxPlayers * 0.9);

  const pulseMise = () => {
    Animated.sequence([
      Animated.spring(miseAnim, { toValue: 1.04, tension: 300, useNativeDriver: true }),
      Animated.spring(miseAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();
  };

  /* ── Lancement ── */
  const handleLaunch = async () => {
  if (!defi) return;
  if (mise < 200) {
    Alert.alert('Mise minimum', '200 FCFA minimum');
    return;
  }

  // ✅ Naviguer vers DuoLobby avec les vrais paramètres
  navigation.navigate('DuoLobby', {
    defi,
    mise,
    player,
    gameKey,
    duelType,
    handicap,
    drawRule,
  });

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.spring(btnAnim, { toValue: 0.96, tension: 300, useNativeDriver: true }),
      Animated.spring(btnAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();

    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('skillz_user');
      const user   = JSON.parse(stored || '{}');
      if (!user.id) throw new Error('Non connecté');

      const { data: wallet } = await supabase
        .from('wallets').select('balance').eq('user_id', user.id).single();

      if (!wallet || wallet.balance < mise) {
        Alert.alert('Solde insuffisant', `Solde : ${(wallet?.balance || 0).toLocaleString('fr-FR')} FCFA`);
        return;
      }

      const expiresAt = new Date(Date.now() + tempsMax * 3600000).toISOString();

      const { data: duelRow, error } = await supabase
        .from('duels')
        .insert({
          creator_id:       user.id,
          creator_username: user.username,
          game_key:         gameKey,
          defi_id:          defi.id,
          defi_nom:         defi.nom,
          defi_cond:        defi.cond,
          defi_palier:      defi.p,
          duel_condition:   cond.desc,
          mise,
          cote:             defi.cote,
          status:           'waiting',
          visibility:       mode,
          max_players:      maxPlayers,
          rounds,
          expires_at:       expiresAt,
        })
        .select().single();

      if (error) throw error;

      // Débiter
      await supabase.from('wallets')
        .update({ balance: wallet.balance - mise })
        .eq('user_id', user.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Partage si privé
      if (mode === 'private') {
        await Share.share({
          message:
            `⚔️ SKILL'Z — Défi lancé !\n${defi.nom}\n` +
            `Mise : ${mise.toLocaleString('fr-FR')} FCFA\n` +
            `Code : ${duelRow.id.slice(0, 8).toUpperCase()}\n` +
            `skillz://duel/${duelRow.id}`,
        });
      }

      navigate('DuoLobby', { duel: duelRow, user });

    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Orbe */}
      <View style={[styles.orb, { backgroundColor: color }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigate('DuelPick'); }}
          >
            <ArrowLeft size={20} color={C.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>CONFIGURATION</Text>
            <Text style={styles.headerTitle}>Paramètres du duel</Text>
          </View>
        </Animated.View>

        {/* ── DÉFI SÉLECTIONNÉ — compact ── */}
        <Animated.View style={[styles.defiRecap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }], borderColor: color + '40' }]}>
          <View style={[styles.defiRecapBar, { backgroundColor: color }]} />
          <View style={styles.defiRecapBody}>
            <View style={styles.defiRecapRow1}>
              <View style={styles.defiRecapLeft}>
                <Text style={[styles.defiRecapGame, { color: game.color || color }]}>
                  {game.short || gameKey?.toUpperCase()}
                </Text>
                <View style={[styles.defiRecapPalier, { backgroundColor: (palier.color || color) + '20', borderColor: (palier.color || color) + '40' }]}>
                  <Text style={[styles.defiRecapPalierText, { color: palier.color || color }]}>
                    {palier.label?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={[styles.cotePill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
                <Zap size={10} color={color} />
                <Text style={[styles.coteText, { color }]}>×{defi?.cote?.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.defiRecapNom}>{defi?.nom}</Text>
            <View style={styles.defiRecapCondRow}>
              <Swords size={10} color={color} />
              <Text style={[styles.defiRecapCondLabel, { color }]}>{cond.label} · </Text>
              <Text style={styles.defiRecapCondDesc} numberOfLines={1}>{cond.desc}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ══ BLOC TEMPS + ROUNDS ══ */}
        <Animated.View style={[styles.block, { opacity: fadeAnim }]}>
          <Text style={styles.blockLabel}>⏱ DURÉE & ROUNDS</Text>

          {/* Temps max */}
          <View style={styles.blockRow}>
            <View style={styles.blockRowLeft}>
              <Clock size={14} color={C.violet} />
              <View>
                <Text style={styles.blockRowTitle}>Temps maximum</Text>
                <Text style={styles.blockRowSub}>Durée avant expiration du duel</Text>
              </View>
            </View>
            <TempsDropdown value={tempsMax} onChange={setTempsMax} />
          </View>

          <View style={styles.blockDivider} />

          {/* Rounds */}
          <View style={styles.blockRowCol}>
            <View style={styles.blockRowLeft}>
              <Swords size={14} color={C.violet} />
              <View>
                <Text style={styles.blockRowTitle}>Format</Text>
                <Text style={styles.blockRowSub}>Nombre de manches à jouer</Text>
              </View>
            </View>
            <View style={styles.roundsRow}>
              {ROUNDS_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roundChip,
                    rounds === r.value && { backgroundColor: C.vDim, borderColor: C.violet },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setRounds(r.value); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roundChipLabel, rounds === r.value && { color: C.violet }]}>
                    {r.label}
                  </Text>
                  <Text style={styles.roundChipSub}>{r.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ══ BLOC MISE ══ */}
        <Animated.View style={[styles.block, { opacity: fadeAnim }]}>
          <Text style={styles.blockLabel}>💰 MISE EN FCFA</Text>

          <Animated.View style={[styles.miseDisplay, { transform: [{ scale: miseAnim }] }]}>
            <TextInput
              style={styles.miseInput}
              value={String(mise)}
              onChangeText={t => {
                const v = parseInt(t.replace(/\D/g, ''), 10) || 200;
                setMise(Math.max(200, Math.min(50000, v)));
                pulseMise();
              }}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <Text style={styles.miseCurrency}>FCFA</Text>
          </Animated.View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.miseChipsRow}>
            {MISES_RAPIDES.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.miseChip, mise === m && styles.miseChipActive]}
                onPress={() => { Haptics.selectionAsync(); setMise(m); pulseMise(); }}
              >
                <Text style={[styles.miseChipText, mise === m && styles.miseChipTextActive]}>
                  {m >= 1000 ? `${m / 1000}k` : m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Gain preview */}
          <View style={styles.gainPreview}>
            <Trophy size={13} color={C.success} />
            <Text style={styles.gainPreviewLabel}>Gain potentiel :</Text>
            <Text style={styles.gainPreviewValue}>+{gain.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </Animated.View>

        {/* ══ BLOC MODE + PARTICIPANTS ══ */}
        <Animated.View style={[styles.block, { opacity: fadeAnim }]}>
          <Text style={styles.blockLabel}>👁 MODE DU DUEL</Text>

          {/* Toggle Public / Privé */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeCard, mode === 'public' && { borderColor: C.blue, backgroundColor: C.blue + '0A' }]}
              onPress={() => { Haptics.selectionAsync(); setMode('public'); setMaxPlayers(2); }}
              activeOpacity={0.85}
            >
              {mode === 'public' && <View style={[styles.modeAccent, { backgroundColor: C.blue }]} />}
              <Globe size={20} color={mode === 'public' ? C.blue : C.muted} />
              <Text style={[styles.modeLabel, mode === 'public' && { color: C.blue }]}>PUBLIC</Text>
              <Text style={styles.modeSub}>Lobby ouvert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, mode === 'private' && { borderColor: C.violet, backgroundColor: C.vDim }]}
              onPress={() => { Haptics.selectionAsync(); setMode('private'); setMaxPlayers(2); }}
              activeOpacity={0.85}
            >
              {mode === 'private' && <View style={[styles.modeAccent, { backgroundColor: C.violet }]} />}
              <Lock size={20} color={mode === 'private' ? C.violet : C.muted} />
              <Text style={[styles.modeLabel, mode === 'private' && { color: C.violet }]}>PRIVÉ</Text>
              <Text style={styles.modeSub}>Lien unique</Text>
            </TouchableOpacity>
          </View>

          {/* Participants */}
          <View style={styles.blockDivider} />
          <View style={styles.blockRowCol}>
            <View style={styles.blockRowLeft}>
              <Users size={14} color={C.violet} />
              <View>
                <Text style={styles.blockRowTitle}>Participants max</Text>
                <Text style={styles.blockRowSub}>
                  {mode === 'private' ? 'Invitations uniquement' : 'Rejoignent librement'}
                </Text>
              </View>
            </View>
            <View style={styles.participantRow}>
              {(mode === 'public' ? [2, 4, 8] : [2]).map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.participantChip,
                    maxPlayers === n && { backgroundColor: C.vDim, borderColor: C.violet },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setMaxPlayers(n); }}
                  disabled={mode === 'private'}
                >
                  <Users size={11} color={maxPlayers === n ? C.violet : C.muted} />
                  <Text style={[styles.participantText, maxPlayers === n && { color: C.violet }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {mode === 'private' && (
            <View style={styles.privateInfo}>
              <Link size={12} color={C.violet} />
              <Text style={styles.privateInfoText}>
                Un lien de partage sera généré après création du duel.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ══ RÉCAP FINAL ══ */}
        <Animated.View style={[styles.recap, { opacity: fadeAnim, borderColor: C.vBorder }]}>
          <View style={styles.recapHeader}>
            <Swords size={14} color={C.violet} />
            <Text style={styles.recapHeaderText}>RÉCAPITULATIF</Text>
          </View>
          {[
            { label: 'Défi',            value: defi?.nom,                       color: C.text    },
            { label: 'Format',          value: `BO${rounds}`,                   color: C.violet  },
            { label: 'Durée max',       value: `${tempsMax}h`,                  color: C.muted   },
            { label: 'Mode',            value: mode === 'public' ? '🌍 Public' : '🔗 Privé', color: C.muted },
            { label: 'Participants',    value: `${maxPlayers}`,                 color: C.muted   },
            { label: 'Mise',            value: `${mise.toLocaleString('fr-FR')} FCFA`, color: C.gold },
            { label: 'Gain potentiel',  value: `+${gain.toLocaleString('fr-FR')} FCFA`, color: C.success },
          ].map((r, i, arr) => (
            <View key={i} style={[styles.recapRow, i < arr.length - 1 && styles.recapRowBorder]}>
              <Text style={styles.recapLabel}>{r.label}</Text>
              <Text style={[styles.recapValue, { color: r.color }]} numberOfLines={1}>{r.value}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Info débit */}
        <View style={styles.infoCard}>
          <AlertTriangle size={13} color={C.gold} />
          <Text style={styles.infoText}>
            {mise.toLocaleString('fr-FR')} FCFA débités immédiatement. Remboursés si personne ne rejoint.
          </Text>
        </View>

        {/* ══ BOUTON LANCER ══ */}
        <Animated.View style={{ transform: [{ scale: btnAnim }] }}>
          <TouchableOpacity
            style={[styles.launchBtn, loading && { opacity: 0.7 }]}
            onPress={handleLaunch}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Swords size={20} color="#fff" />
                <Text style={styles.launchBtnText}>LANCER LE DUEL</Text>
                {mode === 'private' && <Link size={16} color="rgba(255,255,255,0.7)" />}
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  scrollContent:{ paddingHorizontal: 16, paddingBottom: 40 },
  orb: { position: 'absolute', top: -80, right: -60, width: 200, height: 200, borderRadius: 100, opacity: 0.07 },

  /* Header */
  header:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 10, paddingBottom: 18 },
  backBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerSub:  { fontFamily: 'Inter-Regular', fontSize: 9, color: C.violet, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  headerTitle:{ fontFamily: 'Rajdhani-Bold', fontSize: 24, color: C.text },

  /* Défi recap */
  defiRecap:     { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', marginBottom: 16 },
  defiRecapBar:  { width: 3 },
  defiRecapBody: { flex: 1, padding: 14, gap: 7 },
  defiRecapRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  defiRecapLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defiRecapGame: { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  defiRecapPalier: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  defiRecapPalierText: { fontFamily: 'Inter-Regular', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  cotePill:      { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  coteText:      { fontFamily: 'Rajdhani-Bold', fontSize: 13 },
  defiRecapNom:  { fontFamily: 'Rajdhani-Bold', fontSize: 17, color: C.text },
  defiRecapCondRow: { flexDirection: 'row', alignItems: 'center' },
  defiRecapCondLabel: { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '700' },
  defiRecapCondDesc:  { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, flex: 1 },

  /* Blocs */
  block:      { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, marginBottom: 12 },
  blockLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  blockDivider: { height: 1, backgroundColor: C.line, marginVertical: 14 },
  blockRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  blockRowCol:{ gap: 12 },
  blockRowLeft:{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  blockRowTitle:{ fontFamily: 'Inter-Regular', fontSize: 13, color: C.text, fontWeight: '600' },
  blockRowSub: { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, marginTop: 1 },

  /* Dropdown */
  dropdownWrap: { position: 'relative', zIndex: 999 },
  dropdownBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.vDim, borderWidth: 1, borderColor: C.vBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  dropdownValue:{ fontFamily: 'Rajdhani-Bold', fontSize: 14, color: C.violet },
  dropdownList: { position: 'absolute', top: '110%', right: 0, backgroundColor: '#1A1F2A', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', width: 160, zIndex: 1000, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  dropdownItemActive: { backgroundColor: C.vDim },
  dropdownItemText:   { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted, fontWeight: '600' },

  /* Rounds */
  roundsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roundChip: { flex: 1, minWidth: (W - 80) / 4, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 10, alignItems: 'center', gap: 3 },
  roundChipLabel: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.muted, letterSpacing: 1 },
  roundChipSub:   { fontFamily: 'Inter-Regular', fontSize: 8, color: C.muted, textAlign: 'center', lineHeight: 11 },

  /* Mise */
  miseDisplay:   { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 14 },
  miseInput:     { fontFamily: 'Rajdhani-Bold', fontSize: 52, color: C.text, padding: 0, textAlign: 'center', minWidth: 160 },
  miseCurrency:  { fontFamily: 'Inter-Regular', fontSize: 16, color: C.muted, fontWeight: '700' },
  miseChipsRow:  { gap: 8, paddingBottom: 14 },
  miseChip:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' },
  miseChipActive:{ backgroundColor: C.vDim, borderColor: C.violet },
  miseChipText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: C.muted, fontWeight: '700' },
  miseChipTextActive: { color: C.violet },
  gainPreview:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.success + '10', borderRadius: 10, borderWidth: 1, borderColor: C.success + '25', padding: 12 },
  gainPreviewLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted, flex: 1 },
  gainPreviewValue: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: C.success },

  /* Mode */
  modeRow:  { flexDirection: 'row', gap: 10 },
  modeCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', padding: 14, alignItems: 'center', gap: 6, position: 'relative', overflow: 'hidden' },
  modeAccent:{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  modeLabel: { fontFamily: 'Rajdhani-Bold', fontSize: 15, color: C.muted, letterSpacing: 1.5 },
  modeSub:   { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted },

  /* Participants */
  participantRow:  { flexDirection: 'row', gap: 8 },
  participantChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' },
  participantText: { fontFamily: 'Rajdhani-Bold', fontSize: 15, color: C.muted },
  privateInfo:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.vDim, borderRadius: 8, borderWidth: 1, borderColor: C.vBorder, padding: 10, marginTop: 10 },
  privateInfoText: { fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted, flex: 1 },

  /* Récap */
  recap:       { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  recapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  recapHeaderText: { fontFamily: 'Inter-Regular', fontSize: 10, color: C.violet, fontWeight: '800', letterSpacing: 2, flex: 1 },
  recapRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16 },
  recapRowBorder: { borderBottomWidth: 1, borderBottomColor: C.line },
  recapLabel:  { fontFamily: 'Inter-Regular', fontSize: 12, color: C.muted },
  recapValue:  { fontFamily: 'Rajdhani-Bold', fontSize: 15, letterSpacing: 0.3, maxWidth: W * 0.5, textAlign: 'right' },

  /* Info */
  infoCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(240,192,64,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(240,192,64,0.18)', padding: 12, marginBottom: 16 },
  infoText:   { fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted, flex: 1, lineHeight: 16 },

  /* Bouton lancer */
  launchBtn: {
    backgroundColor: C.violet, borderRadius: 16,
    paddingVertical: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 14,
  },
  launchBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 18, color: '#fff', letterSpacing: 2 },
});