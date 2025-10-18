import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalSnackbar from '@/components/GlobalSnackbar';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
    <ErrorBoundary>
      <NavigationProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ThemeProvider>
            <GlobalFeedbackProvider>
              <CurrencyProvider>
                <DataCacheProvider>
                  <Stack>
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                    <Stack.Screen name="login" options={{ title: "Login" }} />
                    <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
                    <Stack.Screen name="forgot-password" options={{ title: "Forgot Password" }} />
                    <Stack.Screen name="kid-dashboard" options={{ title: "Kid Dashboard" }} />
                    <Stack.Screen name="parent-dashboard" options={{ title: "Parent Dashboard" }} />
                    <Stack.Screen name="test" options={{ title: "Test Components" }} />
                  </Stack>
                  <OfflineIndicator />
                  <GlobalSnackbar />
                  <StatusBar style="auto" />
                </DataCacheProvider>
              </CurrencyProvider>
            </GlobalFeedbackProvider>
          </ThemeProvider>
        </NavigationThemeProvider>
      </NavigationProvider>
    </ErrorBoundary>
  );
}
