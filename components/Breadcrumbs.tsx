import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useSegments } from 'expo-router';

// Renders breadcrumbs like: Dashboard > Chores > Complete Task
export default function Breadcrumbs() {
  const segments = useSegments();
  // Transform segments into breadcrumb labels (customize as needed)
  // Example mapping for major tabs, can expand as required
  const segmentLabelMap: Record<string, string> = {
    'index': 'Home',
    'budget': 'Budget',
    'goals': 'Goals',
    'transactions': 'Transactions',
    'chores': 'Chores',
    'requests': 'Requests',
    'points': 'Points',
    'rewards': 'Rewards',
    'analytics': 'Analytics',
    'money-jars': 'Jars',
    'learn': 'Learn',
    'achievements': 'Achievements',
    'settings': 'Settings',
    'more': 'More',
    'parent-dashboard': 'Dashboard',
    'kid-dashboard': 'Dashboard',
  };
  const breadcrumbs = segments
    .filter((seg) => seg !== '(parents-tabs)' && seg !== '(kids-tabs)' && seg !== '(tabs)' && seg !== '')
    .map((seg) => segmentLabelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1));
  if (breadcrumbs.length <= 1) return null; // Hide if only on root tab

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text} numberOfLines={1}>
        {breadcrumbs.join(' > ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 20,
    paddingLeft: 8,
  },
  text: {
    fontSize: 13,
    color: '#7c8896',
    opacity: 0.78,
    fontWeight: '400',
  },
});
