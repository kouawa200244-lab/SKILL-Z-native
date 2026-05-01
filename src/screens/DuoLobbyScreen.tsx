// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { ArrowLeft, User, Swords } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { DUEL_TYPES } from '../constants/duelTypes';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import CoteDisplay from '../components/CoteDisplay';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';

export default function DuoLobbyScreen() {
  const navigation = useNavigation();
  const { duoBets, activeBets } = useSession();

  // Duels ouverts (pas encore rejoints)
  const openDuos = duoBets?.filter(d => d.status === 'open') || [];

  const joinDuel = (duo) => {
    // Ajouter le joueur 2 et passer le duel en mode "active"
    // Pour simplifier, on demande directement le nom du joueur 2 ici
    const player2 = prompt('Ton nom ?'); // À remplacer par un vrai composant d'entrée
    if (player2) {
      // On ajoute le duel dans les paris actifs du joueur 2
      // Pour l'instant, nous allons simplement simuler en naviguant vers Live
      navigation.navigate('Live', { bet: { ...duo, player: player2, isDuo: true } });
    }
  };

  const renderDuo = ({ item }) => {
    const g = GAMES[item.game];
    const DuelIcon = DUEL_TYPES[item.duelType]?.icon || Swords;
    return (
      <View style={styles.duoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <DuelIcon size={20} color={T.physique} />
          <Text style={styles.duoPlayer}>{item.player1}</Text>
          <Text style={styles.vs}>VS</Text>
          <Text style={styles.duoPlayer}>???</Text>
        </View>
        <Text style={styles.duoInfo}>
          {g.label} · {item.defi?.nom}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={styles.duoMise}>Mise: {fmt(item.mise)} F chacun</Text>
          <CoteDisplay cote={2} size={14} />
        </View>
        <TouchableOpacity style={styles.joinButton} onPress={() => joinDuel(item)}>
          <Text style={styles.joinText}>REJOINDRE</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={styles.title}>ARÈNE DUEL</Text>
        <View style={{ width: 24 }} />
      </View>

      {openDuos.length === 0 ? (
        <View style={styles.empty}>
          <Swords size={48} color={T.muted} />
          <Text style={styles.emptyText}>Aucun duel ouvert pour le moment</Text>
        </View>
      ) : (
        <FlatList
          data={openDuos}
          renderItem={renderDuo}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14, borderBottomWidth: 1, borderColor: T.border },
  title: { fontFamily: T.fontTitle, fontSize: 22, color: T.physique, letterSpacing: 2 },
  list: { paddingHorizontal: 16, paddingTop: 20 },
  duoCard: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 16, marginBottom: 12 },
  duoPlayer: { fontFamily: T.fontTitle, fontSize: 18, color: T.text },
  vs: { fontFamily: T.fontBody, fontSize: 14, color: T.muted, marginHorizontal: 8 },
  duoInfo: { fontFamily: T.fontBody, fontSize: 13, color: T.muted },
  duoMise: { fontFamily: T.fontMono, fontSize: 14, color: T.gold },
  joinButton: { backgroundColor: T.physique, borderRadius: 8, paddingVertical: 10, marginTop: 12, alignItems: 'center' },
  joinText: { fontFamily: T.fontTitle, fontSize: 16, color: '#fff', letterSpacing: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: T.fontBody, fontSize: 14, color: T.muted, marginTop: 12 },
});