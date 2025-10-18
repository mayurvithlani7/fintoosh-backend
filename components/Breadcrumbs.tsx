import { useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Renders breadcrumbs like: Dashboard > Chores > Complete Task
export default function Breadcrumbs() {
  const segments = useSegments();

  console.log('Breadcrumbs segments:', segments); // Debug logging

  // Transform segments into breadcrumb labels (customize as needed)
  // Example mapping for major tabs, can expand as required
  const segmentLabelMap: Record<string, string> = {
    'index': 'Overview',
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
    'teaching': 'Teaching',
    'transaction-history': 'History',
  };

  // More aggressive filtering of route groups and empty segments
  const breadcrumbs = segments
    .filter((seg) => {
      // Filter out route groups, empty segments, and problematic segments
      return seg !== '(parents-tabs)' &&
             seg !== '(kids-tabs)' &&
             seg !== '(tabs)' &&
             seg !== '' &&
             !seg.startsWith('(') &&
             !seg.endsWith(')');
    })
    .map((seg) => segmentLabelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1));

  console.log('Filtered breadcrumbs:', breadcrumbs); // Debug logging

  // Always show breadcrumbs if we have segments, even just one
  if (breadcrumbs.length === 0) return null;

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
