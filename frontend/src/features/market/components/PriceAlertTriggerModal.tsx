import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { TrendingDown, TrendingUp, X, Check, Wallet, AlertTriangle } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface PriceAlertTriggerModalProps {
  onActionPress?: (symbol: string, actionType: 'BUY' | 'SELL') => void;
}

export const PriceAlertTriggerModal: React.FC<PriceAlertTriggerModalProps> = () => {
  const {
    activeTriggeredAlert,
    dismissTriggeredAlert,
    portfolio,
    coins,
    executeTrade,
    refreshData,
  } = useApp();
  const { colors, isDark } = useTheme();

  const [sellAmountInput, setSellAmountInput] = useState<string>('');
  const [selectedPercent, setSelectedPercent] = useState<number | null>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const coin = activeTriggeredAlert ? coins.find((c) => c.symbol === activeTriggeredAlert.symbol) : null;
  const currentPrice =
    coin?.lastPrice !== undefined && coin.lastPrice > 0
      ? coin.lastPrice
      : coin?.priceUsd !== undefined && coin.priceUsd > 0
      ? coin.priceUsd
      : activeTriggeredAlert?.targetPrice || 0;

  const isBelow = activeTriggeredAlert?.condition === 'BELOW';

  // Kullanıcının cüzdanındaki mevcut coin varlığı
  const currentHolding = activeTriggeredAlert
    ? portfolio.holdings.find((h) => h.symbol === activeTriggeredAlert.symbol)
    : null;
  const availableCoinAmount = currentHolding ? currentHolding.amount : 0;
  const holdingUsdValue = availableCoinAmount * currentPrice;

  // Modal ilk açıldığında varsayılan olarak %100 (tümü) satış miktarını hazırla
  useEffect(() => {
    if (activeTriggeredAlert) {
      setLoading(false);
      setErrorMessage('');
      setSuccessMessage('');
      if (availableCoinAmount > 0) {
        setSellAmountInput(availableCoinAmount.toString());
        setSelectedPercent(100);
      } else {
        setSellAmountInput('0');
        setSelectedPercent(null);
      }
    }
  }, [activeTriggeredAlert, availableCoinAmount]);

  if (!activeTriggeredAlert) return null;

  const numericAmount = parseFloat(sellAmountInput) || 0;
  const netUsdtTotal = numericAmount * currentPrice;
  const isInsufficient = numericAmount > availableCoinAmount || numericAmount <= 0;

  const handlePercentSelect = (pct: number) => {
    setSelectedPercent(pct);
    if (availableCoinAmount <= 0) return;

    if (pct === 100) {
      setSellAmountInput(availableCoinAmount.toString());
    } else {
      const calculated = (availableCoinAmount * (pct / 100)).toFixed(6);
      setSellAmountInput(calculated);
    }
  };

  const handleAmountChange = (text: string) => {
    setSellAmountInput(text);
    setSelectedPercent(null);
  };

  const handleExecuteSell = async () => {
    if (numericAmount <= 0 || isInsufficient || loading) return;
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Doğrudan backend /api/v1/trade veya /api/v1/crypto/sell endpoint'ine POST isteği gönder
      await executeTrade(
        activeTriggeredAlert.symbol,
        'SELL',
        numericAmount,
        netUsdtTotal
      );

      // 2. Alert kaydını is_triggered=True yap ve 4 kritik state'i eşzamanlı olarak güncelle ve bekle:
      // - fetchPortfolio() (USDT ve coin bakiyeleri güncellenir)
      // - fetchAlerts() (Stop-loss durumu Tetiklendi olur)
      // - fetchTransactions() (İşlem geçmişine satış anında eklenir)
      // - fetchMarketData() (Piyasa verileri yenilenir)
      await Promise.all([
        dismissTriggeredAlert(),
        refreshData(),
      ]);

      setSuccessMessage(
        `Satış Başarılı! ${numericAmount.toLocaleString('tr-TR', { maximumFractionDigits: 6 })} ${
          activeTriggeredAlert.symbol
        } satıldı, $${netUsdtTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} nakit eklendi.`
      );

      setTimeout(() => {
        setSuccessMessage('');
      }, 800);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Satış işlemi gerçekleştirilemedi.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={dismissTriggeredAlert}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: isBelow ? colors.danger : colors.success,
            },
          ]}
        >
          {/* Üst Başlık Barı */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isBelow
                    ? 'rgba(255, 59, 48, 0.15)'
                    : 'rgba(0, 230, 118, 0.15)',
                },
              ]}
            >
              {isBelow ? (
                <TrendingDown size={22} color={colors.danger} />
              ) : (
                <TrendingUp size={22} color={colors.success} />
              )}
            </View>
            <View style={styles.titleCol}>
              <Text
                style={[
                  styles.title,
                  { color: isBelow ? colors.danger : colors.success },
                ]}
              >
                {isBelow ? '⚠️ Stop-Loss Limiti Tetiklendi' : '🎯 Hedef Kâr Limiti Ulaşıldı'}
              </Text>
              <Text style={[styles.subSymbol, { color: colors.textSecondary }]}>
                {activeTriggeredAlert.symbol} / USDT
              </Text>
            </View>
            <Pressable onPress={dismissTriggeredAlert} hitSlop={8} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Fiyat Bilgisi Kartı */}
          <View style={[styles.priceBox, { backgroundColor: isDark ? '#0A101A' : '#F1F5F9' }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Belirlenen Eşik:</Text>
              <Text style={[styles.targetPriceVal, { color: colors.textPrimary }]}>
                ${activeTriggeredAlert.targetPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Güncel Anlık Fiyat:</Text>
              <Text style={[styles.currentPriceVal, { color: isBelow ? colors.danger : colors.success }]}>
                ${currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Kullanıcının Cüzdanındaki Varlık */}
          <View
            style={[
              styles.walletHoldingBox,
              {
                backgroundColor: isDark ? '#111827' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.walletHeader}>
              <Wallet size={15} color={colors.primary} />
              <Text style={[styles.walletTitle, { color: colors.textSecondary }]}>
                Cüzdanınızdaki Varlık
              </Text>
            </View>
            <Text style={[styles.walletAmount, { color: colors.textPrimary }]}>
              {availableCoinAmount.toLocaleString('tr-TR', { maximumFractionDigits: 6 })}{' '}
              {activeTriggeredAlert.symbol}{' '}
              <Text style={[styles.walletUsd, { color: colors.textSecondary }]}>
                (~${holdingUsdValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })})
              </Text>
            </Text>
          </View>

          {availableCoinAmount <= 0 ? (
            <View style={styles.warningBox}>
              <AlertTriangle size={16} color="#FFB300" />
              <Text style={styles.warningText}>
                Cüzdanınızda satılabilecek {activeTriggeredAlert.symbol} varlığı kalmadı.
              </Text>
            </View>
          ) : (
            <>
              {/* Hızlı Satış Yüzde Butonları [%25, %50, %100 (Tümü)] */}
              <View style={styles.percentRow}>
                {[25, 50, 100].map((pct) => {
                  const isSelected = selectedPercent === pct;
                  return (
                    <Pressable
                      key={pct}
                      style={[
                        styles.percentBtn,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected
                            ? 'rgba(0, 178, 254, 0.15)'
                            : isDark
                            ? '#0C121D'
                            : '#F1F5F9',
                        },
                      ]}
                      onPress={() => handlePercentSelect(pct)}
                    >
                      <Text
                        style={[
                          styles.percentBtnText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        %{pct} {pct === 100 ? '(Tümü)' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Satış Miktarı Input Kutusu */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Satılacak {activeTriggeredAlert.symbol} Miktarı:
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    {
                      backgroundColor: isDark ? '#070B11' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={sellAmountInput}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Net Satış Tutarı (USDT) */}
              <View style={[styles.netTotalBox, { borderTopColor: colors.border }]}>
                <Text style={[styles.netTotalLabel, { color: colors.textSecondary }]}>
                  Hesaba Geçecek Tutar:
                </Text>
                <Text style={[styles.netTotalVal, { color: isBelow ? colors.danger : colors.success }]}>
                  ${netUsdtTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USDT
                </Text>
              </View>
            </>
          )}

          {/* Hata Bildirimi */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Başarı Bildirimi */}
          {successMessage ? (
            <View style={styles.successBox}>
              <Check size={16} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Butonlar */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={[styles.dismissBtn, { borderColor: colors.border }]}
              onPress={dismissTriggeredAlert}
            >
              <Text style={[styles.dismissText, { color: colors.textSecondary }]}>Kapat</Text>
            </Pressable>

            {availableCoinAmount > 0 && (
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: isBelow ? colors.danger : colors.success },
                  (loading || isInsufficient) && styles.disabledBtn,
                ]}
                onPress={handleExecuteSell}
                disabled={loading || isInsufficient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {isBelow ? 'Stop-Loss Satış Yap' : 'Kârı Al (Satış Yap)'}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    elevation: 25,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  subSymbol: {
    ...typography.captionBold,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  priceBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  priceLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  targetPriceVal: {
    ...typography.captionBold,
    fontSize: 13,
  },
  currentPriceVal: {
    ...typography.captionBold,
    fontSize: 14,
  },
  walletHoldingBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  walletTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  walletAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  walletUsd: {
    fontSize: 13,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: 12,
    color: '#FFB300',
    fontWeight: '600',
    flex: 1,
  },
  percentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  percentBtn: {
    flex: 1,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  amountInput: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '700',
  },
  netTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    marginBottom: spacing.md,
  },
  netTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  netTotalVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
  },
  successText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dismissBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtn: {
    flex: 2,
    height: 48,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
