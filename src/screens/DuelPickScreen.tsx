// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, Gamepad2, Dumbbell,
  ChevronDown, ChevronUp, Zap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFIS } from '../constants/defis';
import { getDuelCondition } from '../constants/duelTypes';
import { navigate } from '../utils/navigationRef';

const { width: W } = Dimensions.get('window');

/* ══ DESIGN TOKENS ══ */
const C = {
  bg:      '#0B0E13',
  card:    '#161B22',
  violet:  '#A259FF',
  vDim:    'rgba(162,89,255,0.12)',
  vBorder: 'rgba(162,89,255,0.30)',
  blue:    '#3BAFFF',
  text:    '#F5F7FA',
  muted:   '#8B949E',
  success: '#2ECC71',
  gold:    '#F0C040',
  line:    'rgba(255,255,255,0.05)',
};

/* ── Couleurs par palier ── */
const PALIER_COLORS = {
  debutant:      '#2ECC71',
  intermediaire: '#3BAFFF',
  avance:        '#F0C040',
  expert:        '#FF6B35',
  legendaire:    '#A259FF',
};

const PALIER_LABELS = {
  debutant:      'DÉBUTANT',
  intermediaire: 'INTERMÉDIAIRE',
  avance:        'AVANCÉ',
  expert:        'EXPERT',
  legendaire:    'LÉGENDAIRE',
};

/* ── Jeux gaming ── */
const GAMING_GAMES = [
  { key: 'all',  label: 'TOUS' },
  { key: 'pes',  label: 'PES'  },
  { key: 'fifa', label: 'EA SPORT' },
  { key: 'nba',  label: 'NBA 2K' },
  { key: 'nfs',  label: 'NFS' },
];

