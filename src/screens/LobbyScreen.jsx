import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Gamepad2, Trophy, TrendingUp, Timer, User, Shield, Skull, BarChart3, Dumbbell, Zap, Users, ChevronRight, Coins, Swords } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { DUEL_TYPES } from '../constants/duelTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CircularProgress from '../components/CircularProgress';
import StatCard from '../components/StatCard';
import Pill from '../components/Pill';
import CoteDisplay from '../components/CoteDisplay';
import { fmt } from '../utils/helpers';
import { T } from '../utils/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const FEATURED_DEFIS = [
  { id: "f1", game: "fifa", nom: "Victoire Amateur", mise: 500, cote: 1.10, color: "#60A5FA" },
  { id: "phy1", game: "physique", nom: "10 Pompes", mise: 300, cote: 1.10, color: "#FF6B00" },
  { id: "n1", game: "nba", nom: "Victoire Rookie", mise: 400, cote: 1.10, color: "#F97316" },
  { id: "p1", game: "pes", nom: "Victoire nette", mise: 500, cote: 1.10, color: "#22C55E" },
  { id: "phy8", game: "physique", nom: "30 Pompes", mise: 600, cote: 2.50, color: "#FF4444" },
];

export default function LobbyScreen({ history = [], pot = {}, activeBets = [], duoBets = [], onPlayBet, onPlayDuo, onNew, onRecap, onPhysique, walletBalance, onGoDuo }) {
  const insets = useSafeAreaInsets();
  const wins = history.filter(h => h.outcome === "win").length;
  const rate = history.length ? Math.round(wins / history.length * 100) : 0;
  const soloPending = activeBets || [];
  const duoPending = (duoBets || []).filter(d => d.status === "active" || d.status === "open");

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} style={{ flex: 1 }}>
        
        {/* 1. CTA Central avec Dé */}
        <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 30 }}>
          <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: T.physique + '20', borderWidth: 1, borderColor: T.gold + '30', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 40 }}>🎲</Text>
          </View>
          <Text style={{ fontFamily: T.fontTitle, fontSize: 24, color: T.text, letterSpacing: 2 }}>PRÊT À COMPÉTER ?</Text>
          <Text style={{ fontFamily: T.fontBody, fontSize: 12, color: T.muted, marginTop: 4 }}>Sélectionne ton défi ou lance-toi.</Text>

          <TouchableOpacity onPress={() => onNew && onNew()} activeOpacity={0.8} style={{ marginTop: 20, paddingHorizontal: 40, paddingVertical: 16, backgroundColor: T.gold, borderRadius: 60, borderWidth: 1, borderColor: T.gold + '40', shadowColor: T.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Zap size={22} color={T.bg} />
              <Text style={{ fontFamily: T.fontTitle, fontSize: 18, color: T.bg, letterSpacing: 2 }}>LANCER UN DÉFI</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Statistiques (2 colonnes) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 24 }}>
          <StatCard label="Duels joués" value={history.length} color={T.gold} icon={Gamepad2} width={STAT_CARD_WIDTH} />
          <StatCard label="Victoires" value={wins} color={T.success} icon={Trophy} width={STAT_CARD_WIDTH} />
          <View style={[styles.statCard, { width: STAT_CARD_WIDTH }]}>
            <Text style={styles.statLabel}>Taux réussite</Text>
            <CircularProgress value={rate} size={50} strokeWidth={4} color={T.gaming} />
          </View>
          <View style={[styles.statCard, { width: STAT_CARD_WIDTH }]}>
            <Text style={styles.statLabel}>Mon Solde</Text>
            <Text style={{ fontFamily: T.fontMono, fontSize: 20, fontWeight: '700', color: T.gold, marginTop: 8 }}>
              {walletBalance !== null ? fmt(walletBalance) + ' F' : '...'}
            </Text>
          </View>
        </View>

        {/* 3. Défis disponibles (carrousel horizontal) */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
            <Text style={{ fontFamily: T.fontTitle, fontSize: 17, color: T.text, letterSpacing: 1 }}>DÉFIS DISPONIBLES</Text>
            <TouchableOpacity onPress={() => onNew && onNew()}>
              <Text style={{ fontFamily: T.fontBody, color: T.gold, fontSize: 12 }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
            {FEATURED_DEFIS.map((defi) => (
              <TouchableOpacity key={defi.id} style={{ backgroundColor: T.card, borderRadius: T.radius, padding: 14, borderLeftWidth: 3, borderLeftColor: defi.color, width: 150 }} onPress={() => onNew && onNew(defi.game, defi)}>
                <Text style={{ fontFamily: T.fontTitle, fontSize: 14, color: T.text }} numberOfLines={1}>{defi.nom}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ fontFamily: T.fontMono, color: T.gold, fontWeight: '600' }}>×{defi.cote.toFixed(2)}</Text>
                  <Text style={{ fontFamily: T.fontBody, color: T.muted, fontSize: 12 }}>{fmt(defi.mise)} F</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. Catégories Rapides */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 24 }}>
          <TouchableOpacity style={[styles.categoryBtn, { backgroundColor: T.gaming }]} onPress={() => onNew && onNew()}>
            <Gamepad2 size={16} color={T.bg} />
            <Text style={[styles.categoryText, { color: T.bg }]}>GAMING</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.categoryBtn, { backgroundColor: T.physique }]} onPress={onPhysique}>
            <Dumbbell size={16} color="#FFF" />
            <Text style={[styles.categoryText, { color: '#FFF' }]}>PHYSIQUE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.categoryBtn, { backgroundColor: T.intellect }]} onPress={onGoDuo}>
            <Users size={16} color="#FFF" />
            <Text style={[styles.categoryText, { color: '#FFF' }]}>DUEL</Text>
          </TouchableOpacity>
        </View>

        {/* 5. File d'attente (SOLO + DUO) */}
        {(soloPending.length > 0 || duoPending.length > 0) && (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontFamily: T.fontBody, color: T.muted, marginBottom: 10, fontSize: 12 }}>
              <Timer size={14} color={T.muted} /> DÉFIS EN ATTENTE ({soloPending.length + duoPending.length})
            </Text>
            {soloPending.map(bet => (
              <TouchableOpacity key={bet.id} style={[styles.pendingCard, { borderLeftColor: GAMES[bet.game]?.color || T.gold }]} onPress={() => onPlayBet && onPlayBet(bet)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <User size={14} color={T.muted} />
                    <Text style={{ fontFamily: T.fontTitle, fontSize: 15, color: T.text }}>{bet.player}</Text>
                    <Pill label={PALIERS[bet.defi?.p]?.label || '?'} color={PALIERS[bet.defi?.p]?.color || T.gold} dim={PALIERS[bet.defi?.p]?.dim || T.card} />
                  </View>
                  <CoteDisplay cote={bet.cote} size={14} />
                </View>
                <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: T.muted, marginTop: 4 }}>
                  {GAMES[bet.game]?.label || ''} · {bet.defi?.nom} · Mise: {fmt(bet.mise)} F
                </Text>
              </TouchableOpacity>
            ))}
            {duoPending.map(duo => {
              const DuelIcon = DUEL_TYPES[duo.duelType]?.icon || Swords;
              return (
                <TouchableOpacity key={duo.id} style={[styles.pendingCard, { borderLeftColor: T.physique }]} onPress={() => onPlayDuo && onPlayDuo(duo)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Users size={14} color={T.physique} />
                      <Text style={{ fontFamily: T.fontTitle, fontSize: 15, color: T.text }}>{duo.player1} vs {duo.player2 || '?'}</Text>
                      {duo.duelType && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#3b82f620', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 }}>
                          <DuelIcon size={10} color="#60A5FA" />
                          <Text style={{ fontFamily: T.fontBody, fontSize: 10, color: '#60A5FA' }}>{DUEL_TYPES[duo.duelType]?.label}</Text>
                        </View>
                      )}
                    </View>
                    <CoteDisplay cote={2} size={14} />
                  </View>
                  <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: T.muted, marginTop: 4 }}>
                    {GAMES[duo.game]?.label || ''} · {duo.defi?.nom} · Mise: {fmt(duo.mise)} F chacun
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 6. Historique condensé */}
        {history.length > 0 && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: T.fontBody, color: T.muted, fontSize: 12, letterSpacing: 1 }}>HISTORIQUE RÉCENT</Text>
              <TouchableOpacity onPress={onRecap}><Text style={{ color: T.gold, fontSize: 12, fontFamily: T.fontBody }}>RÉCAP</Text></TouchableOpacity>
            </View>
            {history.slice(0, 5).map(h => {
              const isDuo = h.mode === "duo";
              const gain = Math.round(h.mise * (h.cote || 2));
              const win = h.outcome === "win";
              return (
                <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: T.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    {win ? <Trophy size={14} color={T.success} /> : <Skull size={14} color={T.danger} />}
                    <Text style={{ color: T.text, fontFamily: T.fontBody, fontSize: 13 }} numberOfLines={1}>
                      {isDuo ? `${h.player1} vs ${h.player2}` : h.player}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: '700', color: win ? T.success : T.danger }}>
                    {win ? '+' : '-'}{fmt(win ? gain : h.mise)} F
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: T.card,
    borderRadius: T.radiusSm,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  statLabel: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.muted,
    marginBottom: 4,
  },
  categoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: T.radiusSm,
  },
  categoryText: {
    fontFamily: T.fontTitle,
    fontSize: 13,
    letterSpacing: 1,
  },
  pendingCard: {
    backgroundColor: T.card,
    borderRadius: T.radiusSm,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
});