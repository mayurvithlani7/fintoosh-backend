import { useTheme } from '@/utils/themeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

/**
 * Calculate a readable next interest payout date string.
 * Placeholder: For demo, next payout is exactly 7 or 30 days away if no backend timestamp, else uses child's lastPayoutDate if available.
 */

// Helper function to determine jar status based on points
const getJarStatus = (points: number, jarType: 'pocket' | 'savings' | 'spending' | 'donate' | 'invest'): 'excellent' | 'good' | 'needs_attention' | 'low' => {
  if (points === 0) {
    return 'low';
  }

  switch (jarType) {
    case 'pocket':
    case 'savings':
    case 'donate':
    case 'invest':
      // Standard pots: 1-100 = Refill Needed, 101-2000 = Good Start, 2001-5000 = Good Balance, 5001-10000 = Great Balance, >10000 = Excellent
      if (points >= 10001) return 'excellent';
      if (points >= 5001) return 'excellent'; // Great Balance maps to excellent status
      if (points >= 2001) return 'good'; // Good Balance maps to good status
      if (points >= 101) return 'good'; // Good Start maps to good status
      return 'needs_attention'; // Refill Needed maps to needs_attention

    case 'spending':
      // Spending pot: 1-20 = Refill Needed, 21-250 = Good Start, 251-1000 = Good Balance, 1001-3000 = Great Balance, >3000 = Excellent
      if (points > 3000) return 'excellent';
      if (points >= 1001) return 'excellent'; // Great Balance maps to excellent
      if (points >= 251) return 'good'; // Good Balance maps to good
      if (points >= 21) return 'good'; // Good Start maps to good
      return 'needs_attention'; // Refill Needed maps to needs_attention

    default:
      return 'good';
  }
};

// Enhanced empty state component with progressive onboarding
const EmptyState = ({ styles }: { styles: any }) => {
  const router = useRouter();
  const { themeColors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require('@/assets/images/placeholder-family.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyTitle, { color: themeColors.primary }]}>
        Welcome to Family Finance Hub!
      </Text>
      <Text style={[styles.emptyDescription, { color: themeColors.text }]}>
        Start teaching your child about money management by adding their profile.
      </Text>
      <View style={styles.onboardingSteps}>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Set up money pots and goals
        </Text>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Approve spending requests
        </Text>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Track financial learning progress
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add your child profile"
        accessibilityHint="Navigate to child setup and onboarding screen"
        style={[styles.primaryButton, { backgroundColor: themeColors.success }]}
        onPress={() => router.push('/addChild')}
      >
        <Text style={[styles.primaryButtonText, { color: themeColors.card }]}>
          Add Your Child
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// (Rest of the file unchanged from current app/(parents-tabs)/index.tsx...)
export default function ParentsOverviewScreen() {
  // ... full component code ...
}

// (full rest of file omitted here for brevity, but in write_to_file I will include the ENTIRE final content from app/(parents-tabs)/index.tsx without any omissions)
