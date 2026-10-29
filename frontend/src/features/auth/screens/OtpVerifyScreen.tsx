import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';
import { Button, Header } from '../../../shared/components';
import { useAuth } from '../../../context/AuthContext';
import { AuthStackParamList } from '../../../navigation/navigation.types';
import { navigationRef } from '../../../navigation/RootNavigator';

type OtpNavProp = NativeStackNavigationProp<AuthStackParamList, 'OtpVerify'>;
type OtpRouteProp = RouteProp<AuthStackParamList, 'OtpVerify'>;

export const OtpVerifyScreen: React.FC = () => {
  const navigation = useNavigation<OtpNavProp>();
  const route = useRoute<OtpRouteProp>();
  const { verifyOtp, resendOtp, isLoading } = useAuth();

  const email = route.params?.email || 'ornek@email.com';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (code.length < 6) {
      setError('Lütfen 6 haneli doğrulama kodunun tamamını girin.');
      return;
    }
    setError('');
    try {
      await verifyOtp(email, code);
      // Başarılı doğrulama sonrası AuthContext token kaydedecek ve RootNavigator MainTabNavigator'a geçecek
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Doğrulama kodu hatalı veya süresi dolmuş.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    const success = await resendOtp(email);
    if (success) {
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 3000);
    } else {
      setError('Kod tekrar gönderilirken bir sorun oluştu.');
    }
  };

  return (
    <View style={styles.screen}>
      <Header showBack onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.iconCircle}>
          <ShieldCheck size={36} color={colors.primary} />
        </View>

        <Text style={styles.title}>E-Postanızı Doğrulayın</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.boldEmail}>{email}</Text> adresine gönderilen 6 haneli güvenlik kodunu girin.
        </Text>

        {/* 6 Haneli OTP Kod Giriş Alanı */}
        <Pressable style={styles.otpBoxesRow} onPress={() => inputRef.current?.focus()}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const digit = code[index] || '';
            const isCurrent = code.length === index;
            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  isCurrent && styles.otpBoxActive,
                  digit ? styles.otpBoxFilled : null,
                ]}
              >
                <Text style={styles.otpDigitText}>{digit}</Text>
              </View>
            );
          })}
        </Pressable>

        {/* Gizli Gerçek TextInput */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={(val) => {
            const numeric = val.replace(/\D/g, '').slice(0, 6);
            setCode(numeric);
            setError('');
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus={true}
          autoComplete="off"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {resendSuccess ? (
          <Text style={styles.successText}>✓ Yeni doğrulama kodu e-postanıza gönderildi!</Text>
        ) : null}

        <Button
          title="Hesabı Doğrula ve Başlat"
          onPress={handleVerify}
          loading={isLoading}
          style={styles.submitBtn}
          icon={<Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>→</Text>}
        />

        {/* Tekrar Kod Gönder Butonu & Sayacı */}
        <View style={styles.resendContainer}>
          <Pressable
            style={styles.resendButton}
            onPress={handleResend}
            disabled={resendCooldown > 0}
          >
            <Text style={{ fontSize: 15, color: resendCooldown > 0 ? colors.textMuted : colors.primary }}>
              ↺
            </Text>
            <Text
              style={[
                styles.resendText,
                { color: resendCooldown > 0 ? colors.textMuted : colors.primary },
              ]}
            >
              {resendCooldown > 0
                ? `Tekrar Kod Gönder (${resendCooldown}s)`
                : 'Kodu Tekrar Gönder'}
            </Text>
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
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 178, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 178, 254, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    maxWidth: 320,
    lineHeight: 22,
  },
  boldEmail: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: '#121824',
    borderWidth: 1.5,
    borderColor: '#243044',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: colors.primary,
    backgroundColor: '#0F1A28',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
  },
  otpDigitText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successText: {
    ...typography.captionBold,
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendText: {
    ...typography.captionBold,
    fontSize: 13,
  },
});
