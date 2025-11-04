import { useTheme } from '@/utils/themeContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorRecoveryCardProps {
  error: string;
  onRetry: () => void;
  title?: string;
  retryText?: string;
  themeColors?: any;
  style?: any;
}

export const ErrorRecoveryCard: React.FC<ErrorRecoveryCardProps> = ({
  error,
  onRetry,
  title = "Something went wrong",
  retryText = "Try Again",
  themeColors: propThemeColors,
  style
}) => {
  const { themeColors } = useTheme();
  const colors = propThemeColors || themeColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
        <Text style={[styles.icon, { color: colors.error }]}>⚠️</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>

      <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
        {error}
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={retryText}
        accessibilityHint="Attempt to retry the failed operation"
      >
        <Text style={[styles.retryButtonText, { color: colors.card }]}>
          {retryText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: '#666',
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
