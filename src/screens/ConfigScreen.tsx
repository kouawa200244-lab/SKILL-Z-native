// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { ArrowLeft, Zap, Shield, Clock } from 'lucide-react-native';
import { GAMES } from '../constants/games';
import { PALIERS } from '../constants/paliers';
import { T } from '../utils/designTokens';
import { fmt, filet as calcFilet } from '../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';

export default function ConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { addToQueue } = useSession();

  const gameKey = route.params?.gameKey || 'fifa';
  const defi = route.params?.defi;
  const user = route.params?.user || { user_metadata: { name: 'Joueur' } };

  const [mise, setMise] = useState(1000);
  const [miseError, setMiseError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleMiseChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const val = Number(cleaned);
    if (cleaned === '') {
      setMise(0);
      setMiseError('');
      return;
    }
    if (val < 200) {
      setMiseError('Minimum 200 FCFA');
      setMise(val);
    } else if (val > 20000) {
      setMiseError('Maximum 20 000 FCFA');
      setMise(20000);
    } else {
      setMiseError('');
      setMise(val);
    }
  };

  if (!defi) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Aucun défi sélectionné</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const g = GAMES[gameKey] || {};
  const pc = PALIERS[defi.p] || {};
  const isPhysique = gameKey === 'physique';
  const accentColor = isPhysique ? T.physique : (g.color || T.gaming);

  const filet = calcFilet(mise, defi.cote);
  const gain = Math.round(mise * defi.cote);
  const ok = mise >= 200 && mise <= 20000;

  const handleStart = () => {
    if (!ok) {
      Alert.alert('Mise invalide', 'La mise doit être entre 200 et 20 000 FCFA.');
      return;
    }
    navigation.navigate('Live', {
      bet: {
        player: user?.user_metadata?.name || 'Joueur',
        game: gameKey,
        defi,
        mise,
        cote: defi.cote,
        isPhysique,
        userId: user?.id,
      },
    });
  };

  const handleAddToQueue = () => {
    if (!ok) {
      Alert.alert('Mise invalide', 'La mise doit être entre 200 et 20 000 FCFA.');
      return;
    }
    addToQueue({
      player: user?.user_metadata?.name || 'Joueur',
      mise,
      gameKey,
      defi,
    });
    navigation.navigate('HomeTab', { screen: 'Lobby' });
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.gameLabel, { color: accentColor }]}>{g.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card Défi */}
        <View style={styles.defiCard}>
          <View style={[styles.palierBadge, { backgroundColor: pc.dim, borderColor: pc.color + '40' }]}>
            <Text style={[styles.palierText, { color: pc.color }]}>{pc.label?.toUpperCase()}</Text>
          </View>
          <Text style={styles.defiNom}>{defi.nom}</Text>
          <Text style={[styles.coteText, { color: accentColor, textShadowColor: accentColor + '60' }]}>
            ×{defi.cote.toFixed(2)}
          </Text>
          <Text style={styles.defiCond}>{defi.cond}</Text>
          <View style={styles.tauxRow}>
            <Clock size={14} color={T.muted} />
            <Text style={styles.tauxText}>Réussite estimée : ~{defi.taux}%</Text>
          </View>
        </View>

        {/* Saisie de la mise */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>MISE EN FCFA</Text>
          <TextInput
            ref={inputRef}
            style={styles.miseInput}
            keyboardType="numeric"
            value={mise === 0 ? '' : String(mise)}
            onChangeText={handleMiseChange}
            placeholder="1000"
            placeholderTextColor="#555"
            maxLength={5}
          />
          {miseError ? (
            <Text style={styles.miseError}>{miseError}</Text>
          ) : (
            <Text style={styles.miseHint}>Min 200 · Max 20 000 FCFA</Text>
          )}
        </View>

        {/* Récap financier */}
        <View style={styles.recapCard}>
          <View style={styles.recapLine}>
            <Text style={styles.recapLabel}>Gain potentiel</Text>
            <Text style={[styles.recapValue, styles.gainValue]}>+{fmt(gain)} F</Text>
          </View>
          {filet > 0 && (
            <View style={styles.recapLine}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Shield size={14} color="#A855F7" />
                <Text style={[styles.recapLabel, { color: '#A855F7' }]}>Filet SKILL'Z</Text>
              </View>
              <Text style={[styles.recapValue, { color: '#A855F7' }]}>{fmt(filet)} F remboursés</Text>
            </View>
          )}
          <View style={styles.recapLine}>
            <Text style={styles.recapLabel}>Perte max</Text>
            <Text style={[styles.recapValue, { color: T.danger }]}>-{fmt(mise - filet)} F</Text>
          </View>
        </View>

        {/* Boutons intégrés dans le scroll */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: accentColor, shadowColor: accentColor }]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Zap size={20} color="#0F1217" />
          <Text style={styles.startText}>COMMENCER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.queueButton}
          onPress={handleAddToQueue}
          activeOpacity={0.7}
        >
          <Text style={styles.queueText}>AJOUTER À LA FILE D'ATTENTE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F1217',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 14,
    backgroundColor: '#0F1217',
    borderBottomWidth: 1,
    borderColor: T.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameLabel: {
    fontFamily: T.fontTitle,
    fontSize: 18,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  defiCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  palierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  palierText: {
    fontFamily: T.fontBody,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  defiNom: {
    fontFamily: T.fontTitle,
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  coteText: {
    fontFamily: T.fontMono,
    fontSize: 80,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 16,
  },
  defiCond: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  tauxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tauxText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.muted,
  },
  inputSection: {
    marginTop: 28,
  },
  inputLabel: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.muted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  miseInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontFamily: T.fontMono,
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  miseError: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.danger,
    marginTop: 6,
    textAlign: 'center',
  },
  miseHint: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: '#555',
    marginTop: 6,
    textAlign: 'center',
  },
  recapCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 20,
    marginTop: 28,
  },
  recapLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  recapLabel: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.muted,
  },
  recapValue: {
    fontFamily: T.fontMono,
    fontSize: 18,
    fontWeight: '700',
    color: T.text,
  },
  gainValue: {
    fontSize: 36,
    color: '#00E676',
    fontWeight: '900',
  },
  startButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startText: {
    fontFamily: T.fontTitle,
    fontSize: 18,
    color: '#0F1217',
    letterSpacing: 2,
  },
  queueButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  queueText: {
    fontFamily: T.fontTitle,
    fontSize: 16,
    color: T.muted,
    letterSpacing: 1,
  },
  errorText: {
    color: T.text,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    fontFamily: T.fontBody,
  },
  backLink: {
    color: T.gold,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: T.fontBody,
  },
});