import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { SuccessAnimation } from '@/components/animations/SuccessAnimation';
import ErrorBoundary from '@/components/ErrorBoundary';
import HelpModal from '@/components/HelpModal';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { useTheme } from '@/utils/themeContext';

import { CulturalBorder, RangoliPattern } from "@/components/cultural";

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
  sectionCard: {
    backgroundColor: themeColors.card,
    borderRadius: 14,
    marginBottom: 16,
    padding: 12,
    minWidth: 280,
    width: "95%",
    maxWidth: 480,
    elevation: 2,
    shadowColor: themeColors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: themeColors.text,
  },
  lessonCard: {
    width: "45%",
    margin: "1%",
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    elevation: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    minHeight: 70,
    maxWidth: 100,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: themeColors.border,
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  lessonCard2x2: {
    width: "48%",
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    elevation: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    minHeight: 90,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: themeColors.border,
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  lessonIcon: {
    fontSize: 35,
    marginBottom: 7,
  },
  lessonTitle: {
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
    color: themeColors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.overlay || 'rgba(0,0,0,0.38)',
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: themeColors.card,
    borderRadius: 18,
    width: "87%",
    maxWidth: 400,
    paddingBottom: 12,
    shadowColor: themeColors.border,
    shadowRadius: 8,
    elevation: 7,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 9,
    textAlign: "center",
    color: themeColors.primary,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
    color: themeColors.text,
  },
  closeButton: {
    backgroundColor: themeColors.surface,
    borderColor: themeColors.border,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 21,
    borderRadius: 8,
    alignSelf: "center",
  },
  closeButtonText: {
    fontWeight: "700",
    color: themeColors.text,
  },
  quizOption: {
    borderRadius: 7,
    padding: 9,
    marginBottom: 7,
    width: 220,
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderColor: themeColors.border,
    borderWidth: 1,
  },
  quizButton: {
    backgroundColor: themeColors.success + "22",
    borderRadius: 7,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
  },
  quizButtonText: {
    color: themeColors.success,
    fontWeight: "bold",
  },
  quizCloseButton: {
    backgroundColor: themeColors.warning + "33",
    paddingVertical: 7,
    paddingHorizontal: 17,
    borderRadius: 8,
  },
  quizCloseButtonText: {
    fontWeight: "bold",
    color: themeColors.warning,
  },
});

