import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';

interface PasswordCriteriaProps {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasMixedCase: boolean;
}

export const PasswordCriteriaCard: React.FC<PasswordCriteriaProps> = ({
  hasMinLength,
  hasNumber,
  hasMixedCase,
}) => {
  const renderItem = (label: string, valid: boolean) => (
    <View style={styles.itemRow}>
      <View style={[styles.circle, valid && styles.circleValid]}>
        {valid && <Check size={12} color="#FFFFFF" />}
      </View>
      <Text style={[styles.itemText, valid && styles.itemTextValid]}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Şifre Güvenlik Kriterleri:</Text>
      <View style={styles.grid}>
        {renderItem('En az 8 karakter', hasMinLength)}
        {renderItem('En az 1 rakam (0-9)', hasNumber)}
        {renderItem('Büyük ve küçük harf', hasMixedCase)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: 4,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E2738',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  circleValid: {
    backgroundColor: colors.success,
  },
  itemText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  itemTextValid: {
    color: colors.success,
    fontWeight: '600',
  },
});
