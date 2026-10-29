import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Bell,
  TrendingDown,
  TrendingUp,
  Wallet,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { HoldingDto } from '../../../services/api/types';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface CreateHoldingAlertBottomSheetProps {
  visible: boolean;
  holding: HoldingDto | null;
  onClose: () => void;
}

export const CreateHoldingAlertBottomSheet: React.FC<CreateHoldingAlertBottomSheetProps> = ({
  visible,
  holding,
  onClose,
}) => {
  const { coins, createPriceAlert, refreshData } = useApp();
  const { colors, isDark } = useTheme();

  const [stopLossInput, setStopLossInput] = useState('');
  const [takeProfitInput, setTakeProfitInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const coin = holding ? coins.find((c) => c.symbol === holding.symbol) : null;
  const currentLivePrice =
    coin?.lastPrice !== undefined && coin.lastPrice > 0
      ? coin.lastPrice
      : coin?.priceUsd !== undefined && coin.priceUsd > 0
      ? coin.priceUsd
      : holding && holding.amount > 0
      ? holding.valueUsd / holding.amount
      : 0;

  // Ortalama giriş maliyeti (holding.valueUsd / holding.amount)
  const avgCostPrice =
    holding && holding.amount > 0 ? holding.valueUsd / holding.amount : currentLivePrice;
  const totalHoldingValue = holding ? holding.amount * currentLivePrice : 0;

  useEffect(() => {
    if (visible && holding && currentLivePrice > 0) {
      setLoading(false);
      setSuccessMsg('');
      setErrorMsg('');

      // Varsayılan olarak %5 altı (Stop-Loss) ve %10 üstü (Take-Profit) hazırla
      const defaultDecimals = currentLivePrice < 1 ? 4 : 2;
      setStopLossInput((currentLivePrice * 0.95).toFixed(defaultDecimals));
      setTakeProfitInput((currentLivePrice * 1.10).toFixed(defaultDecimals));
    }
  }, [visible, holding, currentLivePrice]);

  if (!visible || !holding) return null;

  const decimals = currentLivePrice < 1 ? 4 : 2;

  const slNumeric = parseFloat(stopLossInput) || 0;
  const slDiffPct = currentLivePrice > 0 && slNumeric > 0 ? ((slNumeric - currentLivePrice) / currentLivePrice) * 100 : 0;

  const tpNumeric = parseFloat(takeProfitInput) || 0;
  const tpDiffPct = currentLivePrice > 0 && tpNumeric > 0 ? ((tpNumeric - currentLivePrice) / currentLivePrice) * 100 : 0;

  // Hızlı Yüzdelik Butonları (%-5, %-10, %+10, %+20)
  const handleQuickPercent = (pct: number) => {
    if (currentLivePrice <= 0) return;

    if (pct < 0) {
      // Stop-Loss
      const calculated = (currentLivePrice * (1 + pct / 100)).toFixed(decimals);
      setStopLossInput(calculated);
    } else {
      // Hedef Kâr
      const calculated = (currentLivePrice * (1 + pct / 100)).toFixed(decimals);
      setTakeProfitInput(calculated);
    }
  };

  const handleSaveAlerts = async () => {
    const slVal = parseFloat(stopLossInput);
    const tpVal = parseFloat(takeProfitInput);

    if ((!slVal || slVal <= 0) && (!tpVal || tpVal <= 0)) {
      setErrorMsg('Lütfen en az bir Stop-Loss veya Hedef Kâr fiyatı belirleyin.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const createdAlerts: string[] = [];

      // 1. Stop-Loss Alarmı Kaydet (Altına Düşerse)
      if (slVal && slVal > 0) {
        await createPriceAlert({
          symbol: holding.symbol,
          targetPrice: slVal,
          condition: 'BELOW',
          alertType: 'STOP_LOSS',
          message: `${holding.symbol} belirlediğiniz stop-loss eşiğinin ($${slVal.toLocaleString('tr-TR')}) altına indi!`,
        });
        createdAlerts.push(`Stop-Loss: $${slVal.toLocaleString('tr-TR')}`);
      }

      // 2. Hedef Kâr Alarmı Kaydet (Üstüne Çıkarsa)
      if (tpVal && tpVal > 0) {
        await createPriceAlert({
          symbol: holding.symbol,
          targetPrice: tpVal,
          condition: 'ABOVE',
          alertType: 'TAKE_PROFIT',
          message: `${holding.symbol} belirlediğiniz kâr hedefi eşiğine ($${tpVal.toLocaleString('tr-TR')}) ulaştı!`,
        });
        createdAlerts.push(`Hedef Kâr: $${tpVal.toLocaleString('tr-TR')}`);
      }

      // 3. Portföy ve emir listesini anında güncelle
      await refreshData();

      setSuccessMsg(`Başarılı! ${createdAlerts.join(' ve ')} emri aktif edildi.`);

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Emir oluşturulurken bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.bottomSheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Mobil Tutma Çubuğu (Grab Handle Bar) */}
          <View style={styles.grabHandleWrap}>
            <View style={[styles.grabHandle, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]} />
          </View>

          {/* Üst Başlık Barı */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.coinIconCircle, { backgroundColor: holding.color || colors.primary }]}>
                <Text style={styles.coinIconLetter}>{holding.iconLetter || holding.symbol[0]}</Text>
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.titleText, { color: colors.textPrimary }]}>
                    Stop-Loss & Alarm Ekle
                  </Text>
                  <View style={styles.symbolBadge}>
                    <Text style={styles.symbolBadgeText}>{holding.symbol}/USDT</Text>
                  </View>
                </View>
                <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
                  Cüzdandaki varlığınız için otomatik satış ve fiyat eşiği kurun
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {/* Varlık & Canlı Fiyat Bilgi Kartı */}
            <View style={[styles.infoGrid, { backgroundColor: isDark ? '#0C121D' : '#F1F5F9' }]}>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Anlık Binance Fiyatı:
                </Text>
                <Text style={[styles.infoValHighlight, { color: colors.primary }]}>
                  ${currentLivePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: currentLivePrice < 1 ? 4 : 2 })}
                </Text>
                <Text style={[styles.infoSub, { color: colors.textMuted }]}>Gerçek zamanlı kur</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Cüzdandaki Varlık:
                </Text>
                <Text style={[styles.infoValBold, { color: colors.textPrimary }]}>
                  {holding.amount.toLocaleString('tr-TR', { maximumFractionDigits: 6 })} {holding.symbol}
                </Text>
                <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
                  ~${totalHoldingValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </Text>
              </View>
            </View>

            {/* Hızlı Yüzdelik Butonları */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Hızlı Yüzdelik Eşikleri:
              </Text>
              <View style={styles.quickPercentRow}>
                <Pressable
                  style={[styles.quickPercentBtn, styles.stopLossQuickBtn]}
                  onPress={() => handleQuickPercent(-5)}
                >
                  <TrendingDown size={13} color="#FF3B30" />
                  <Text style={[styles.quickPercentText, { color: '#FF3B30' }]}>%-5 (Stop)</Text>
                </Pressable>

                <Pressable
                  style={[styles.quickPercentBtn, styles.stopLossQuickBtn]}
                  onPress={() => handleQuickPercent(-10)}
                >
                  <TrendingDown size={13} color="#FF3B30" />
                  <Text style={[styles.quickPercentText, { color: '#FF3B30' }]}>%-10 (Stop)</Text>
                </Pressable>

                <Pressable
                  style={[styles.quickPercentBtn, styles.takeProfitQuickBtn]}
                  onPress={() => handleQuickPercent(10)}
                >
                  <TrendingUp size={13} color="#00E676" />
                  <Text style={[styles.quickPercentText, { color: '#00E676' }]}>%+10 (Kâr)</Text>
                </Pressable>

                <Pressable
                  style={[styles.quickPercentBtn, styles.takeProfitQuickBtn]}
                  onPress={() => handleQuickPercent(20)}
                >
                  <TrendingUp size={13} color="#00E676" />
                  <Text style={[styles.quickPercentText, { color: '#00E676' }]}>%+20 (Kâr)</Text>
                </Pressable>
              </View>
            </View>

            {/* 1. Stop-Loss Input Alanı */}
            <View style={styles.inputWrap}>
              <View style={styles.inputHeader}>
                <View style={styles.inputTitleRow}>
                  <TrendingDown size={16} color="#FF3B30" />
                  <Text style={[styles.inputTitle, { color: colors.textPrimary }]}>
                    Stop-Loss Fiyatı (Alt Limit Eşiği)
                  </Text>
                </View>
                <Text style={styles.tagStopLoss}>Zarar Durdur</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#070B11' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={stopLossInput}
                onChangeText={setStopLossInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
              {slNumeric > 0 && (
                <View style={[styles.inlineBadge, { backgroundColor: 'rgba(255, 59, 48, 0.12)' }]}>
                  <Text style={[styles.inlineBadgeText, { color: '#FF3B30' }]}>
                    {slDiffPct < 0 ? `Eşik: %${Math.abs(slDiffPct).toFixed(2)} daha düşük` : `Eşik: +%${slDiffPct.toFixed(2)}`}
                    {` (Fark: $${Math.abs(slNumeric - currentLivePrice).toFixed(2)})`}
                  </Text>
                </View>
              )}
              <Text style={[styles.inputHelper, { color: colors.textMuted }]}>
                Fiyat bu seviyenin altına indiğinde bildirim ve hızlı satış ekranı açılır.
              </Text>
            </View>

            {/* 2. Hedef Satış / Kâr Fiyatı Input Alanı */}
            <View style={styles.inputWrap}>
              <View style={styles.inputHeader}>
                <View style={styles.inputTitleRow}>
                  <TrendingUp size={16} color="#00E676" />
                  <Text style={[styles.inputTitle, { color: colors.textPrimary }]}>
                    Hedef Satış / Kâr Fiyatı (Üst Limit Eşiği)
                  </Text>
                </View>
                <Text style={styles.tagTakeProfit}>Kâr Al</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#070B11' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={takeProfitInput}
                onChangeText={setTakeProfitInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
              {tpNumeric > 0 && (
                <View style={[styles.inlineBadge, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
                  <Text style={[styles.inlineBadgeText, { color: '#00E676' }]}>
                    {tpDiffPct > 0 ? `Hedef: +%${tpDiffPct.toFixed(2)} daha yüksek` : `Hedef: %${tpDiffPct.toFixed(2)}`}
                    {` (Kâr Potansiyeli: +$${Math.abs(tpNumeric - currentLivePrice).toFixed(2)})`}
                  </Text>
                </View>
              )}
              <Text style={[styles.inputHelper, { color: colors.textMuted }]}>
                Fiyat bu seviyeye ulaştığında hedef kâr bildirimi çıkar ve tek tıkla kâr satışı yapabilirsiniz.
              </Text>
            </View>

            {/* Hata & Başarı Kutuları */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <Check size={16} color={colors.success} />
                <Text style={[styles.successText, { color: colors.success }]}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Kaydet / Buton */}
            <Pressable
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                loading && styles.disabledBtn,
              ]}
              onPress={handleSaveAlerts}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#052914" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Emri Oluştur / Kaydet</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center', // Web ortamında ekranın ortasındaki mobil alanı hizalar
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    width: '100%',
    maxWidth: 430, // Telefondaki mobil çerçeveyi korur, monitöre taşmaz
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  grabHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  coinIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIconLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  symbolBadge: {
    backgroundColor: 'rgba(0, 178, 254, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  symbolBadgeText: {
    color: '#00B2FE',
    fontSize: 11,
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: spacing.sm,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValHighlight: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoValBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoSub: {
    fontSize: 10,
    marginTop: 2,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickPercentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickPercentBtn: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stopLossQuickBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  takeProfitQuickBtn: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  quickPercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputWrap: {
    gap: 6,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tagStopLoss: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF3B30',
  },
  tagTakeProfit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00E676',
  },
  textInput: {
    height: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '700',
  },
  inputHelper: {
    fontSize: 11,
    lineHeight: 15,
  },
  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  inlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveButton: {
    height: 48,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  saveButtonText: {
    color: '#052914',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  successText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },
});
