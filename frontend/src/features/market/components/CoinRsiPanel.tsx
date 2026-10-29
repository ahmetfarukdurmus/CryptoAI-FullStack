import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';

interface CoinRsiPanelProps {
  value?: number;
}

export const CoinRsiPanel: React.FC<CoinRsiPanelProps> = ({ value = 62.4 }) => {
  const { colors, isDark } = useTheme();

  const getStatusText = (val: number) => {
    if (val >= 70) return 'Aşırı Alım';
    if (val <= 30) return 'Aşırı Satım';
    return 'Nötr / Alım';
  };

  return (
    <View
      style={[
        styles.rsiPanel,
        {
          backgroundColor: isDark ? '#0C131E' : '#F1F5F9',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.rsiHeader}>
        <Text style={[styles.rsiTitle, { color: colors.textSecondary }]}>
          RSI (14) Osilatörü
        </Text>
        <Text style={[styles.rsiValue, { color: colors.primary }]}>
          {value.toFixed(2)} ({getStatusText(value)})
        </Text>
      </View>

      <View style={styles.rsiBarTrack}>
        <View
          style={[
            styles.rsiZone,
            { left: 0, width: '30%', backgroundColor: 'rgba(0, 230, 118, 0.15)' },
          ]}
        />
        <View
          style={[
            styles.rsiZone,
            { left: '70%', width: '30%', backgroundColor: 'rgba(255, 59, 48, 0.15)' },
          ]}
        />
        <View style={[styles.rsiPointer, { left: `${Math.min(Math.max(value, 0), 100)}%` }]} />
      </View>

      <View style={styles.rsiLabelsRow}>
        <Text style={styles.rsiLabel}>0 (Aşırı Satım: 30)</Text>
        <Text style={styles.rsiLabel}>70 (Aşırı Alım)</Text>
        <Text style={styles.rsiLabel}>100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rsiPanel: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  rsiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rsiTitle: {
    ...typography.micro,
  },
  rsiValue: {
    ...typography.captionBold,
  },
  rsiBarTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  rsiZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  rsiPointer: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 12,
    backgroundColor: '#00B2FE',
    borderRadius: 2,
  },
  rsiLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rsiLabel: {
    ...typography.micro,
    color: '#64748B',
    fontSize: 9,
  },
});
