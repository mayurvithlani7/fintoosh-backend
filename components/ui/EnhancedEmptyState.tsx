import { useTheme } from '@/utils/themeContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EnhancedEmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  themeColors?: any;
  style?: any;
}

export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
  icon = "🎯",
  title,
  description,
  actionText,
  onAction,
  themeColors: propThemeColors,
  style
}) => {
  const { themeColors } = useTheme();
  const colors = propThemeColors || themeColors;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>

      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={actionText}
          accessibilityHint={`Tap to ${actionText.toLowerCase()}`}
        >
          <Text style={[styles.actionButtonText, { color: colors.card }]}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
