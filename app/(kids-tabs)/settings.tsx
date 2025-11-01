import HelpModal from '@/components/HelpModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { useTheme } from "@/utils/themeContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { themeColors, animationSettings, setAnimationEnabled, setHapticFeedback, setSoundFeedback } = useTheme();
  const router = useRouter();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [loadingAnimations, setLoadingAnimations] = useState(false);
  const [loadingHaptic, setLoadingHaptic] = useState(false);
  const [loadingSound, setLoadingSound] = useState(false);

  const handleAnimationToggle = async (enabled: boolean) => {
    setLoadingAnimations(true);
    try {
      await setAnimationEnabled(enabled);
    } finally {
      setLoadingAnimations(false);
    }
  };

  const handleHapticToggle = async (enabled: boolean) => {
    setLoadingHaptic(true);
    try {
      await setHapticFeedback(enabled);
    } finally {
      setLoadingHaptic(false);
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    setLoadingSound(true);
    try {
      await setSoundFeedback(enabled);
    } finally {
      setLoadingSound(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
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
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.text, fontWeight: 'bold' }}>⬅️ Back</Text>
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
              alignItems: 'center',
            }}
            onPress={() => setHelpModalVisible(true)}
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card, fontWeight: 'bold' }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={MOBILE_STYLES.center}>
          <Text style={[styles.header, { color: themeColors.primary }]} accessibilityRole="header">⚙️ Settings</Text>
        </View>
      </View>

      <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Enable Animations</Text>
        {loadingAnimations ? (
          <LoadingSpinner size="small" color={themeColors.primary} />
        ) : (
          <Switch
            value={animationSettings.enabled}
            onValueChange={handleAnimationToggle}
            accessibilityLabel="Enable or disable all app animations"
          />
        )}
      </View>

      <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Haptic Feedback</Text>
        {loadingHaptic ? (
          <LoadingSpinner size="small" color={themeColors.primary} />
        ) : (
          <Switch
            value={animationSettings.hapticFeedback}
            onValueChange={handleHapticToggle}
            accessibilityLabel="Enable or disable vibration feedback"
          />
        )}
      </View>

      <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Sound Effects</Text>
        {loadingSound ? (
          <LoadingSpinner size="small" color={themeColors.primary} />
        ) : (
          <Switch
            value={animationSettings.soundFeedback}
            onValueChange={handleSoundToggle}
            accessibilityLabel="Enable or disable sound feedback"
          />
        )}
      </View>

      <View style={[styles.infoSection, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.infoLabel, { color: themeColors.primary }]}>System Reduced Motion:</Text>
        <Text style={[styles.infoValue, { color: themeColors.text }]}>{animationSettings.prefersReducedMotion ? "ON" : "OFF"}</Text>
      </View>

      <Text style={[styles.note, { color: themeColors.textSecondary }]}>
        When "System Reduced Motion" is ON, most motion and animations will be minimized for accessibility.
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
                text: "Some settings come from your phone's system:",
                icon: "📱"
              },
              {
                type: "bullet",
                text: "\"Reduced Motion\" = Your phone's accessibility setting"
              },
              {
                type: "bullet",
                text: "When \"ON\", it overrides your animation choice"
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
