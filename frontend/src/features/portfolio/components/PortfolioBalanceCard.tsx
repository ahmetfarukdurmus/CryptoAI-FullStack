import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../../../shared/theme';
import { Card, Badge } from '../../../shared/components';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

export const PortfolioBalanceCard: React.FC = () => {
  const { portfolio } = useApp();
  const { colors } = useTheme();

  const isPositive = portfolio.dailyChangeUsd > 0.001;
  const isNegative = portfolio.dailyChangeUsd < -0.001;
  const changeLabel = isPositive
    ? `+ $${portfolio.dailyChangeUsd.toFixed(2)}`
    : isNegative
    ? `- $${Math.abs(portfolio.dailyChangeUsd).toFixed(2)}`
    : `$0.00`;

  return (
    <Card style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.balanceHeader}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          Toplam Sanal Bakiye
        </Text>
        {portfolio.isAutopilotActive && (
          <Badge label="● Otopilot Açık" variant="autopilot" />
        )}
      </View>

      <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>
        ${portfolio.totalBalanceUsd.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>

      <View style={styles.changeRow}>
        <Badge
          label={changeLabel}
          variant={isPositive ? 'profit' : isNegative ? 'loss' : 'neutral'}
        />
        <Text style={[styles.changePeriod, { color: colors.textSecondary }]}>
          Bugün
        </Text>
      </View>

      {/* Varlık Dağılım Çubuğu (Portföydeki gerçek varlıklara göre dinamik) */}
      <View style={styles.allocationBar}>
        {portfolio.holdings && portfolio.holdings.length > 0 ? (
          portfolio.holdings.map((h, idx) => (
            <View
              key={h.symbol + idx}
              style={[
                styles.allocSegment,
                {
                  flex: Math.max(h.valueUsd, 1),
                  backgroundColor: h.color || colors.primary,
                },
              ]}
            />
          ))
        ) : (
          <View style={[styles.allocSegment, { flex: 1, backgroundColor: colors.primary }]} />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    ...typography.body,
  },
  balanceAmount: {
    ...typography.heroPrice,
    marginVertical: spacing.xs,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  changePeriod: {
    ...typography.caption,
  },
  allocationBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 4,
  },
  allocSegment: {
    height: '100%',
    borderRadius: 3,
  },
});
