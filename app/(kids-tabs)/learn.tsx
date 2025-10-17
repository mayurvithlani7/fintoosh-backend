import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from "react";
import {
  Dimensions,
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
import { useTheme } from '@/utils/themeContext';

import { CulturalBorder, RangoliPattern } from "@/components/cultural";

const styles = StyleSheet.create({
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
    color: "#154477",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
    minWidth: 300,
    width: "97%",
    maxWidth: 520,
    elevation: 2,
    shadowColor: "#aaa",
    // ...
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#234",
  },
  lessonCard: {
    width: "45%",
    margin: "2.5%",
    backgroundColor: "#fafdff",
    borderRadius: 12,
    elevation: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    minHeight: 96,
    maxWidth: 170,
    borderWidth: 1,
    borderColor: "#d8e6ee",
    shadowColor: "#bcd",
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  lessonIcon: {
    fontSize: 35,
    marginBottom: 7,
  },
  lessonTitle: {
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
    color: "#294352",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: "87%",
    maxWidth: 400,
    paddingBottom: 12,
    shadowColor: "#222",
    shadowRadius: 8,
    elevation: 7,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 9,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
  },
  closeButton: {
    backgroundColor: "#e9e9ef",
    paddingVertical: 7,
    paddingHorizontal: 21,
    borderRadius: 8,
    alignSelf: "center",
  },
  closeButtonText: {
    fontWeight: "700",
    color: "#38507a",
  },
  quizOption: {
    borderRadius: 7,
    padding: 9,
    marginBottom: 7,
    width: 220,
    alignItems: "center",
  },
  quizButton: {
    backgroundColor: "#d7faee",
    borderRadius: 7,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
  },
  quizButtonText: {
    color: "#23646a",
    fontWeight: "bold",
  },
  quizCloseButton: {
    backgroundColor: "#ffe1c6",
    paddingVertical: 7,
    paddingHorizontal: 17,
    borderRadius: 8,
  },
  quizCloseButtonText: {
    fontWeight: "bold",
    color: "#c5741b",
  },
});

export default function LearnScreen() {
  const { themeColors } = useTheme();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
      <RangoliPattern color="#FF9933" opacity={0.03} />
      <View style={{ width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.border,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              elevation: 2,
            }}
            onPress={() => router.push('/')}
          >
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
          </TouchableOpacity>
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
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: themeColors.primary, textAlign: 'center' }]} accessibilityRole="header" accessibilityLabel="Learn About Money Education Section">📚 Learn About Money</Text>
        </View>
      </View>

      <FinancialLessonsSection />
      <MyAchievementsSection />
      <VideoLessonSection />

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

// --- FinancialLessonsSection: list of clickable lessons, with launch feedback ---
function FinancialLessonsSection() {
  const { themeColors } = useTheme();
  // Modal state: which lesson is open? null for none
  const [openLesson, setOpenLesson] = useState<string | null>(null);

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
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {lessons.map((l) => (
          <TouchableOpacity
            key={l.id}
            onPress={() => setOpenLesson(l.id)}
            style={[styles.lessonCard, {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
              shadowColor: themeColors.border
            }]}
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
        <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {badges.map((badge, index) => (
            <View key={index} style={{
              width: "45%",
              margin: "2.5%",
              backgroundColor: themeColors.surface,
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              borderWidth: 2,
              borderColor: themeColors.success,
              minHeight: 100,
            }}>
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
          ))}
        </View>
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
      >
        <Text style={{ color: themeColors.card, fontWeight: "bold" }}>
          🔄 Refresh Achievements
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Video Lesson Section ---
function VideoLessonSection() {
  // Responsive video sizing based on device width
  const windowWidth = Dimensions.get("window").width;
  const videoWidth = Math.min(340, windowWidth - 32);
  const videoHeight = Math.round(videoWidth * 9 / 16);

  const player = useVideoPlayer(require('../../assets/videos/Needs_vs_Wants.mp4'), (player) => {
    player.loop = false;
    player.muted = false;
  });

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Learn about Needs vs. Wants</Text>
      <View style={{
        backgroundColor: "#edf7fb",
        borderRadius: 11,
        overflow: "hidden",
        alignSelf: "center",
        maxWidth: 340,
        width: videoWidth,
        height: videoHeight,
        marginVertical: 6,
        justifyContent: "center",
        alignItems: "center"
      }}>
        <VideoView
          player={player}
          style={{
            width: videoWidth,
            height: videoHeight,
            borderRadius: 11,
            backgroundColor: "#111"
          }}
          contentFit="contain"
        />
      </View>
      <Text style={{ color: "#184c76", marginTop: 6, textAlign: "center" }}>
        Video lesson about understanding the basic difference between &ldquo;needs&rdquo; and &ldquo;wants&rdquo;.
      </Text>
    </View>
  );
}

// --- NeedsWantsSortModal Placeholder ---
function NeedsWantsSortModal({ onClose }: { onClose: () => void }) {
  return (
    <View style={{ padding: 18, alignItems: "center" }}>
      <Text style={styles.modalTitle}>🔀 Sort Fun Things!</Text>
      <Text style={styles.modalText}>
        This is where the interactive Needs vs. Wants sorting game will be built!
      </Text>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Quiz Modal ---
function LessonQuizModal({ onClose }: { onClose: () => void }) {
  const { themeColors } = useTheme();
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
        <TouchableOpacity onPress={restart} style={{ backgroundColor: "#b3e4fd", borderRadius: 7, padding: 10, marginBottom: 7 }}>
          <Text style={{ fontWeight: "700", color: "#104166" }}>Take Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: "#ffe1c6", paddingVertical: 7, paddingHorizontal: 19, borderRadius: 8 }}>
          <Text style={{ fontWeight: "bold", color: "#c5741b" }}>Close</Text>
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
        backgroundColor: "#f2f6ff",
        padding: 9
      }}>
        <Text style={{ fontSize: 15, color: "#294", fontWeight: "bold" }}>
          Starting Savings: <Text style={{ color: "#227" }}>{savePoints} points</Text>
        </Text>
        <Text style={{ fontSize: 15, color: "#347", fontWeight: "bold" }}>
          Interest Rate: <Text style={{ color: "#227" }}>{rate}% per {freq}</Text>
        </Text>
        <Text style={{ fontSize: 15, color: "#579", fontWeight: "bold" }}>
          Interest Applied To: <Text style={{ color: "#227" }}>{interestRule.jar === "save" ? "Savings Pot" : interestRule.jar}</Text>
        </Text>
      </View>
      <Text style={{ marginBottom: 4, textAlign: "center", fontWeight: "500" }}>
        Growth Projection ({periodLabel}s):
      </Text>
      <View style={{
        borderRadius: 10, backgroundColor: "#e8fafe", padding: 10,
        marginBottom: 10, width: 210
      }}>
        {growth.map(row => (
          <Text key={row.period} style={{
            fontSize: 15,
            fontWeight: row.period === periods ? "bold" : "500",
            color: "#235D83",
            marginBottom: 3
          }}>
            {periodLabel} {row.period}: {row.value} points
            {row.period === periods && "  ← Projected total"}
          </Text>
        ))}
      </View>
      <Text style={{ fontSize: 13, color: "#488", marginBottom: 13, textAlign: "center" }}>
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
