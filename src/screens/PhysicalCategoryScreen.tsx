// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Dumbbell, Heart, Smile, Footprints, ArrowLeft } from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = [
  { key: 'force', label: 'FORCE', icon: Dumbbell, color: '#FF6B00' },
  { key: 'cardio', label: 'CARDIO', icon: Heart, color: '#FF3333' },
  { key: 'abdos', label: 'ABDOS', icon: Smile, color: '#FFAA00' },
  { key: 'jambes', label: 'JAMBES', icon: Footprints, color: '#FF6600' },
];

export default function PhysicalCategoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        style={[styles.card, { borderTopColor: item.color }]}
        onPress={() => navigation.navigate('DefiSelect', { gameKey: 'physique', category: item.key })}
        activeOpacity={0.8}
      >
        <Icon size={32} color={item.color} style={{ marginBottom: 10 }} />
        <Text style={styles.categoryLabel}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={T.text} />
      </TouchableOpacity>

      <FlatList
        data={CATEGORIES}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        numColumns={2}
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 10, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  categoryLabel: {
    fontFamily: T.fontTitle,
    fontSize: 18,
    fontWeight: '600',
    color: T.text,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: 160,
    backgroundColor: T.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    borderTopWidth: 4,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});