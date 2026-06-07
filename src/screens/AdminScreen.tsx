// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  Users,
  Coins,
  TrendingUp,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { T } from '../utils/designTokens';
import { fmt } from '../utils/helpers';
import { supabase } from '../supabaseClient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function AdminScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalBets: 0,
    totalVolume: 0,
    pendingWithdrawals: 0,
    pendingModeration: 0,
  });
  const [recentBets, setRecentBets] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      // Stats globales
      const { count: playersCount } = await supabase.from('players').select('*', { count: 'exact', head: true });
      const { count: betsCount } = await supabase.from('bets').select('*', { count: 'exact', head: true });
      const { count: withdrawalsCount } = await supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: moderationCount } = await supabase.from('moderation_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: volumeData } = await supabase.from('transactions').select('amount').eq('type', 'bet_placed');
      const totalVolume = volumeData?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      setStats({
        totalPlayers: playersCount || 0,
        totalBets: betsCount || 0,
        totalVolume,
        pendingWithdrawals: withdrawalsCount || 0,
        pendingModeration: moderationCount || 0,
      });

      // 10 derniers paris
      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentBets(bets || []);

      // Demandes de retrait en attente
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*, players(name, phone)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setPendingRequests(withdrawals || []);

    } catch (e) {
      console.error('Admin load error:', e);
    }
    setLoading(false);
  }

  async function handleWithdrawal(requestId: string, action: 'approved' | 'rejected') {
    await supabase
      .from('withdrawal_requests')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    loadAdminData();
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={T.gold} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADMIN DASHBOARD</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['overview', 'bets', 'withdrawals'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'overview' ? 'Vue d\'ensemble' : tab === 'bets' ? 'Paris' : 'Retraits'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'overview' && (
          <>
            {/* KPIs */}
            <View style={styles.kpiGrid}>
              <KpiCard icon={Users} label="Joueurs" value={stats.totalPlayers} color={T.gaming} />
              <KpiCard icon={TrendingUp} label="Paris" value={stats.totalBets} color={T.gold} />
              <KpiCard icon={Coins} label="Volume" value={`${fmt(stats.totalVolume)} F`} color={T.physique} />
              <KpiCard icon={AlertTriangle} label="Modération" value={stats.pendingModeration} color={T.danger} />
            </View>

            {/* Demande de retraits urgentes */}
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏳ Retraits en attente ({pendingRequests.length})</Text>
                {pendingRequests.slice(0, 3).map(req => (
                  <View key={req.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{req.players?.name || 'Joueur'}</Text>
                    <Text style={styles.cardSub}>{req.phone} · {fmt(req.amount)} FCFA</Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: T.success }]}
                        onPress={() => handleWithdrawal(req.id, 'approved')}
                      >
                        <CheckCircle size={16} color="#fff" />
                        <Text style={styles.actionText}>Approuver</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: T.danger }]}
                        onPress={() => handleWithdrawal(req.id, 'rejected')}
                      >
                        <XCircle size={16} color="#fff" />
                        <Text style={styles.actionText}>Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'bets' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Derniers paris</Text>
            {recentBets.map(bet => (
              <View key={bet.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.cardTitle}>{bet.player_name}</Text>
                  <Text style={[styles.badge, { color: bet.outcome === 'win' ? T.success : T.danger }]}>
                    {bet.outcome === 'win' ? 'Gagné' : 'Perdu'}
                  </Text>
                </View>
                <Text style={styles.cardSub}>{bet.game} · {bet.defi_nom} · Mise: {fmt(bet.mise)} F</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'withdrawals' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💸 Demandes de retrait</Text>
            {pendingRequests.length === 0 && (
              <Text style={styles.emptyText}>Aucune demande en attente.</Text>
            )}
            {pendingRequests.map(req => (
              <View key={req.id} style={styles.card}>
                <Text style={styles.cardTitle}>{req.players?.name || 'Joueur'}</Text>
                <Text style={styles.cardSub}>{req.phone} · {fmt(req.amount)} FCFA</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: T.success }]}
                    onPress={() => handleWithdrawal(req.id, 'approved')}
                  >
                    <Text style={styles.actionText}>Approuver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: T.danger }]}
                    onPress={() => handleWithdrawal(req.id, 'rejected')}
                  >
                    <Text style={styles.actionText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Petit composant KPI
function KpiCard({ icon: Icon, label, value, color }: any) {
  return (
    <View style={styles.kpiCard}>
      <Icon size={24} color={color} style={{ marginBottom: 8 }} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14, borderBottomWidth: 1, borderColor: T.border },
  headerTitle: { fontFamily: T.fontTitle, fontSize: 22, color: T.gold, letterSpacing: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: T.card, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  activeTab: { backgroundColor: T.goldDim, borderColor: T.gold },
  tabText: { fontFamily: T.fontBody, fontSize: 13, color: T.muted },
  activeTabText: { color: T.gold, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  kpiCard: { width: (width - 52) / 2, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 16, alignItems: 'center' },
  kpiValue: { fontFamily: T.fontMono, fontSize: 22, fontWeight: '700', color: T.text },
  kpiLabel: { fontFamily: T.fontBody, fontSize: 11, color: T.muted, marginTop: 4 },
  section: { marginTop: 24 },
  sectionTitle: { fontFamily: T.fontTitle, fontSize: 18, color: T.text, marginBottom: 12, letterSpacing: 1 },
  card: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 14, marginBottom: 8 },
  cardTitle: { fontFamily: T.fontTitle, fontSize: 16, color: T.text },
  cardSub: { fontFamily: T.fontBody, fontSize: 13, color: T.muted, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  actionText: { fontFamily: T.fontTitle, fontSize: 14, color: '#fff', letterSpacing: 1 },
  badge: { fontFamily: T.fontBody, fontSize: 12, fontWeight: '600' },
  emptyText: { fontFamily: T.fontBody, fontSize: 14, color: T.muted, textAlign: 'center', marginTop: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
});