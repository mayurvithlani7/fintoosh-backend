import { deleteAuthToken } from '@/utils/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


import Breadcrumbs from '@/components/Breadcrumbs';
import ThemeToggle from '@/components/ThemeToggle';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNavigation } from '@/utils/navigationContext';
import { useTheme } from '@/utils/themeContext';

function HamburgerMenu({ isVisible, onClose, themeColors, router }: {
  isVisible: boolean;
  onClose: () => void;
  themeColors: any;
  router: any;
}) {
  const menuItems = [
    { name: '🏠 Overview', route: 'index', icon: 'house.fill' },
    { name: '📚 Teaching', route: 'teaching', icon: 'book.fill' },
    { name: '📋 Requests', route: 'requests', icon: 'checkmark.circle.fill' },
    { name: '💰 Points', route: 'points', icon: 'dollarsign.circle.fill' },
    { name: '🎯 Goals', route: 'goals', icon: 'target' },
    { name: '🧹 Tasks', route: 'chores', icon: 'checkmark.seal.fill' },
    { name: '🎁 Rewards', route: 'rewards', icon: 'gift.fill' },
    { name: '📊 Progress', route: 'analytics', icon: 'chart.bar.xaxis' },
    { name: '📈 History', route: 'transaction-history', icon: 'list.bullet.rectangle' },
    { name: '⚙️ Settings', route: 'settings', icon: 'gear' },
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
                    router.push(item.route);
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

export default function ParentsTabLayout() {
  const colorScheme = useColorScheme();
  const { themeColors } = useTheme();
  const { activeModal, setActiveModal } = useNavigation();
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

  // TEMPORARILY DISABLE AUTH CHECK FOR TESTING
  useEffect(() => {
    // Allow immediate access for testing
    console.log('Authentication check disabled for testing - allowing access');
    setIsAuthenticated(true);
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
          headerTitle: () => <Breadcrumbs />,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('Hamburger pressed, setting activeModal to hamburger-menu');
                setActiveModal('hamburger-menu');
              }}
              style={styles.hamburgerButton}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              activeOpacity={0.7}
            >
              <Text style={[styles.hamburgerIcon, { color: themeColors.text }]}>☰</Text>
            </TouchableOpacity>
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
                  // Logout: clear tokens and redirect
                  await deleteAuthToken();
                  await AsyncStorage.removeItem('user');
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
