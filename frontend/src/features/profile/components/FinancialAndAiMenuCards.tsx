import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { typography, spacing } from '../../../shared/theme';
import { Card, Toggle } from '../../../shared/components';
import { useTheme } from '../../../context/ThemeContext';

export const FinancialAndAiMenuCards: React.FC = () => {
  const { colors } = useTheme();
  const [autopilotPermission, setAutopilotPermission] = useState(true);

  return (
    <View>
      {/* Bölüm: FİNANSAL İŞLEMLER */}
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        FİNANSAL İŞLEMLER
      </Text>
      <Card style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.menuRow}>
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
            Banka Hesaplarım
          </Text>
          <View style={styles.menuValueRow}>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
              2 Kayıtlı
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </View>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable style={styles.menuRow}>
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
            Komisyon Oranları
          </Text>
          <View style={styles.menuValueRow}>
            <Text style={[styles.menuValue, { color: colors.success }]}>
              %0.08
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </View>
        </Pressable>
      </Card>

      {/* Bölüm: YAPAY ZEKA VE OTOPİLOT */}
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        YAPAY ZEKA VE OTOPİLOT
      </Text>
      <Card style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.menuRow}>
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
            AI Risk Profili
          </Text>
          <View style={styles.menuValueRow}>
            <Text style={[styles.menuValue, { color: colors.primary }]}>
              Dengeli
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </View>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.menuRow}>
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
            Otopilot İşlem İzni
          </Text>
          <Toggle
            value={autopilotPermission}
            onValueChange={setAutopilotPermission}
          />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    ...typography.micro,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  menuCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  menuLabel: {
    ...typography.bodyBold,
  },
  menuValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuValue: {
    ...typography.body,
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
});
