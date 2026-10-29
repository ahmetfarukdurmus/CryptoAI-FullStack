import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigation.types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { CoinDetailScreen } from '../features/market/screens/CoinDetailScreen';
import { NewAlarmScreen } from '../features/autopilot/screens/NewAlarmScreen';
import { PriceAlertTriggerModal } from '../features/market/components/PriceAlertTriggerModal';
import { useAuth } from '../context/AuthContext';
import { colors } from '../shared/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer
        ref={navigationRef}
        theme={{
          dark: true,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.textPrimary,
            border: colors.border,
            notification: colors.primary,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '800' },
          },
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen
                name="CoinDetail"
                component={CoinDetailScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="NewAlarm"
                component={NewAlarmScreen}
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Küresel Fiyat Eşiği ve Otomatik Tetikleme Bildirim Modalı */}
      {isAuthenticated && (
        <PriceAlertTriggerModal
          onActionPress={(symbol) => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('CoinDetail', { symbol });
            }
          }}
        />
      )}
    </View>
  );
};
