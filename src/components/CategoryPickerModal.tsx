// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Modal, Dimensions, TouchableWithoutFeedback, PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gamepad2, Dumbbell, Swords, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';

const { height: H, width: W } = Dimensions.get('window');
const SHEET_H    = 420;
const DRAG_CLOSE = 80;

const CATEGORIES = [
  {
    key:   'gaming',
    label: 'GAMING',
    sub:   'FIFA · PES · NBA 2K · Need for Speed',
    emoji: '🎮',
    Icon:  Gamepad2,
    color: T.gaming,
  },
  {
    key:   'physique',
    label: 'PHYSIQUE',
    sub:   'Pompes · Squats · Planche · Abdos',
    emoji: '💪',
    Icon:  Dumbbell,
    color: T.physique,
    route: 'PhysicalChallenges',
    routeParams: { gameKey: 'physique' },
  },
  {
    key:   'duel',
    label: 'DUEL 1v1',
    sub:   'Affronte un joueur en direct',
    emoji: '⚔️',
    Icon:  Swords,
    color: '#A855F7',
  },
];

export default function CategoryPickerModal({ visible, onClose, navigation }) {
  const insets     = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOp  = useRef(new Animated.Value(0)).current;
  const dragY      = useRef(new Animated.Value(0)).current;
  const scaleAnims = CATEGORIES.map(() => useRef(new Animated.Value(1)).current);

  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOp,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOp,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: SHEET_H, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove:   (_, g) => { if (g.dy > 0) dragY.setValue(g.dy); },
      onPanResponderRelease:(_, g) => {
        if (g.dy > DRAG_CLOSE) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        } else {
          Animated.spring(dragY, { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  /* ── Sélection + navigation ── */
  const handleSelect = (cat, idx) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.spring(scaleAnims[idx], { toValue: 0.96, tension: 300, useNativeDriver: true }),
      Animated.spring(scaleAnims[idx], { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose();
      setTimeout(() => {
        if (!navigation) return;
        switch (cat.key) {
          case 'gaming':
            // Navigate dans HomeStack → GameSelect
            navigation.navigate('HomeTab', { screen: 'GameSelect' });
            break;
          case 'physique':
            // Navigate dans HomeStack → DefiSelect avec gameKey physique
            navigation.navigate('HomeTab', {
              screen: 'DefiSelect',
              params: { gameKey: 'physique' },
            });
            break;
          case 'duel':
            // Navigate vers l'onglet Duels
            navigation.navigate('DuelTab');
            break;
        }
      }, 180);
    });
  };

  const sheetTranslate = Animated.add(translateY, dragY);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOp }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[
        styles.sheet,
        { paddingBottom: insets.bottom + 12, transform: [{ translateY: sheetTranslate }] },
      ]}>
        {/* Handle draggable */}
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetEyebrow}>NOUVEAU DÉFI</Text>
            <Text style={styles.sheetTitle}>Quelle catégorie ?</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
          >
            <X size={15} color={T.muted} />
          </TouchableOpacity>
        </View>

        {/* Catégories */}
        <View style={styles.cats}>
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.Icon;
            return (
              <Animated.View key={`cat_${cat.key}`} style={{ transform: [{ scale: scaleAnims[i] }] }}>
                <TouchableOpacity
                  style={[styles.catBtn, { borderColor: cat.color + '35' }]}
                  onPress={() => handleSelect(cat, i)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.catOrb, { backgroundColor: cat.color }]} />
                  <View style={styles.catLeft}>
                    <View style={[styles.catIconBox, {
                      backgroundColor: cat.color + '18',
                      borderColor:     cat.color + '35',
                    }]}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    </View>
                    <View style={styles.catTexts}>
                      <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                      <Text style={styles.catSub} numberOfLines={1}>{cat.sub}</Text>
                    </View>
                  </View>
                  <View style={[styles.catArrow, {
                    backgroundColor: cat.color + '12',
                    borderColor:     cat.color + '30',
                  }]}>
                    <Text style={{ color: cat.color, fontSize: 16 }}>›</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ⚡ Tu choisiras le défi précis à l'étape suivante
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0C0E15',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 0, paddingHorizontal: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.55, shadowRadius: 30, elevation: 30,
  },
  dragZone: { alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
  handle:   { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)' },

  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 18,
  },
  sheetEyebrow: { fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold, fontWeight: '800', letterSpacing: 2, marginBottom: 3 },
  sheetTitle:   { fontFamily: 'Rajdhani-Bold', fontSize: 24, color: '#EEEEF5', letterSpacing: 0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },

  cats: { gap: 10, marginBottom: 16 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1219', borderRadius: 18, borderWidth: 1,
    paddingVertical: 16, paddingHorizontal: 16,
    overflow: 'hidden', position: 'relative', minHeight: 76,
  },
  catOrb: {
    position: 'absolute', top: -30, right: -30,
    width: 90, height: 90, borderRadius: 45, opacity: 0.10,
  },
  catLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  catIconBox:{ width: 52, height: 52, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  catEmoji:  { fontSize: 26 },
  catTexts:  { flex: 1 },
  catLabel:  { fontFamily: 'Rajdhani-Bold', fontSize: 20, letterSpacing: 1.5, marginBottom: 3 },
  catSub:    { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },
  catArrow:  { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  footerText: { fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted },
});