import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Dumbbell, Gamepad2, Wallet, User } from 'lucide-react-native';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { T } from '../utils/designTokens';

// Écrans temporaires
function PlaceholderScreen({ title }) {
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: T.text, fontFamily: T.fontTitle, fontSize: 24 }}>{title}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab: Home,
            PhysiqueTab: Dumbbell,
            GamesTab: Gamepad2,
            WalletTab: Wallet,
            ProfileTab: User,
          };
          const Icon = icons[route.name];
          const iconColor = focused ? T.gold : T.muted;
          return (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Icon size={size} color={iconColor} />
              {focused && <Text style={[styles.tabLabel, { color: T.gold }]}>{route.name.replace('Tab', '')}</Text>}
            </View>
          );
        },
        tabBarActiveTintColor: T.gold,
        tabBarInactiveTintColor: T.muted,
      })}
    >
      <Tab.Screen name="HomeTab" component={() => <PlaceholderScreen title="Accueil" />} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="PhysiqueTab" component={() => <PlaceholderScreen title="Physique" />} options={{ tabBarLabel: 'Physique' }} />
      <Tab.Screen name="GamesTab" component={() => <PlaceholderScreen title="Gaming" />} options={{ tabBarLabel: 'Gaming' }} />
      <Tab.Screen name="WalletTab" component={() => <PlaceholderScreen title="Wallet" />} options={{ tabBarLabel: 'Wallet' }} />
      <Tab.Screen name="ProfileTab" component={() => <PlaceholderScreen title="Profil" />} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(26, 29, 35, 0.8)',
    borderRadius: 40,
    height: 70,
    borderTopWidth: 0,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabLabel: {
    fontFamily: T.fontBody,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 30,
    flexDirection: 'row',
    gap: 4,
  },
  activeIconBg: {
    backgroundColor: `${T.gold}18`,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: `${T.gold}30`,
  },
});