import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SmartLearningSection() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Smart Learning Section</Text>
      <Text style={styles.desc}>
        Interactive lessons and activities will appear here soon!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#eef6fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b6d8f6',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2577ab',
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    color: '#457091',
    textAlign: 'center',
  }
});
