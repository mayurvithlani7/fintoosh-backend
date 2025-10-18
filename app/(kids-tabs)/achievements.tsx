import AchievementSystem from "@/components/AchievementSystem";
import HelpModal from "@/components/HelpModal";
import { useTheme } from "@/utils/themeContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 22,
    marginTop: 6,
    color: themeColors.primary,
  },
});

export default function AchievementsScreen() {
  const { themeColors } = useTheme();
  const router = useRouter();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              elevation: 2,
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
          >
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
          </TouchableOpacity>
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
          >
            <Text
              style={{
                color: themeColors.card,
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              ❓ Help
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: themeColors.primary }]}>
            🏆 My Achievements
          </Text>
        </View>
      </View>

      <AchievementSystem />

      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🏆 My Achievements - Help"
        tabs={[
          {
            title: "What Are Achievements?",
            content: [
              {
                type: "text",
                text: "Achievements are special badges you earn for completing cool tasks, learning new things, or showing good behavior!",
                icon: "🏅",
              },
              {
                type: "bullet",
                text: "Finish certain chores or learning tasks to unlock achievements",
              },
              {
                type: "bullet",
                text: "Some achievements are secret until you earn them",
              },
              {
                type: "highlight",
                text: "Achievements help track your progress and celebrate your successes!",
                icon: "🥳",
              },
            ],
          },
          {
            title: "How to Earn Achievements",
            content: [
              {
                type: "bullet",
                text: "Complete special milestones in chores, games, or learning sections",
              },
              {
                type: "bullet",
                text: "Sometimes you'll need to do a task more than once",
              },
              {
                type: "bullet",
                text: "Your achievements appear automatically when you unlock them",
              },
            ],
          },
          {
            title: "Why Achievements Matter",
            content: [
              {
                type: "text",
                text: "Achievements show how much you've learned and grown!",
                icon: "🌟",
              },
              {
                type: "bullet",
                text: "See your progress over time",
              },
              {
                type: "bullet",
                text: "Motivates you to try new things",
              },
              {
                type: "highlight",
                text: "Collect them all to become a Super Star!",
                icon: "🚀",
              },
            ],
          },
        ]}
      />
    </ScrollView>
  );
}
