import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Wallet, CircleDot, Bot, User, Sparkles } from 'lucide-react-native';
import { MainTabParamList } from './navigation.types';
import { PortfolioScreen } from '../features/portfolio/screens/PortfolioScreen';
import { MarketScreen } from '../features/market/screens/MarketScreen';
import { AiChatScreen } from '../features/chat/screens/AiChatScreen';
import { AutopilotScreen } from '../features/autopilot/screens/AutopilotScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { colors, typography } from '../shared/theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Market"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#070B11' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{
          tabBarLabel: 'Piyasa',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <CircleDot size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Cüzdanım',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Wallet size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="AiChat"
        component={AiChatScreen}
        options={{
          tabBarLabel: 'Yapay Zeka',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Sparkles size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Autopilot"
        component={AutopilotScreen}
        options={{
          tabBarLabel: 'Otopilot',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Bot size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#070B11',
    borderTopWidth: 1,
    borderTopColor: '#141D2B',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    ...typography.captionBold,
    fontSize: 11,
    marginTop: 2,
  },
  activeIconWrap: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
