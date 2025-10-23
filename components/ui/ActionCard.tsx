import { useTheme } from '@/utils/themeContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  color: string;
  badge?: number | string | null;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  subtitle,
  color,
  badge,
  onPress,
  disabled = false,
  size = 'medium'
}) => {
  const { themeColors } = useTheme();

  const sizeStyles = {
    small: styles.smallCard,
    medium: styles.mediumCard,
    large: styles.largeCard,
  };

  const sizeTextStyles = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  };

  const sizeIconStyles = {
    small: styles.smallIcon,
    medium: styles.mediumIcon,
    large: styles.largeIcon,
  };

  const currentSize = sizeStyles[size];
  const currentTextStyle = sizeTextStyles[size];
  const currentIconStyle = sizeIconStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        currentSize,
        {
          backgroundColor: disabled ? themeColors.surface : color,
          borderColor: themeColors.border,
          opacity: disabled ? 0.6 : 1,
        }
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}${badge ? `, ${badge} items` : ''}`}
      accessibilityState={{ disabled }}
    >
      {/* Badge */}
      {badge && (
        <View style={[styles.badge, { backgroundColor: themeColors.error }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      {/* Icon */}
      <Text style={[currentIconStyle, { color: themeColors.card }]}>{icon}</Text>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, currentTextStyle, { color: themeColors.card }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, currentTextStyle, { color: themeColors.card + 'CC' }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Arrow indicator */}
      <Text style={[styles.arrow, { color: themeColors.card + '80' }]}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Size variants
  smallCard: {
    padding: 12,
    minHeight: 60,
  },
  mediumCard: {
    padding: 16,
    minHeight: 70,
  },
  largeCard: {
    padding: 20,
    minHeight: 80,
  },

  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Icon styles
  smallIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  mediumIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  largeIcon: {
    fontSize: 28,
    marginRight: 16,
  },

  content: {
    flex: 1,
  },

  // Text styles
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontWeight: '500',
    fontSize: 13,
  },

  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  arrow: {
    fontSize: 24,
    fontWeight: '300',
  },
});

export default ActionCard;
