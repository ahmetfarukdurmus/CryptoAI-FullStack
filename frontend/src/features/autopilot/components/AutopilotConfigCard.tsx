import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sliders, Shield, TrendingUp } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Card } from '../../../shared/components/Card';
import { useApp, RiskProfileType } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

export const AutopilotConfigCard: React.FC = () => {
  const { autopilotSettings, updateAutopilotSettings } = useApp();
  const { colors, isDark } = useTheme();

  const riskProfiles: RiskProfileType[] = ['Muhafazakar', 'Dengeli', 'Agresif'];
  const stopLossOptions = [5, 10, 15];
  const takeProfitOptions = [10, 20, 30];

  return (
    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Sliders size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Otopilot Strateji Ayarları
          </Text>
        </View>
        <View style={[styles.activeRiskBadge, { backgroundColor: isDark ? 'rgba(0, 178, 254, 0.15)' : '#E0F2FE' }]}>
          <Text style={[styles.activeRiskBadgeText, { color: colors.primary }]}>
            {autopilotSettings.riskProfile}
          </Text>
        </View>
      </View>

      {/* Risk Profili Seçimi */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Risk Profili</Text>
      <View style={styles.chipRow}>
        {riskProfiles.map((profile) => {
          const isActive = autopilotSettings.riskProfile === profile;
          return (
            <Pressable
              key={profile}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? (isDark ? '#0F1E32' : '#E0F2FE')
                    : (isDark ? '#111722' : '#F1F5F9'),
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateAutopilotSettings({ riskProfile: profile })}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive
                      ? colors.primary
                      : (isDark ? '#8E9BAE' : '#334155'),
                  },
                ]}
              >
                {profile}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Otomatik Stop-Loss */}
      <View style={styles.labelRow}>
        <View style={styles.labelWithIcon}>
          <Shield size={14} color={colors.danger} />
          <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
            Otomatik Zarar-Kes (Stop-Loss)
          </Text>
        </View>
        <Text style={[styles.valueHighlight, { color: colors.danger }]}>
          -%{autopilotSettings.stopLossPercent}
        </Text>
      </View>
      <View style={styles.chipRow}>
        {stopLossOptions.map((pct) => {
          const isActive = autopilotSettings.stopLossPercent === pct;
          return (
            <Pressable
              key={pct}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? (isDark ? 'rgba(255, 59, 48, 0.2)' : '#FEE2E2')
                    : (isDark ? '#111722' : '#F1F5F9'),
                  borderColor: isActive ? colors.danger : colors.border,
                },
              ]}
              onPress={() => updateAutopilotSettings({ stopLossPercent: pct })}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive
                      ? colors.danger
                      : (isDark ? '#8E9BAE' : '#334155'),
                  },
                ]}
              >
                -%{pct}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Hedef Kâr Alma */}
      <View style={styles.labelRow}>
        <View style={styles.labelWithIcon}>
          <TrendingUp size={14} color={colors.success} />
          <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
            Hedef Kâr Alma (Take-Profit)
          </Text>
        </View>
        <Text style={[styles.valueHighlight, { color: colors.success }]}>
          +%{autopilotSettings.takeProfitPercent}
        </Text>
      </View>
      <View style={styles.chipRow}>
        {takeProfitOptions.map((pct) => {
          const isActive = autopilotSettings.takeProfitPercent === pct;
          return (
            <Pressable
              key={pct}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? (isDark ? 'rgba(0, 230, 118, 0.2)' : '#DCFCE7')
                    : (isDark ? '#111722' : '#F1F5F9'),
                  borderColor: isActive ? colors.success : colors.border,
                },
              ]}
              onPress={() => updateAutopilotSettings({ takeProfitPercent: pct })}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive
                      ? colors.success
                      : (isDark ? '#8E9BAE' : '#334155'),
                  },
                ]}
              >
                +%{pct}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    marginBottom: spacing.md,
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
  activeRiskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  activeRiskBadgeText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  label: {
    ...typography.captionBold,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueHighlight: {
    ...typography.captionBold,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...typography.captionBold,
    fontSize: 13,
  },
});
