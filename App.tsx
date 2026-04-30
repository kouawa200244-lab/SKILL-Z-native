// @ts-nocheck
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { SessionProvider, useSession } from './src/context/SessionContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { T } from './src/utils/designTokens';

function AppContent() {
  const { user, loading } = useSession();
  const [authUser, setAuthUser] = React.useState(null);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user || authUser ? (
        <AppNavigator />
      ) : (
        <AuthScreen onLogin={(u) => setAuthUser(u)} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