/* ══════════════════════════════════════
   CARTE DÉFI
══════════════════════════════════════ */
function DefiCard({ defi, gameKey, selected, onSelect }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cond      = getDuelCondition(defi.id);
  const color     = PALIER_COLORS[defi.p] || C.violet;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, tension: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start(() => onSelect({ defi, gameKey }));
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.defiCard,
          selected && { borderColor: C.violet, backgroundColor: C.vDim },
        ]}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        {/* Accent latéral */}
        <View style={[styles.defiCardBar, { backgroundColor: color }]} />

        <View style={styles.defiCardBody}>
          {/* Ligne 1 — nom + cote */}
          <View style={styles.defiCardRow1}>
            <Text style={styles.defiCardNom} numberOfLines={1}>{defi.nom}</Text>
            <View style={[styles.cotePill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
              <Zap size={9} color={color} />
              <Text style={[styles.coteText, { color }]}>×{defi.cote.toFixed(2)}</Text>
            </View>
          </View>

          {/* Ligne 2 — condition duel */}
          <View style={styles.defiCardCondRow}>
            <Text style={styles.defiCardCondLabel}>{cond.label} · </Text>
            <Text style={styles.defiCardCondDesc} numberOfLines={1}>{cond.desc}</Text>
          </View>

          {/* Ligne 3 — taux réussite */}
          <View style={styles.defiCardFooter}>
            <View style={styles.tauxWrap}>
              <View style={[styles.tauxBar, { width: `${defi.taux}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.tauxText}>{defi.taux}% réussite</Text>
          </View>
        </View>

        {/* Check si sélectionné */}
        {selected && (
          <View style={styles.defiCardCheck}>
            <View style={styles.defiCardCheckDot} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   GROUPE PAR PALIER
══════════════════════════════════════ */
function PalierGroup({ palier, defis, selectedId, onSelect, defaultOpen = false }) {
  const [open, setOpen]   = useState(defaultOpen);
  const heightAnim        = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const color             = PALIER_COLORS[palier] || C.violet;

  const toggle = () => {
    Haptics.selectionAsync();
    const toValue = open ? 0 : 1;
    Animated.spring(heightAnim, { toValue, tension: 60, friction: 12, useNativeDriver: false }).start();
    setOpen(!open);
  };

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, defis.length * 110 + 16],
  });

  return (
    <View style={styles.palierGroup}>
      {/* Header cliquable */}
      <TouchableOpacity style={styles.palierHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={[styles.palierDot, { backgroundColor: color }]} />
        <Text style={[styles.palierLabel, { color }]}>{PALIER_LABELS[palier]}</Text>
        <Text style={styles.palierCount}>{defis.length} défis</Text>
        <View style={styles.palierChevron}>
          {open
            ? <ChevronUp   size={16} color={C.muted} />
            : <ChevronDown size={16} color={C.muted} />
          }
        </View>
      </TouchableOpacity>

      {/* Défis */}
      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <View style={styles.palierList}>
          {defis.map(defi => (
            <DefiCard
              key={defi.id}
              defi={defi}
              gameKey={defi._gameKey}
              selected={selectedId === defi.id}
              onSelect={onSelect}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/* ══════════════════════════════════════
   SECTION GAMING
══════════════════════════════════════ */
function GamingSection({ selectedId, onSelect }) {
  const [gameFilter, setGameFilter] = useState('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  // Fusionner tous les défis gaming avec leur gameKey
  const allGamingDefis = ['pes', 'fifa', 'nba', 'nfs'].flatMap(gk =>
    (DEFIS[gk] || []).map(d => ({ ...d, _gameKey: gk }))
  );

  const filtered = gameFilter === 'all'
    ? allGamingDefis
    : allGamingDefis.filter(d => d._gameKey === (gameFilter === 'fifa' ? 'fifa' : gameFilter));

  // Grouper par palier
  const byPalier = ['debutant', 'intermediaire', 'avance', 'expert', 'legendaire']
    .map(p => ({ palier: p, defis: filtered.filter(d => d.p === p) }))
    .filter(g => g.defis.length > 0);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Filtre par jeu */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gameFilterRow}
      >
        {GAMING_GAMES.map(g => (
          <TouchableOpacity
            key={g.key}
            style={[styles.gameFilterChip, gameFilter === g.key && styles.gameFilterChipActive]}
            onPress={() => { Haptics.selectionAsync(); setGameFilter(g.key); }}
          >
            <Text style={[styles.gameFilterText, gameFilter === g.key && styles.gameFilterTextActive]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Groupes par palier */}
      {byPalier.map((g, i) => (
        <PalierGroup
          key={g.palier}
          palier={g.palier}
          defis={g.defis}
          selectedId={selectedId}
          onSelect={onSelect}
          defaultOpen={i === 0}
        />
      ))}
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   SECTION PHYSIQUE
══════════════════════════════════════ */
function PhysiqueSection({ selectedId, onSelect }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const defis = (DEFIS['physique'] || []).map(d => ({ ...d, _gameKey: 'physique' }));

  const byPalier = ['debutant', 'intermediaire', 'avance', 'expert', 'legendaire']
    .map(p => ({ palier: p, defis: defis.filter(d => d.p === p) }))
    .filter(g => g.defis.length > 0);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {byPalier.map((g, i) => (
        <PalierGroup
          key={g.palier}
          palier={g.palier}
          defis={g.defis}
          selectedId={selectedId}
          onSelect={onSelect}
          defaultOpen={i === 0}
        />
      ))}
    </Animated.View>
  );
}

/* ══════════════════════════════════════
   ÉCRAN PRINCIPAL
══════════════════════════════════════ */
export default function DuelPickScreen() {
  const insets = useSafeAreaInsets();

  const [category,  setCategory]  = useState(null);   // 'gaming' | 'physique'
  const [selection, setSelection] = useState(null);   // { defi, gameKey }

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const btnAnim    = useRef(new Animated.Value(0)).current;
  const catAnimG   = useRef(new Animated.Value(1)).current;
  const catAnimP   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Apparition bouton configurer
  useEffect(() => {
    Animated.spring(btnAnim, {
      toValue: selection ? 1 : 0,
      tension: 70, friction: 10, useNativeDriver: true,
    }).start();
  }, [selection]);

  const handleCatSelect = (cat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCategory(cat);
    setSelection(null);
    // Mini animation bounce sur la carte sélectionnée
    const anim = cat === 'gaming' ? catAnimG : catAnimP;
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.96, tension: 300, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleDefiSelect = (sel) => {
    setSelection(sel);
  };

  const handleConfigure = () => {
  if (!selection) return;
  navigate('DuoConfig', { defi: selection.defi, gameKey: selection.gameKey }); // ✅ en premier
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // après
};

  const btnTranslate = btnAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const btnOpacity   = btnAnim;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Orbes bg */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigate('DuelTab'); }}
        >
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>MODE DUEL</Text>
          <Text style={styles.headerTitle}>Choisis ton défi</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── CATÉGORIES ── */}
        <Animated.View style={[styles.catRow, { opacity: fadeAnim }]}>

          {/* GAMING */}
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: catAnimG }] }]}>
            <TouchableOpacity
              style={[
                styles.catCard,
                category === 'gaming' && { borderColor: C.blue, backgroundColor: C.blue + '0C' },
              ]}
              onPress={() => handleCatSelect('gaming')}
              activeOpacity={0.85}
            >
              {category === 'gaming' && <View style={[styles.catAccent, { backgroundColor: C.blue }]} />}
              <View style={[styles.catIconBox, { backgroundColor: C.blue + '18' }]}>
                <Gamepad2 size={26} color={C.blue} />
              </View>
              <Text style={[styles.catLabel, category === 'gaming' && { color: C.blue }]}>
                GAMING
              </Text>
              <Text style={styles.catSub}>FIFA · PES · NBA · NFS</Text>
              {category === 'gaming' && <View style={[styles.catSelectedBar, { backgroundColor: C.blue }]} />}
            </TouchableOpacity>
          </Animated.View>

          {/* PHYSIQUE */}
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: catAnimP }] }]}>
            <TouchableOpacity
              style={[
                styles.catCard,
                category === 'physique' && { borderColor: C.violet, backgroundColor: C.vDim },
              ]}
              onPress={() => handleCatSelect('physique')}
              activeOpacity={0.85}
            >
              {category === 'physique' && <View style={[styles.catAccent, { backgroundColor: C.violet }]} />}
              <View style={[styles.catIconBox, { backgroundColor: C.vDim }]}>
                <Dumbbell size={26} color={C.violet} />
              </View>
              <Text style={[styles.catLabel, category === 'physique' && { color: C.violet }]}>
                PHYSIQUE
              </Text>
              <Text style={styles.catSub}>Pompes · Squats · Planche</Text>
              {category === 'physique' && <View style={[styles.catSelectedBar, { backgroundColor: C.violet }]} />}
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>

        {/* ── DÉFIS ── */}
        {category === 'gaming' && (
          <GamingSection
            selectedId={selection?.defi?.id}
            onSelect={handleDefiSelect}
          />
        )}
        {category === 'physique' && (
          <PhysiqueSection
            selectedId={selection?.defi?.id}
            onSelect={handleDefiSelect}
          />
        )}

        {/* Espace bouton flottant */}
        {selection && <View style={{ height: 90 }} />}
      </ScrollView>

      {/* ── BOUTON CONFIGURER (flottant) ── */}
      <Animated.View style={[
        styles.configBtnWrap,
        {
          opacity: btnOpacity,
          transform: [{ translateY: btnTranslate }],
          paddingBottom: insets.bottom + 12,
        },
      ]}>
        {selection && (
          <View style={styles.configBtnInner}>
            {/* Récap défi sélectionné */}
            <View style={styles.configDefiPreview}>
              <Text style={styles.configDefiNom} numberOfLines={1}>{selection.defi.nom}</Text>
              <Text style={[styles.configDefiCote, { color: PALIER_COLORS[selection.defi.p] }]}>
                ×{selection.defi.cote.toFixed(2)}
              </Text>
            </View>
            {/* Bouton */}
            <TouchableOpacity
              style={styles.configBtn}
              onPress={handleConfigure}
              activeOpacity={0.88}
            >
              <Text style={styles.configBtnText}>CONFIGURER CE DUEL</Text>
              <View style={styles.configBtnArrow}>
                <ArrowLeft size={14} color={C.violet} style={{ transform: [{ scaleX: -1 }] }} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  scrollContent:{ paddingHorizontal: 16, paddingBottom: 40 },

  orb1: { position: 'absolute', top: -80, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: C.violet, opacity: 0.06 },
  orb2: { position: 'absolute', bottom: 300, left: -60, width: 160, height: 160, borderRadius: 80,  backgroundColor: C.blue, opacity: 0.05 },

  /* Header */
  header:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  headerBack: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerSub:  { fontFamily: 'Inter-Regular', fontSize: 9, color: C.violet, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  headerTitle:{ fontFamily: 'Rajdhani-Bold', fontSize: 26, color: C.text, letterSpacing: 0.5 },

  /* Catégories */
  catRow:  { flexDirection: 'row', gap: 10, marginBottom: 22 },
  catCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)',
    padding: 16, alignItems: 'center', gap: 8,
    position: 'relative', overflow: 'hidden', minHeight: 140,
  },
  catAccent:      { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  catIconBox:     { width: 52, height: 52, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  catLabel:       { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.muted, letterSpacing: 2 },
  catSub:         { fontFamily: 'Inter-Regular', fontSize: 9, color: C.muted, textAlign: 'center', lineHeight: 13 },
  catSelectedBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },

  /* Filtre gaming */
  gameFilterRow: { gap: 7, paddingBottom: 14 },
  gameFilterChip:{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: C.card },
  gameFilterChipActive: { backgroundColor: C.blue + '20', borderColor: C.blue },
  gameFilterText:{ fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted, fontWeight: '700' },
  gameFilterTextActive: { color: C.blue },

  /* Groupe palier */
  palierGroup:   { marginBottom: 8 },
  palierHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 4 },
  palierDot:     { width: 8, height: 8, borderRadius: 4 },
  palierLabel:   { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, flex: 1 },
  palierCount:   { fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted },
  palierChevron: { width: 28, alignItems: 'center' },
  palierList:    { gap: 8, paddingBottom: 8 },

  /* Défi card */
  defiCard: {
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row', overflow: 'hidden',
    position: 'relative',
  },
  defiCardBar:      { width: 3, backgroundColor: C.violet },
  defiCardBody:     { flex: 1, padding: 12, gap: 6 },
  defiCardRow1:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  defiCardNom:      { fontFamily: 'Rajdhani-Bold', fontSize: 15, color: C.text, flex: 1, marginRight: 10 },
  cotePill:         { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  coteText:         { fontFamily: 'Rajdhani-Bold', fontSize: 13 },
  defiCardCondRow:  { flexDirection: 'row', alignItems: 'center' },
  defiCardCondLabel:{ fontFamily: 'Inter-Regular', fontSize: 10, color: C.violet, fontWeight: '700' },
  defiCardCondDesc: { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, flex: 1 },
  defiCardFooter:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tauxWrap:         { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  tauxBar:          { height: '100%', borderRadius: 2 },
  tauxText:         { fontFamily: 'Inter-Regular', fontSize: 9, color: C.muted },
  defiCardCheck:    { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.violet, justifyContent: 'center', alignItems: 'center' },
  defiCardCheckDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  /* Bouton configurer flottant */
  configBtnWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16, paddingTop: 12,
  },
  configBtnInner: { gap: 10 },
  configDefiPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  configDefiNom:     { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.text, flex: 1, marginRight: 10 },
  configDefiCote:    { fontFamily: 'Rajdhani-Bold', fontSize: 16 },
  configBtn: {
    backgroundColor: C.violet, borderRadius: 14,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  configBtnText:  { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 2 },
  configBtnArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
});