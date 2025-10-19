import { useTheme } from '@/utils/themeContext';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  tabs: {
    title: string;
    content: {
      type: 'text' | 'bullet' | 'highlight';
      text: string;
      icon?: string;
    }[];
  }[];
}

const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose, title, tabs }) => {
  const { themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      width: Math.min(width * 0.92, 360),
      maxHeight: Math.min(height * 0.75, 500),
      minHeight: Math.min(height * 0.4, 300),
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: themeColors.text,
      fontWeight: 'bold',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 6,
      minWidth: 80,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeTab: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    inactiveTab: {
      backgroundColor: themeColors.surface,
    },
    inactiveTabText: {
      color: themeColors.text,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    tabScrollContainer: {
      maxHeight: 50,
    },
    contentContainer: {
      padding: 12,
      maxHeight: Math.min(height * 0.4, 350),
      minHeight: Math.min(height * 0.25, 200),
    },
    contentItem: {
      marginBottom: 12,
    },
    textContent: {
      fontSize: 15,
      color: themeColors.text,
      lineHeight: 22,
    },
    bulletContent: {
      fontSize: 15,
      color: themeColors.text,
      lineHeight: 22,
      paddingLeft: 20,
    },
    bulletIcon: {
      fontSize: 15,
      color: themeColors.textSecondary,
      position: 'absolute',
      left: 0,
    },
    highlightContent: {
      fontSize: 15,
      color: themeColors.text,
      lineHeight: 22,
      backgroundColor: themeColors.surface,
      padding: 10,
      borderRadius: 6,
      borderLeftWidth: 3,
      borderLeftColor: themeColors.primary,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    highlightIcon: {
      fontSize: 20,
      marginRight: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollContainer}
            contentContainerStyle={styles.tabContainer}
          >
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tab,
                  activeTab === index ? styles.activeTab : styles.inactiveTab,
                ]}
                onPress={() => setActiveTab(index)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === index ? '#ffffff' : themeColors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content */}
          <ScrollView style={styles.contentContainer}>
            {tabs[activeTab].content.map((item, index) => (
              <View key={index} style={styles.contentItem}>
                {item.type === 'text' && (
                  <Text style={styles.textContent}>
                    {item.icon && <Text style={styles.highlightIcon}>{item.icon}</Text>}
                    {item.text}
                  </Text>
                )}
                {item.type === 'bullet' && (
                  <View style={{ position: 'relative' }}>
                    <Text style={styles.bulletIcon}>•</Text>
                    <Text style={styles.bulletContent}>
                      {item.icon && <Text style={styles.highlightIcon}>{item.icon}</Text>}
                      {item.text}
                    </Text>
                  </View>
                )}
                {item.type === 'highlight' && (
                  <Text style={styles.highlightContent}>
                    {item.icon && <Text style={styles.highlightIcon}>{item.icon}</Text>}
                    {item.text}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default HelpModal;
