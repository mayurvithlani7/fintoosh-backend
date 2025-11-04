import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");
const GAME_MODAL_HEIGHT = Math.min(height * 0.85, 600);

type Dream = {
  name: string;
  emoji: string;
  target: number;
  color: string;
  description: string;
};

const DREAMS: Dream[] = [
  {
    name: "Cricket Bat",
    emoji: "🏏",
    target: 300,
    color: "#4CAF50",
    description: "Professional cricket bat for the playground champion!"
  },
  {
    name: "New Bicycle",
    emoji: "🚲",
    target: 500,
    color: "#2196F3",
    description: "Two-wheeler freedom to explore the neighborhood!"
  },
  {
    name: "School Bag",
    emoji: "🎒",
    target: 220,
    color: "#FF9800",
    description: "Stylish backpack for all your school adventures!"
  },
  {
    name: "Board Game",
    emoji: "🎲",
    target: 150,
    color: "#E91E63",
    description: "Fun board game for family game nights!"
  },
];

export default function DreamJarBuilder({ onClose }: { onClose: () => void }) {
  const [currentDream, setCurrentDream] = useState(0);
  const [saved, setSaved] = useState(0);
  const [drops, setDrops] = useState(0);
  const [coinsLeft, setCoinsLeft] = useState(20);
  const [message, setMessage] = useState("Choose a dream and start saving! Drop coins into the jar.");
  const [celebration, setCelebration] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  const jarFillAnim = useRef(new Animated.Value(0)).current;
  const dream = DREAMS[currentDream];

  // Animate jar fill when saved amount changes
  useEffect(() => {
    const fillPercentage = Math.min(saved / dream.target, 1);
    Animated.spring(jarFillAnim, {
      toValue: fillPercentage,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [saved, dream.target]);

  // Check if goal is reached
  useEffect(() => {
    if (saved >= dream.target && !celebration) {
      setCelebration(true);
      setMessage(`🎉 AMAZING! You achieved your dream: ${dream.emoji} ${dream.name}! 🎊`);
      createCelebrationParticles();
    }
  }, [saved, dream.target, celebration]);

  const createCelebrationParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * width,
        y: height * 0.6,
        vx: (Math.random() - 0.5) * 8,
        vy: -(Math.random() * 8 + 5),
        emoji: ["⭐", "🎊", "✨", "💫", "🎉"][Math.floor(Math.random() * 5)],
      });
    }
    setParticles(newParticles);

    // Animate particles
    setTimeout(() => {
      setParticles([]);
    }, 2000);
  };

  const dropCoin = () => {
    console.log("Drop coin called, coins left:", coinsLeft);
    if (coinsLeft <= 0) {
      setMessage("No more coins left! Choose a new dream to start fresh.");
      return;
    }

    const coinAmount = Math.floor(Math.random() * 20) + 10; // 10-30 rupees
    const newSaved = saved + coinAmount;
    console.log("Adding coin:", coinAmount, "New total:", newSaved);

    setSaved(newSaved);
    setDrops(drops + 1);
    setCoinsLeft(coinsLeft - 1);

    if (newSaved < dream.target) {
      setMessage(`💰 Jar got ₹${coinAmount}! ${dream.target - newSaved} more to go for ${dream.name}!`);
    }

    // Create coin drop animation
    const coinParticle = {
      id: Date.now(),
      x: width / 2,
      y: height * 0.2,
      emoji: "🪙",
      falling: true,
    };
    setParticles(prev => [...prev, coinParticle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== coinParticle.id));
    }, 1000);
  };

  const chooseNewDream = () => {
    setCurrentDream((currentDream + 1) % DREAMS.length);
    setSaved(0);
    setDrops(0);
    setCoinsLeft(20);
    setCelebration(false);
    setMessage("New dream selected! Start saving for your goal.");
  };

  const resetDream = () => {
    setSaved(0);
    setDrops(0);
    setCoinsLeft(20);
    setCelebration(false);
    setMessage("Dream reset! Start saving again.");
  };

  const jarHeight = 200;
  const fillHeight = jarFillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, jarHeight * 0.8],
  });

  const handleScreenTap = (event: any) => {
    if (coinsLeft > 0 && !celebration) {
      console.log("Screen tapped, dropping coin");
      dropCoin();
    }
  };

  // Create data for FlatList
  const gameData = [
    {
      id: 'header',
      type: 'header',
      content: null
    },
    {
      id: 'dream-selector',
      type: 'dream-selector',
      content: null
    },
    {
      id: 'current-dream',
      type: 'current-dream',
      content: null
    },
    {
      id: 'stats',
      type: 'stats',
      content: null
    },
    {
      id: 'jar',
      type: 'jar',
      content: null
    },
    {
      id: 'message',
      type: 'message',
      content: null
    },
    {
      id: 'actions',
      type: 'actions',
      content: null
    },
    {
      id: 'progress',
      type: 'progress',
      content: null
    },
    {
      id: 'education',
      type: 'education',
      content: null
    }
  ];

  const renderItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.header}>
            <Text style={styles.title}>🎯 Dream Jar Builder</Text>
            <Text style={styles.subtitle}>Tap anywhere to drop coins!</Text>
          </View>
        );

      case 'dream-selector':
        return (
          <View style={styles.dreamSelector}>
            <Text style={styles.sectionTitle}>Choose Your Dream:</Text>
            <View style={styles.dreamButtons}>
              {DREAMS.map((dreamOption, index) => (
                <TouchableOpacity
                  key={dreamOption.name}
                  style={[
                    styles.dreamButton,
                    {
                      backgroundColor: dreamOption.color,
                      opacity: index === currentDream ? 1 : 0.6
                    }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent triggering screen tap
                    setCurrentDream(index);
                    setSaved(0);
                    setDrops(0);
                    setCoinsLeft(20);
                    setCelebration(false);
                    setMessage(`Dream changed to ${dreamOption.name}! Start saving.`);
                  }}
                >
                  <Text style={styles.dreamEmoji}>{dreamOption.emoji}</Text>
                  <Text style={styles.dreamName}>{dreamOption.name}</Text>
                  <Text style={styles.dreamPrice}>₹{dreamOption.target}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'current-dream':
        return (
          <View style={styles.currentDream}>
            <Text style={styles.dreamTitle}>
              Current Goal: {dream.emoji} {dream.name}
            </Text>
            <Text style={styles.dreamDesc}>{dream.description}</Text>
          </View>
        );

      case 'stats':
        return (
          <View style={styles.stats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>₹{saved}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coinsLeft}</Text>
              <Text style={styles.statLabel}>Coins Left</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{drops}</Text>
              <Text style={styles.statLabel}>Drops</Text>
            </View>
          </View>
        );

      case 'jar':
        return (
          <View style={styles.jarContainer}>
            <View style={[styles.jar, { borderColor: dream.color }]}>
              <Animated.View
                style={[
                  styles.jarFill,
                  {
                    backgroundColor: dream.color + "80",
                    height: fillHeight,
                  },
                ]}
              />
              <View style={styles.jarTop} />
              {saved >= dream.target && (
                <View style={styles.dreamAchieved}>
                  <Text style={styles.achievementEmoji}>{dream.emoji}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.dropButton, { backgroundColor: dream.color }]}
              onPress={dropCoin}
              disabled={coinsLeft <= 0 || celebration}
              activeOpacity={0.8}
            >
              <Ionicons name="cash" size={30} color="#fff" />
              <Text style={styles.dropText}>DROP COIN</Text>
              <Text style={{ color: "#fff", fontSize: 10, marginTop: 2 }}>
                {coinsLeft > 0 ? `${coinsLeft} left` : "NO COINS"}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'message':
        return (
          <Text style={[styles.message, celebration && styles.celebrationMessage]}>
            {message}
          </Text>
        );

      case 'actions':
        return (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                chooseNewDream();
              }}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.actionText}>New Dream</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.resetButton]}
              onPress={(e) => {
                e.stopPropagation();
                resetDream();
              }}
            >
              <Ionicons name="reload" size={20} color="#fff" />
              <Text style={styles.actionText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <Ionicons name="exit-outline" size={20} color="#666" />
              <Text style={[styles.actionText, { color: "#666" }]}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        );

      case 'progress':
        return (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: jarFillAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: dream.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {saved >= dream.target ? "🎉 Dream Achieved!" : `${saved}/${dream.target} rupees saved`}
            </Text>
          </View>
        );

      case 'education':
        return (
          <View style={styles.educationBox}>
            <Text style={styles.educationTitle}>💡 Savings Tip:</Text>
            <Text style={styles.educationText}>
              Setting specific goals makes saving more fun and rewarding!
              Watch your jar fill up as you work toward your dreams.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8f9ff" }}
      contentContainerStyle={{
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 120,
        alignItems: "center",
        minHeight: GAME_MODAL_HEIGHT + 200 // Force content to be taller
      }}
      showsVerticalScrollIndicator={true}
      bounces={true}
      scrollEnabled={true}
    >
      {/* Particles overlay */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
            },
          ]}
        >
          <Text style={styles.particleEmoji}>{particle.emoji}</Text>
        </Animated.View>
      ))}

      <View style={styles.header}>
        <Text style={styles.title}>🎯 Dream Jar Builder</Text>
        <Text style={styles.subtitle}>Tap anywhere to drop coins!</Text>
      </View>

      {/* Dream Selection */}
      <View style={styles.dreamSelector}>
        <Text style={styles.sectionTitle}>Choose Your Dream:</Text>
        <View style={styles.dreamButtons}>
          {DREAMS.map((dreamOption, index) => (
            <TouchableOpacity
              key={dreamOption.name}
              style={[
                styles.dreamButton,
                {
                  backgroundColor: dreamOption.color,
                  opacity: index === currentDream ? 1 : 0.6
                }
              ]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering screen tap
                setCurrentDream(index);
                setSaved(0);
                setDrops(0);
                setCoinsLeft(20);
                setCelebration(false);
                setMessage(`Dream changed to ${dreamOption.name}! Start saving.`);
              }}
            >
              <Text style={styles.dreamEmoji}>{dreamOption.emoji}</Text>
              <Text style={styles.dreamName}>{dreamOption.name}</Text>
              <Text style={styles.dreamPrice}>₹{dreamOption.target}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Current Dream Display */}
      <View style={styles.currentDream}>
        <Text style={styles.dreamTitle}>
          Current Goal: {dream.emoji} {dream.name}
        </Text>
        <Text style={styles.dreamDesc}>{dream.description}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{saved}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{coinsLeft}</Text>
          <Text style={styles.statLabel}>Coins Left</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{drops}</Text>
          <Text style={styles.statLabel}>Drops</Text>
        </View>
      </View>

      {/* Jar Visualization */}
      <View style={styles.jarContainer}>
        <View style={[styles.jar, { borderColor: dream.color }]}>
          <Animated.View
            style={[
              styles.jarFill,
              {
                backgroundColor: dream.color + "80",
                height: fillHeight,
              },
            ]}
          />
          <View style={styles.jarTop} />
          {saved >= dream.target && (
            <View style={styles.dreamAchieved}>
              <Text style={styles.achievementEmoji}>{dream.emoji}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.dropButton, { backgroundColor: dream.color }]}
          onPress={dropCoin}
          disabled={coinsLeft <= 0 || celebration}
          activeOpacity={0.8}
        >
          <Ionicons name="cash" size={30} color="#fff" />
          <Text style={styles.dropText}>DROP COIN</Text>
          <Text style={{ color: "#fff", fontSize: 10, marginTop: 2 }}>
            {coinsLeft > 0 ? `${coinsLeft} left` : "NO COINS"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Message */}
      <Text style={[styles.message, celebration && styles.celebrationMessage]}>
        {message}
      </Text>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            chooseNewDream();
          }}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.actionText}>New Dream</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={(e) => {
            e.stopPropagation();
            resetDream();
          }}
        >
          <Ionicons name="reload" size={20} color="#fff" />
          <Text style={styles.actionText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.closeButton]}
          onPress={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <Ionicons name="exit-outline" size={20} color="#666" />
          <Text style={[styles.actionText, { color: "#666" }]}>Back to Games</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: jarFillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: dream.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {saved >= dream.target ? "🎉 Dream Achieved!" : `${saved}/${dream.target} rupees saved`}
        </Text>
      </View>

      {/* Educational Tip */}
      <View style={styles.educationBox}>
        <Text style={styles.educationTitle}>💡 Savings Tip:</Text>
        <Text style={styles.educationText}>
          Setting specific goals makes saving more fun and rewarding!
          Watch your jar fill up as you work toward your dreams.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  dreamSelector: {
    width: "100%",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#34495e",
    marginBottom: 10,
    textAlign: "center",
  },
  dreamButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  dreamButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    minWidth: 80,
    elevation: 2,
  },
  dreamEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  dreamName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  dreamPrice: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  currentDream: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    width: "100%",
    elevation: 3,
    borderWidth: 2,
    borderColor: "#e8f4f8",
  },
  dreamTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 5,
  },
  dreamDesc: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    minWidth: 70,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27ae60",
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
  },
  jarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  jar: {
    width: 80,
    height: 200,
    borderRadius: 40,
    borderWidth: 4,
    backgroundColor: "#fff",
    position: "relative",
    overflow: "hidden",
    elevation: 5,
  },
  jarFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 36,
  },
  jarTop: {
    position: "absolute",
    top: -10,
    left: 25,
    width: 30,
    height: 15,
    backgroundColor: "#ddd",
    borderRadius: 15,
  },
  dreamAchieved: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  achievementEmoji: {
    fontSize: 40,
  },
  dropButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
  },
  dropText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 2,
  },
  message: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "600",
    minHeight: 40,
    paddingHorizontal: 20,
  },
  celebrationMessage: {
    color: "#27ae60",
    fontSize: 18,
  },
  particle: {
    position: "absolute",
    zIndex: 10,
  },
  particleEmoji: {
    fontSize: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
  },
  resetButton: {
    backgroundColor: "#f39c12",
  },
  closeButton: {
    backgroundColor: "#ecf0f1",
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 5,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 15,
    alignItems: "center",
  },
  progressBar: {
    width: "90%",
    height: 20,
    backgroundColor: "#ecf0f1",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#bdc3c7",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  educationBox: {
    backgroundColor: "#e8f8e8",
    borderRadius: 15,
    padding: 15,
    width: "100%",
    borderWidth: 2,
    borderColor: "#d5edda",
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  educationText: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  tapHintText: {
    fontSize: 12,
    color: "#856404",
    fontWeight: "600",
    marginLeft: 6,
  },
});
