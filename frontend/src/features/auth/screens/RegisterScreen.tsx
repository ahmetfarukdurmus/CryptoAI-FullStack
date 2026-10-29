import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';
import { Button, Input, Header } from '../../../shared/components';
import { useAuth } from '../../../context/AuthContext';
import { AuthStackParamList } from '../../../navigation/navigation.types';
import { navigationRef } from '../../../navigation/RootNavigator';
import { PasswordCriteriaCard } from '../components/PasswordCriteriaCard';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavProp>();
  const { register, isLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    if (!hasMinLength || !hasNumber || !hasMixedCase) {
      setError('Lütfen tüm şifre kriterlerini karşılayın.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await register(firstName.trim(), lastName.trim(), email.trim(), password);

      // 6 Haneli OTP Kod Doğrulama ekranına yönlendir
      const targetEmail = email.trim().toLowerCase();
      navigation.navigate('OtpVerify', { email: targetEmail });
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.includes('zaten') ||
        msg.includes('already') ||
        msg.includes('mevcut') ||
        msg.includes('registered') ||
        msg.includes('400')
      ) {
        setError('Bu e-posta adresiyle zaten bir hesap mevcut, lütfen giriş yapın.');
      } else {
        setError(msg || 'Kayıt oluşturulurken bir hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header showBack onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            Yeni Hesap <Text style={styles.titleCyan}>Oluştur</Text>
          </Text>
          <Text style={styles.subtitle}>
            Aramıza katılın ve{' '}
            <Text style={styles.bonusGreen}>$10.000 Sanal Bakiye</Text> kazanın
          </Text>
        </View>

        <View style={styles.nameRow}>
          <View style={styles.halfInput}>
            <Input
              label="Ad"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Adınız"
              autoComplete="off"
              autoCorrect={false}
              leftIcon={<User size={18} color={colors.textSecondary} />}
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Soyad"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Soyadınız"
              autoComplete="off"
              autoCorrect={false}
            />
          </View>
        </View>

        <Input
          label="E-Posta Adresi"
          value={email}
          onChangeText={setEmail}
          placeholder="ornek@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          leftIcon={<Mail size={18} color={colors.textSecondary} />}
        />

        <Input
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="off"
          autoCorrect={false}
          leftIcon={<Lock size={18} color={colors.primary} />}
          rightIcon={
            showPassword ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )
          }
          onRightIconPress={() => setShowPassword(!showPassword)}
        />

        <PasswordCriteriaCard
          hasMinLength={hasMinLength}
          hasNumber={hasNumber}
          hasMixedCase={hasMixedCase}
        />

        <Input
          label="Şifre (Tekrar)"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Şifrenizi tekrar girin"
          secureTextEntry={!showPassword}
          autoComplete="off"
          autoCorrect={false}
          leftIcon={<Lock size={18} color={colors.textMuted} />}
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          title="Hesap Oluştur"
          onPress={handleRegister}
          loading={isSubmitting || isLoading}
          style={styles.submitButton}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya şununla devam et</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.googleContainer}>
          <Pressable style={styles.googleCircleButton} onPress={handleRegister}>
            <Text style={styles.googleIconText}>G</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Giriş Yapın</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  titleCyan: {
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bonusGreen: {
    color: colors.success,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: 'rgba(255, 59, 48, 0.35)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: '#FF453A',
    textAlign: 'center',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#18202E',
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  googleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  googleCircleButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#243044',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
