import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PortfolioSummaryDto,
  CoinMarketDto,
  AutopilotStatusDto,
  CreateAlarmDto,
  AlertCreateDto,
  AlertDto,
  TransactionDto,
} from '../services/api/types';
import { cryptoService } from '../services/api/cryptoService';
import { useAuth } from './AuthContext';
import {
  mockPortfolio,
  mockCoins,
  mockAutopilotStatus,
} from '../services/api/mockData';

export type RiskProfileType = 'Muhafazakar' | 'Dengeli' | 'Agresif';

export interface AutopilotSettings {
  riskProfile: RiskProfileType;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxTradeAllocationPercent: number;
}

const CACHE_PORTFOLIO_KEY = '@cryptoai_cached_portfolio';
const CACHE_TRANSACTIONS_KEY = '@cryptoai_cached_transactions';
const CACHE_ALERTS_KEY = '@cryptoai_cached_alerts';

interface AppContextType {
  portfolio: PortfolioSummaryDto;
  coins: CoinMarketDto[];
  autopilot: AutopilotStatusDto;
  autopilotSettings: AutopilotSettings;
  alerts: AlertDto[];
  transactions: TransactionDto[];
  activeTriggeredAlert: AlertDto | null;
  isInitialLoading: boolean;
  isPortfolioLoaded: boolean;
  dismissTriggeredAlert: () => Promise<void>;
  createPriceAlert: (alertData: AlertCreateDto) => Promise<AlertDto | null>;
  deletePriceAlert: (alertId: number) => Promise<boolean>;
  updatePriceAlert: (alertId: number, data: Partial<AlertCreateDto>) => Promise<AlertDto | null>;
  updateAutopilotSettings: (settings: Partial<AutopilotSettings>) => void;
  refreshData: () => Promise<void>;
  toggleAutopilot: () => Promise<void>;
  toggleWatchlist: (symbol: string) => Promise<void>;
  createAlarm: (data: CreateAlarmDto) => Promise<boolean>;
  executeTrade: (symbol: string, type: 'BUY' | 'SELL', amount: number, costUsd: number) => Promise<boolean>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [dbPortfolio, setDbPortfolio] = useState<PortfolioSummaryDto | null>(null);
  const [coins, setCoins] = useState<CoinMarketDto[]>(mockCoins);
  const [autopilot, setAutopilot] = useState<AutopilotStatusDto>(mockAutopilotStatus);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [activeTriggeredAlert, setActiveTriggeredAlert] = useState<AlertDto | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  const isPortfolioLoaded = dbPortfolio !== null;

