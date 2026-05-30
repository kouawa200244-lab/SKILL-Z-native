// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
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

const GAMING_GAMES = [
  { key: 'all',  label: 'TOUS'     },
  { key: 'pes',  label: 'PES'      },
  { key: 'fifa', label: 'EA SPORT' },
  { key: 'nba',  label: 'NBA 2K'   },
  { key: 'nfs',  label: 'NFS'      },
];

/* ── Carte défi ── */
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
        <View style={[styles.defiCardBar, { backgroundColor: color }]} />

        <View style={styles.defiCardBody}>
          {/* Ligne 1 — nom + COTE GRANDE */}
          <View style={styles.defiCardRow1}>
            <Text style={styles.defiCardNom} numberOfLines={1}>{defi.nom}</Text>

            {/* ✅ Cote agrandie */}
            <View style={[styles.coteBadge, { backgroundColor: color + '18', borderColor: color + '50' }]}>
              <Zap size={11} color={color} />
              <Text style={[styles.coteValue, { color }]}>×{defi.cote.toFixed(2)}</Text>
            </View>
          </View>

          {/* Condition duel */}
          <View style={styles.condRow}>
            <Text style={[styles.condLabel, { color }]}>{cond.label} · </Text>
            <Text style={styles.condDesc} numberOfLines={1}>{cond.desc}</Text>
          </View>

          {/* Barre taux */}
          <View style={styles.tauxRow}>
            <View style={styles.tauxTrack}>
              <View style={[styles.tauxFill, { width: `${defi.taux}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.tauxText}>{defi.taux}%</Text>
          </View>
        </View>

        {selected && (
          <View style={styles.selectedCheck}>
            <View style={styles.selectedCheckDot} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Groupe palier ── */
function PalierGroup({ palier, defis, selectedId, onSelect, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const heightAnim      = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const color           = PALIER_COLORS[palier] || C.violet;

  const toggle = () => {
    Haptics.selectionAsync();
    const toValue = open ? 0 : 1;
    Animated.spring(heightAnim, { toValue, tension: 60, friction: 12, useNativeDriver: false }).start();
    setOpen(!open);
  };

  const maxH = heightAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, defis.length * 115 + 16],
  });

  return (
    <View style={styles.palierGroup}>
      <TouchableOpacity style={styles.palierHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={[styles.palierDot, { backgroundColor: color }]} />
        <Text style={[styles.palierLabel, { color }]}>{PALIER_LABELS[palier]}</Text>
        <Text style={styles.palierCount}>{defis.length}</Text>
        {open
          ? <ChevronUp   size={16} color={C.muted} />
          : <ChevronDown size={16} color={C.muted} />
        }
      </TouchableOpacity>

      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        <View style={styles.palierList}>
          {defis.map(d => (
            <DefiCard
              key={d.id}
              defi={d}
              gameKey={d._gameKey}
              selected={selectedId === d.id}
              onSelect={onSelect}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/* ── Section Gaming ── */
function GamingSection({ selectedId, onSelect }) {
  const [gameFilter, setGameFilter] = useState('all');

  const allDefis = ['pes', 'fifa', 'nba', 'nfs'].flatMap(gk =>
    (DEFIS[gk] || []).map(d => ({ ...d, _gameKey: gk }))
  );

  const filtered = gameFilter === 'all'
    ? allDefis
    : allDefis.filter(d => d._gameKey === gameFilter);

  const byPalier = ['debutant', 'intermediaire', 'avance', 'expert', 'legendaire']
    .map(p => ({ palier: p, defis: filtered.filter(d => d.p === p) }))
    .filter(g => g.defis.length > 0);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {GAMING_GAMES.map(g => (
          <TouchableOpacity
            key={g.key}
            style={[styles.filterChip, gameFilter === g.key && styles.filterChipActive]}
            onPress={() => { Haptics.selectionAsync(); setGameFilter(g.key); }}
          >
            <Text style={[styles.filterChipText, gameFilter === g.key && styles.filterChipTextActive]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    </View>
  );
}

/* ── Section Physique ── */
function PhysiqueSection({ selectedId, onSelect }) {
  const defis = (DEFIS['physique'] || []).map(d => ({ ...d, _gameKey: 'physique' }));

  const byPalier = ['debutant', 'intermediaire', 'avance', 'expert', 'legendaire']
    .map(p => ({ palier: p, defis: defis.filter(d => d.p === p) }))
    .filter(g => g.defis.length > 0);

  return (
    <View>
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
    </View>
  );
}

/* ══ ÉCRAN PRINCIPAL ══ */
export default function DuelPickScreen() {
  const insets = useSafeAreaInsets();

  const [category,  setCategory]  = useState(null);
  const [selection, setSelection] = useState(null);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const btnAnim    = useRef(new Animated.Value(0)).current;
  const catAnimG   = useRef(new Animated.Value(1)).current;
  const catAnimP   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

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
    const anim = cat === 'gaming' ? catAnimG : catAnimP;
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.96, tension: 300, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleConfigure = () => {
    if (!selection) return;
    navigate('DuoConfig', { defi: selection.defi, gameKey: selection.gameKey });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const btnTranslate = btnAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backBtn}
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
        contentContainerStyle={[styles.scrollContent, selection && { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Catégories */}
        <Animated.View style={[styles.catRow, { opacity: fadeAnim }]}>
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: catAnimG }] }]}>
            <TouchableOpacity
              style={[styles.catCard, category === 'gaming' && { borderColor: C.blue, backgroundColor: C.blue + '0C' }]}
              onPress={() => handleCatSelect('gaming')}
              activeOpacity={0.85}
            >
              {category === 'gaming' && <View style={[styles.catAccent, { backgroundColor: C.blue }]} />}
              <View style={[styles.catIconBox, { backgroundColor: C.blue + '18' }]}>
                <Gamepad2 size={26} color={C.blue} />
              </View>
              <Text style={[styles.catLabel, category === 'gaming' && { color: C.blue }]}>GAMING</Text>
              <Text style={styles.catSub}>FIFA · PES · NBA · NFS</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: catAnimP }] }]}>
            <TouchableOpacity
              style={[styles.catCard, category === 'physique' && { borderColor: C.violet, backgroundColor: C.vDim }]}
              onPress={() => handleCatSelect('physique')}
              activeOpacity={0.85}
            >
              {category === 'physique' && <View style={[styles.catAccent, { backgroundColor: C.violet }]} />}
              <View style={[styles.catIconBox, { backgroundColor: C.vDim }]}>
                <Dumbbell size={26} color={C.violet} />
              </View>
              <Text style={[styles.catLabel, category === 'physique' && { color: C.violet }]}>PHYSIQUE</Text>
              <Text style={styles.catSub}>Pompes · Squats · Planche</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {category === 'gaming'   && <GamingSection  selectedId={selection?.defi?.id} onSelect={setSelection} />}
        {category === 'physique' && <PhysiqueSection selectedId={selection?.defi?.id} onSelect={setSelection} />}
      </ScrollView>

      {/* ✅ Bouton configurer — FLOTTANT BIEN AU DESSUS */}
      <Animated.View style={[
        styles.configBtnWrap,
        {
          opacity:   btnAnim,
          transform: [{ translateY: btnTranslate }],
          paddingBottom: insets.bottom + 16,
        },
      ]}>
        {selection && (
          <>
            {/* Preview défi sélectionné */}
            <View style={styles.selectedPreview}>
              <View style={styles.selectedPreviewLeft}>
                <Text style={styles.selectedPreviewNom} numberOfLines={1}>
                  {selection.defi.nom}
                </Text>
                {/* ✅ Gain = mise × cote (avec mise par défaut 1000) */}
                <Text style={styles.selectedPreviewGain}>
                  Gain estimé : +{Math.round(1000 * selection.defi.cote).toLocaleString('fr-FR')} F pour 1 000 F misés
                </Text>
              </View>
              {/* ✅ Cote GRANDE */}
              <View style={[
                styles.selectedCoteBig,
                { backgroundColor: (PALIER_COLORS[selection.defi.p] || C.violet) + '20' },
              ]}>
                <Zap size={14} color={PALIER_COLORS[selection.defi.p] || C.violet} />
                <Text style={[styles.selectedCoteValue, { color: PALIER_COLORS[selection.defi.p] || C.violet }]}>
                  ×{selection.defi.cote.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Bouton */}
            <TouchableOpacity
              style={styles.configBtn}
              onPress={handleConfigure}
              activeOpacity={0.88}
            >
              <Text style={styles.configBtnText}>CONFIGURER CE DUEL</Text>
              <ArrowLeft size={16} color="#000" style={{ transform: [{ scaleX: -1 }] }} />
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  scrollContent:{ paddingHorizontal: 16, paddingBottom: 40 },
  orb1: { position: 'absolute', top: -80, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: C.violet, opacity: 0.06 },
  orb2: { position: 'absolute', bottom: 300, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: C.blue, opacity: 0.05 },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  backBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerSub:  { fontFamily: 'Inter-Regular', fontSize: 9, color: C.violet, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  headerTitle:{ fontFamily: 'Rajdhani-Bold', fontSize: 26, color: C.text },

  catRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  catCard:{ flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', padding: 16, alignItems: 'center', gap: 8, position: 'relative', overflow: 'hidden', minHeight: 140 },
  catAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  catIconBox:{ width: 52, height: 52, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  catLabel:  { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: C.muted, letterSpacing: 2 },
  catSub:    { fontFamily: 'Inter-Regular', fontSize: 9, color: C.muted, textAlign: 'center', lineHeight: 13 },

  filterRow:       { gap: 7, paddingBottom: 14 },
  filterChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: C.card },
  filterChipActive:{ backgroundColor: C.blue + '20', borderColor: C.blue },
  filterChipText:  { fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted, fontWeight: '700' },
  filterChipTextActive: { color: C.blue },

  palierGroup:  { marginBottom: 8 },
  palierHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 4 },
  palierDot:    { width: 8, height: 8, borderRadius: 4 },
  palierLabel:  { fontFamily: 'Inter-Regular', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, flex: 1 },
  palierCount:  { fontFamily: 'Inter-Regular', fontSize: 11, color: C.muted, marginRight: 4 },
  palierList:   { gap: 8, paddingBottom: 8 },

  /* Défi card */
  defiCard:    { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', overflow: 'hidden' },
  defiCardBar: { width: 3 },
  defiCardBody:{ flex: 1, padding: 12, gap: 7 },
  defiCardRow1:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  defiCardNom: { fontFamily: 'Rajdhani-Bold', fontSize: 15, color: C.text, flex: 1 },

  /* ✅ Cote agrandie */
  coteBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  coteValue:  { fontFamily: 'Rajdhani-Bold', fontSize: 18, letterSpacing: 0.5 },

  condRow:   { flexDirection: 'row', alignItems: 'center' },
  condLabel: { fontFamily: 'Inter-Regular', fontSize: 10, fontWeight: '700' },
  condDesc:  { fontFamily: 'Inter-Regular', fontSize: 10, color: C.muted, flex: 1 },
  tauxRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tauxTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  tauxFill:  { height: '100%', borderRadius: 2 },
  tauxText:  { fontFamily: 'Inter-Regular', fontSize: 9, color: C.muted, width: 28 },

  selectedCheck:   { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.violet, justifyContent: 'center', alignItems: 'center' },
  selectedCheckDot:{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  /* Bouton configurer flottant */
  configBtnWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16, paddingTop: 12,
  },
  selectedPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, paddingHorizontal: 4,
  },
  selectedPreviewLeft: { flex: 1, marginRight: 12 },
  selectedPreviewNom:  { fontFamily: 'Rajdhani-Bold', fontSize: 17, color: C.text, marginBottom: 3 },
  selectedPreviewGain: { fontFamily: 'Inter-Regular', fontSize: 11, color: C.success },

  /* ✅ Cote grande dans le preview */
  selectedCoteBig:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  selectedCoteValue: { fontFamily: 'Rajdhani-Bold', fontSize: 26, letterSpacing: 1 },

  configBtn: {
    backgroundColor: C.violet, borderRadius: 14,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  configBtnText: { fontFamily: 'Rajdhani-Bold', fontSize: 16, color: '#000', letterSpacing: 2 },
});