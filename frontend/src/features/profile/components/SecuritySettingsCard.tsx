import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { typography, spacing } from '../../../shared/theme';
import { Card, Toggle } from '../../../shared/components';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

export const SecuritySettingsCard: React.FC = () => {
  const { sessionDaysRemaining, sessionExpiryDate, refreshSession } = useAuth();
  const { colors } = useTheme();

  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  const handleRefreshSession = async () => {
    await refreshSession();
    setSessionRefreshed(true);
    setTimeout(() => setSessionRefreshed(false), 2500);
  };

  return (
    <Card style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable style={styles.menuRow} onPress={handleRefreshSession}>
        <View>
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
            Oturum Süresi (Beni Hatırla)
          </Text>
          <Text style={[styles.subLabelText, { color: colors.textMuted }]}>
            Bitiş: {sessionExpiryDate} ({sessionDaysRemaining} gün kaldı)
          </Text>
        </View>
        <View style={styles.menuValueRow}>
          <Text style={[styles.menuValue, { color: sessionRefreshed ? colors.success : colors.primary }]}>
            {sessionRefreshed ? '✓ 30 Gün Uzatıldı' : '+30 Gün Uzat'}
          </Text>
        </View>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Pressable style={styles.menuRow}>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
          Google Authenticator (2FA)
        </Text>
        <View style={styles.menuValueRow}>
          <Text style={[styles.menuValue, { color: colors.success }]}>
            Açık
          </Text>
          <ChevronRight size={16} color={colors.textSecondary} />
        </View>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.menuRow}>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
          FaceID ile Giriş
        </Text>
        <Toggle value={faceIdEnabled} onValueChange={setFaceIdEnabled} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
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
  subLabelText: {
    ...typography.micro,
    marginTop: 2,
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
