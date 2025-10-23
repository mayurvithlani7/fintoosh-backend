import { useTheme } from '@/utils/themeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
  size = 'medium'
}) => {
  const { themeColors } = useTheme();

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      icon: styles.smallIcon,
      value: styles.smallValue,
      label: styles.smallLabel,
    },
    medium: {
      container: styles.mediumContainer,
      icon: styles.mediumIcon,
      value: styles.mediumValue,
      label: styles.mediumLabel,
    },
    large: {
      container: styles.largeContainer,
      icon: styles.largeIcon,
      value: styles.largeValue,
      label: styles.largeLabel,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[currentSize.container, { backgroundColor: color || themeColors.surface }]}>
      <Text style={currentSize.icon}>{icon}</Text>
      <Text style={[currentSize.value, { color: themeColors.primary }]}>{value}</Text>
      <Text style={[currentSize.label, { color: themeColors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Small size
  smallContainer: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  smallIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  smallValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  smallLabel: {
    fontSize: 10,
    textAlign: 'center',
  },

  // Medium size
  mediumContainer: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mediumIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mediumValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  mediumLabel: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Large size
  largeContainer: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  largeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  largeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  largeLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default StatCard;
