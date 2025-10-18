import HelpModal from '@/components/HelpModal';
import { useTheme } from "@/utils/themeContext";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { themeColors, animationSettings, setAnimationEnabled, setHapticFeedback, setSoundFeedback } = useTheme();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 22, marginTop: 6 }}>
        <Text style={[styles.header, { color: themeColors.primary }]} accessibilityRole="header">Settings</Text>
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
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Enable Animations</Text>
        <Switch
          value={animationSettings.enabled}
          onValueChange={setAnimationEnabled}
          accessibilityLabel="Enable or disable all app animations"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Haptic Feedback</Text>
        <Switch
          value={animationSettings.hapticFeedback}
          onValueChange={setHapticFeedback}
          accessibilityLabel="Enable or disable vibration feedback"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Sound Effects</Text>
        <Switch
          value={animationSettings.soundFeedback}
          onValueChange={setSoundFeedback}
          accessibilityLabel="Enable or disable sound feedback"
        />
      </View>

      <View style={[styles.infoSection, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.infoLabel, { color: themeColors.primary }]}>System Reduced Motion:</Text>
        <Text style={[styles.infoValue, { color: themeColors.text }]}>{animationSettings.prefersReducedMotion ? "ON" : "OFF"}</Text>
      </View>

      <Text style={[styles.note, { color: themeColors.textSecondary }]}>
        When &quot;System Reduced Motion&quot; is ON, most motion and animations will be minimized for accessibility.
      </Text>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="⚙️ Settings - Help"
        tabs={[
          {
            title: "What Are Settings?",
            content: [
              {
                type: "text",
                text: "Settings let you customize how the app works for you! You can change sounds, vibrations, and animations.",
                icon: "⚙️"
              },
              {
                type: "bullet",
                text: "Turn things on or off with the switches"
              },
              {
                type: "bullet",
                text: "Your changes save automatically"
              },
              {
                type: "bullet",
                text: "Settings help make the app comfortable for you"
              },
              {
                type: "highlight",
                text: "Try different combinations to find what you like best!",
                icon: "🎛️"
              }
            ]
          },
          {
            title: "Enable Animations",
            content: [
              {
                type: "text",
                text: "Animations are the moving pictures and effects in the app:",
                icon: "🎬"
              },
              {
                type: "bullet",
                text: "ON = See fun animations when you earn points"
              },
                {
                type: "bullet",
                text: "OFF = App runs faster, no moving pictures"
              },
              {
                type: "bullet",
                text: "Good to turn OFF if animations make you dizzy"
              },
              {
                type: "highlight",
                text: "Most kids like animations ON for the fun effects!",
                icon: "✨"
              }
            ]
          },
          {
            title: "Haptic Feedback",
            content: [
              {
                type: "text",
                text: "Haptic feedback is when your phone vibrates:",
                icon: "📳"
              },
              {
                type: "bullet",
                text: "ON = Phone buzzes when you tap buttons"
              },
              {
                type: "bullet",
                text: "OFF = No vibrations from the app"
              },
              {
                type: "bullet",
                text: "Helps you know when you've pressed something"
              },
              {
                type: "highlight",
                text: "Good for kids who can't see the screen clearly!",
                icon: "👆"
              }
            ]
          },
          {
            title: "Sound Effects",
            content: [
              {
                type: "text",
                text: "Sound effects are the beeps and noises the app makes:",
                icon: "🔊"
              },
              {
                type: "bullet",
                text: "ON = Hear sounds when you earn points or complete tasks"
              },
              {
                type: "bullet",
                text: "OFF = App is completely quiet"
              },
              {
                type: "bullet",
                text: "Fun celebration sounds when you do well!"
              },
              {
                type: "highlight",
                text: "Turn OFF in quiet places like school or library!",
                icon: "🤫"
              }
            ]
          },
          {
            title: "System Settings",
            content: [
              {
                type: "text",
                text: "Some settings come from your phone&apos;s system:",
                icon: "📱"
              },
              {
                type: "bullet",
                // Corrected the unescaped quotes with &quot;
                text: "&quot;Reduced Motion&quot; = Your phone&apos;s accessibility setting"
              },
              {
                type: "bullet",
                // Corrected the unescaped quotes with &quot;
                text: "When &quot;ON&quot;, it overrides your animation choice"
              },
              {
                type: "bullet",
                text: "Helps people who get motion sickness"
              },
              {
                type: "highlight",
                text: "Ask your parents to change phone settings if needed!",
                icon: "👨‍👩‍👧‍👦"
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
    paddingVertical: 48,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    flexGrow: 1,
    backgroundColor: themeColors.background
  },
  header: {
    fontSize: 26,
    marginBottom: 25,
    color: themeColors.primary,
    fontWeight: "bold",
    alignSelf: "center"
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  settingLabel: {
    fontSize: 18,
    color: themeColors.text,
    fontWeight: "600"
  },
  infoSection: {
    marginTop: 36,
    marginBottom: 8,
    padding: 12,
    backgroundColor: themeColors.surface,
    borderRadius: 10,
    width: "100%",
    alignItems: "flex-start"
  },
  infoLabel: {
    fontSize: 15,
    color: themeColors.primary,
    fontWeight: "700"
  },
  infoValue: {
    fontSize: 15,
    color: themeColors.text,
    fontWeight: "700",
    marginTop: 8
  },
  note: {
    marginTop: 14,
    color: themeColors.textSecondary,
    fontSize: 14
  }
});
