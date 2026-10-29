import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerify: { email: string };
  VerifyEmail: { email: string };
};

export type MainTabParamList = {
  Market: undefined;
  Portfolio: undefined;
  AiChat: undefined;
  Autopilot: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  CoinDetail: { symbol: string };
  NewAlarm: { symbol: string };
};
