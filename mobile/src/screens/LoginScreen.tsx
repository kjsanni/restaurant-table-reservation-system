import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth';
import { connectSocket } from '../services/socket';
import { brandColors } from '../theme/colors';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    const ok = await login(email, password);
    if (ok) {
      connectSocket(global.__AUTH_TOKEN__);
    } else if (error) {
      Alert.alert('Login failed', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>RTRS Staff</Text>
        <Text style={styles.subtitle}>Restaurant Table Reservation System</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {isLoading ? (
            <ActivityIndicator size="large" color={brandColors.brand600} />
          ) : (
            <Button title="Sign In" color={brandColors.brand600} onPress={handleLogin} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: brandColors.brand700,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: brandColors.surface,
    color: brandColors.textPrimary,
  },
});
