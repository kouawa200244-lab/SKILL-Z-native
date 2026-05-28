// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Modal, Dimensions,
  TouchableWithoutFeedback, PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gamepad2, Dumbbell, ChevronRight, Zap, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../utils/designTokens';
import { navigate } from '../utils/navigationRef';

const { height: H } = Dimensions.get('window');
const SHEET_H    = 320;
const DRAG_CLOSE = 70;

const CATEGORIES = [
  {
    key:    'gaming',
    label:  'GAMING',
    sub:    'FIFA · PES · NBA 2K · Need for Speed',
    emoji:  '🎮',
    Icon:   Gamepad2,
    color:  T.gaming,
    route:  'GameSelect',
    params: {},
  },
  {
    key:    'physique',
    label:  'PHYSIQUE',
    sub:    'Pompes · Squats · Planche · Abdos',
    emoji:  '💪',
    Icon:   Dumbbell,
    color:  T.physique,
    route:  'PhysicalChallenges',
    params: { gameKey: 'physique' },
  },

  {
    key:    'duel',
    label:  'DUEL',
    sub:    'Affronte un ami sur un défi de ton choix',
    emoji:  '⚔️',
    Icon:   Gamepad2,
    color:  '#A855F7',
    route:  'DuoLobby',
    params: {},
  },
];

export default function CategoryPickerModal({ visible, onClose }) {
  const insets     = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOp  = useRef(new Animated.Value(0)).current;
  const dragY      = useRef(new Animated.Value(0)).current;
  const isClosing  = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      dragY.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOp, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0, tension: 80, friction: 14, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOp,  { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: SHEET_H, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const close = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    onClose();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DRAG_CLOSE) {
          close();
        } else {
          Animated.spring(dragY, {
            toValue: 0, tension: 150, friction: 10, useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  /* ✅ CLEF DU FIX — navigation IMMÉDIATE sans délai */
  const handleSelect = (cat) => {
    if (isClosing.current) return;

    // 1. Haptic immédiat
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 2. Fermer la modal IMMÉDIATEMENT
    close();

    // 3. Naviguer IMMÉDIATEMENT (pas de setTimeout, pas d'attente animation)
    navigate(cat.route, cat.params);
  };

  const sheetY = Animated.add(translateY, dragY);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.overlay, { opacity: overlayOp }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[
        styles.sheet,
        {
          paddingBottom: insets.bottom + 16,
          transform: [{ translateY: sheetY }],
        },
      ]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleZone}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NOUVEAU DÉFI</Text>
            <Text style={styles.title}>Quelle catégorie ?</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={close}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={T.muted} />
          </TouchableOpacity>
        </View>

        {/* Catégories */}
        <View style={styles.cats}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.Icon;
            return (
              /* ✅ TouchableOpacity avec hitSlop élargi pour meilleure détection */
              <TouchableOpacity
                key={cat.key}
                style={[styles.catBtn, { borderColor: cat.color + '40' }]}
                onPress={() => handleSelect(cat)}
                activeOpacity={0.75}
                hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
              >
                <View style={[styles.catOrb, { backgroundColor: cat.color }]} />

                <View style={styles.catLeft}>
                  <View style={[
                    styles.catIconBox,
                    { backgroundColor: cat.color + '18', borderColor: cat.color + '40' },
                  ]}>
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  </View>
                  <View style={styles.catTexts}>
                    <Text style={[styles.catLabel, { color: cat.color }]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.catSub} numberOfLines={1}>{cat.sub}</Text>
                  </View>
                </View>

                <View style={[
                  styles.catArrow,
                  { backgroundColor: cat.color + '15', borderColor: cat.color + '35' },
                ]}>
                  <ChevronRight size={18} color={cat.color} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Zap size={10} color={T.muted} />
          <Text style={styles.footerText}>
            Tu choisiras le défi précis à l'étape suivante
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
    position:        'absolute',
    bottom:          0, left: 0, right: 0,
    backgroundColor: '#0C0E15',
    borderTopLeftRadius:  26,
    borderTopRightRadius: 26,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: -8 },
    shadowOpacity:   0.5,
    shadowRadius:    24,
    elevation:       30,
  },

  handleZone: { alignItems: 'center', paddingTop: 14, paddingBottom: 8 },
  handle: {
    width:           36, height: 4,
    borderRadius:    2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   20,
  },
  eyebrow: {
    fontFamily:    'Inter-Regular',
    fontSize:      10, color: T.gold,
    fontWeight:    '800', letterSpacing: 2.5,
    marginBottom:  4,
  },
  title: {
    fontFamily: 'Rajdhani-Bold',
    fontSize:   26, color: '#EEEEF5',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width:          34, height: 34,
    borderRadius:   17,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth:    1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  cats: { gap: 12, marginBottom: 20 },

  catBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1219',
    borderRadius:   18, borderWidth: 1,
    paddingVertical: 18, paddingHorizontal: 18,
    overflow:       'hidden', position: 'relative',
    minHeight:      80, // ✅ zone de tap plus grande
  },
  catOrb: {
    position: 'absolute', top: -40, right: -40,
    width: 100, height: 100, borderRadius: 50, opacity: 0.12,
  },
  catLeft: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, flex: 1,
  },
  catIconBox: {
    width: 54, height: 54, borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  catEmoji: { fontSize: 28 },
  catTexts: { flex: 1 },
  catLabel: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 21, letterSpacing: 1.5, marginBottom: 3,
  },
  catSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11, color: T.muted,
  },
  catArrow: {
    width: 36, height: 36, borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },

  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11, color: T.muted,
  },
});