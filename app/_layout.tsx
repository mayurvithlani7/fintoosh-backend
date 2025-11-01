import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import CenteredMessageModal from '@/components/CenteredMessageModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalSnackbar from '@/components/GlobalSnackbar';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CenteredMessageProvider } from '@/utils/centeredMessageContext';
import { CurrencyProvider } from '@/utils/currencyContext';
import { DataCacheProvider } from '@/utils/dataCacheContext';
import { GlobalFeedbackProvider } from '@/utils/globalFeedbackContext';
import { NavigationProvider } from '@/utils/navigationContext';
import { ThemeProvider } from '@/utils/themeContext';

/*
// Removed by Cline to expose /kid-dashboard as a top-level route.
export const unstable_settings = {
  anchor: '(tabs)',
};
*/

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <NavigationProvider>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <GlobalFeedbackProvider>
              <CurrencyProvider>
                <DataCacheProvider>
                  <CenteredMessageProvider>
                    <Stack>
                      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                      <Stack.Screen name="login" options={{ headerShown: false }} />
                      <Stack.Screen name="signup" options={{ headerShown: false }} />
                      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                      <Stack.Screen name="addChild" options={{ headerShown: false }} />
                      <Stack.Screen name="join-family" options={{ headerShown: false }} />
                      <Stack.Screen name="kid-dashboard" options={{ title: "Kid Dashboard" }} />
                      <Stack.Screen name="parent-dashboard" options={{ title: "Parent Dashboard" }} />
                      <Stack.Screen name="test" options={{ title: "Test Components" }} />
                      <Stack.Screen name="(parents-tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="(kids-tabs)" options={{ headerShown: false }} />
                    </Stack>
                    <OfflineIndicator />
                    <GlobalSnackbar />
                    <CenteredMessageModal />
                    <StatusBar style="auto" />
                  </CenteredMessageProvider>
                </DataCacheProvider>
              </CurrencyProvider>
            </GlobalFeedbackProvider>
          </NavigationThemeProvider>
        </NavigationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