  // F5 yapıldığında son verileri anında ekrana bas (önbellekten oku)
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [cachedP, cachedTxs, cachedAls] = await Promise.all([
          AsyncStorage.getItem(CACHE_PORTFOLIO_KEY),
          AsyncStorage.getItem(CACHE_TRANSACTIONS_KEY),
          AsyncStorage.getItem(CACHE_ALERTS_KEY),
        ]);
        if (cachedP) {
          const parsed = JSON.parse(cachedP);
          if (parsed && parsed.holdings && parsed.holdings.length > 0) {
            setDbPortfolio(parsed);
          }
        }
        if (cachedTxs) {
          const parsed = JSON.parse(cachedTxs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions(parsed);
          }
        }
        if (cachedAls) {
          const parsed = JSON.parse(cachedAls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAlerts(parsed);
          }
        }
      } catch {
        // sessiz
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadCachedData();
  }, []);

  // Canlı Portföy Hesaplaması (Gerçek zamanlı Binance fiyatlarına göre anlık güncellenir)
  // Toplam Değer = Nakit USDT + SUM(Kullanıcının Sahip Olduğu Coin Miktarı * O Coinin Anlık Binance Fiyatı)
  const portfolio: PortfolioSummaryDto = useMemo(() => {
    if (!dbPortfolio || !dbPortfolio.holdings) {
      return {
        totalBalanceUsd: 0,
        dailyChangeUsd: 0,
        isAutopilotActive: false,
        llmAnalysisText: '',
        holdings: [],
      };
    }

    let dynamicTotal = 0;
    let totalCryptoCost = 0;
    let totalCryptoLiveValue = 0;

    const dynamicHoldings = dbPortfolio.holdings.map((h) => {
      if (h.isCash || h.symbol === 'USDT') {
        const cashVal = h.amount !== undefined ? h.amount : h.valueUsd;
        dynamicTotal += cashVal;
        return {
          ...h,
          valueUsd: cashVal,
          changeUsd: 0,
          changePercent: 0,
        };
      }

      // Canlı Binance fiyatını bul
      const liveCoin = coins.find(
        (c) => c.symbol === h.symbol || c.pairSymbol === `${h.symbol}USDT`
      );

      const livePrice =
        liveCoin?.lastPrice !== undefined && liveCoin.lastPrice > 0
          ? liveCoin.lastPrice
          : liveCoin?.priceUsd !== undefined && liveCoin.priceUsd > 0
          ? liveCoin.priceUsd
          : h.amount > 0
          ? h.valueUsd / h.amount
          : 0;

      const liveValueUsd = h.amount * livePrice;
      const costBasis = h.valueUsd > 0 ? h.valueUsd : liveValueUsd;
      const changeUsd = liveValueUsd - costBasis;
      const changePercent =
        costBasis > 0
          ? (changeUsd / costBasis) * 100
          : liveCoin?.priceChangePercent !== undefined
          ? liveCoin.priceChangePercent
          : 0;

      dynamicTotal += liveValueUsd;
      totalCryptoCost += costBasis;
      totalCryptoLiveValue += liveValueUsd;

      return {
        ...h,
        valueUsd: liveValueUsd,
        changeUsd: changeUsd,
        changePercent: changePercent,
      };
    });

    const netCryptoPnL = totalCryptoLiveValue - totalCryptoCost;

    return {
      ...dbPortfolio,
      totalBalanceUsd: dynamicTotal > 0 ? dynamicTotal : dbPortfolio.totalBalanceUsd,
      dailyChangeUsd: netCryptoPnL,
      holdings: dynamicHoldings,
    };
  }, [dbPortfolio, coins]);

  const [autopilotSettings, setAutopilotSettings] = useState<AutopilotSettings>({
    riskProfile: 'Dengeli',
    stopLossPercent: 10,
    takeProfitPercent: 20,
    maxTradeAllocationPercent: 25,
  });

  const updateAutopilotSettings = (newSettings: Partial<AutopilotSettings>) => {
    setAutopilotSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const refreshData = async () => {
    try {
      const [p, userAlerts, userTxs] = await Promise.all([
        cryptoService.getPortfolio(),
        cryptoService.getAlerts(),
        cryptoService.getTransactions(),
      ]);
      if (p) {
        setDbPortfolio(p);
        AsyncStorage.setItem(CACHE_PORTFOLIO_KEY, JSON.stringify(p)).catch(() => {});
      }
      if (userAlerts) {
        setAlerts(userAlerts);
        AsyncStorage.setItem(CACHE_ALERTS_KEY, JSON.stringify(userAlerts)).catch(() => {});
      }
      if (userTxs) {
        setTransactions(userTxs);
        AsyncStorage.setItem(CACHE_TRANSACTIONS_KEY, JSON.stringify(userTxs)).catch(() => {});
      }
    } catch {
      // sessiz
    }
  };

  // Kullanıcı oturum açtığında veya kapattığında portföy ve işlemleri senkronize et
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshData();
      // 1.5 saniye içinde backend yanıt vermezse ekranın kilitli/siyah kalmasını önlemek için yedek veriyi yükle
      const fallbackTimer = setTimeout(() => {
        setDbPortfolio((curr) => curr || mockPortfolio);
      }, 1500);
      return () => clearTimeout(fallbackTimer);
    } else {
      setDbPortfolio(mockPortfolio);
      setTransactions([]);
      setAlerts([]);
      AsyncStorage.multiRemove([CACHE_PORTFOLIO_KEY, CACHE_TRANSACTIONS_KEY, CACHE_ALERTS_KEY]).catch(() => {});
    }
  }, [isAuthenticated, token]);

  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  const activeTriggeredAlertRef = useRef(activeTriggeredAlert);
  activeTriggeredAlertRef.current = activeTriggeredAlert;

  // Backend Piyasa & Portföy Akışı (Single Source of Truth: FastAPI /api/v1)
  useEffect(() => {
    // 0. İlk açılışta backend'den kurları ve portföyü çek
    cryptoService.getCoins().then((live) => {
      if (live && live.length > 0) {
        setCoins(live);
      }
    }).catch(() => {});

    refreshData();

    // 1. Canlı Borsa Akışı: Her 3 saniyede bir /api/v1/crypto/market ile sessiz senkronizasyon
    let isPolling = false;
    const interval = setInterval(async () => {
      if (isPolling) return; // Önceki istek tamamlanmadan yeni istek atıp kuyruğu kilitlemeyi engelle
      isPolling = true;
      try {
        const liveCoins = await cryptoService.getCoins();
        if (liveCoins && liveCoins.length > 0) {
          // Sayfada tam ekran loading çıkarmadan sadece değişen fiyatları güncelle
          setCoins(liveCoins);

          // Fiyat Bildirim Eşiği / Alarm Kontrolü (Stop-Loss & Take-Profit)
          const currentAlerts = alertsRef.current;
          const currentActive = activeTriggeredAlertRef.current;
          if (currentAlerts.length > 0 && !currentActive) {
            for (const alert of currentAlerts) {
              if (alert.isTriggered) continue;
              const coin = liveCoins.find((c) => c.symbol === alert.symbol);
              if (!coin) continue;

              const currentPrice = coin.lastPrice !== undefined ? coin.lastPrice : coin.priceUsd;
              if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
                setActiveTriggeredAlert(alert);
                break;
              } else if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
                setActiveTriggeredAlert(alert);
                break;
              }
            }
          }
        }
      } catch {
        // Sessiz hata yakalama
      } finally {
        isPolling = false;
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const createPriceAlert = async (alertData: AlertCreateDto): Promise<AlertDto | null> => {
    // 1. Kullanıcı beklemesin diye anında state'e ve arayüze ekle (0ms)
    const tempId = Date.now();
    const optimisticAlert: AlertDto = {
      id: tempId,
      symbol: alertData.symbol,
      targetPrice: alertData.targetPrice,
      condition: alertData.condition,
      alertType: alertData.alertType || (alertData.condition === 'BELOW' ? 'STOP_LOSS' : 'PRICE_ALERT'),
      message: alertData.message || '',
      isTriggered: false,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [optimisticAlert, ...prev]);

    try {
      const created = await cryptoService.createAlert(alertData);
      if (created) {
        setAlerts((prev) => prev.map((a) => (a.id === tempId ? created : a)));
        AsyncStorage.getItem(CACHE_ALERTS_KEY).then((stored) => {
          const list: AlertDto[] = stored ? JSON.parse(stored) : [];
          AsyncStorage.setItem(CACHE_ALERTS_KEY, JSON.stringify([created, ...list.filter((x) => x.id !== tempId)])).catch(() => {});
        }).catch(() => {});
        return created;
      }
      return optimisticAlert;
    } catch (err) {
      console.warn('Alarm sunucuya kaydedilemedi:', err);
      return optimisticAlert;
    }
  };

  const deletePriceAlert = async (alertId: number): Promise<boolean> => {
    // Anında UI'dan ve önbellekten kaldır (0ms gecikme!)
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    AsyncStorage.getItem(CACHE_ALERTS_KEY).then((stored) => {
      if (stored) {
        const list: AlertDto[] = JSON.parse(stored);
        const filtered = list.filter((a) => a.id !== alertId);
        AsyncStorage.setItem(CACHE_ALERTS_KEY, JSON.stringify(filtered)).catch(() => {});
      }
    }).catch(() => {});

    // Arka planda sunucudan sil (kullanıcıyı kitlemez)
    cryptoService.deleteAlert(alertId).catch(() => {});
    return true;
  };

  const updatePriceAlert = async (alertId: number, data: Partial<AlertCreateDto>): Promise<AlertDto | null> => {
    const updated = await cryptoService.updateAlert(alertId, data);
    if (updated) {
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
      refreshData().catch(() => {});
    }
    return updated;
  };

  const dismissTriggeredAlert = async () => {
    if (activeTriggeredAlert) {
      await cryptoService.dismissAlert(activeTriggeredAlert.id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === activeTriggeredAlert.id ? { ...a, isTriggered: true } : a))
      );
      setActiveTriggeredAlert(null);
    }
  };

  const toggleAutopilot = async () => {
    const newState = await cryptoService.toggleAutopilot();
    setAutopilot((prev) => ({ ...prev, isRunning: newState }));
    setDbPortfolio((prev) => ({ ...prev, isAutopilotActive: newState }));
  };

  const toggleWatchlist = async (symbol: string) => {
    await cryptoService.toggleWatchlist(symbol);
    setCoins((prev) =>
      prev.map((c) => (c.symbol === symbol ? { ...c, isWatchlisted: !c.isWatchlisted } : c))
    );
  };

  const createAlarm = async (data: CreateAlarmDto): Promise<boolean> => {
    const success = await cryptoService.createAlarm(data);
    if (success) {
      setCoins((prev) =>
        prev.map((c) => (c.symbol === data.symbol ? { ...c, hasAlarm: true } : c))
      );
    }
    return success;
  };

  const executeTrade = async (
    symbol: string,
    type: 'BUY' | 'SELL',
    amount: number,
    costUsd: number
  ): Promise<boolean> => {
    try {
      // 1. Backend PostgreSQL 'transactions' ve 'holdings' tablolarına atomik olarak kaydet
      const res = await cryptoService.executeTrade(symbol, type, amount, costUsd);
      if (res.portfolio) {
        setDbPortfolio(res.portfolio);
      }

      // Alım ya da satım yapıldığı an yeni işlemi Son İşlem Geçmişi'ne derhal ekle
      const newTx: TransactionDto = res.transaction || {
        id: `tx_${Date.now()}`,
        symbol,
        type,
        amount,
        price: amount > 0 ? costUsd / amount : 0,
        costUsd,
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
      AsyncStorage.getItem(CACHE_TRANSACTIONS_KEY).then((stored) => {
        const list = stored ? JSON.parse(stored) : [];
        AsyncStorage.setItem(CACHE_TRANSACTIONS_KEY, JSON.stringify([newTx, ...list])).catch(() => {});
      }).catch(() => {});

      // 2. Arka planda veritabanından kesin olarak senkronize et (UI'ı bekletmez)
      refreshData().catch(() => {});
      return true;
    } catch (err: any) {
      console.error('İşlem yürütme hatası:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        portfolio,
        coins,
        autopilot,
        autopilotSettings,
        alerts,
        transactions,
        activeTriggeredAlert,
        isInitialLoading,
        isPortfolioLoaded,
        dismissTriggeredAlert,
        createPriceAlert,
        deletePriceAlert,
        updatePriceAlert,
        updateAutopilotSettings,
        refreshData,
        toggleAutopilot,
        toggleWatchlist,
        createAlarm,
        executeTrade,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
