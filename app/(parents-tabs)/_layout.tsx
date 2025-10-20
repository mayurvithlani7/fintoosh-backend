import { Redirect, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


import ThemeToggle from '@/components/ThemeToggle';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNavigation } from '@/utils/navigationContext';
import { ThemeProvider, useTheme } from '@/utils/themeContext';

function HamburgerMenu({ isVisible, onClose, themeColors, router }: {
  isVisible: boolean;
  onClose: () => void;
  themeColors: any;
  router: any;
}) {
  const menuItems = [
    { name: '🏠 Overview', route: '/(parents-tabs)', icon: 'house.fill' },
    { name: '📚 Teaching', route: '/(parents-tabs)/teaching', icon: 'book.fill' },
    { name: '📋 Requests', route: '/(parents-tabs)/requests', icon: 'checkmark.circle.fill' },
    { name: '💰 Points', route: '/(parents-tabs)/points', icon: 'dollarsign.circle.fill' },
    { name: '🎯 Goals', route: '/(parents-tabs)/goals', icon: 'target' },
    { name: '🧹 Tasks', route: '/(parents-tabs)/chores', icon: 'checkmark.seal.fill' },
    { name: '🎁 Rewards', route: '/(parents-tabs)/rewards', icon: 'gift.fill' },
    { name: '📊 Progress', route: '/(parents-tabs)/analytics', icon: 'chart.bar.xaxis' },
    { name: '📈 History', route: '/(parents-tabs)/transaction-history', icon: 'list.bullet.rectangle' },
    { name: '⚙️ Settings', route: '/(parents-tabs)/settings', icon: 'gear' },
  ];

  console.log('HamburgerMenu isVisible:', isVisible);

  const dynamicStyles = StyleSheet.create({
    leftMenuContainer: {
      width: 250,
      backgroundColor: themeColors.background,
      height: '100%',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    leftMenuHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      alignItems: 'center',
    },
    leftMenuTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    leftMenuItem: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    leftMenuItemText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 15,
      color: themeColors.text,
    },
  });

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.leftOverlay}>
        <TouchableOpacity style={styles.leftOverlayTouchable} onPress={onClose} activeOpacity={1}>
          <View style={dynamicStyles.leftMenuContainer}>
            <View style={dynamicStyles.leftMenuHeader}>
              <Text style={dynamicStyles.leftMenuTitle}>👨‍👩‍👧‍👦 Menu</Text>
            </View>

            <View style={styles.leftMenuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={dynamicStyles.leftMenuItem}
                  onPress={() => {
                    onClose();
                    console.log('Navigating to:', item.route);
                    router.replace(item.route);
                  }}
                >
                  <View style={styles.leftMenuItemContent}>
                    <IconSymbol size={22} name={item.icon as any} color={themeColors.text} />
                    <Text style={dynamicStyles.leftMenuItemText}>
                      {item.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function ParentsTabLayoutInner() {
  const colorScheme = useColorScheme();
  const { themeColors } = useTheme();
  const { activeModal, setActiveModal } = useNavigation();
  const dataCache = require('@/utils/dataCacheContext').useDataCache();
  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: themeColors.background + 'CC',
      justifyContent: 'flex-start',
    },
  // menuHeader (theme-dependent) moved to dynamicStyles in both components
  });
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[PARENTS LAYOUT] Starting auth check...');
        const { getAuthToken, getUserData, clearAllAuthData } = await import('@/utils/secureStorage');

        // Check if auth token exists
        const token = await getAuthToken();
        console.log(`[PARENTS LAYOUT] Token retrieved: ${token ? 'present' : 'null'}, length: ${token?.length || 0}`);

        // Check if user data exists with extra error handling
        let user = null;
        try {
          user = await getUserData();
          console.log(`[PARENTS LAYOUT] User data retrieved: ${user ? 'present' : 'null'}, type: ${typeof user}`);

          // Additional validation - ensure user is a valid object
          if (user && typeof user === 'object' && user.id) {
            console.log(`[PARENTS LAYOUT] User validation passed, userId: ${user.id}, role: ${user.role}`);
          } else if (user) {
            console.warn('[PARENTS LAYOUT] User data exists but is invalid, clearing corrupted data');
            await clearAllAuthData();
            user = null;
          }
        } catch (userDataError) {
          console.error('[PARENTS LAYOUT] Error retrieving user data:', userDataError);
          // Clear corrupted data
          try {
            await clearAllAuthData();
            console.log('[PARENTS LAYOUT] Cleared corrupted auth data');
          } catch (clearError) {
            console.error('[PARENTS LAYOUT] Failed to clear corrupted data:', clearError);
          }
          user = null;
        }

        console.log(`[PARENTS LAYOUT] Final check: hasToken=${!!token}, hasValidUser=${!!user}`);

        if (token && user) {
          // Check if user is parent
          if (user.role === 'parent') {
            console.log('[PARENTS LAYOUT] Auth data valid, user is parent, proceeding to authenticated screens');
            setIsAuthenticated(true);
          } else {
            console.log('[PARENTS LAYOUT] Auth data valid but user is not parent, redirecting to login');
            setIsAuthenticated(false);
          }
          return;
        }

        console.log('[PARENTS LAYOUT] Auth data incomplete or invalid, redirecting to login');
        setIsAuthenticated(false);
      } catch (error) {
        console.error('[PARENTS LAYOUT] Auth check error:', error);
        // Try to clear potentially corrupted data
        try {
          const { clearAllAuthData } = await import('@/utils/secureStorage');
          await clearAllAuthData();
          console.log('[PARENTS LAYOUT] Cleared auth data after error');
        } catch (clearError) {
          console.error('[PARENTS LAYOUT] Failed to clear data after error:', clearError);
        }
        setIsAuthenticated(false);
      }
    };

    // Small delay to ensure storage is ready
    setTimeout(checkAuth, 100);
  }, []);

  // Show loading or redirect while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <Text style={{ color: themeColors.text }}>Loading...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated or backend not connected
  if (isAuthenticated === false) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerTitle: '',
          headerLeft: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  console.log('Hamburger pressed, setting activeModal to hamburger-menu');
                  setActiveModal('hamburger-menu');
                }}
                style={{ padding: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: themeColors.text }}>☰</Text>
              </TouchableOpacity>
              <Text style={{
                fontSize: 24,
                fontWeight: '900',
                letterSpacing: 0.5,
                color: '#6A49F3',
                marginLeft: 10,
              }}>
                Fintoosh
              </Text>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
              <ThemeToggle />
              <TouchableOpacity
                style={{
                  marginLeft: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: themeColors.error,
                  borderRadius: 6,
                }}
                onPress={async () => {
                  // Logout: clear all tokens, user data, and user-specific persistent state, then redirect
                  dataCache.resetDataCache();
                  const { clearSensitiveAppData } = await import('@/utils/secureStorage');
                  await clearSensitiveAppData();
                  router.replace('/login');
                }}
                accessibilityRole="button"
                accessibilityLabel="Logout"
              >
                <Text style={{ color: '#ffffff', fontWeight: "bold" }}>Logout</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Overview' }} />
        <Stack.Screen name="teaching" options={{ title: 'Teaching' }} />
        <Stack.Screen name="requests" options={{ title: 'Requests' }} />
        <Stack.Screen name="points" options={{ title: 'Points' }} />
        <Stack.Screen name="goals" options={{ title: 'Goals' }} />
        <Stack.Screen name="chores" options={{ title: 'Tasks' }} />
        <Stack.Screen name="rewards" options={{ title: 'Rewards' }} />
        <Stack.Screen name="analytics" options={{ title: 'Progress' }} />
        <Stack.Screen name="transaction-history" options={{ title: 'History' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>

      <HamburgerMenu
        isVisible={activeModal === 'hamburger-menu'}
        onClose={() => {
          console.log('Closing menu');
          setActiveModal(null);
        }}
        themeColors={themeColors}
        router={router}
      />
    </>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    marginTop: 60,
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxHeight: '70%',
  },
  // menuHeader (theme-dependent) moved to dynamicStyles in component
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuScroll: {
    padding: 10,
  },
  menuItem: {
    borderBottomWidth: 1,
    paddingVertical: 15,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  hamburgerButton: {
    marginLeft: 15,
    padding: 10,
  },
  hamburgerIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Left-side menu styles
  leftOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  leftOverlayTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  leftMenuItems: {
    flex: 1,
    paddingTop: 10,
  },
  leftMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

});

export default function ParentsTabLayout() {
  return (
    <ThemeProvider>
      <ParentsTabLayoutInner />
    </ThemeProvider>
  );
}
