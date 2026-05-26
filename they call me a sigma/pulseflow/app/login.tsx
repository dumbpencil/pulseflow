import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { colors } from '../src/constants/colors';
import { fonts } from '../src/constants/fonts';
import { spacing } from '../src/constants/spacing';

const VALID_EMAIL = 'athlete@pulseflow.io';
const VALID_PASSWORD = 'demo';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please enter your credentials.');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 600));

    if (email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD) {
      await SecureStore.setItemAsync('auth_token', 'mock-token-12345');
      const ob = await SecureStore.getItemAsync('onboarding_complete');
      router.replace(ob === 'true' ? '/' : '/onboarding/welcome');
    } else {
      setError('Invalid credentials. Try athlete@pulseflow.io / demo');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.wordmark}>PULSEFLOW</Text>
          <Text style={styles.subtitle}>Athlete Recovery</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.text.secondary}
            placeholder="athlete@pulseflow.io"
          />
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.text.secondary}
            placeholder="••••••••"
          />
          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />
        </View>

        <Text style={styles.hint}>Demo: athlete@pulseflow.io / demo</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.deep },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxxl },
  wordmark: {
    fontFamily: fonts.condensed,
    fontSize: 40,
    color: colors.accent.primary,
    letterSpacing: 6,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  form: { gap: spacing.sm },
  inputLabel: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  input: {
    height: 48,
    backgroundColor: colors.background.card,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    color: colors.text.primary,
    fontFamily: fonts.sans,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: { marginTop: spacing.lg },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.accent.danger,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
