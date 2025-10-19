import { GoalTemplate, getTemplatesByCategory, goalTemplates } from '@/utils/goalTemplates';
import { useTheme } from '@/utils/themeContext';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface GoalTemplatesProps {
  visible: boolean;
  onSelect: (template: GoalTemplate) => void;
  onClose: () => void;
  selectedCategory?: GoalTemplate['category'];
}

const createStyles = (themeColors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: themeColors.card,
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  closeButton: {
    backgroundColor: themeColors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: themeColors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoryTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  categoryTab: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderColor: '#007bff',
  },
  categoryTabText: {
    color: 'gray',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryTabTextActive: {
    color: '#007bff',
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  difficultyEasy: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  difficultyMedium: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  difficultyHard: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  milestonesSection: {
    marginBottom: 12,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  milestoneIcon: {
    fontSize: 12,
    marginRight: 8,
    color: '#28a745',
  },
  milestoneText: {
    fontSize: 12,
    color: '#555',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 40,
    marginBottom: 20,
  },
});

const GoalTemplates: React.FC<GoalTemplatesProps> = ({
  visible,
  onSelect,
  onClose,
  selectedCategory
}) => {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [activeCategory, setActiveCategory] = useState<GoalTemplate['category'] | 'all'>('all');

  const categories: (GoalTemplate['category'] | 'all')[] = ['all', 'saving', 'learning', 'charity', 'spending'];

  const getFilteredTemplates = () => {
    if (activeCategory === 'all') return goalTemplates;
    return getTemplatesByCategory(activeCategory);
  };

  const formatDuration = (days: number) => {
    if (days < 30) return `${days} days`;
    const months = Math.round(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const renderTemplateCard = ({ item }: { item: GoalTemplate }) => (
    <View style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateIcon}>{item.icon}</Text>
        <Text style={styles.templateTitle}>{item.name}</Text>
        <View style={[
          styles.difficultyBadge,
          item.difficulty === 'easy' && styles.difficultyEasy,
          item.difficulty === 'medium' && styles.difficultyMedium,
          item.difficulty === 'hard' && styles.difficultyHard,
        ]}>
          {item.difficulty}
        </View>
      </View>

      <Text style={styles.templateDescription}>{item.description}</Text>

      <View style={styles.templateDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Target</Text>
          <Text style={styles.detailValue}>{formatAmount(item.targetAmount)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Milestones</Text>
          <Text style={styles.detailValue}>{item.milestones.length}</Text>
        </View>
      </View>

      <View style={styles.milestonesSection}>
        <Text style={styles.milestonesTitle}>Key Milestones:</Text>
        {item.milestones.slice(0, 2).map((milestone, index) => (
          <View key={index} style={styles.milestoneItem}>
            <Text style={styles.milestoneIcon}>🎯</Text>
            <Text style={styles.milestoneText}>
              {milestone.description} ({formatAmount(milestone.targetAmount)})
            </Text>
          </View>
        ))}
        {item.milestones.length > 2 && (
          <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            +{item.milestones.length - 2} more milestones...
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => onSelect(item)}
      >
        <Text style={styles.selectButtonText}>Choose This Goal</Text>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🎯 Choose a Goal Template</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  activeCategory === category && styles.categoryTabActive,
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Text style={[
                  styles.categoryTabText,
                  activeCategory === category && styles.categoryTabTextActive,
                ]}>
                  {category === 'all' ? 'All Goals' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={getFilteredTemplates()}
            renderItem={renderTemplateCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyState}>
                No templates found in this category. Try selecting "All Goals".
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default GoalTemplates;
