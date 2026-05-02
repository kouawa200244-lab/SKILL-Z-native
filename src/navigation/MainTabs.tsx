// @ts-nocheck
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomTabBar from '../components/CustomTabBar';

// Écrans
import DashboardHomeScreen from '../screens/DashboardHomeScreen';
import GamesScreen from '../screens/GamesScreen';
import PhysicalChallengesScreen from '../screens/PhysicalChallengesScreen';
import DefiSelectScreen from '../screens/DefiSelectScreen';
import ConfigScreen from '../screens/ConfigScreen';
import LiveScreen from '../screens/LiveScreen';
import ResultScreen from '../screens/ResultScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';

const stackScreenOptions = { headerShown: false };

// ── Stacks ──────────────────────────────────────────────────
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Lobby" component={DashboardHomeScreen} />
      <HomeStack.Screen name="GameSelect" component={GamesScreen} />
      <HomeStack.Screen name="PhysicalCategory" component={PhysicalChallengesScreen} />
      <HomeStack.Screen name="DefiSelect" component={DefiSelectScreen} />
      <HomeStack.Screen name="Config" component={ConfigScreen} />
      <HomeStack.Screen name="Live" component={LiveScreen} />
      <HomeStack.Screen name="Result" component={ResultScreen} />
    </HomeStack.Navigator>
  );
}

const WalletStack = createNativeStackNavigator();
function WalletStackScreen() {
  return (
    <WalletStack.Navigator screenOptions={stackScreenOptions}>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

const HistoryStack = createNativeStackNavigator();
function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator screenOptions={stackScreenOptions}>
      <HistoryStack.Screen name="HistoryMain" component={DashboardHomeScreen} />
    </HistoryStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ── Tab Navigator ───────────────────────────────────────────
const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryStackScreen} />
      <Tab.Screen name="WalletTab" component={WalletStackScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}