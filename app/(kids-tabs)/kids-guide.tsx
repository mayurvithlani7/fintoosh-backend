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

export default function KidsGuideScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const guideTabs = [
    {
      title: "🎉 Welcome!",
      content: [
        {
          type: "text",
          text: "Hi there! Welcome to Fintoosh - your super fun money adventure game!",
          icon: "🎈"
        },
        {
          type: "bullet",
          text: "This is YOUR special app for learning about money"
        },
        {
          type: "bullet",
          text: "You can earn points, save for cool stuff, and play games"
        },
        {
          type: "bullet",
          text: "Everything you do helps you become a money expert!"
        },
        {
          type: "highlight",
          text: "Ready to start your money adventure? Let's go! 🚀",
          icon: "⭐"
        }
      ]
    },
    {
      title: "🏠 Home Screen",
      content: [
        {
          type: "text",
          text: "Your Home screen is like your money control center!",
          icon: "🏠"
        },
        {
          type: "bullet",
          text: "See your total points at the top"
        },
        {
          type: "bullet",
          text: "Check all your money pots below"
        },
        {
          type: "bullet",
          text: "Find fun buttons to do different activities"
        },
        {
          type: "bullet",
          text: "See your recent adventures (what you've done)"
        },
        {
          type: "highlight",
          text: "Tap the ❓ button anytime for help!",
          icon: "💡"
        }
      ]
    },
    {
      title: "🏺 Money Pots",
      content: [
        {
          type: "text",
          text: "You have 5 special money pots that teach you about money!",
          icon: "🏺"
        },
        {
          type: "bullet",
          text: "💰 Pocket Money - For treats and fun spending right now"
        },
        {
          type: "bullet",
          text: "🐷 Savings Pot - For big goals like bikes or games"
        },
        {
          type: "bullet",
          text: "🛒 Spending Pot - For things you want (but can wait for)"
        },
        {
          type: "bullet",
          text: "🤲 Help Others Pot - For sharing and helping others"
        },
        {
          type: "bullet",
          text: "📈 Grow Money Pot - For learning about money growing bigger"
        },
        {
          type: "highlight",
          text: "Your parent decides how points get split between pots!",
          icon: "👨‍👩‍👧‍👦"
        }
      ]
    },
    {
      title: "🎯 Making Goals",
      content: [
        {
          type: "text",
          text: "Goals help you save for awesome things you want!",
          icon: "🎯"
        },
        {
          type: "bullet",
          text: "Think of something special you want to buy"
        },
        {
          type: "bullet",
          text: "Tell your parent what it costs and when you want it"
        },
        {
          type: "bullet",
          text: "Watch your progress grow like a progress bar!"
        },
        {
          type: "bullet",
          text: "Celebrate when you reach milestones (25%, 50%, 75%, 100%)"
        },
        {
          type: "highlight",
          text: "Goals teach you patience and planning - you're becoming a money master!",
          icon: "🏆"
        }
      ]
    },
    {
      title: "🧹 Doing Tasks",
      content: [
        {
          type: "text",
          text: "Tasks are like quests that give you points for helping!",
          icon: "🧹"
        },
        {
          type: "bullet",
          text: "Look at the tasks your parent made for you"
        },
        {
          type: "bullet",
          text: "Do the task exactly like your parent asked"
        },
        {
          type: "bullet",
          text: "Mark it as completed and ask for approval"
        },
        {
          type: "bullet",
          text: "Wait for your parent to check and give you points!"
        },
        {
          type: "highlight",
          text: "Good work = points = fun rewards! Keep helping around the house!",
          icon: "✨"
        }
      ]
    },
    {
      title: "🔄 Moving Points",
      content: [
        {
          type: "text",
          text: "Sometimes you want to move points between your pots!",
          icon: "🔄"
        },
        {
          type: "bullet",
          text: "Go to 'My Pots' section"
        },
        {
          type: "bullet",
          text: "Choose which pot to take points FROM"
        },
        {
          type: "bullet",
          text: "Choose which pot to put points TO"
        },
        {
          type: "bullet",
          text: "Tell your parent WHY you want to move them"
        },
        {
          type: "highlight",
          text: "Your parent will see before and after amounts and decide!",
          icon: "🤔"
        }
      ]
    },
    {
      title: "🎁 Getting Rewards",
      content: [
        {
          type: "text",
          text: "When you save enough points, you can get awesome rewards!",
          icon: "🎁"
        },
        {
          type: "bullet",
          text: "Look at rewards your parent set up"
        },
        {
          type: "bullet",
          text: "Check how many points each reward costs"
        },
        {
          type: "bullet",
          text: "Ask your parent for the reward when you have enough points"
        },
        {
          type: "bullet",
          text: "They will check and give you the reward!"
        },
        {
          type: "highlight",
          text: "Saving points for rewards teaches you about waiting for good things!",
          icon: "⏳"
        }
      ]
    },
    {
      title: "📚 Learning Money",
      content: [
        {
          type: "text",
          text: "The Money Gyaan section has fun ways to learn about money!",
          icon: "📚"
        },
        {
          type: "bullet",
          text: "Read stories about kids and money"
        },
        {
          type: "bullet",
          text: "Watch short videos about money tips"
        },
        {
          type: "bullet",
          text: "Play games that teach money skills"
        },
        {
          type: "bullet",
          text: "Answer questions to test what you learned"
        },
        {
          type: "highlight",
          text: "Learning about money can be fun - and you get badges for being smart!",
          icon: "🎓"
        }
      ]
    },
    {
      title: "🎮 Playing Games",
      content: [
        {
          type: "text",
          text: "Games make learning about money super exciting!",
          icon: "🎮"
        },
        {
          type: "bullet",
          text: "Match coins to learn about different amounts"
        },
        {
          type: "bullet",
          text: "Plan pretend shopping trips"
        },
        {
          type: "bullet",
          text: "See how saving money makes it grow"
        },
        {
          type: "bullet",
          text: "Help characters make good money choices"
        },
        {
          type: "highlight",
          text: "Games teach you money skills while having tons of fun!",
          icon: "😄"
        }
      ]
    },
    {
      title: "🏆 Getting Badges",
      content: [
        {
          type: "text",
          text: "Badges are like trophies for your money achievements!",
          icon: "🏆"
        },
        {
          type: "bullet",
          text: "Complete goals to get goal badges"
        },
        {
          type: "bullet",
          text: "Finish learning modules for smart badges"
        },
        {
          type: "bullet",
          text: "Save consistently to earn saver badges"
        },
        {
          type: "bullet",
          text: "Share with others to get giving badges"
        },
        {
          type: "highlight",
          text: "Collect all the badges - you're becoming a money expert!",
          icon: "🌟"
        }
      ]
    },
    {
      title: "📞 Getting Help",
      content: [
        {
          type: "text",
          text: "Never get stuck - there's always someone to help!",
          icon: "📞"
        },
        {
          type: "bullet",
          text: "Tap the ❓ button on any screen for hints"
        },
        {
          type: "bullet",
          text: "Ask your parent if you need help with the app"
        },
        {
          type: "bullet",
          text: "Look for guide messages when you first start"
        },
        {
          type: "bullet",
          text: "Check notifications for important updates"
        },
        {
          type: "highlight",
          text: "Everyone needs help sometimes - asking questions makes you smarter!",
          icon: "🧠"
        }
      ]
    },
    {
      title: "🎊 Pro Tips",
      content: [
        {
          type: "text",
          text: "Here are some super tips to become a money master!",
          icon: "💡"
        },
        {
          type: "bullet",
          text: "Check your points every day to see your progress"
        },
        {
          type: "bullet",
          text: "Think carefully before moving points between pots"
        },
        {
          type: "bullet",
          text: "Tell your parent exactly what you want to save for"
        },
        {
          type: "bullet",
          text: "Complete tasks right away so you don't forget"
        },
        {
          type: "bullet",
          text: "Share your achievements with your family!"
        },
        {
          type: "highlight",
          text: "You're learning real money skills that will help you your whole life! Keep it up! 🚀",
          icon: "🌈"
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
          accessibilityRole="button"
          accessibilityLabel="Go back to previous screen"
          accessibilityHint="Return to the previous page"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setHelpModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Help and information"
          accessibilityHint="Open help guide for using the kids guide"
        >
          <Text style={styles.helpButtonText}>❓ Help</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: themeColors.primary }]}>
          👶 Kids' Money Guide
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text }]}>
          Your fun guide to becoming a money expert!
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
            accessibilityRole="tab"
            accessibilityLabel={tab.title}
            accessibilityHint={`Switch to ${tab.title} section`}
            accessibilityState={{ selected: selectedTab === index }}
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
          onPress={() => router.push('/(kids-tabs)/learn')}
          accessibilityRole="button"
          accessibilityLabel="Learn about money"
          accessibilityHint="Go to the money learning section with stories and videos"
        >
          <Text style={[styles.footerButtonText, { color: themeColors.card }]}>
            📚 Learn Money
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: themeColors.primary }]}
          onPress={() => router.push('/(kids-tabs)/games')}
          accessibilityRole="button"
          accessibilityLabel="Play money games"
          accessibilityHint="Go to the games section to play fun money learning games"
        >
          <Text style={[styles.footerButtonText, { color: themeColors.card }]}>
            🎮 Play Games
          </Text>
        </TouchableOpacity>
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="👶 Kids' Guide Help"
        tabs={[
          {
            title: "Using This Guide",
            content: [
              {
                type: "text",
                text: "This guide helps you understand everything about your money app!",
                icon: "📖"
              },
              {
                type: "bullet",
                text: "Scroll through different topics using the buttons above"
              },
              {
                type: "bullet",
                text: "Each section explains one part of the app"
              },
              {
                type: "bullet",
                text: "Look for the ⭐ highlights - they're the most important tips!"
              },
              {
                type: "highlight",
                text: "Read a little bit each day to become a money expert!",
                icon: "🎯"
              }
            ]
          },
          {
            title: "Need More Help?",
            content: [
              {
                type: "text",
                text: "Don't worry if you need extra help!",
                icon: "🤗"
              },
              {
                type: "bullet",
                text: "Ask your parent to explain anything confusing"
              },
              {
                type: "bullet",
                text: "Tap ❓ buttons in the app for quick hints"
              },
              {
                type: "bullet",
                text: "Look at the pictures and examples"
              },
              {
                type: "highlight",
                text: "You're doing great just by trying to learn!",
                icon: "🌟"
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
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletIcon: {
    fontSize: 20,
    marginRight: 12,
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
    textAlign: 'center',
  },
  icon: {
    fontSize: 20,
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
