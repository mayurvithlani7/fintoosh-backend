import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
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

  // Load custom fonts for consistent typography across platforms
  const [fontsLoaded] = useFonts({
    // Inter fonts - Primary font stack
    'Inter-Light': require('../assets/fonts/Inter-Light.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('../assets/fonts/Inter-ExtraBold.ttf'),

    // SF Pro Display fonts - Secondary font stack
    'SF-Pro-Display-Regular': require('../assets/fonts/SF-Pro-Display-Regular.ttf'),
    'SF-Pro-Display-Medium': require('../assets/fonts/SF-Pro-Display-Medium.ttf'),
    'SF-Pro-Display-SemiBold': require('../assets/fonts/SF-Pro-Display-SemiBold.ttf'),
    'SF-Pro-Display-Bold': require('../assets/fonts/SF-Pro-Display-Bold.ttf'),

    // Fredoka fonts - Display font for kids sections
    'Fredoka-Regular': require('../assets/fonts/Fredoka-Regular.ttf'),
    'Fredoka-Medium': require('../assets/fonts/Fredoka-Medium.ttf'),
    'Fredoka-Bold': require('../assets/fonts/Fredoka-Bold.ttf'),

    // Nunito fonts - Tertiary warm font
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Medium': require('../assets/fonts/Nunito-Medium.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),

    // Poppins fonts - Accent font
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  // Show loading screen while fonts load
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4A90E2' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          Loading Fintoosh...
        </Text>
      </View>
    );
  }

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
