import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T } from '../utils/designTokens';
import { Dumbbell } from 'lucide-react-native';

export default function AuthScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone.trim() || !name.trim()) {
      Alert.alert('Erreur', 'Le nom et le numéro sont requis.');
      return;
    }

    setLoading(true);

    // Formatage du numéro
    let formatted = phone.trim();
    if (!formatted.startsWith('+')) {
      formatted = '+237' + formatted.replace(/^0+/, '');
    }

    // Simule une connexion : on stocke simplement l'utilisateur localement
    const user = {
      id: Date.now().toString(),
      phone: formatted,
      user_metadata: { name: name.trim() },
    };

    try {
      await AsyncStorage.setItem('skillz_user', JSON.stringify(user));
      onLogin(user);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la session.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo simple */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Dumbbell size={40} color={T.gold} />
          </View>
          <Text style={styles.logoText}>SKILL'Z</Text>
          <Text style={styles.subtitle}>Entre tes infos pour jouer</Text>
        </View>

        {/* Champ Nom */}
        <TextInput
          style={styles.input}
          placeholder="Ton nom"
          placeholderTextColor={T.muted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

        {/* Champ Téléphone */}
        <TextInput
          style={styles.input}
          placeholder="+237 6XX XXX XXX"
          placeholderTextColor={T.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />

        {/* Bouton Jouer */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={T.textInverse} />
          ) : (
            <Text style={styles.buttonText}>JOUER</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Si tu as déjà joué, entre le même numéro pour retrouver ton profil.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.goldDim,
    borderWidth: 2,
    borderColor: T.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontFamily: T.fontTitle,
    fontSize: 48,
    color: T.gold,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.muted,
    marginTop: 8,
  },
  input: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radiusSm,
    padding: 16,
    color: T.text,
    fontFamily: T.fontBody,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: T.gold,
    borderRadius: T.radiusSm,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: T.fontTitle,
    fontSize: 20,
    color: T.textInverse,
    letterSpacing: 2,
  },
  footer: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.muted,
    textAlign: 'center',
    opacity: 0.7,
  },
});