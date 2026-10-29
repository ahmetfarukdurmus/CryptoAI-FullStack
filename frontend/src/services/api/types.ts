// Kullanıcı & Oturum Tipleri (Spring Boot Auth DTO'ları ile uyumlu)
export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  uid: string;
  balanceUsd?: number;
  isEmailVerified: boolean;
}

export interface TransactionDto {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  costUsd: number;
  createdAt: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
}

export interface RegisterResponseDto {
  message: string;
  email: string;
  requiresVerification: boolean;
  token?: string;
  user?: UserDto;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface AlertCreateDto {
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  alertType?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'PRICE_ALERT';
  message?: string;
}

export interface AlertDto {
  id: number;
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  alertType: 'STOP_LOSS' | 'TAKE_PROFIT' | 'PRICE_ALERT';
  message?: string;
  isTriggered: boolean;
}

// Portföy Tipleri
export interface HoldingDto {
  symbol: string;
  name: string;
  amount: number;
  valueUsd: number;
  changeUsd: number;
  changePercent?: number;
  iconLetter: string;
  color: string;
  isCash?: boolean;
}

export interface PortfolioSummaryDto {
  totalBalanceUsd: number;
  dailyChangeUsd: number;
  isAutopilotActive: boolean;
  llmAnalysisText: string;
  holdings: HoldingDto[];
}

// Piyasa & Kripto Tipleri (Binance/Backend Ticker DTO'ları ile uyumlu)
export type AiSignalType = 'GÜÇLÜ AL' | 'AL' | 'NÖTR' | 'SAT';

export interface CoinMarketDto {
  symbol: string;
  pairSymbol?: string;
  name: string;
  priceUsd: number;
  change24h: number;
  changeUsd?: number;
  high24h: number;
  low24h: number;
  volumeBtc: string;
  // Binance canlı API alanları
  lastPrice?: number;
  priceChangePercent?: number;
  highPrice?: number;
  lowPrice?: number;
  volume?: string;
  rsi: number;
  aiSignal: AiSignalType;
  aiConfidencePercent: number;
  aiAnalysisText: string;
  isWatchlisted: boolean;
  hasAlarm?: boolean;
  iconLetter: string;
  color: string;
}

// Otopilot & Alarm Tipleri
export interface AutopilotLogDto {
  id: string;
  type: 'BUY' | 'SELL';
  title: string;
  symbol: string;
  amountInfo: string;
  profitUsd?: number;
  reason: string;
  time: string;
}

export interface AutopilotStatusDto {
  isRunning: boolean;
  activeModelName: string;
  realizedProfit24h: number;
  successRatePercent: number;
  totalTradesCount: number;
  logs: AutopilotLogDto[];
}

export interface CreateAlarmDto {
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  sendNotification: boolean;
  autoSellAutopilot: boolean;
  sellPercentage?: number;
}

// Mum Grafiği Veri Tipi (OHLCV)
export interface CandleDto {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Backtest (Geçmiş Strateji Simülasyonu) Sonuç Tipi
export interface BacktestResultDto {
  period: string;
  totalReturnPercent: number;
  initialCapitalUsd: number;
  finalCapitalUsd: number;
  winRatePercent: number;
  tradesCount: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  equityCurve: number[];
}

// Bildirim Merkezi Tipleri
export type NotificationType = 'AI_SIGNAL' | 'PRICE_ALERT' | 'AUTOPILOT_TRADE' | 'SECURITY';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  relatedSymbol?: string;
}

