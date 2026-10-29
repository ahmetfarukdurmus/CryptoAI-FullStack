import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Card } from '../../../shared/components';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface LlmAnalysisCardProps {
  onPress?: () => void;
}

export const LlmAnalysisCard: React.FC<LlmAnalysisCardProps> = ({ onPress }) => {
  const { portfolio } = useApp();
  const { colors, isDark } = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card
        style={[
          styles.analysisCard,
          {
            backgroundColor: isDark ? '#0E1724' : '#F0F9FF',
            borderColor: isDark ? '#1D2A3D' : '#BAE6FD',
          },
        ]}
      >
        <View style={styles.analysisHeader}>
          <View
            style={[
              styles.emojiBox,
              { backgroundColor: isDark ? '#152233' : '#E0F2FE' },
            ]}
          >
            <Sparkles size={16} color={colors.primary} />
          </View>
          <View style={styles.titleColumn}>
            <Text style={[styles.analysisTitle, { color: colors.primary }]}>
              LLM Portföy Analizi
            </Text>
            <Text style={[styles.modelTag, { color: colors.textMuted }]}>
              Google Gemini 2.0 Flash
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.analysisBody,
            { color: isDark ? '#B0C0D4' : '#334155' },
          ]}
        >
          {portfolio.llmAnalysisText}
        </Text>

        <View style={[styles.chatActionRow, { borderTopColor: isDark ? '#1D2A3D' : '#E0F2FE' }]}>
          <Text style={[styles.chatActionText, { color: colors.primary }]}>
            Gemini ile Canlı Sohbet Başlat
          </Text>
          <ArrowRight size={14} color={colors.primary} />
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  analysisCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 8,
  },
  titleColumn: {
    flex: 1,
  },
  emojiBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitle: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  modelTag: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  analysisBody: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 20,
  },
  chatActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
  },
  chatActionText: {
    ...typography.captionBold,
    fontSize: 12,
  },
});
