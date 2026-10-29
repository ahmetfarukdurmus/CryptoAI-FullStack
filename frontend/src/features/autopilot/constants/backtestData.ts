import { BacktestResultDto } from '../../../services/api/types';

export const PERIOD_RESULTS: Record<'1M' | '3M' | '6M', BacktestResultDto> = {
  '1M': {
    period: '1M',
    totalReturnPercent: 8.6,
    initialCapitalUsd: 10000,
    finalCapitalUsd: 10860,
    winRatePercent: 75.0,
    tradesCount: 24,
    maxDrawdownPercent: 3.2,
    sharpeRatio: 1.95,
    equityCurve: [10000, 10200, 10100, 10500, 10860],
  },
  '3M': {
    period: '3M',
    totalReturnPercent: 21.3,
    initialCapitalUsd: 10000,
    finalCapitalUsd: 12130,
    winRatePercent: 76.5,
    tradesCount: 68,
    maxDrawdownPercent: 4.8,
    sharpeRatio: 2.05,
    equityCurve: [10000, 10300, 10700, 11200, 11800, 12130],
  },
  '6M': {
    period: '6M',
    totalReturnPercent: 38.4,
    initialCapitalUsd: 10000,
    finalCapitalUsd: 13840,
    winRatePercent: 78.2,
    tradesCount: 142,
    maxDrawdownPercent: 6.15,
    sharpeRatio: 2.14,
    equityCurve: [10000, 10450, 10200, 11100, 11800, 11600, 12400, 13100, 12900, 13840],
  },
};
