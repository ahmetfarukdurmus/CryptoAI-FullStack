import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Card } from '../../../shared/components';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

export const AutopilotStatusHeader: React.FC = () => {
  const { autopilot, toggleAutopilot } = useApp();
  const { colors, isDark } = useTheme();

  return (
    <View>
      {/* Otopilot Durum Kartı */}
      <Card variant="active" style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.pulsingRow}>
            <View
              style={[
                styles.pulseDot,
                !autopilot.isRunning && styles.pulseDotInactive,
              ]}
            />
            <Text style={[styles.statusText, { color: colors.textPrimary }]}>
              {autopilot.isRunning ? 'Otopilot Çalışıyor' : 'Otopilot Durduruldu'}
            </Text>
          </View>

          <Pressable
            style={[
              styles.stopButton,
              {
                backgroundColor: isDark ? '#0F1A28' : '#E0F2FE',
                borderColor: isDark ? 'rgba(0, 178, 254, 0.3)' : colors.primary,
              },
            ]}
            onPress={toggleAutopilot}
            hitSlop={8}
          >
            <Text style={[styles.stopButtonText, { color: colors.primary }]}>
              {autopilot.isRunning ? 'DURDUR' : 'BAŞLAT'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

        <Text style={[styles.engineLabel, { color: colors.textSecondary }]}>
          Aktif Karar Motoru:
        </Text>
        <Text style={[styles.engineName, { color: colors.success }]}>
          {autopilot.activeModelName}
        </Text>
      </Card>

      {/* 24S Performans İstatistikleri */}
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        OTOPİLOT PERFORMANSI (24S)
      </Text>
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Gerçekleşen Kâr
          </Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            +${autopilot.realizedProfit24h.toFixed(2)}
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Model Başarı Oranı
          </Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            %{autopilot.successRatePercent}{' '}
            <Text style={[styles.tradeCount, { color: colors.textMuted }]}>
              ({autopilot.totalTradesCount} İşlem)
            </Text>
          </Text>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulsingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B2FE',
  },
  pulseDotInactive: {
    backgroundColor: '#64748B',
  },
  statusText: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  stopButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  stopButtonText: {
    ...typography.captionBold,
  },
  cardDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  engineLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  engineName: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  sectionHeader: {
    ...typography.micro,
    marginBottom: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    flex: 1,
    padding: spacing.md,
    marginBottom: 0,
  },
  metricLabel: {
    ...typography.caption,
    marginBottom: 6,
  },
  metricValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  tradeCount: {
    ...typography.caption,
  },
});
