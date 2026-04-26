import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { T } from '../utils/designTokens';

export default function AuthScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!phone || !name) {
      Alert.alert('Erreur', 'Nom et numéro requis');
      return;
    }
    setLoading(true);
    const formatted = phone.startsWith('+') ? phone : `+237${phone.replace(/^0+/, '')}`;
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatted,
      options: { shouldCreateUser: true, data: { name } }
    });
    if (error) Alert.alert('Erreur', error.message);
    else setStep('otp');
    setLoading(false);
  }

  async function handleVerify() {
    if (!code) return;
    setLoading(true);
    const formatted = phone.startsWith('+') ? phone : `+237${phone.replace(/^0+/, '')}`;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: code,
      type: 'sms'
    });
    if (error) Alert.alert('Erreur', error.message);
    else onLogin(data.user);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SKILL'Z</Text>
      {step === 'phone' ? (
        <>
          <TextInput style={styles.input} placeholder="Ton nom" placeholderTextColor={T.muted} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="+237 6XX XXX XXX" placeholderTextColor={T.muted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
            <Text style={styles.buttonText}>Recevoir un code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Code SMS" placeholderTextColor={T.muted} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('phone')}>
            <Text style={styles.link}>Modifier le numéro</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, justifyContent: 'center', padding: 24 },
  logo: { fontFamily: T.fontTitle, fontSize: 48, color: T.gold, textAlign: 'center', marginBottom: 40, letterSpacing: 4 },
  input: { backgroundColor: T.card, borderWidth: 1, borderColor: T.border, borderRadius: T.radiusSm, padding: 16, color: T.text, fontFamily: T.fontBody, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: T.gold, borderRadius: T.radiusSm, padding: 16, alignItems: 'center', marginBottom: 12 },
  buttonText: { fontFamily: T.fontTitle, fontSize: 18, color: T.bg, letterSpacing: 2 },
  link: { fontFamily: T.fontBody, color: T.muted, textAlign: 'center', marginTop: 12 },
});