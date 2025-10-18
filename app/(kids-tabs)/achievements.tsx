import AchievementSystem from "@/components/AchievementSystem";
import HelpModal from "@/components/HelpModal";
import { useTheme } from "@/utils/themeContext";
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
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 520,
          marginBottom: 22,
          marginTop: 6,
        }}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>
          🏆 My Achievements
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
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
