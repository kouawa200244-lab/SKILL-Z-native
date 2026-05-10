// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../utils/designTokens';
import { supabase } from '../supabaseClient';

export default function AdminScreen() {
  const [stats, setStats] = useState({ users: 0, totalBets: 0, totalGains: 0, totalPot: 0 });
  const [recentBets, setRecentBets] = useState([]);

  useEffect(() => {
    // Récupérer les statistiques globales
    const fetchStats = async () => {
      const { count: users } = await supabase.from('players').select('*', { count: 'exact', head: true });
      const { count: totalBets } = await supabase.from('bets').select('*', { count: 'exact', head: true });
      const { data: bets } = await supabase.from('bets').select('gain, mise');
      const totalGains = bets?.reduce((sum, b) => sum + (b.gain || 0), 0) || 0;
      const totalPot = bets?.reduce((sum, b) => sum + (b.mise || 0), 0) || 0;

      setStats({ users: users || 0, totalBets: totalBets || 0, totalGains, totalPot });

      const { data: recent } = await supabase.from('bets').select('*').order('created_at', { ascending: false }).limit(10);
      setRecentBets(recent || []);
    };

    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>DASHBOARD ADMIN</Text>
      <View style={styles.statsGrid}>
        <StatBox label="Joueurs" value={stats.users} />
        <StatBox label="Paris joués" value={stats.totalBets} />
        <StatBox label="Gains payés" value={`${stats.totalGains} F`} />
        <StatBox label="Pot total" value={`${stats.totalPot} F`} />
      </View>
      <Text style={styles.subtitle}>DERNIERS PARIS</Text>
      {recentBets.map((bet) => (
        <View key={bet.id} style={styles.betRow}>
          <Text style={styles.betPlayer}>{bet.player_name}</Text>
          <Text style={styles.betGame}>{bet.game} · {bet.defi_nom}</Text>
          <Text style={[styles.betOutcome, { color: bet.outcome === 'win' ? '#00E676' : '#FF3D3D' }]}>
            {bet.outcome === 'win' ? `+${bet.gain} F` : `-${bet.mise} F`}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor:T.bg, padding:20, paddingTop:60 },
  title: { fontFamily:T.fontTitle, fontSize:28, color:T.text, textAlign:'center', marginBottom:24 },
  subtitle: { fontFamily:T.fontTitle, fontSize:20, color:T.gold, marginTop:24, marginBottom:12 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:10 },
  statBox: { flex:1, minWidth:'45%', backgroundColor:T.card, borderRadius:12, padding:16, borderWidth:1, borderColor:T.border },
  statLabel: { fontFamily:T.fontBody, fontSize:12, color:T.muted },
  statValue: { fontFamily:T.fontMono, fontSize:24, fontWeight:'700', color:T.gold, marginTop:6 },
  betRow: { backgroundColor:T.card, borderRadius:10, padding:14, marginBottom:8, borderWidth:1, borderColor:T.border },
  betPlayer: { fontFamily:T.fontTitle, fontSize:16, color:T.text },
  betGame: { fontFamily:T.fontBody, fontSize:13, color:T.muted, marginTop:4 },
  betOutcome: { fontFamily:T.fontMono, fontSize:15, fontWeight:'700', marginTop:6 },
});