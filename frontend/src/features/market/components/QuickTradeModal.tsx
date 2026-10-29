import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, Check, Bell, TrendingDown, TrendingUp } from 'lucide-react-native';
import { CoinMarketDto } from '../../../services/api/types';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface QuickTradeModalProps {
  visible: boolean;
  onClose: () => void;
  coin: CoinMarketDto;
  tradeType: 'BUY' | 'SELL';
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  visible,
  onClose,
  coin,
  tradeType: initialTradeType,
}) => {
  const { portfolio, executeTrade, createPriceAlert } = useApp();
  const { colors, isDark } = useTheme();

  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>(initialTradeType);
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Canlı Binance Fiyatı (Sabit mock yerine anlık dinamik kur)
  const livePrice = coin.lastPrice !== undefined ? coin.lastPrice : coin.priceUsd;

  // Fiyat Eşiği ve Otomatik Bildirim (Alert / Stop-Loss) Ayarları
  const [enableAlert, setEnableAlert] = useState(false);
  const [lowerLimitInput, setLowerLimitInput] = useState('');
  const [upperLimitInput, setUpperLimitInput] = useState('');

  // Kullanıcının inputları elle düzenleyip düzenlemediği kontrolü (canlı fiyatların ezmesini engeller)
  const [isLimitsUserEdited, setIsLimitsUserEdited] = useState(false);
  const [isAmountUserEdited, setIsAmountUserEdited] = useState(false);

  const isBuy = tradeType === 'BUY';

  // Alım için kullanılabilir nakit (USDT)
  const cashHolding = portfolio.holdings.find((h) => h.isCash);
  const availableUsdt = cashHolding ? cashHolding.valueUsd : 0;

  // Satım için elde tutulan coin adedi
  const currentHolding = portfolio.holdings.find((h) => h.symbol === coin.symbol);
  const availableCoinAmount = currentHolding ? currentHolding.amount : 0;

  // Modal ilk açıldığında veya coin değiştiğinde varsayılanları bir kere ayarla (canlı fiyat değiştikçe ezmez!)
  useEffect(() => {
    if (visible) {
      setLoading(false);
      setSuccessMessage('');
      setErrorMessage('');
      setTradeType(initialTradeType);
      setIsLimitsUserEdited(false);
      setIsAmountUserEdited(false);

      if (initialTradeType === 'BUY') {
        setAmountInput('500');
      } else {
        const defaultSell = availableCoinAmount > 0 ? (availableCoinAmount * 0.25).toFixed(4) : '0';
        setAmountInput(defaultSell);
      }

      // Fiyat eşiği varsayılanlarını modal açılışındaki fiyata göre (%5 alt ve %5 üst) hazırla
      if (livePrice > 0) {
        setLowerLimitInput((livePrice * 0.95).toFixed(livePrice < 1 ? 4 : 2));
        setUpperLimitInput((livePrice * 1.05).toFixed(livePrice < 1 ? 4 : 2));
      }
    }
  }, [visible, coin.symbol]);

  const handleSwitchType = (type: 'BUY' | 'SELL') => {
    setTradeType(type);
    if (!isAmountUserEdited) {
      if (type === 'BUY') {
        setAmountInput('500');
      } else {
        const defaultSell = availableCoinAmount > 0 ? (availableCoinAmount * 0.25).toFixed(4) : '0';
        setAmountInput(defaultSell);
      }
    }

    if (!isLimitsUserEdited && livePrice > 0) {
      setLowerLimitInput((livePrice * 0.95).toFixed(livePrice < 1 ? 4 : 2));
      setUpperLimitInput((livePrice * 1.05).toFixed(livePrice < 1 ? 4 : 2));
    }
  };

  if (!visible) return null;

  const numericInput = parseFloat(amountInput) || 0;

  // Alım yaparken girilen tutar USDT, satım yaparken girilen tutar COIN adedi
  const estimatedCoins = isBuy
    ? (livePrice > 0 ? (numericInput / livePrice).toFixed(5) : '0.00000')
    : numericInput.toFixed(5);

  const totalCostUsd = isBuy
    ? numericInput
    : numericInput * livePrice;

  const isInsufficient = isBuy
    ? numericInput > availableUsdt
    : numericInput > availableCoinAmount;

  const numericLowerVal = parseFloat(lowerLimitInput) || 0;
  const lowerDiffPct =
    livePrice > 0 && numericLowerVal > 0 ? ((numericLowerVal - livePrice) / livePrice) * 100 : 0;

  const numericUpperVal = parseFloat(upperLimitInput) || 0;
  const upperDiffPct =
    livePrice > 0 && numericUpperVal > 0 ? ((numericUpperVal - livePrice) / livePrice) * 100 : 0;

  const handlePercentage = (pct: number) => {
    setIsAmountUserEdited(true);
    if (isBuy) {
      const val = (availableUsdt * pct).toFixed(2);
      setAmountInput(val);
    } else {
      const val = (availableCoinAmount * pct).toFixed(4);
      setAmountInput(val);
    }
  };

  const handleConfirm = async () => {
    if (numericInput <= 0 || isInsufficient || loading) return;
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Emri yürüt
      const tradeAmount = isBuy ? parseFloat(estimatedCoins) : numericInput;
      await executeTrade(
        coin.symbol,
        tradeType,
        tradeAmount,
        totalCostUsd
      );

      // 2. Kullanıcı fiyat eşiği alarmı kurduysa PostgreSQL alerts tablosuna eşzamanlı kaydet
      if (enableAlert) {
        try {
          const lowerVal = parseFloat(lowerLimitInput);
          const upperVal = parseFloat(upperLimitInput);
          const alertPromises = [];

          if (lowerVal && lowerVal > 0) {
            alertPromises.push(
              createPriceAlert({
                symbol: coin.symbol,
                targetPrice: lowerVal,
                condition: 'BELOW',
                alertType: 'STOP_LOSS',
                message: `${coin.name} belirlediğiniz limitin ($${lowerVal}) altına düştü, satmak ister misiniz?`,
              })
            );
          }

          if (upperVal && upperVal > 0) {
            alertPromises.push(
              createPriceAlert({
                symbol: coin.symbol,
                targetPrice: upperVal,
                condition: 'ABOVE',
                alertType: 'TAKE_PROFIT',
                message: `${coin.name} belirlediğiniz hedef fiyata ($${upperVal}) ulaştı!`,
              })
            );
          }

          if (alertPromises.length > 0) {
            await Promise.all(alertPromises).catch(() => {});
          }
        } catch (alertErr) {
          console.warn('Alarm kurulamadı ancak işlem tamamlandı:', alertErr);
        }
      }

      setLoading(false);
      setSuccessMessage(
        isBuy
          ? `Tebrikler! ${estimatedCoins} ${coin.symbol} başarıyla alındı!`
          : `Tebrikler! ${numericInput} ${coin.symbol} satıldı, $${totalCostUsd.toFixed(2)} nakit eklendi.`
      );

      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Alım/satım işlemi hatası:', err);
      setLoading(false);
      setErrorMessage(err?.message || 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
          {/* Üst Sekmeli İşlem Türü Değiştirici */}
          <View style={styles.typeSwitcherRow}>
            <Pressable
              style={[
                styles.typeTab,
                isBuy && { backgroundColor: colors.success, borderColor: colors.success },
              ]}
              onPress={() => handleSwitchType('BUY')}
            >
              <Text style={[styles.typeTabText, isBuy ? styles.activeBuyText : { color: colors.textSecondary }]}>
                AL (Satın Al)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.typeTab,
                !isBuy && { backgroundColor: colors.danger, borderColor: colors.danger },
              ]}
              onPress={() => handleSwitchType('SELL')}
            >
              <Text style={[styles.typeTabText, !isBuy ? styles.activeSellText : { color: colors.textSecondary }]}>
                SAT (Satış Yap)
              </Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Varlık & Canlı Fiyat Bilgisi */}
          <View style={styles.coinHeaderRow}>
            <View>
              <Text style={[styles.coinName, { color: colors.textPrimary }]}>
                {coin.name} ({coin.symbol})
              </Text>
              <Text style={[styles.coinPrice, { color: colors.primary }]}>
                1 {coin.symbol} = ${livePrice < 1
                  ? livePrice.toFixed(4)
                  : livePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.liveDotRow, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.liveBadgeText}>CANLI BİNANCE</Text>
            </View>
          </View>

          {/* Kullanılabilir Bakiye Bilgisi */}
          <View style={[styles.balanceCard, { backgroundColor: isDark ? '#0C121C' : '#F1F5F9', borderColor: colors.border }]}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              {isBuy ? 'Kullanılabilir Nakit (USDT):' : `Kullanılabilir ${coin.symbol}:`}
            </Text>
            <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>
              {isBuy
                ? `$${availableUsdt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                : `${availableCoinAmount} ${coin.symbol}`}
            </Text>
          </View>

          {/* Miktar Giriş Kutusu */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {isBuy ? 'Yatırılacak Tutar (USDT)' : `Satılacak Miktar (${coin.symbol})`}
          </Text>
          <View
            style={[
              styles.inputBox,
              { backgroundColor: colors.inputBackground, borderColor: isInsufficient ? colors.danger : colors.inputBorder },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={amountInput}
              onChangeText={(val) => {
                setIsAmountUserEdited(true);
                setAmountInput(val);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.currencyBadge, { color: isBuy ? colors.success : colors.danger }]}>
              {isBuy ? 'USDT' : coin.symbol}
            </Text>
          </View>

          {/* Yetersiz Bakiye Uyarısı */}
          {isInsufficient ? (
            <View style={styles.warningRow}>
              <Text style={{ marginRight: 6 }}>⚠️</Text>
              <Text style={[styles.warningText, { color: colors.danger }]}>
                Yetersiz Bakiye! En fazla {isBuy ? `$${availableUsdt.toFixed(2)}` : `${availableCoinAmount} ${coin.symbol}`} girebilirsiniz.
              </Text>
            </View>
          ) : null}

          {/* Hızlı Yüzde Butonları (%25, %50, %75, %100) */}
          <View style={styles.pctRow}>
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <Pressable
                key={pct}
                style={[
                  styles.pctChip,
                  { backgroundColor: isDark ? '#0F1622' : '#F1F5F9', borderColor: colors.border },
                ]}
                onPress={() => handlePercentage(pct)}
              >
                <Text style={[styles.pctText, { color: colors.textSecondary }]}>
                  {pct === 1 ? 'MAX' : `%${pct * 100}`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Fiyat Bildirim Eşiği / Otomatik Alarm Ekleme Kartı (Stop-Loss / Limit) */}
          <Pressable
            style={[
              styles.alertToggleHeader,
              { backgroundColor: isDark ? '#101622' : '#F8FAFC', borderColor: colors.border },
            ]}
            onPress={() => setEnableAlert(!enableAlert)}
          >
            <View style={styles.alertToggleLeft}>
              <Bell size={16} color={enableAlert ? colors.primary : colors.textSecondary} />
              <Text style={[styles.alertToggleTitle, { color: enableAlert ? colors.primary : colors.textPrimary }]}>
                Fiyat Bildirim Eşiği & Alarm (Stop-Loss)
              </Text>
            </View>
            <View style={[styles.toggleSwitch, enableAlert && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, enableAlert && styles.toggleThumbActive]} />
            </View>
          </Pressable>

          {enableAlert ? (
            <View style={[styles.alertInputsBox, { backgroundColor: isDark ? '#0A101A' : '#F1F5F9', borderColor: colors.border }]}>
              {/* Alt Limit (Stop-Loss) */}
              <View style={styles.thresholdRow}>
                <View style={styles.thresholdLabelRow}>
                  <TrendingDown size={14} color={colors.danger} />
                  <Text style={[styles.thresholdLabel, { color: colors.textSecondary }]}>
                    Alt Limit ($) - Stop Loss:
                  </Text>
                </View>
                <TextInput
                  style={[styles.thresholdInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  value={lowerLimitInput}
                  onChangeText={(val) => {
                    setIsLimitsUserEdited(true);
                    setLowerLimitInput(val);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {numericLowerVal > 0 && (
                <View style={{ backgroundColor: 'rgba(255, 59, 48, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 }}>
                  <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: '700' }}>
                    {lowerDiffPct < 0 ? `Eşik: %${Math.abs(lowerDiffPct).toFixed(2)} daha düşük` : `Eşik: +%${lowerDiffPct.toFixed(2)}`}
                    {` (Fark: -$${Math.abs(numericLowerVal - livePrice).toFixed(livePrice < 1 ? 4 : 2)})`}
                  </Text>
                </View>
              )}
              <Text style={[styles.thresholdHelp, { color: colors.textMuted }]}>
                Fiyat bu seviyenin altına inerse: "{coin.name} düştü, satmak ister misiniz?" uyarısı çıkar.
              </Text>

              {/* Üst Limit (Hedef Kâr) */}
              <View style={[styles.thresholdRow, { marginTop: spacing.sm }]}>
                <View style={styles.thresholdLabelRow}>
                  <TrendingUp size={14} color={colors.success} />
                  <Text style={[styles.thresholdLabel, { color: colors.textSecondary }]}>
                    Üst Limit ($) - Hedef Kâr:
                  </Text>
                </View>
                <TextInput
                  style={[styles.thresholdInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  value={upperLimitInput}
                  onChangeText={(val) => {
                    setIsLimitsUserEdited(true);
                    setUpperLimitInput(val);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {numericUpperVal > 0 && (
                <View style={{ backgroundColor: 'rgba(0, 230, 118, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 }}>
                  <Text style={{ color: '#00E676', fontSize: 11, fontWeight: '700' }}>
                    {upperDiffPct > 0 ? `Hedef: +%${upperDiffPct.toFixed(2)} daha yüksek` : `Hedef: %${upperDiffPct.toFixed(2)}`}
                    {` (Kâr Potansiyeli: +$${Math.abs(numericUpperVal - livePrice).toFixed(livePrice < 1 ? 4 : 2)})`}
                  </Text>
                </View>
              )}
              <Text style={[styles.thresholdHelp, { color: colors.textMuted }]}>
                Fiyat bu seviyeye çıkarsa: "{coin.name} hedef kâra ulaştı!" uyarısı çıkar.
              </Text>
            </View>
          ) : null}

          {/* İşlem Özeti */}
          <View style={[styles.summaryBox, { borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Komisyon Oranı:</Text>
              <Text style={[styles.summaryVal, { color: colors.success }]}>%0.08</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {isBuy ? 'Alınacak Tahmini Miktar:' : 'Hesaba Geçecek Tutar:'}
              </Text>
              <Text style={[styles.summaryValBold, { color: isBuy ? colors.success : colors.textPrimary }]}>
                {isBuy
                  ? `~${estimatedCoins} ${coin.symbol}`
                  : `$${totalCostUsd.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USDT`}
              </Text>
            </View>
          </View>

          {/* Hata Mesajı */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Başarı Mesajı */}
          {successMessage ? (
            <View style={styles.successBox}>
              <Check size={16} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Onay Butonu */}
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: isBuy ? colors.success : colors.danger },
              (loading || isInsufficient || numericInput <= 0) && styles.disabledButton,
            ]}
            onPress={handleConfirm}
            disabled={loading || isInsufficient || numericInput <= 0}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.actionButtonText, { color: isBuy ? '#052914' : '#FFFFFF' }]}>
                {isBuy
                  ? `${coin.symbol} Satın Al (AL)`
                  : `${coin.symbol} Satışını Onayla (SAT)`}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 99999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    maxHeight: '90%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  sheetScroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 1.5,
  },
  typeSwitcherRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  typeTab: {
    flex: 1,
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#243044',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTabText: {
    ...typography.bodyBold,
    fontSize: 13,
  },
  activeBuyText: {
    color: '#052914',
    fontWeight: '800',
  },
  activeSellText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  closeBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coinName: {
    ...typography.h3,
    fontSize: 18,
  },
  coinPrice: {
    ...typography.captionBold,
    fontSize: 13,
    marginTop: 2,
  },
  liveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 0.5,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  balanceLabel: {
    ...typography.caption,
  },
  balanceValue: {
    ...typography.captionBold,
    fontSize: 13,
  },
  inputLabel: {
    ...typography.captionBold,
    marginBottom: spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  currencyBadge: {
    fontWeight: '800',
    fontSize: 14,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    fontSize: 12,
  },
  pctRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  pctChip: {
    flex: 1,
    height: 34,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  alertToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  alertToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertToggleTitle: {
    ...typography.captionBold,
    fontSize: 13,
  },
  toggleSwitch: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2A374A',
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  alertInputsBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thresholdLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  thresholdLabel: {
    ...typography.captionBold,
    fontSize: 12,
  },
  thresholdInput: {
    width: 110,
    height: 38,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    textAlign: 'right',
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  thresholdHelp: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 14,
  },
  summaryBox: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  summaryLabel: {
    ...typography.caption,
  },
  summaryVal: {
    ...typography.captionBold,
  },
  summaryValBold: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.captionBold,
    color: '#FF3B30',
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.captionBold,
    flex: 1,
  },
  actionButton: {
    height: 52,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
