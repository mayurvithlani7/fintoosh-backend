import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Usage: Insert into headerLeft or header for detail/child screens.
export default function BackButton({ label = 'Back', to }: { label?: string, to?: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        if (to) router.replace(to);
        else router.back();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="chevron-back" size={22} color="#184e82" style={{ marginRight: 3 }} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingVertical: 3,
  },
  label: {
    color: '#184e82',
    fontWeight: '600',
    fontSize: 16,
  }
});
