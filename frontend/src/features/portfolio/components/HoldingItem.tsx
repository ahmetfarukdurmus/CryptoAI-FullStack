import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import { HoldingDto } from '../../../services/api/types';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';

interface HoldingItemProps {
  holding: HoldingDto;
  onPress?: () => void;
  onAlarmPress?: () => void;
}

export const HoldingItem: React.FC<HoldingItemProps> = ({ holding, onPress, onAlarmPress }) => {
  const { colors, isDark } = useTheme();
  const isPositive = holding.changeUsd > 0.001;
  const isNegative = holding.changeUsd < -0.001;

  const formattedAmount = holding.amount.toLocaleString('tr-TR', {
    maximumFractionDigits: 6,
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.leftRow}>
        <View style={[styles.iconCircle, { backgroundColor: holding.color }]}>
          <Text style={styles.iconLetter}>{holding.iconLetter}</Text>
        </View>
        <View>
          <Text style={[styles.symbol, { color: colors.textPrimary }]}>{holding.symbol}</Text>
          <Text style={[styles.name, { color: colors.textSecondary }]}>
            {holding.isCash ? 'Kullanılabilir Nakit (USDT)' : `${formattedAmount} ${holding.symbol}`}
          </Text>
        </View>
      </View>

      <View style={styles.rightContainer}>
        <View style={styles.rightColumn}>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            ${holding.valueUsd.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {holding.isCash ? (
            <Text style={styles.cashDash}>Nakit Bakiye</Text>
          ) : (
            <View
              style={[
                styles.changeBadge,
                isPositive && styles.badgePositive,
                isNegative && styles.badgeNegative,
                !isPositive && !isNegative && { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  isPositive && styles.textPositive,
                  isNegative && styles.textNegative,
                  !isPositive && !isNegative && { color: colors.textSecondary },
                ]}
              >
                {isPositive
                  ? `+$${holding.changeUsd.toFixed(2)}`
                  : isNegative
                  ? `-$${Math.abs(holding.changeUsd).toFixed(2)}`
                  : '$0.00'}
                {holding.changePercent !== undefined
                  ? ` (${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%)`
                  : ''}
              </Text>
            </View>
          )}
        </View>

        {!holding.isCash && (
          <Pressable
            style={({ pressed }) => [
              styles.alarmBtn,
              {
                backgroundColor: isDark ? 'rgba(0, 230, 118, 0.12)' : 'rgba(0, 230, 118, 0.1)',
                borderColor: 'rgba(0, 230, 118, 0.3)',
              },
              pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              if (onAlarmPress) {
                onAlarmPress();
              } else if (onPress) {
                onPress();
              }
            }}
            hitSlop={8}
            accessibilityLabel={`${holding.symbol} Stop-Loss / Alarm Ekle`}
          >
            <Bell size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  symbol: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  name: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  alarmBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  value: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  cashDash: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  changeBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgePositive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
  },
  badgeNegative: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  changeText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  textPositive: {
    color: colors.success,
  },
  textNegative: {
    color: colors.danger,
  },
});
