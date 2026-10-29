import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { History, Play } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Card } from '../../../shared/components/Card';
import { useTheme } from '../../../context/ThemeContext';
import { BacktestResultDto } from '../../../services/api/types';
import { BacktestMetricsGrid } from './BacktestMetricsGrid';
import { PERIOD_RESULTS } from '../constants/backtestData';

export const AutopilotBacktestCard: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState<'1M' | '3M' | '6M'>('6M');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResultDto>(PERIOD_RESULTS['6M']);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults(PERIOD_RESULTS[period]);
      setIsRunning(false);
    }, 600);
  };

  return (
    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <History size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Strateji Backtest Simülatörü
          </Text>
        </View>
        <Text
          style={[
            styles.academicBadge,
            {
              backgroundColor: isDark ? 'rgba(0, 178, 254, 0.15)' : '#E0F2FE',
              color: colors.primary,
            },
          ]}
        >
          LSTM+XGBoost
        </Text>
      </View>

      <Text style={[styles.desc, { color: colors.textSecondary }]}>
        Mevcut otopilot ayarlarını geçmiş borsa verileri üzerinde simüle ederek getiri ve risk metriklerini test edin.
      </Text>

      <View style={styles.periodRow}>
        {(['1M', '3M', '6M'] as const).map((p) => {
          const isActive = period === p;
          return (
            <Pressable
              key={p}
              style={[
                styles.periodBtn,
                {
                  backgroundColor: isActive
                    ? isDark ? '#0F1E32' : '#E0F2FE'
                    : isDark ? '#111722' : '#F1F5F9',
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {p === '1M' ? 'Son 1 Ay' : p === '3M' ? 'Son 3 Ay' : 'Son 6 Ay'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.runButton, { backgroundColor: isDark ? '#00B2FE' : '#0284C7' }]}
        onPress={handleRunSimulation}
        disabled={isRunning}
      >
        {isRunning ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.runRow}>
            <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.runText}>Simülasyonu Çalıştır</Text>
          </View>
        )}
      </Pressable>

      <BacktestMetricsGrid results={results} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  academicBadge: {
    ...typography.micro,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    fontWeight: '800',
  },
  desc: {
    ...typography.caption,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  runButton: {
    height: 42,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  runText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
