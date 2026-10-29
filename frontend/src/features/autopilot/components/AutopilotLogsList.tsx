import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../../../shared/theme';
import { Card } from '../../../shared/components';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

export const AutopilotLogsList: React.FC = () => {
  const { autopilot } = useApp();
  const { colors } = useTheme();

  return (
    <View>
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        SON AI İŞLEMLERİ (LOG)
      </Text>

      {autopilot.logs.map((log) => {
        const isSell = log.type === 'SELL';
        return (
          <Card key={log.id} style={styles.logCard}>
            <View
              style={[
                styles.leftAccentBar,
                { backgroundColor: isSell ? colors.success : colors.primary },
              ]}
            />
            <View style={styles.logContent}>
              <View style={styles.logTopRow}>
                <Text style={[styles.logTitle, { color: colors.textPrimary }]}>
                  {log.title}
                </Text>
                <Text
                  style={[
                    styles.logAmount,
                    { color: isSell ? colors.success : colors.textPrimary },
                  ]}
                >
                  {log.amountInfo}
                </Text>
              </View>

              <View style={styles.logBottomRow}>
                <Text
                  style={[styles.logReason, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {log.reason}
                </Text>
                <Text style={[styles.logTime, { color: colors.textMuted }]}>
                  {log.time}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    ...typography.micro,
    marginBottom: spacing.sm,
  },
  logCard: {
    padding: 0,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  leftAccentBar: {
    width: 4,
    height: '100%',
  },
  logContent: {
    flex: 1,
    padding: spacing.md,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logTitle: {
    ...typography.bodyBold,
  },
  logAmount: {
    ...typography.captionBold,
  },
  logBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logReason: {
    ...typography.caption,
    flex: 1,
    marginRight: spacing.sm,
  },
  logTime: {
    ...typography.micro,
  },
});
