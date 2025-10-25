import HelpModal from '@/components/HelpModal';
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from '@/utils/themeContext';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TABS = [
  { title: "Games", name: "games", icon: "gamecontroller.fill" },
  { title: "Badges", name: "achievements", icon: "trophy.fill" },
  { title: "Requests", name: "requests", icon: "list.bullet" },
  { title: "Settings", name: "settings", icon: "gearshape.fill" },
];

export default function MoreScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 18, marginTop: 6 }}>
        <Text style={[styles.header, { color: themeColors.primary }]}>📱 More</Text>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            elevation: 2,
            minWidth: 48,
            minHeight: 48,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setHelpModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Help and information"
          accessibilityHint="Open help guide for more options"
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.name}
          style={styles.item}
          // Typesafe navigation for Expo Router v2+
          onPress={() => router.push({ pathname: `/(kids-tabs)/${tab.name}` })}
          accessibilityRole="button"
          accessibilityLabel={tab.title}
          accessibilityHint={`Go to ${tab.title.toLowerCase()} section`}
        >
          <IconSymbol name={tab.icon as any} color={themeColors.primary} size={26} style={{ marginRight: 16 }} />
          <Text style={styles.text}>{tab.title}</Text>
        </TouchableOpacity>
      ))}

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="📱 More Options - Help"
        tabs={[
          {
            title: "What Is This?",
            content: [
              {
                type: "text",
                text: "The More screen gives you quick access to extra features and settings! It's like a menu for additional options.",
                icon: "📱"
              },
              {
                type: "bullet",
                text: "Tap any option to go to that section"
              },
              {
                type: "bullet",
                text: "All your favorite extra features are here"
              },
              {
                type: "bullet",
                text: "Quick way to change app settings"
              },
              {
                type: "highlight",
                text: "Everything you need beyond the main tabs!",
                icon: "⭐"
              }
            ]
          },
          {
            title: "Games",
            content: [
              {
                type: "text",
                text: "Play fun money games to earn points!",
                icon: "🎮"
              },
              {
                type: "bullet",
                text: "Investment games to learn about money growth"
              },
              {
                type: "bullet",
                text: "Mini-games with prizes"
              },
              {
                type: "bullet",
                text: "Festival-themed games"
              },
              {
                type: "highlight",
                text: "Games are the most fun way to learn about money!",
                icon: "🎉"
              }
            ]
          },
          {
            title: "Badges",
            content: [
              {
                type: "text",
                text: "Show off your achievements with badges!",
                icon: "🏆"
              },
              {
                type: "bullet",
                text: "Earn badges for completing goals"
              },
              {
                type: "bullet",
                text: "Badges for chores and tasks"
              },
              {
                type: "bullet",
                text: "Special badges for learning"
              },
              {
                type: "highlight",
                text: "Collect badges to show your money skills!",
                icon: "🎖️"
              }
            ]
          },
          {
            title: "Requests",
            content: [
              {
                type: "text",
                text: "Check on your requests to parents!",
                icon: "📝"
              },
              {
                type: "bullet",
                text: "See which requests are approved"
              },
              {
                type: "bullet",
                text: "Check which ones are still waiting"
              },
              {
                type: "bullet",
                text: "Read your parents' notes"
              },
              {
                type: "highlight",
                text: "Requests help you get permission for special things!",
                icon: "✅"
              }
            ]
          },
          {
            title: "Settings",
            content: [
              {
                type: "text",
                text: "Customize how the app works for you!",
                icon: "⚙️"
              },
              {
                type: "bullet",
                text: "Turn animations on/off"
              },
              {
                type: "bullet",
                text: "Change sound and vibration settings"
              },
              {
                type: "bullet",
                text: "Make the app comfortable for you"
              },
              {
                type: "highlight",
                text: "Settings help the app work just right for you!",
                icon: "🎛️"
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
    paddingVertical: 36,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    flexGrow: 1,
    backgroundColor: themeColors.background
  },
  header: {
    fontSize: 26,
    marginBottom: 18,
    color: themeColors.primary,
    fontWeight: "bold",
    alignSelf: "center"
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingLeft: 8,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  text: {
    fontSize: 18,
    color: themeColors.text,
    fontWeight: "600"
  }
});
