// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Gamepad2, Dumbbell } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function NewDefiScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>CHOISIS TA CATÉGORIE</Text>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: T.gaming }]}
        onPress={() => navigation.navigate('GameSelect')}
        activeOpacity={0.85}
      >
        <Gamepad2 size={48} color="#fff" style={{ marginBottom: 12 }} />
        <Text style={styles.cardTitle}>GAMING</Text>
        <Text style={styles.cardSubtitle}>FIFA, PES, NBA 2K, NFS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: T.physique }]}
        onPress={() => navigation.navigate('PhysicalCategory')}
        activeOpacity={0.85}
      >
        <Dumbbell size={48} color="#fff" style={{ marginBottom: 12 }} />
        <Text style={styles.cardTitle}>PHYSIQUE</Text>
        <Text style={styles.cardSubtitle}>Force, Cardio, Abdos, Jambes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: T.fontTitle,
    fontSize: 28,
    color: T.text,
    letterSpacing: 3,
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    width: width - 48,
    height: 160,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTitle: {
    fontFamily: T.fontTitle,
    fontSize: 26,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});