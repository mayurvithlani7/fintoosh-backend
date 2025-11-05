import AchievementSystem from "@/components/AchievementSystem";
import HelpModal from "@/components/HelpModal";
import { SEMANTIC_TYPOGRAPHY } from "@/constants/theme";
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { useTheme } from "@/utils/themeContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4
  },
  title: {
    ...SEMANTIC_TYPOGRAPHY["type-display-medium"],
    marginBottom: 22,
    marginTop: 6,
    color: themeColors.primary
  }
  });

export default function AchievementsScreen() {
  const { themeColors } = useTheme();
  const router = useRouter();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: themeColors.background }} contentContainerStyle={styles.container}>
      <View style={{ ...MOBILE_STYLES.fullWidthContainer, marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing }}>
        <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: MOBILE_LAYOUT.cardBorderRadius,
              paddingHorizontal: MOBILE_LAYOUT.cardPadding,
              paddingVertical: MOBILE_LAYOUT.itemSpacing,
              elevation: MOBILE_LAYOUT.buttonElevation,
              minWidth: MOBILE_LAYOUT.minTouchTarget,
              minHeight: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center'
  }}
            onPress={() => router.push('./')}
            accessibilityRole="button"
            accessibilityLabel="Go back to home"
            accessibilityHint="Return to the main kids dashboard"
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.text
  }}>⬅️ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: MOBILE_LAYOUT.cardBorderRadius,
              paddingHorizontal: MOBILE_LAYOUT.cardPadding,
              paddingVertical: MOBILE_LAYOUT.itemSpacing,
              elevation: MOBILE_LAYOUT.buttonElevation,
              minWidth: MOBILE_LAYOUT.minTouchTarget,
              minHeight: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center'
  }}
            onPress={() => setHelpModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Open help guide for achievements"
          >
            <Text
              style={{
                ...MOBILE_STYLES.body,
                color: themeColors.card,
  }}
            >
              ❓ Help
            </Text>
          </TouchableOpacity>
        </View>
        <View style={MOBILE_STYLES.center}>
          <Text style={[styles.title, { color: themeColors.primary }]}>
            🏆 My Achievements
          </Text>
        </View>
      </View>

      <View style={{
        backgroundColor: themeColors.card,
        borderRadius: 14,
        marginBottom: 16,
        padding: 18,
        minWidth: 300,
        width: '97%',
        maxWidth: 520,
        alignSelf: 'center',
        elevation: 2,
        shadowColor: themeColors.border
  }}>
        <AchievementSystem />
      </View>

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
                icon: "🏅"
  },
              {
                type: "bullet",
                text: "Finish certain chores or learning tasks to unlock achievements"
  },
              {
                type: "bullet",
                text: "Some achievements are secret until you earn them"
  },
              {
                type: "highlight",
                text: "Achievements help track your progress and celebrate your successes!",
                icon: "🥳"
  }
  ]
  },
          {
            title: "How to Earn Achievements",
            content: [
              {
                type: "bullet",
                text: "Complete special milestones in chores, games, or learning sections"
  },
              {
                type: "bullet",
                text: "Sometimes you'll need to do a task more than once"
  },
              {
                type: "bullet",
                text: "Your achievements appear automatically when you unlock them"
  }
  ]
  },
          {
            title: "Why Achievements Matter",
            content: [
              {
                type: "text",
                text: "Achievements show how much you've learned and grown!",
                icon: "🌟"
  },
              {
                type: "bullet",
                text: "See your progress over time"
  },
              {
                type: "bullet",
                text: "Motivates you to try new things"
  },
              {
                type: "highlight",
                text: "Collect them all to become a Super Star!",
                icon: "🚀"
  }
  ]
  }
  ]}
      />
    </ScrollView>
  );
}
