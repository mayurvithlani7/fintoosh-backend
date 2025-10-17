import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ParentDashboardScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new tabbed parents dashboard
    router.replace('/(parents-tabs)');
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting to Parent Dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafd',
  },
  text: {
    fontSize: 18,
    color: '#194476',
  },
});
