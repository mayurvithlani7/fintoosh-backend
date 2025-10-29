import HelpModal from '@/components/HelpModal';
import { useTheme } from '@/utils/themeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function UserGuideScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const guideTabs = [
    {
      title: "�‍👩‍👦 Family Management",
      content: [
        {
          type: "text",
          text: "Welcome to Fintoosh! This guide will help you get started with teaching your children about money management.",
          icon: "🎉"
        },
        {
          type: "bullet",
          text: "Download the app and create the first parent account"
        },
        {
          type: "bullet",
          text: "Choose: New Family or Join Existing Family (for multiple parents)"
        },
        {
          type: "bullet",
          text: "Add your children with usernames and PINs"
        },
        {
          type: "bullet",
          text: "Set up your family's point distribution rules"
        },
        {
          type: "bullet",
          text: "Create initial chores and watch your children explore!"
        },
        {
          type: "highlight",
          text: "Multiple parents can share family management using family codes!",
          icon: "👨‍👩‍👧‍👦"
        }
      ]
    },
    {
      title: "🏺 Money Pots",
      content: [
        {
          type: "text",
          text: "Your child learns through 5 special money pots, each teaching different financial lessons:",
          icon: "🏺"
        },
        {
          type: "bullet",
          text: "💰 Pocket Money - Immediate spending (treats, small items)"
        },
        {
          type: "bullet",
          text: "🐷 Savings Pot - Big goals (bikes, tablets, special outings)"
        },
        {
          type: "bullet",
          text: "🛒 Spending Pot - Fun items they want (games, toys, clothes)"
        },
        {
          type: "bullet",
          text: "🤲 Help Others Pot - Charity and giving (donations, helping others)"
        },
        {
          type: "bullet",
          text: "📈 Grow Money Pot - Investment concepts (long-term savings)"
        },
        {
          type: "highlight",
          text: "Points automatically split across pots based on your family rules!",
          icon: "⚙️"
        }
      ]
    },
    {
      title: "🧹 Chores & Points",
      content: [
        {
          type: "text",
          text: "Turn household tasks into learning opportunities:",
          icon: "🧹"
        },
        {
          type: "bullet",
          text: "Create chores with appropriate point values (25-100 points)"
        },
        {
          type: "bullet",
          text: "Set clear expectations and quality standards"
        },
        {
          type: "bullet",
          text: "Your child submits for approval when complete"
        },
        {
          type: "bullet",
          text: "Review, discuss, and approve to distribute points"
        },
        {
          type: "bullet",
          text: "Use custom splits for special teaching moments"
        },
        {
          type: "highlight",
          text: "Every approval is a chance for a meaningful money conversation!",
          icon: "💬"
        }
      ]
    },
    {
      title: "🎯 Goals & Savings",
      content: [
        {
          type: "text",
          text: "Help your child set and achieve savings goals:",
          icon: "🎯"
        },
        {
          type: "bullet",
          text: "Create specific goals with target amounts and deadlines"
        },
        {
          type: "bullet",
          text: "Track progress with visual charts and celebrations"
        },
        {
          type: "bullet",
          text: "Set milestones for motivation (25%, 50%, 75%, 100%)"
        },
        {
          type: "bullet",
          text: "Discuss trade-offs when they want to move savings"
        },
        {
          type: "bullet",
          text: "Celebrate achievements and discuss what they learned"
        },
        {
          type: "highlight",
          text: "Goals teach patience, planning, and the joy of accomplishment!",
          icon: "🏆"
        }
      ]
    },
    {
      title: "📋 Requests & Approvals",
      content: [
        {
          type: "text",
          text: "Manage your child's financial requests with full context:",
          icon: "📋"
        },
        {
          type: "bullet",
          text: "See before/after balances for all transfer requests"
        },
        {
          type: "bullet",
          text: "Read their explanation and add your response"
        },
        {
          type: "bullet",
          text: "Discuss the decision and teach financial concepts"
        },
        {
          type: "bullet",
          text: "Approve purchases, transfers, and completed chores"
        },
        {
          type: "bullet",
          text: "Use denials as teaching opportunities, not punishments"
        },
        {
          type: "highlight",
          text: "Each approval becomes a valuable learning conversation!",
          icon: "🎓"
        }
      ]
    },
    {
      title: "💬 Teaching Tips",
      content: [
        {
          type: "text",
          text: "Make financial education fun and effective:",
          icon: "💡"
        },
        {
          type: "bullet",
          text: "Discuss decisions together during family time"
        },
        {
          type: "bullet",
          text: "Celebrate small wins and big achievements"
        },
        {
          type: "bullet",
          text: "Use real-world examples they understand"
        },
        {
          type: "bullet",
          text: "Ask questions instead of just giving answers"
        },
        {
          type: "bullet",
          text: "Make it consistent - review progress regularly"
        },
        {
          type: "bullet",
          text: "Focus on effort and learning, not perfection"
        },
        {
          type: "highlight",
          text: "Financial literacy is a journey - enjoy teaching these life skills!",
          icon: "🌟"
        }
      ]
    },
    {
      title: "📊 Analytics & Progress",
      content: [
        {
          type: "text",
          text: "Track your family's financial learning journey:",
          icon: "📊"
        },
        {
          type: "bullet",
          text: "View spending patterns across different pots"
        },
        {
          type: "bullet",
          text: "Monitor goal achievement and time to completion"
        },
        {
          type: "bullet",
          text: "See educational milestones and badges earned"
        },
        {
          type: "bullet",
          text: "Track family communication frequency"
        },
        {
          type: "bullet",
          text: "Review monthly progress and adjust strategies"
        },
        {
          type: "highlight",
          text: "Data helps you understand what's working and where to focus teaching!",
          icon: "📈"
        }
      ]
    },
    {
      title: "�‍👩‍👦 Family Management",
      content: [
        {
          type: "text",
          text: "Fintoosh supports modern family structures with multiple parents and children:",
          icon: "👨‍👩‍👧‍👦"
        },
        {
          type: "bullet",
          text: "Multiple caregivers can join using family codes (FAM-ABC123)"
        },
        {
          type: "bullet",
          text: "Any caregiver can approve requests and manage children"
        },
        {
          type: "bullet",
          text: "Easy switching between multiple children in parent dashboard"
        },
        {
          type: "bullet",
          text: "Shared notifications and family-wide updates"
        },
        {
          type: "bullet",
          text: "Perfect for step-parents, grandparents, or divorced co-parents"
        },
        {
          type: "highlight",
          text: "Family codes make it easy to coordinate parenting responsibilities!",
          icon: "🔗"
        }
      ]
    },
    {
      title: "�🚨 Troubleshooting",
      content: [
        {
          type: "text",
          text: "Common issues and solutions:",
          icon: "🔧"
        },
        {
          type: "bullet",
          text: "Points not showing? Check if parent approved the request"
        },
        {
          type: "bullet",
          text: "App running slowly? Refresh or restart the app"
        },
        {
          type: "bullet",
          text: "Transfer request stuck? Ensure sufficient points in source pot"
        },
        {
          type: "bullet",
          text: "Child can't log in? Verify username and PIN with them"
        },
        {
          type: "bullet",
          text: "Points not distributing correctly? Check your default split settings"
        },
        {
          type: "highlight",
          text: "Most issues resolve with a quick refresh or app restart!",
          icon: "🔄"
        }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={styles.helpButtonText}>❓ Help</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: themeColors.primary }]}>
          📚 Fintoosh User Guide
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text }]}>
          Your complete guide to teaching financial literacy through fun!
        </Text>
      </View>

      {/* Quick Navigation Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {guideTabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tab,
              {
                backgroundColor: selectedTab === index ? themeColors.primary : themeColors.surface,
                borderColor: themeColors.border
              }
            ]}
            onPress={() => setSelectedTab(index)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === index ? themeColors.card : themeColors.text
                }
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.contentContainer}>
        {guideTabs[selectedTab].content.map((item, index) => (
          <View key={index} style={styles.contentItem}>
            {item.type === 'text' && (
              <Text style={[styles.textContent, { color: themeColors.text }]}>
                {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
                {item.text}
              </Text>
            )}
            {item.type === 'bullet' && (
              <View style={styles.bulletContainer}>
                <Text style={[styles.bulletIcon, { color: themeColors.primary }]}>•</Text>
                <Text style={[styles.bulletContent, { color: themeColors.text }]}>
                  {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
                  {item.text}
                </Text>
              </View>
            )}
            {item.type === 'highlight' && (
              <View style={[
                styles.highlightContent,
                {
                  backgroundColor: themeColors.secondary + '20',
                  borderColor: themeColors.primary
                }
              ]}>
                <Text style={[styles.highlightText, { color: themeColors.text }]}>
                  {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
                  {item.text}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: themeColors.success }]}
          onPress={() => router.push('/(parents-tabs)/addChild')}
        >
          <Text style={[styles.footerButtonText, { color: themeColors.card }]}>
            Add Child
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: themeColors.primary }]}
          onPress={() => router.push('/(parents-tabs)/chores')}
        >
          <Text style={[styles.footerButtonText, { color: themeColors.card }]}>
            Create Chore
          </Text>
        </TouchableOpacity>
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="📚 User Guide Help"
        tabs={[
          {
            title: "Navigation",
            content: [
              {
                type: "text",
                text: "Use the tabs above to jump to different sections of the guide.",
                icon: "🧭"
              },
              {
                type: "bullet",
                text: "Quick Start - Get up and running in 30 minutes"
              },
              {
                type: "bullet",
                text: "Money Pots - Understand the 5-pot system"
              },
              {
                type: "bullet",
                text: "Teaching Tips - Best practices for success"
              },
              {
                type: "highlight",
                text: "Scroll horizontally to see all available sections!",
                icon: "👆"
              }
            ]
          },
          {
            title: "Getting More Help",
            content: [
              {
                type: "text",
                text: "Need more detailed help or have questions?",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "Check the ❓ Help button on any screen"
              },
              {
                type: "bullet",
                text: "Visit our website for complete guides"
              },
              {
                type: "bullet",
                text: "Contact support@fintoosh.com"
              },
              {
                type: "highlight",
                text: "Every screen has context-sensitive help available!",
                icon: "🎯"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: themeColors.primary,
    fontWeight: '600',
  },
  helpButton: {
    backgroundColor: themeColors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpButtonText: {
    color: themeColors.card,
    fontWeight: 'bold',
  },
  titleContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  tabsContainer: {
    maxHeight: 60,
    marginBottom: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  contentItem: {
    marginBottom: 16,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  bulletContent: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  highlightContent: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 4,
  },
  highlightText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
  },
  footerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
