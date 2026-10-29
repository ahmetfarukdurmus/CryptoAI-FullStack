import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Bot, Sliders, Shield, Zap } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';
import { Header, Input, Toggle, Button, Card } from '../../../shared/components';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';
import { RootStackParamList } from '../../../navigation/navigation.types';

type RouteType = RouteProp<RootStackParamList, 'NewAlarm'>;

export const NewAlarmScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { coins, createAlarm } = useApp();
  const { colors, isDark } = useTheme();

  const symbol = route.params?.symbol || 'ETH';
  const coin = coins.find((c) => c.symbol === symbol) || coins[1];

  const [triggerType, setTriggerType] = useState<'price' | 'ai'>('price');
  const [targetPrice, setTargetPrice] = useState('2.600');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // AI Sinyali Alanları
  const [aiSignalTarget, setAiSignalTarget] = useState<'GÜÇLÜ AL' | 'AL' | 'SAT' | 'GÜÇLÜ SAT'>('GÜÇLÜ AL');
  const [aiConfidenceMin, setAiConfidenceMin] = useState<number>(80);
  const [aiTimeHorizon, setAiTimeHorizon] = useState<'1S' | '4S' | '24S'>('4S');

  const [sendNotification, setSendNotification] = useState(true);
  const [autoExecute, setAutoExecute] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await createAlarm({
      symbol: coin.symbol,
      targetPrice: triggerType === 'price' ? (parseFloat(targetPrice.replace('.', '')) || 2600) : coin.priceUsd,
      condition,
      sendNotification,
      autoSellAutopilot: autoExecute,
      sellPercentage: 25,
    });
    setIsSaving(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title="Yeni Alarm & Otopilot"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Varlık Başlığı */}
        <View style={styles.assetHeader}>
          <View style={[styles.assetCircle, { backgroundColor: coin.color }]}>
            <Text style={styles.assetLetter}>{coin.iconLetter}</Text>
          </View>
          <Text style={[styles.assetTitle, { color: colors.textPrimary }]}>
            {coin.name} ({coin.symbol})
          </Text>
          <Text style={[styles.currentPrice, { color: colors.success }]}>
            Güncel Fiyat: ${coin.priceUsd.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Tetikleyici Türü (Fiyat Eşiği vs AI Sinyali) */}
        <View style={[styles.segmentedRow, { backgroundColor: isDark ? '#10151E' : '#E2E8F0' }]}>
          <Pressable
            style={[
              styles.segmentBtn,
              triggerType === 'price' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
            ]}
            onPress={() => setTriggerType('price')}
          >
            <Text
              style={[
                styles.segmentText,
                triggerType === 'price' ? { color: colors.textPrimary } : { color: colors.textMuted },
              ]}
            >
              Fiyat Eşiği (Statik)
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentBtn,
              triggerType === 'ai' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
            ]}
            onPress={() => setTriggerType('ai')}
          >
            <Text
              style={[
                styles.segmentText,
                triggerType === 'ai' ? { color: colors.textPrimary } : { color: colors.textMuted },
              ]}
            >
              AI Sinyali (Model)
            </Text>
          </Pressable>
        </View>

        {/* 1. SEÇENEK: FİYAT EŞİĞİ KONTROLLERİ */}
        {triggerType === 'price' ? (
          <View>
            <Input
              label="Hedef Fiyat ($)"
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="numeric"
              badgeText="USDT"
            />

            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Koşul Yönü</Text>
            <View style={styles.conditionRow}>
              <Pressable
                style={[
                  styles.conditionBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  condition === 'ABOVE' && [styles.conditionBtnActive, { backgroundColor: isDark ? '#0F1A28' : '#E0F2FE', borderColor: colors.primary }],
                ]}
                onPress={() => setCondition('ABOVE')}
              >
                <Text
                  style={[
                    styles.conditionText,
                    { color: condition === 'ABOVE' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Üzerine Çıkarsa ↑
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.conditionBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  condition === 'BELOW' && [styles.conditionBtnActive, { backgroundColor: isDark ? '#0F1A28' : '#E0F2FE', borderColor: colors.primary }],
                ]}
                onPress={() => setCondition('BELOW')}
              >
                <Text
                  style={[
                    styles.conditionText,
                    { color: condition === 'BELOW' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Altına Düşerse ↓
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* 2. SEÇENEK: AI SİNYALİ KONTROLLERİ */
          <View>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Beklenen AI Sinyali</Text>
            <View style={styles.signalChoiceRow}>
              {(['GÜÇLÜ AL', 'AL', 'SAT', 'GÜÇLÜ SAT'] as const).map((sig) => {
                const isActive = aiSignalTarget === sig;
                const isBuySig = sig.includes('AL');
                return (
                  <Pressable
                    key={sig}
                    style={[
                      styles.signalChoiceBtn,
                      {
                        backgroundColor: isActive
                          ? (isBuySig ? (isDark ? 'rgba(0, 230, 118, 0.2)' : '#DCFCE7') : (isDark ? 'rgba(255, 59, 48, 0.2)' : '#FEE2E2'))
                          : (isDark ? '#111722' : '#F1F5F9'),
                        borderColor: isActive ? (isBuySig ? colors.success : colors.danger) : colors.border,
                      },
                    ]}
                    onPress={() => setAiSignalTarget(sig)}
                  >
                    <Text
                      style={[
                        styles.signalChoiceText,
                        {
                          color: isActive
                            ? (isBuySig ? colors.success : colors.danger)
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {sig}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Minimum Model Güven Oranı</Text>
            <View style={styles.chipRow}>
              {[75, 80, 85, 90].map((conf) => {
                const isActive = aiConfidenceMin === conf;
                return (
                  <Pressable
                    key={conf}
                    style={[
                      styles.confChip,
                      {
                        backgroundColor: isActive
                          ? (isDark ? '#0F1E32' : '#E0F2FE')
                          : (isDark ? '#111722' : '#F1F5F9'),
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setAiConfidenceMin(conf)}
                  >
                    <Text
                      style={[
                        styles.confChipText,
                        { color: isActive ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      %{conf}+
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Tahmin Zaman Ufku</Text>
            <View style={styles.chipRow}>
              {(['1S', '4S', '24S'] as const).map((horizon) => {
                const isActive = aiTimeHorizon === horizon;
                return (
                  <Pressable
                    key={horizon}
                    style={[
                      styles.confChip,
                      {
                        backgroundColor: isActive
                          ? (isDark ? '#0F1E32' : '#E0F2FE')
                          : (isDark ? '#111722' : '#F1F5F9'),
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setAiTimeHorizon(horizon)}
                  >
                    <Text
                      style={[
                        styles.confChipText,
                        { color: isActive ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {horizon === '1S' ? '1 Saat' : horizon === '4S' ? '4 Saat (Önerilen)' : '24 Saat'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* AI Açıklama Kutusu */}
            <Card style={[styles.aiInfoBox, { backgroundColor: isDark ? '#0A121E' : '#F0F9FF', borderColor: colors.primary }]}>
              <View style={styles.aiInfoTitleRow}>
                <Zap size={15} color={colors.primary} />
                <Text style={[styles.aiInfoTitle, { color: colors.primary }]}>Yapay Zeka Karar Motoru</Text>
              </View>
              <Text style={[styles.aiInfoDesc, { color: colors.textSecondary }]}>
                LSTM + XGBoost modeli, RSI ve zincir-üstü hacim verilerini birleştirerek en az %{aiConfidenceMin} güvenle {aiSignalTarget} sinyali tespit ettiğinde alarm devreye girecektir.
              </Text>
            </Card>
          </View>
        )}

        {/* Aksiyonlar Bölümü */}
        <Text style={[styles.fieldLabel, { color: colors.textPrimary, marginTop: spacing.md }]}>Aksiyonlar</Text>

        <Card style={styles.actionCard}>
          <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Anlık Bildirim Gönder</Text>
          <Toggle value={sendNotification} onValueChange={setSendNotification} />
        </Card>

        <Card style={styles.actionCard}>
          <View style={styles.actionLeftCol}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              {triggerType === 'ai' ? 'AI Tetikli Otomatik İşlem' : 'Otomatik İşlem (Otopilot)'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              Koşul sağlandığında portföyün %25'i ile otomatik emir ver
            </Text>
          </View>
          <Toggle value={autoExecute} onValueChange={setAutoExecute} />
        </Card>

        {/* Kaydet Butonu */}
        <Button
          title={triggerType === 'ai' ? 'AI Stratejisini Başlat' : 'Fiyat Alarmını Kaydet'}
          onPress={handleSave}
          loading={isSaving}
          style={styles.saveButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  assetHeader: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  assetCircle: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  assetLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
  },
  assetTitle: {
    ...typography.h2,
  },
  currentPrice: {
    ...typography.bodyBold,
    marginTop: 4,
  },
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.sm + 2,
  },
  segmentBtnActive: {},
  segmentText: {
    ...typography.bodyBold,
  },
  fieldLabel: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  conditionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  conditionBtnActive: {},
  conditionText: {
    ...typography.bodyBold,
  },
  signalChoiceRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  signalChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalChoiceText: {
    ...typography.captionBold,
    fontSize: 11,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  confChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confChipText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  aiInfoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  aiInfoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiInfoTitle: {
    ...typography.bodyBold,
    fontSize: 13,
  },
  aiInfoDesc: {
    ...typography.caption,
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionLeftCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  actionTitle: {
    ...typography.bodyBold,
  },
  actionSubtitle: {
    ...typography.caption,
    marginTop: 4,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
