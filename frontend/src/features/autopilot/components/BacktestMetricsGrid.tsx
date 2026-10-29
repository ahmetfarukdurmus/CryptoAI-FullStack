import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';
import { BacktestResultDto } from '../../../services/api/types';

interface BacktestMetricsGridProps {
  results: BacktestResultDto;
}

export const BacktestMetricsGrid: React.FC<BacktestMetricsGridProps> = ({ results }) => {
  const { colors, isDark } = useTheme();

  return (
    <View>
      {/* Sonuç Metrikleri Grid */}
      <View style={styles.metricsGrid}>
        <View
          style={[
            styles.metricBox,
            { backgroundColor: isDark ? '#0C131E' : '#F8FAFC', borderColor: colors.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Kümülatif Getiri
          </Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            +%{results.totalReturnPercent.toFixed(1)}
          </Text>
        </View>

        <View
          style={[
            styles.metricBox,
            { backgroundColor: isDark ? '#0C131E' : '#F8FAFC', borderColor: colors.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Başarı (Win Rate)
          </Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            %{results.winRatePercent.toFixed(1)}
          </Text>
        </View>

        <View
          style={[
            styles.metricBox,
            { backgroundColor: isDark ? '#0C131E' : '#F8FAFC', borderColor: colors.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Maks. Kayıp (MDD)
          </Text>
          <Text style={[styles.metricValue, { color: colors.danger }]}>
            -%{results.maxDrawdownPercent.toFixed(2)}
          </Text>
        </View>

        <View
          style={[
            styles.metricBox,
            { backgroundColor: isDark ? '#0C131E' : '#F8FAFC', borderColor: colors.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Sharpe Oranı
          </Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {results.sharpeRatio.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Mini Portföy Büyüme Eğrisi (Equity Curve) */}
      <View style={[styles.chartWrapper, { borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
            Portföy Büyüme Eğrisi ($10.000 → ${results.finalCapitalUsd.toLocaleString()})
          </Text>
        </View>
        <Svg width="100%" height="55" viewBox="0 0 300 55">
          <Path
            d="M0,50 Q40,45 80,38 T160,25 T240,15 T300,5"
            fill="none"
            stroke="#00E676"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricBox: {
    width: '48%',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  metricLabel: {
    ...typography.micro,
    marginBottom: 4,
  },
  metricValue: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  chartWrapper: {
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  chartHeader: {
    marginBottom: 4,
  },
  chartTitle: {
    ...typography.micro,
    fontSize: 10,
  },
});