export default function LearnScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  return (
    <ScrollView style={{ backgroundColor: themeColors.background }} contentContainerStyle={styles.container}>
      <RangoliPattern color="#FF9933" opacity={0.03} />
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
            onPress={() => router.push('/')}
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            accessibilityHint="Return to the main kids dashboard"
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
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Open help guide for learning about money"
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card, fontWeight: 'bold' }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={MOBILE_STYLES.center}>
          <Text style={[styles.title, { color: themeColors.primary }]} accessibilityRole="header" accessibilityLabel="Learn About Money Education Section">📚 Learn About Money</Text>
        </View>
      </View>

      {/* Temporarily hidden - Interactive Learning Modules Section */}
      {false && (
        <EducationModulesSection
          selectedModule={selectedModule}
          setSelectedModule={setSelectedModule}
        />
      )}
      <FinancialLessonsSection />
      <MyAchievementsSection />

      {/* Module Modal */}
      <Modal
        visible={!!selectedModule}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedModule(null)}
      >
        <ErrorBoundary fallback={({ error, resetError }) => (
          <View style={styles.modalContainer}>
            <View style={{
              backgroundColor: themeColors.card,
              borderRadius: 20,
              width: "90%",
              maxWidth: 400,
              maxHeight: "80%",
              shadowColor: themeColors.border,
              shadowRadius: 10,
              elevation: 10,
            }}>
              <Text style={{...styles.modalTitle, padding: 20, textAlign: 'center'}}>Oops! Something went wrong</Text>
              <Text style={{...styles.modalText, paddingHorizontal: 20, paddingBottom: 20}}>
                We encountered an error loading this module. Please try again.
              </Text>
              <TouchableOpacity
                style={{...styles.closeButton, margin: 20}}
                onPress={() => {
                  resetError();
                  setSelectedModule(null);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}>
          <View style={styles.modalContainer}>
            {selectedModule ? <EducationModuleModal module={selectedModule} onClose={() => setSelectedModule(null)} /> : null}
          </View>
        </ErrorBoundary>
      </Modal>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="📚 Learn About Money - Help"
        tabs={[
          {
            title: "What Super Fun Things You'll Learn!",
            content: [
              {
                type: "text",
                text: "Hey there, money explorer! 🎉 This section is full of awesome games and lessons about money. You'll learn how to be a money superhero!",
                icon: "📚"
              },
              {
                type: "bullet",
                text: "🐷 Saving - Put your points in a piggy bank for later fun!"
              },
              {
                type: "bullet",
                text: "🛒 Smart Spending - Buy things you really need and want!"
              },
              {
                type: "bullet",
                text: "🤲 Sharing - Give points to help friends and animals!"
              },
              {
                type: "highlight",
                text: "Take your time and have fun learning! No rush at all! 🎈",
                icon: "⏰"
              }
            ]
          },
          {
            title: "Cool Interactive Lessons - Tap to Play!",
            content: [
              {
                type: "text",
                text: "Click on any colorful card to open an adventure:",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "🐷 Piggy Bank Magic - Watch your money grow like magic! ✨"
              },
              {
                type: "bullet",
                text: "🧠 Fun Quiz Time - Answer questions and earn stars! ⭐"
              },
              {
                type: "bullet",
                text: "🔀 Sort & Play - Drag things into Need or Want baskets! 🎲"
              },
              {
                type: "bullet",
                text: "💵 Pocket Money Adventure - Learn about allowance money!"
              },
              {
                type: "highlight",
                text: "Some lessons have mini-games inside - super exciting! 🎮",
                icon: "🎮"
              }
            ]
          },
          {
            title: "Watch Fun Videos - Like TV but Educational!",
            content: [
              {
                type: "text",
                text: "Sit back and watch cool videos that teach you money stuff:",
                icon: "🎥"
              },
              {
                type: "bullet",
                text: "Needs vs Wants cartoon video - super funny! 📺"
              },
              {
                type: "bullet",
                text: "Press the big play triangle button ▶️ to start watching"
              },
              {
                type: "bullet",
                text: "Pause anytime with the pause button ⏸️"
              },
              {
                type: "highlight",
                text: "Videos make learning feel like watching your favorite cartoons! 🌟",
                icon: "💡"
              }
            ]
          },
          {
            title: "Money Tests - Show What You Know!",
            content: [
              {
                type: "text",
                text: "Ready to test your money smarts? Let's play!",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "Take a quiz with fun questions about money"
              },
              {
                type: "bullet",
                text: "See how many stars ⭐ you get for correct answers!"
              },
              {
                type: "bullet",
                text: "Play again to try to beat your high score!"
              },
              {
                type: "highlight",
                text: "Every try makes you smarter - keep practicing! 📈",
                icon: "📈"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}

// --- EducationModulesSection: Dynamic education modules from database ---
function EducationModulesSection({ selectedModule, setSelectedModule }: { selectedModule: any; setSelectedModule: (module: any) => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    loadModules();
  }, [selectedCategory, selectedDifficulty]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const userData = await AsyncStorage.getItem('user');

      if (!token || !userData) return;

      const user = JSON.parse(userData);
      const params = new URLSearchParams({
        childId: user.id,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedDifficulty !== 'all' && { difficulty: selectedDifficulty })
      });

      const response = await fetch(`${API_URL}/education/modules?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      } else {
        console.error('Failed to load education modules');
        setModules([]);
      }
    } catch (error) {
      console.error('Error loading education modules:', error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: '📚 All Topics', icon: '📚' },
    { key: 'saving', label: '🐷 Saving', icon: '🐷' },
    { key: 'budgeting', label: '🛒 Budgeting', icon: '🛒' },
    { key: 'investing', label: '📈 Investing', icon: '📈' },
    { key: 'giving', label: '🤲 Giving', icon: '🤲' }
  ];

  const difficulties = [
    { key: 'all', label: '⭐ All Levels' },
    { key: 'beginner', label: '🌱 Beginner' },
    { key: 'intermediate', label: '🌿 Intermediate' },
    { key: 'advanced', label: '🌳 Advanced' }
  ];

  if (loading) {
    return (
      <CulturalBorder variant="mixed">
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 12 }]}>
          🎓 Interactive Learning Modules
        </Text>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ color: themeColors.textSecondary }}>
            Loading learning modules...
          </Text>
        </View>
      </CulturalBorder>
    );
  }

  return (
    <CulturalBorder variant="mixed">
      <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 12 }]}>
        🎓 Interactive Learning Modules
      </Text>

      {/* Category Filter */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: themeColors.textSecondary, marginBottom: 8, textAlign: 'center' }}>
          Choose Topic:
        </Text>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 4,
          paddingHorizontal: 2
        }}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              onPress={() => setSelectedCategory(category.key)}
              style={{
                backgroundColor: selectedCategory === category.key
                  ? themeColors.primary + '33'
                  : themeColors.surface,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: selectedCategory === category.key
                  ? themeColors.primary
                  : themeColors.border,
                minWidth: 70,
                flex: 1,
                maxWidth: 100,
              }}
            >
              <Text style={{
                fontSize: 11,
                fontWeight: selectedCategory === category.key ? 'bold' : 'normal',
                color: selectedCategory === category.key ? themeColors.primary : themeColors.text,
                textAlign: 'center'
              }}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulty Filter */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: themeColors.textSecondary, marginBottom: 8, textAlign: 'center' }}>
          Choose Level:
        </Text>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 4,
          paddingHorizontal: 2
        }}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.key}
              onPress={() => setSelectedDifficulty(difficulty.key)}
              style={{
                backgroundColor: selectedDifficulty === difficulty.key
                  ? themeColors.secondary + '33'
                  : themeColors.surface,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: selectedDifficulty === difficulty.key
                  ? themeColors.secondary
                  : themeColors.border,
                minWidth: 70,
                flex: 1,
                maxWidth: 100,
              }}
            >
              <Text style={{
                fontSize: 11,
                fontWeight: selectedDifficulty === difficulty.key ? 'bold' : 'normal',
                color: selectedDifficulty === difficulty.key ? themeColors.secondary : themeColors.text,
                textAlign: 'center'
              }}>
                {difficulty.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Modules Grid */}
      {modules.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ fontSize: 16, color: themeColors.textSecondary, textAlign: 'center' }}>
            No modules found for the selected filters.
            Try adjusting your category or difficulty preferences!
          </Text>
        </View>
      ) : (
        <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {modules.map((module) => {
            const progress = module.progress;
            const isCompleted = progress?.status === 'completed';
            const isInProgress = progress?.status === 'in-progress';
            const progressPercent = progress?.progress || 0;

            return (
              <TouchableOpacity
                key={module._id}
                onPress={() => {
                  setSelectedModule(module);
                }}
                style={[styles.lessonCard, {
                  backgroundColor: isCompleted
                    ? themeColors.success + '22'
                    : isInProgress
                      ? themeColors.primary + '22'
                      : themeColors.card,
                  borderColor: isCompleted
                    ? themeColors.success
                    : isInProgress
                      ? themeColors.primary
                      : themeColors.border,
                  shadowColor: themeColors.border
                }]}
              >
                <Text style={styles.lessonIcon}>{module.icon}</Text>
                <Text style={[styles.lessonTitle, { color: themeColors.text }]}>
                  {module.title}
                </Text>

                {/* Progress Indicator */}
                {isInProgress && (
                  <View style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    right: 8,
                    height: 4,
                    backgroundColor: themeColors.surface,
                    borderRadius: 2,
                  }}>
                    <View style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      backgroundColor: themeColors.primary,
                      borderRadius: 2,
                    }} />
                  </View>
                )}

                {/* Status Badge */}
                {isCompleted && (
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: themeColors.success,
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                  </View>
                )}

                {/* Difficulty Badge */}
                <View style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: themeColors.surface + 'CC',
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: themeColors.textSecondary,
                    textTransform: 'capitalize'
                  }}>
                    {module.difficulty}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity
        style={{
          backgroundColor: themeColors.secondary,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 20,
          alignItems: "center",
          marginTop: 16,
          alignSelf: 'center',
        }}
        onPress={loadModules}
      >
        <Text style={{ color: themeColors.card, fontWeight: "bold" }}>
          🔄 Refresh Modules
        </Text>
      </TouchableOpacity>
    </CulturalBorder>
  );
}

// --- FinancialLessonsSection: list of clickable lessons, with launch feedback ---
function FinancialLessonsSection() {
  const { themeColors } = useTheme();
// Modal state: which lesson is open? null for none
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const styles = createStyles(themeColors);

  // Lessons config - Kid-friendly titles!
  const lessons = [
    { id: "saving", title: "🐷 Piggy Bank Power!", icon: "🐷", content: "Saving means putting aside some of your points or money for future needs or goals. It helps you buy something special later!" },
    { id: "spending", title: "🛒 Spend Smart!", icon: "🛒", content: "Spending is using your money or points to buy things you need or want right now. Always check if you can afford it!" },
    { id: "donating", title: "🤲 Share & Care!", icon: "🤲", content: "Donating is giving away some of your points or money to help others. It&apos;s a generous and kind act!" }, 
    { id: "how-money-grows", title: "📈 How My Money Grows!", icon: "📈", content: "See the magic of compounding! Find out how your savings can grow with interest over time." },
    { id: "spend-smart-review", title: "🔍 Spend Smart Review", icon: "🔍", content: "Reflect on your last purchase: was it really a need or just a want?" },
    { id: "quiz", title: "🧠 Money Quiz Time!", icon: "🧠" },
    { id: "needs-wants-game", title: "🔀 Sort Fun Things!", icon: "🔀" },
    { id: "understanding-allowance", title: "💵 Pocket Money Magic!", icon: "💵", content: "Allowance is money parents give you regularly to help learn about managing money. You can decide to spend, save, donate, or invest it!" },
    { id: "smart-shopping", title: "🛍️ Shopper Superstar!", icon: "🛍️", content: "Smart shopping means making good choices, comparing prices, checking if something is a need or a want, and looking for deals." },
    { id: "assessments", title: "🎯 Test Your Money Smarts!", icon: "🎯", content: "Test yourself to see how much you&apos;ve learned about saving, spending, and more!" }
  ];

  // --- Modal lesson content definitions ---
  function getLessonModalContent(id: string) {
    const l = lessons.find(l => l.id === id);
    if (!l) return <Text>Lesson not found.</Text>;
    if (id === "how-money-grows") {
      return <HowMyMoneyGrowsModal onClose={() => setOpenLesson(null)} />;
    }
    if (id === "spend-smart-review") {
      return <SpendSmartReviewModal onClose={() => setOpenLesson(null)} />;
    }
    if (id === "quiz") {
      return <LessonQuizModal onClose={() => setOpenLesson(null)} />;
    }
    if (id === "needs-wants-game") {
      return <NeedsWantsSortModal onClose={() => setOpenLesson(null)} />;
    }
    if (id === "assessments") {
      return <AssessmentModal onClose={() => setOpenLesson(null)} />;
    }
    return (
      <View style={{ padding: 18, alignItems: "center" }}>
        <Text style={styles.modalTitle}>{l.icon} {l.title}</Text>
        <Text style={styles.modalText}>{l.content}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setOpenLesson(null)}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CulturalBorder variant="mixed">
      <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 12 }]}>Financial Lessons</Text>
      <View style={{ paddingHorizontal: 10 }}>
        {/* Display all lessons in 2x2 grid layout (2 columns, multiple rows) */}
        {Array.from({ length: Math.ceil(lessons.length / 2) }, (_, rowIndex) => (
          <View key={`row-${rowIndex}`} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            {lessons.slice(rowIndex * 2, rowIndex * 2 + 2).map((l) => (
              <TouchableOpacity
                key={l.id}
                onPress={() => setOpenLesson(l.id)}
                style={[styles.lessonCard2x2, {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                  shadowColor: themeColors.border
                }]}
                accessibilityRole="button"
                accessibilityLabel={l.title}
                accessibilityHint="Open this learning lesson"
              >
                <Text style={styles.lessonIcon}>{l.icon}</Text>
                <Text
                  style={[styles.lessonTitle, { color: themeColors.text }]}
                  numberOfLines={2}
                >
                  {l.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <Modal
        visible={!!openLesson}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOpenLesson(null)}
      >
        <ErrorBoundary fallback={({ error, resetError }) => (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Oops! Something went wrong</Text>
              <Text style={styles.modalText}>
                We encountered an error loading this lesson. Please try again.
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  resetError();
                  setOpenLesson(null);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {openLesson ? getLessonModalContent(openLesson) : null}
            </View>
          </View>
        </ErrorBoundary>
      </Modal>
    </CulturalBorder>
  );
}

// --- My Achievements Section ---
function MyAchievementsSection() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const token = await getAuthToken();
      const userData = await AsyncStorage.getItem('user');

      if (!token || !userData) return;

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userDetails = await response.json();
        setBadges(userDetails.badges || []);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🏆 My Achievements</Text>
        <Text style={{ color: "#666", textAlign: "center", paddingVertical: 20 }}>
          Loading your achievements...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>🏆 My Achievements</Text>
      <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
        Badges you earned from your parent&apos;s teaching milestones! 
      </Text>

      {badges.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Text style={{ fontSize: 16, color: themeColors.textSecondary, textAlign: "center" }}>
            🎯 No achievements yet! Keep learning with your parents to unlock badges.
          </Text>
        </View>
      ) : (
        badges.map((badge, index) => (
          <View
            key={`badge-${index}`}
            style={{
              width: "45%",
              margin: "2.5%",
              backgroundColor: themeColors.surface,
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              borderWidth: 2,
              borderColor: themeColors.success,
              minHeight: 100,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{badge.icon || '🏆'}</Text>
            <Text style={{
              fontWeight: "bold",
              fontSize: 14,
              textAlign: "center",
              color: themeColors.success,
              marginBottom: 4
            }}>
              {badge.title}
            </Text>
            {badge.description && (
              <Text style={{
                fontSize: 12,
                textAlign: "center",
                color: themeColors.textSecondary,
                marginBottom: 4
              }}>
                {badge.description}
              </Text>
            )}
            {badge.pointsAwarded > 0 && (
              <Text style={{
                fontSize: 12,
                fontWeight: "bold",
                color: themeColors.warning,
                textAlign: "center"
              }}>
                +{badge.pointsAwarded} points!
              </Text>
            )}
            {badge.unlockedAt && (
              <Text style={{
                fontSize: 10,
                color: themeColors.textSecondary,
                textAlign: "center",
                marginTop: 4
              }}>
                {new Date(badge.unlockedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))
      )}

      <TouchableOpacity
        style={{
          backgroundColor: themeColors.secondary,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 20,
          alignItems: "center",
          marginTop: 10,
        }}
        onPress={loadBadges}
        accessibilityRole="button"
        accessibilityLabel="Refresh achievements"
        accessibilityHint="Reload your earned badges and achievements"
      >
        <Text style={{ color: themeColors.card, fontWeight: "bold" }}>
          🔄 Refresh Achievements
        </Text>
      </TouchableOpacity>
    </View>
  );
}




// --- NeedsWantsSortModal ---
function NeedsWantsSortModal({ onClose }: { onClose: () => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

  return (
    <View style={{ padding: 18, alignItems: "center" }}>
      <Text style={styles.modalTitle}>🔀 Needs vs Wants!</Text>
      <Text style={styles.modalText}>
        Learn the difference between needs and wants! Needs are things you must have to live well (like food, clothes, shelter).
        Wants are nice things but you can live without them (like toys, candy, video games)!
      </Text>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Got it!</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Quiz Modal ---
function LessonQuizModal({ onClose }: { onClose: () => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const questions = [
    {
      q: "Which of these is a need, not a want?",
      options: ["Food", "A video game"],
      correct: 0,
      explanation: "Food is a basic need for living, while a video game is a want."
    },
    {
      q: "Why should you save some of your points or money?",
      options: [
        "So you can buy something special later",
        "So you can spend it all at once"
      ],
      correct: 0,
      explanation: "Saving lets you reach bigger goals instead of spending everything now."
    },
    {
      q: "Which is a good example of donating?",
      options: [
        "Giving extra points to help a friend in need",
        "Buying candy for yourself"
      ],
      correct: 0,
      explanation: "Donating is using your resources to help others."
    }
  ];
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function handleSelect(i: number) {
    setSelected(i);
    setShowFeedback(true);
    if (i === questions[step].correct) {
      setScore(s => s + 1);
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 800);
    }
  }
  function nextQuestion() {
    setShowFeedback(false);
    setSelected(null);
    if (step + 1 < questions.length) setStep(s => s + 1);
    else setFinished(true);
  }
  function restart() {
    setStep(0);
    setSelected(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <View style={{ padding: 18, alignItems: "center" }}>
        <Text style={{ fontSize: 21, fontWeight: "bold", marginBottom: 5 }}>🧠 Quiz Complete!</Text>
        <Text style={{ fontSize: 16, marginBottom: 12 }}>You scored {score} out of {questions.length}</Text>
        <TouchableOpacity onPress={restart} style={{ backgroundColor: themeColors.success + "22", borderRadius: 7, padding: 10, marginBottom: 7 }}>
          <Text style={{ fontWeight: "700", color: themeColors.success }}>Take Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: themeColors.warning + "33", paddingVertical: 7, paddingHorizontal: 19, borderRadius: 8 }}>
          <Text style={{ fontWeight: "bold", color: themeColors.warning }}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ padding: 18, alignItems: "center" }}>
      {showSuccessAnimation && (
        <SuccessAnimation size={60} onComplete={() => setShowSuccessAnimation(false)} />
      )}
      <Text style={styles.modalTitle}>🧠 Financial Quiz</Text>
      <Text style={{ fontSize: 16, marginBottom: 13, textAlign: "center" }}>
        {questions[step].q}
      </Text>
      {questions[step].options.map((option, i) => (
        <TouchableOpacity
          key={option}
          style={{
            ...styles.quizOption,
            backgroundColor: selected === i
              ? i === questions[step].correct
                ? themeColors.success + "33"
                : themeColors.error + "22"
              : themeColors.surface,
          }}
          onPress={() => !showFeedback && handleSelect(i)}
          disabled={showFeedback}
        >
          <Text style={{ fontWeight: "700" }}>{option}</Text>
        </TouchableOpacity>
      ))}
      {showFeedback && (
        <Text style={{
          marginTop: 4,
          fontWeight: "bold",
          color: selected === questions[step].correct ? themeColors.success : themeColors.error
        }}>
          {selected === questions[step].correct ? "Correct!" : "Not quite!"} <Text style={{ fontWeight: "normal" }}>{questions[step].explanation}</Text>
        </Text>
      )}
      <View style={{ flexDirection: "row", marginTop: 13 }}>
        {showFeedback && (
          <TouchableOpacity
            onPress={nextQuestion}
            style={[styles.quizButton, { backgroundColor: themeColors.success + "22" }]}>
            <Text style={[styles.quizButtonText, { color: themeColors.success }]}>
              {step === questions.length - 1 ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onClose} style={[styles.quizCloseButton, { backgroundColor: themeColors.warning + "33" }]}>
          <Text style={[styles.quizCloseButtonText, { color: themeColors.warning }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Assessment Modal ---
function AssessmentModal({ onClose }: { onClose: () => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const questions = [
    {
      q: "What should you do before buying a toy?",
      options: [
        "Check if you have enough points/money",
        "Buy it first and worry later"
      ],
      correct: 0,
      explanation: "Always check your balance before spending."
    },
    {
      q: "Giving points to charity is an example of:",
      options: [
        "Donating",
        "Spending"
      ],
      correct: 0,
      explanation: "Donating helps others and is generous."
    },
    {
      q: "If you put all your points in spend jar, what might you have trouble with?",
      options: [
        "Saving for big goals",
        "Having fun"
      ],
      correct: 0,
      explanation: "You need to save for important or large expenses."
    }
  ];
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function handleSelect(i: number) {
    setSelected(i);
    setShowFeedback(true);
    if (i === questions[step].correct) setScore(s => s + 1);
  }
  function nextQuestion() {
    setShowFeedback(false);
    setSelected(null);
    if (step + 1 < questions.length) setStep(s => s + 1);
    else setFinished(true);
  }
  function restart() {
    setStep(0);
    setSelected(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  }
  if (finished) {
    return (
      <View style={{ padding: 18, alignItems: "center" }}>
        <Text style={{ fontSize: 21, fontWeight: "bold", marginBottom: 5 }}>📋 Assessment Complete!</Text>
        <Text style={{ fontSize: 16, marginBottom: 12 }}>You scored {score} out of {questions.length}</Text>
        <TouchableOpacity onPress={restart} style={{ backgroundColor: "#b3e4fd", borderRadius: 7, padding: 10, marginBottom: 7 }}>
          <Text style={{ fontWeight: "700", color: "#104166" }}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: "#b8efc9", paddingVertical: 8, paddingHorizontal: 19, borderRadius: 8 }}>
          <Text style={{ fontWeight: "bold", color: "#175d36" }}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={{ padding: 18, alignItems: "center" }}>
      <Text style={styles.modalTitle}>📋 Assessment</Text>
      <Text style={{ fontSize: 16, marginBottom: 13, textAlign: "center" }}>
        {questions[step].q}
      </Text>
      {questions[step].options.map((option, i) => (
        <TouchableOpacity
          key={option}
          style={{
            ...styles.quizOption,
            backgroundColor: selected === i
              ? i === questions[step].correct
                ? themeColors.success + "33"
                : themeColors.error + "22"
              : themeColors.surface,
          }}
          onPress={() => !showFeedback && handleSelect(i)}
          disabled={showFeedback}
        >
          <Text style={{ fontWeight: "700" }}>{option}</Text>
        </TouchableOpacity>
      ))}
      {showFeedback && (
        <Text style={{
          marginTop: 4,
          fontWeight: "bold",
          color: selected === questions[step].correct ? themeColors.success : themeColors.error
        }}>
          {selected === questions[step].correct ? "Correct!" : "Not quite!"} <Text style={{ fontWeight: "normal" }}>{questions[step].explanation}</Text>
        </Text>
      )}
      <View style={{ flexDirection: "row", marginTop: 13 }}>
        {showFeedback && (
          <TouchableOpacity
            onPress={nextQuestion}
            style={[styles.quizButton, { backgroundColor: themeColors.success + "22" }]}>
            <Text style={[styles.quizButtonText, { color: themeColors.success }]}>
              {step === questions.length - 1 ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onClose} style={[styles.quizCloseButton, { backgroundColor: themeColors.warning + "33" }]}>
          <Text style={[styles.quizCloseButtonText, { color: themeColors.warning }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** --- BEGIN: How My Money Grows Modal --- */
function HowMyMoneyGrowsModal({ onClose }: { onClose: () => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchUserInfo() {
      try {
        const token = await getAuthToken();
        const userData = await AsyncStorage.getItem('user');
        if (!token || !userData) throw new Error('Not authenticated.');
        const parsedUser = JSON.parse(userData);
        const res = await fetch(`${API_URL}/users/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const userDetails = await res.json();
          setUser(userDetails);
        } else if (res.status === 429) {
          // Rate limited - show user-friendly message
          setUser(null);
        } else if (res.status === 401) {
          // Token expired - user needs to login again
          setUser(null);
        }
      } catch (e) { 
        console.error('Error in HowMyMoneyGrowsModal fetch:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUserInfo();
  }, []);

  function projectGrowth(
    principal: number,
    rate: number,
    periods: number,
    frequency: string // 'monthly' or 'weekly'
  ) {
    // Simple compound interest
    rate = rate / 100;
    let history = [];
    let balance = principal;
    for (let i = 1; i <= periods; i++) {
      balance += balance * rate;
      history.push({
        period: i,
        value: Math.round(balance * 100) / 100
      });
    }
    return history;
  }

  if (loading) {
    return (
      <View style={{ padding: 18, alignItems: 'center' }}>
        <Text>Loading your savings data...</Text>
      </View>
    );
  }
  if (!user) {
    return (
      <View style={{ padding: 18, alignItems: 'center' }}>
        <Text>Unable to load your money growth info.</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const savePoints = user.savePoints || 0;
  const interestRule = (user.interestRule) || { rate: 0, frequency: 'monthly' };
  const rate = interestRule.rate || 0;
  const freq = interestRule.frequency || 'monthly';
  const periodLabel = freq === "weekly" ? "Week" : "Month";
  const periods = 6; // Show next 6 periods

  const growth = projectGrowth(savePoints, rate, periods, freq);

  return (
    <View style={{ padding: 18, alignItems: "center", minWidth: 270 }}>
      <Text style={styles.modalTitle}>📈 How My Money Grows</Text>
      <View style={{
        alignItems: "flex-start",
        marginBottom: 10,
        width: 220,
        borderRadius: 7,
        backgroundColor: themeColors.surface,
        padding: 9
      }}>
        <Text style={{ fontSize: 15, color: themeColors.text, fontWeight: "bold" }}>
          Starting Savings: <Text style={{ color: themeColors.primary }}>{savePoints} points</Text>
        </Text>
        <Text style={{ fontSize: 15, color: themeColors.textSecondary, fontWeight: "bold" }}>
          Interest Rate: <Text style={{ color: themeColors.primary }}>{rate}% per {freq}</Text>
        </Text>
        <Text style={{ fontSize: 15, color: themeColors.textSecondary, fontWeight: "bold" }}>
          Interest Applied To: <Text style={{ color: themeColors.primary }}>{interestRule.jar === "save" ? "Savings Pot" : interestRule.jar}</Text>
        </Text>
      </View>
      <Text style={{ marginBottom: 4, textAlign: "center", fontWeight: "500", color: themeColors.text }}>
        Growth Projection ({periodLabel}s):
      </Text>
      <View style={{
        borderRadius: 10, backgroundColor: themeColors.surface, padding: 10,
        marginBottom: 10, width: 210
      }}>
        {growth.map(row => (
          <Text key={row.period} style={{
            fontSize: 15,
            fontWeight: row.period === periods ? "bold" : "500",
            color: themeColors.primary,
            marginBottom: 3
          }}>
            {periodLabel} {row.period}: {row.value} points
            {row.period === periods && "  ← Projected total"}
          </Text>
        ))}
      </View>
      <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginBottom: 13, textAlign: "center" }}>
        Keep saving! The more you save, the more your money can grow.
      </Text>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}
/** --- END: How My Money Grows Modal --- */

/** --- BEGIN: Spend Smart Review Modal (Fixed and Completed) --- */
function SpendSmartReviewModal({ onClose }: { onClose: () => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [loading, setLoading] = React.useState(true);
  const [recentPurchase, setRecentPurchase] = React.useState<any>(null); // Changed from reward to purchase for clarity
  const [choice, setChoice] = React.useState<null | "need" | "want">(null);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    async function fetchRecentRewardPurchase() {
      try {
        const token = await getAuthToken();
        const userData = await AsyncStorage.getItem('user');
        if (!token || !userData) throw new Error('Not authenticated.');
        const parsedUser = JSON.parse(userData);

        // Fetch transactions - NOTE: Assuming the API is available at localhost:5001/api/transactions/:userId
        const res = await fetch(`${API_URL}/transactions/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const txs = await res.json();
          // Filter for the most recent reward-purchase
          const purchases = txs
            .filter((t: any) => t.type === 'reward-purchase' || t.type === 'expense')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (purchases.length > 0) {
            // For the review, we take the *most recent* one.
            setRecentPurchase(purchases[0]);
          } else {
            setRecentPurchase(null);
          }
        } else if (res.status === 429) {
          // Rate limited - show user-friendly message
          setRecentPurchase(null);
        } else if (res.status === 401) {
          // Token expired - user needs to login again
          setRecentPurchase(null);
        }
      } catch (e) { 
        console.error("Failed to fetch recent purchase:", e);
        setRecentPurchase(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentRewardPurchase();
  }, []);

  const handleSubmit = () => {
    if (choice) {
      // In a real app, you might save this review to the database here.
      setSubmitted(true);
    }
  };

  const purchaseName = recentPurchase?.name || "a recent item";

  if (loading) {
    return (
      <View style={{ padding: 18, alignItems: 'center' }}>
        <Text>Loading your recent spending data...</Text>
      </View>
    );
  }

  if (!recentPurchase) {
    return (
      <View style={{ padding: 18, alignItems: 'center' }}>
        <Text style={styles.modalTitle}>🔍 Spend Smart Review</Text>
        {/* FIX APPLIED: Using a JS template string within braces to bypass the lint rule. */}
        <Text style={styles.modalText}>
          {`You haven't made any purchases yet! Come back after you've spent some points/money.`}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ padding: 18, alignItems: "center", minWidth: 270 }}>
      <Text style={styles.modalTitle}>🔍 Spend Smart Review</Text>

      {!submitted ? (
        <>
          <Text style={styles.modalText}>
            Think about your last purchase: <Text style={{ fontWeight: 'bold', color: themeColors.primary }}>{purchaseName}</Text> for <Text style={{ fontWeight: 'bold', color: themeColors.error }}>{recentPurchase.amount} points</Text>.
            Was it a **Need** or a **Want**?
          </Text>
          <TouchableOpacity
            style={{
              ...styles.quizOption,
              width: 200,
              backgroundColor: choice === 'need' ? themeColors.success + '44' : themeColors.surface
            }}
            onPress={() => setChoice('need')}
          >
            <Text style={{ fontWeight: '700', color: themeColors.success }}>🏠 Need (Something I must have to live well)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...styles.quizOption,
              width: 200,
              backgroundColor: choice === 'want' ? themeColors.warning + '44' : themeColors.surface
            }}
            onPress={() => setChoice('want')}
          >
            <Text style={{ fontWeight: '700', color: themeColors.warning }}>✨ Want (Something nice, but I can live without it)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quizButton, { marginTop: 15, backgroundColor: themeColors.primary + '33' }]}
            onPress={handleSubmit}
            disabled={!choice}
          >
            <Text style={[styles.quizButtonText, { color: themeColors.primary }]}>
              Submit Review
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        // Post-submission feedback
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 21, fontWeight: 'bold', marginBottom: 10, color: themeColors.success }}>
            Great job thinking about your spending!
          </Text>
          <Text style={styles.modalText}>
            Reflecting on whether something is a **need** or a **want** helps you become a **Shopper Superstar!**
          </Text>
          <SuccessAnimation size={60} onComplete={() => {}} />
          <TouchableOpacity style={{ ...styles.closeButton, marginTop: 15 }} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close Lesson</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
/** --- END: Spend Smart Review Modal (Fixed and Completed) --- */

/** --- BEGIN: EducationModuleModal --- */
function EducationModuleModal({ module, onClose }: { module: any; onClose: () => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

  return (
    <View style={{ padding: 18, alignItems: 'center' }}>
      <Text style={styles.modalTitle}>📚 Learning Module</Text>
      <Text style={styles.modalText}>
        Module content will be displayed here.
      </Text>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}
/** --- END: EducationModuleModal --- */
