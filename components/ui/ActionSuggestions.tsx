import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SuggestionCardProps {
  icon: string;
  title: string;
  action: string;
  onPress: () => void;
  priority?: 'high' | 'medium' | 'low';
  themeColors: any;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  icon,
  title,
  action,
  onPress,
  priority = 'medium',
  themeColors
}) => {
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: themeColors.warning + '15',
          borderColor: themeColors.warning,
          shadowColor: themeColors.warning,
        };
      case 'medium':
        return {
          backgroundColor: themeColors.primary + '15',
          borderColor: themeColors.primary,
          shadowColor: themeColors.primary,
        };
      case 'low':
        return {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          shadowColor: themeColors.border,
        };
    }
  };

  const priorityStyles = getPriorityStyles();

  return (
    <TouchableOpacity
      style={[styles.suggestionCard, {
        backgroundColor: priorityStyles.backgroundColor,
        borderColor: priorityStyles.borderColor,
        shadowColor: priorityStyles.shadowColor,
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionIcon}>{icon}</Text>
        <View style={styles.suggestionText}>
          <Text style={[styles.suggestionTitle, { color: themeColors.text }]}>{title}</Text>
          <Text style={[styles.suggestionAction, { color: themeColors.primary }]}>{action} →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface ActionSuggestionsProps {
  pendingRequests: number;
  childData: any;
  lastAllowanceDate?: Date;
  recentGoalActivity?: boolean;
  themeColors: any;
  onNavigateToRequests: () => void;
  onNavigateToPoints: () => void;
  onNavigateToGoals: () => void;
  onNavigateToChores: () => void;
}

export const ActionSuggestions: React.FC<ActionSuggestionsProps> = ({
  pendingRequests,
  childData,
  lastAllowanceDate,
  recentGoalActivity,
  themeColors,
  onNavigateToRequests,
  onNavigateToPoints,
  onNavigateToGoals,
  onNavigateToChores,
}) => {
  // Calculate if allowance is overdue (more than 7 days)
  const isAllowanceOverdue = () => {
    if (!lastAllowanceDate) return true; // No record means never given
    const daysSince = Math.floor((Date.now() - lastAllowanceDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
  };

  // Check if it's chore day (simplified - could be enhanced with actual schedule)
  const isChoreDay = () => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5; // Monday to Friday
  };

  // Generate contextual suggestions based on current state
  const getSuggestions = () => {
    const suggestions = [];

    // High priority: Pending requests
    if (pendingRequests > 0) {
      suggestions.push({
        icon: '📋',
        title: `${pendingRequests} Request${pendingRequests > 1 ? 's' : ''} Need${pendingRequests > 1 ? '' : 's'} Attention`,
        action: 'Review Now',
        priority: 'high' as const,
        onPress: onNavigateToRequests,
      });
    }

    // Medium priority: Allowance timing
    if (isAllowanceOverdue()) {
      suggestions.push({
        icon: '💰',
        title: lastAllowanceDate ? 'Time for Weekly Allowance?' : 'Give First Allowance',
        action: 'Give Pocket Money',
        priority: 'medium' as const,
        onPress: onNavigateToPoints,
      });
    }

    // Low priority: Goal encouragement
    if (recentGoalActivity || (childData && childData.savePoints > 0)) {
      suggestions.push({
        icon: '🎯',
        title: 'Check Goal Progress',
        action: 'View Goals',
        priority: 'low' as const,
        onPress: onNavigateToGoals,
      });
    }

    // Low priority: Chore reminders
    if (isChoreDay() && childData) {
      suggestions.push({
        icon: '🧹',
        title: 'Chore Day - Check Tasks',
        action: 'View Chores',
        priority: 'low' as const,
        onPress: onNavigateToChores,
      });
    }

    // Return top 2 suggestions to avoid clutter
    return suggestions.slice(0, 2);
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) {
    return null; // No suggestions to show
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>💡 Smart Suggestions</Text>
      {suggestions.map((suggestion, index) => (
        <SuggestionCard
          key={index}
          icon={suggestion.icon}
          title={suggestion.title}
          action={suggestion.action}
          priority={suggestion.priority}
          onPress={suggestion.onPress}
          themeColors={themeColors}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  suggestionCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionAction: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ActionSuggestions;
