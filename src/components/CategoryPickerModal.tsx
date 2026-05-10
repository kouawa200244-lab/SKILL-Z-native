// @ts-nocheck
// src/components/CategoryPickerModal.tsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Modal, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { Gamepad2, Dumbbell, X, Zap, ChevronRight } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { useNavigation } from '@react-navigation/native';

const { height: H } = Dimensions.get('window');

const CATEGORIES = [
  {
    key: 'gaming',
    label: 'GAMING',
    emoji: '🎮',
    desc: 'FIFA, PES, NBA 2K, Need for Speed',
    icon: Gamepad2,
    color: T.gaming,
    glow: T.gaming + '20',
    border: T.gaming + '40',
    route: 'GameSelect',
    params: {},
  },
  {
    key: 'physique',
    label: 'PHYSIQUE',
    emoji: '💪',
    desc: 'Pompes, Squats, Planche, Abdos...',
    icon: Dumbbell,
    color: T.physique,
    glow: T.physique + '20',
    border: T.physique + '40',
    route: 'DefiSelect',
    params: { gameKey: 'physique' },
  },
];

export default function CategoryPickerModal({ visible, onClose }) {
  const navigation = useNavigation();
  const slideAnim  = useRef(new Animated.Value(H)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnims = CATEGORIES.map(() => useRef(new Animated.Value(1)).current);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: H, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (cat, index) => {
    // Micro animation sur la carte sélectionnée
    Animated.sequence([
      Animated.spring(scaleAnims[index], { toValue: 0.95, tension: 200, useNativeDriver: true }),
      Animated.spring(scaleAnims[index], { toValue: 1,    tension: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose();
      setTimeout(() => navigation.navigate(cat.route, cat.params), 150);
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetEyebrow}>NOUVEAU DÉFI</Text>
            <Text style={styles.sheetTitle}>Quelle catégorie ?</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={16} color={T.muted} />
          </TouchableOpacity>
        </View>

        {/* Sous-titre */}
        <Text style={styles.sheetSub}>
          Choisis le type de défi que tu veux lancer
        </Text>

        {/* Cards catégories */}
        <View style={styles.cardsRow}>
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Animated.View key={cat.key} style={{ flex: 1, transform: [{ scale: scaleAnims[i] }] }}>
                <TouchableOpacity
                  style={[styles.catCard, { borderColor: cat.border, backgroundColor: cat.glow }]}
                  onPress={() => handleSelect(cat, i)}
                  activeOpacity={0.85}
                >
                  {/* Orbe déco */}
                  <View style={[styles.catOrb, { backgroundColor: cat.color }]} />

                  {/* Emoji grand */}
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>

                  {/* Icône */}
                  <View style={[styles.catIconBox, { backgroundColor: cat.color + '20', borderColor: cat.color + '40' }]}>
                    <Icon size={22} color={cat.color} />
                  </View>

                  <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                  <Text style={styles.catDesc}>{cat.desc}</Text>

                  {/* Arrow */}
                  <View style={[styles.catArrow, { backgroundColor: cat.color + '15', borderColor: cat.color + '30' }]}>
                    <ChevronRight size={14} color={cat.color} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Footer hint */}
        <View style={styles.sheetFooter}>
          <Zap size={11} color={T.muted} />
          <Text style={styles.sheetFooterText}>
            Tu pourras choisir ton défi précis à l'étape suivante
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0C0E14',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 0,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.5, shadowRadius: 32, elevation: 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },

  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 22, paddingTop: 16,
  },
  sheetEyebrow: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.gold,
    fontWeight: '800', letterSpacing: 2, marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: 'Rajdhani-Bold', fontSize: 26, color: '#EEEEF5', letterSpacing: 0.5,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetSub: {
    fontFamily: 'Inter-Regular', fontSize: 13, color: T.muted,
    paddingHorizontal: 22, marginTop: 6, marginBottom: 24, lineHeight: 18,
  },

  /* Cards côte à côte */
  cardsRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 18, marginBottom: 20,
  },
  catCard: {
    borderRadius: 20, borderWidth: 1,
    padding: 18, alignItems: 'center',
    overflow: 'hidden', position: 'relative',
    minHeight: 190,
  },
  catOrb: {
    position: 'absolute', top: -30, right: -30,
    width: 80, height: 80, borderRadius: 40, opacity: 0.15,
  },
  catEmoji: { fontSize: 36, marginBottom: 12 },
  catIconBox: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  catLabel: {
    fontFamily: 'Rajdhani-Bold', fontSize: 18, letterSpacing: 1.5, marginBottom: 6,
  },
  catDesc: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: T.muted,
    textAlign: 'center', lineHeight: 15, marginBottom: 14,
  },
  catArrow: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },

  sheetFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 22,
  },
  sheetFooterText: {
    fontFamily: 'Inter-Regular', fontSize: 11, color: T.muted, letterSpacing: 0.2,
  },
});