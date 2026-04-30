// @ts-nocheck
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Dumbbell, Gamepad2, Wallet } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { T } from '../utils/designTokens';

// Écrans
import DashboardHomeScreen from '../screens/DashboardHomeScreen';
import NewDefiScreen from '../screens/NewDefiScreen';
import GameSelectScreen from '../screens/GameSelectScreen';
import GamingChallengesScreen from '../screens/GamingChallengesScreen';
import PhysicalChallengesScreen from '../screens/PhysicalChallengesScreen';
import DefiSelectScreen from '../screens/DefiSelectScreen';
import ConfigScreen from '../screens/ConfigScreen';
import LiveScreen from '../screens/LiveScreen';
import ResultScreen from '../screens/ResultScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';

const stackScreenOptions = { headerShown: false };

// ─── Stack Accueil ────────────────────────────────────────
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Lobby" component={DashboardHomeScreen} />
      <HomeStack.Screen name="NewDefi" component={NewDefiScreen} />
      <HomeStack.Screen name="GameSelect" component={GameSelectScreen} />
      <HomeStack.Screen name="PhysicalCategory" component={PhysicalChallengesScreen} />
      <HomeStack.Screen name="DefiSelect" component={DefiSelectScreen} />
      <HomeStack.Screen name="Config" component={ConfigScreen} />
      <HomeStack.Screen name="Live" component={LiveScreen} />
      <HomeStack.Screen name="Result" component={ResultScreen} />
    </HomeStack.Navigator>
  );
}

// ─── Stack Physique ──────────────────────────────────────
const PhysiqueStack = createNativeStackNavigator();
function PhysiqueStackScreen() {
  return (
    <PhysiqueStack.Navigator screenOptions={stackScreenOptions}>
      <PhysiqueStack.Screen name="PhysicalMain" component={PhysicalChallengesScreen} />
      <PhysiqueStack.Screen name="DefiSelect" component={DefiSelectScreen} />
      <PhysiqueStack.Screen name="Config" component={ConfigScreen} />
      <PhysiqueStack.Screen name="Live" component={LiveScreen} />
      <PhysiqueStack.Screen name="Result" component={ResultScreen} />
    </PhysiqueStack.Navigator>
  );
}

// ─── Stack Gaming ────────────────────────────────────────
const GamesStack = createNativeStackNavigator();
function GamesStackScreen() {
  return (
    <GamesStack.Navigator screenOptions={stackScreenOptions}>
      <GamesStack.Screen name="GamingMain" component={GamingChallengesScreen} />
      <GamesStack.Screen name="DefiSelect" component={DefiSelectScreen} />
      <GamesStack.Screen name="Config" component={ConfigScreen} />
      <GamesStack.Screen name="Live" component={LiveScreen} />
      <GamesStack.Screen name="Result" component={ResultScreen} />
    </GamesStack.Navigator>
  );
}

// ─── Stack Wallet ────────────────────────────────────────
const WalletStack = createNativeStackNavigator();
function WalletStackScreen() {
  return (
    <WalletStack.Navigator screenOptions={stackScreenOptions}>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

// ─── Stack Profil ────────────────────────────────────────
const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab Navigator ───────────────────────────────────────
const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab: Home,
            PhysiqueTab: Dumbbell,
            GamesTab: Gamepad2,
            WalletTab: Wallet,
            ProfileTab: Wallet, // placeholder, on n'affiche plus Profil dans la barre
          };
          const Icon = icons[route.name] || Home;
          const iconColor = focused ? T.gold : T.muted;
          return (
            <View style={styles.iconContainer}>
              <Icon size={size} color={iconColor} />
            </View>
          );
        },
        tabBarActiveTintColor: T.gold,
        tabBarInactiveTintColor: T.muted,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ tabBarLabel: () => null }} />
      <Tab.Screen name="PhysiqueTab" component={PhysiqueStackScreen} options={{ tabBarLabel: () => null }} />
      <Tab.Screen name="GamesTab" component={GamesStackScreen} options={{ tabBarLabel: () => null }} />
      <Tab.Screen name="WalletTab" component={WalletStackScreen} options={{ tabBarLabel: () => null }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    height: 70,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
});