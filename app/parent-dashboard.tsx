import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();

  useEffect(() => {
    // Redirect to the new tabbed parents dashboard, passing through the refresh parameter
    router.replace({
      pathname: '/(parents-tabs)',
      params: refresh ? { refresh } : {}
    });
  }, [router, refresh]);

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
