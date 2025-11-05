import { Redirect, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ThemeToggle from '@/components/ThemeToggle';
import { ACCESSIBILITY } from '@/constants/accessibility';
import { TYPOGRAPHY } from '@/constants/theme';
import { fetchNotifications } from '@/utils/api';
import { useNavigation } from '@/utils/navigationContext';
import { ThemeProvider, useTheme } from '@/utils/themeContext';

function HamburgerMenu({ isVisible, onClose, themeColors, router }: {
  isVisible: boolean;
  onClose: () => void;
  themeColors: any;
  router: any;
}) {
  const menuItems = [
    { name: '💬 MoneyBuddy AI', route: '/(kids-tabs)/moneybuddy', icon: 'message.fill' },
    { name: '🏠 Home', route: '/(kids-tabs)', icon: 'house.fill' },
    { name: '💰 My Pots', route: '/(kids-tabs)/money-jars', icon: 'dollarsign.circle.fill' },
    { name: '🎯 My Goals', route: '/(kids-tabs)/goals', icon: 'target' },
    { name: '🎁 My Gifts', route: '/(kids-tabs)/gifts', icon: 'star.circle.fill' },
    { name: '🧹 My Tasks', route: '/(kids-tabs)/chores', icon: 'checkmark.seal.fill' },
    { name: '📚 Money Gyaan', route: '/(kids-tabs)/learn', icon: 'book.fill' },
    { name: '🎮 Games', route: '/(kids-tabs)/games', icon: 'gamecontroller.fill' },
    { name: '🏆 Badges', route: '/(kids-tabs)/achievements', icon: 'star.circle.fill' },
    { name: '📝 My Requests', route: '/(kids-tabs)/requests', icon: 'checkmark.circle.fill' },
    { name: '📊 My Points Story', route: '/(kids-tabs)/transaction-history', icon: 'chart.bar.fill' },
    { name: '👶 Kids Guide', route: '/(kids-tabs)/kids-guide', icon: 'person.fill' },
    { name: '⚙️ Settings', route: '/(kids-tabs)/settings', icon: 'gear' },
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
      ...TYPOGRAPHY.h3,
      color: themeColors.text,
    },
    leftMenuItem: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    leftMenuItemText: {
      ...TYPOGRAPHY.body,
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
              <Text style={dynamicStyles.leftMenuTitle}>🎮 Menu</Text>
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

function KidsTabLayoutInner() {
  const { themeColors } = useTheme();
  const { activeModal, setActiveModal } = useNavigation();
  const dataCache = require('@/utils/dataCacheContext').useDataCache();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationDrawerVisible, setNotificationDrawerVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check authentication and backend connectivity on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[KIDS LAYOUT] Starting auth check...');
        const { getAuthToken, getUser, clearAllAuthData } = await import('@/utils/secureStorage');

        // Check if auth token exists
        const token = await getAuthToken();
        console.log(`[KIDS LAYOUT] Token retrieved: ${token ? 'present' : 'null'}, length: ${token?.length || 0}`);

        // Check if user data exists with extra error handling
        let user = null;
        try {
          user = await getUser();
          console.log(`[KIDS LAYOUT] User data retrieved: ${user ? 'present' : 'null'}, type: ${typeof user}`);

          // Additional validation - ensure user is a valid object
          if (user && typeof user === 'object' && user.id) {
            console.log(`[KIDS LAYOUT] User validation passed, userId: ${user.id}`);
          } else if (user) {
            console.warn('[KIDS LAYOUT] User data exists but is invalid, clearing corrupted data');
            await clearAllAuthData();
            user = null;
          }
        } catch (userDataError) {
          console.error('[KIDS LAYOUT] Error retrieving user data:', userDataError);
          // Clear corrupted data
          try {
            await clearAllAuthData();
            console.log('[KIDS LAYOUT] Cleared corrupted auth data');
          } catch (clearError) {
            console.error('[KIDS LAYOUT] Failed to clear corrupted data:', clearError);
          }
          user = null;
        }

        console.log(`[KIDS LAYOUT] Final check: hasToken=${!!token}, hasValidUser=${!!user}`);

        if (token && user) {
          console.log('[KIDS LAYOUT] Auth data valid, proceeding to authenticated screens');
          setIsAuthenticated(true);
          return;
        }

        console.log('[KIDS LAYOUT] Auth data incomplete or invalid, redirecting to login');
        setIsAuthenticated(false);
      } catch (error) {
        console.error('[KIDS LAYOUT] Auth check error:', error);
        // Try to clear potentially corrupted data
        try {
          const { clearAllAuthData } = await import('@/utils/secureStorage');
          await clearAllAuthData();
          console.log('[KIDS LAYOUT] Cleared auth data after error');
        } catch (clearError) {
          console.error('[KIDS LAYOUT] Failed to clear data after error:', clearError);
        }
        setIsAuthenticated(false);
      }
    };

    // Small delay to ensure storage is ready
    setTimeout(checkAuth, 100);
  }, []);

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  // Function to load notifications
  const loadNotifications = async () => {
    try {
      const { getAuthToken, getUserData } = await import('@/utils/secureStorage');
      const token = await getAuthToken();
      const user = await getUserData();

      if (token && user) {
        const notifList = await fetchNotifications(user.id, token);
        setNotifications(notifList || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    }
  };

  // Enhanced logout function with proper error handling
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple simultaneous logout attempts

    setIsLoggingOut(true);
    console.log('[LOGOUT] Starting logout process...');

    try {
      // Step 1: Reset data cache
      console.log('[LOGOUT] Resetting data cache...');
      dataCache.resetDataCache();

      // Step 2: Clear sensitive app data (tokens, user data)
      console.log('[LOGOUT] Clearing sensitive app data...');
      const { clearSensitiveAppData } = await import('@/utils/secureStorage');
      await clearSensitiveAppData();

      // Step 3: Clear request cache
      console.log('[LOGOUT] Clearing request cache...');
      const { clearRequestCache } = await import('@/utils/api');
      clearRequestCache();

      console.log('[LOGOUT] Logout successful, redirecting to login...');
      // Step 4: Navigate to login screen
      router.replace('/login');

    } catch (error) {
      console.error('[LOGOUT] Error during logout:', error);

      // Fallback: try to clear what we can and redirect anyway
      try {
        console.log('[LOGOUT] Attempting fallback logout...');
        dataCache.resetDataCache();
        router.replace('/login');
      } catch (fallbackError) {
        console.error('[LOGOUT] Fallback logout failed:', fallbackError);
        // Last resort: force navigation
        setTimeout(() => {
          router.replace('/login');
        }, 100);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

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
          headerTitle: '',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerLeft: () => {
            const unreadCount = notifications.filter(n => !n.isRead).length;
            return (
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

                {/* Notification Bell - moved to left side */}
                <TouchableOpacity
                  onPress={() => setNotificationDrawerVisible(true)}
                  style={{
                    marginLeft: 6,
                    marginRight: 8,
                    padding: 6,
                    position: 'relative',
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <Text style={{ fontSize: 18, color: themeColors.text }}>🔔</Text>
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: themeColors.error,
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: themeColors.background,
                    }}>
                      <Text style={{
                        color: '#FFF',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={{
                  fontSize: 20,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  color: '#6A49F3',
                }}>
                  Fintoosh
                </Text>
              </View>
            );
          },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6 }}>
              <View style={{ transform: [{ scale: 0.8 }] }}>
                <ThemeToggle />
              </View>
              <TouchableOpacity
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: isLoggingOut ? themeColors.textSecondary : themeColors.error,
                  borderRadius: 6,
                  minWidth: 60,
                  minHeight: 36,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                }}
                onPress={handleLogout}
                disabled={isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel={isLoggingOut ? "Logging out..." : "Logout"}
                accessibilityState={{ disabled: isLoggingOut }}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: '#ffffff',
                  fontWeight: "bold",
                  fontSize: 14
                }}>
                  {isLoggingOut ? '⏳' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="moneybuddy" options={{ title: 'MoneyBuddy AI' }} />
        <Stack.Screen name="money-jars" options={{ title: 'My Pots' }} />
        <Stack.Screen name="goals" options={{ title: 'My Goals' }} />
        <Stack.Screen name="gifts" options={{ title: 'My Gifts' }} />
        <Stack.Screen name="chores" options={{ title: 'My Tasks' }} />
        <Stack.Screen name="learn" options={{ title: 'Money Gyaan' }} />
        <Stack.Screen name="games" options={{ title: 'Games' }} />
        <Stack.Screen name="achievements" options={{ title: 'Badges' }} />
        <Stack.Screen name="kids-guide" options={{ title: 'Kids Guide' }} />
        <Stack.Screen name="requests" options={{ title: 'My Requests' }} />
        <Stack.Screen name="transaction-history" options={{ title: 'My Points Story' }} />
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

      {/* Notification Drawer */}
      <Modal
        visible={notificationDrawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationDrawerVisible(false)}
      >
        <View style={styles.notificationOverlay}>
          <TouchableOpacity
            style={styles.notificationOverlayTouchable}
            onPress={() => setNotificationDrawerVisible(false)}
            activeOpacity={1}
          >
            <View style={[styles.notificationDrawer, { backgroundColor: themeColors.background }]}>
              {/* Header */}
              <View style={[styles.notificationHeader, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.notificationTitle, { color: themeColors.text }]}>
                  🔔 Notifications
                </Text>
                <TouchableOpacity
                  onPress={() => setNotificationDrawerVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={{ fontSize: 24, color: themeColors.text }}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.notificationContent} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                    🎉 All caught up! No notifications yet.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Mark all as read button - only show if there are unread notifications */}
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <View style={styles.notificationActions}>
                      <TouchableOpacity
                        style={[styles.markAllReadButton, { backgroundColor: themeColors.primary }]}
                        onPress={async () => {
                          try {
                            const { getAuthToken, getUserData } = await import('@/utils/secureStorage');
                            const token = await getAuthToken();
                            const user = await getUserData();
                            if (token && user) {
                              await fetch(`${require('@/utils/config').API_URL}/notifications/mark-all-read?userId=${user.id}`, {
                                method: "PATCH",
                                headers: { "Authorization": "Bearer " + token }
                              });
                              setNotifications(prev => prev.filter(n => n.isRead));
                            }
                          } catch (err) {
                            console.error('Failed to mark all notifications as read:', err);
                          }
                        }}
                      >
                        <Text style={[styles.markAllReadText, { color: themeColors.card }]}>
                          Mark All Read
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Notifications List - Show all notifications, not just unread */}
                  {notifications
                    .slice(0, 15) // Show max 15 notifications
                    .map((notification, index) => (
                      <TouchableOpacity
                        key={notification._id || index}
                        style={[
                          styles.notificationItem,
                          { borderBottomColor: themeColors.border }
                        ]}
                        onPress={async () => {
                          // Only mark as read if it's currently unread
                          if (!notification.isRead) {
                            try {
                              const { markNotificationRead } = await import('@/utils/api');
                              const { getAuthToken } = await import('@/utils/secureStorage');
                              const token = await getAuthToken();
                              if (notification._id && token) {
                                await markNotificationRead(notification._id, token);
                                setNotifications(prev =>
                                  prev.filter(n => n._id !== notification._id)
                                );
                              }
                            } catch (err) {
                              console.error('Failed to mark notification as read:', err);
                            }
                          }
                        }}
                      >
                        <View style={styles.notificationItemContent}>
                          <Text style={[
                            styles.notificationMessage,
                            {
                              color: themeColors.text,
                              opacity: notification.isRead ? 0.7 : 1,
                              fontWeight: notification.isRead ? '400' : '600'
                            }
                          ]}>
                            {notification.message}
                          </Text>
                          <Text style={[styles.notificationTime, { color: themeColors.textSecondary }]}>
                            {new Date(notification.createdAt || Date.now()).toLocaleDateString()}
                          </Text>
                        </View>
                        {!notification.isRead && (
                          <View style={[styles.unreadIndicator, { backgroundColor: themeColors.primary }]} />
                        )}
                      </TouchableOpacity>
                    ))}
                </>
              )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // overlay (theme-dependent) moved to dynamicStyles in the component
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
  // menuHeader (theme-dependent) moved to dynamicStyles in the component
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
    minWidth: ACCESSIBILITY.MIN_TOUCH_TARGET,
    minHeight: ACCESSIBILITY.MIN_TOUCH_TARGET,
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
  // Notification drawer styles
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  notificationOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  notificationDrawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  markAllReadButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
  },
  notificationItemContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
});

export default function KidsTabLayout() {
  return (
    <ThemeProvider>
      <KidsTabLayoutInner />
    </ThemeProvider>
  );
}
