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

const { width } = Dimensions.get("window");

type Scenario = {
  safe: { msg: string; points: number };
  risk: { msg: string; points: number }[];
};

const FESTIVAL_SCENARIOS: Scenario[] = [
  {
    safe: { msg: "You enjoyed a safe ladoo! +8 points.", points: 8 },
    risk: [
      { msg: "Your firecracker lit up the night! +25 points.", points: 25 },
      { msg: "Oh no! The firecracker fizzled out... -15 points.", points: -15 }
    ]
  },
  {
    safe: { msg: "You danced safely in the Holi rain! +10 points.", points: 10 },
    risk: [
      { msg: "Huge color splash! +30 points.", points: 30 },
      { msg: "You slipped on water... -12 points.", points: -12 }
    ]
  },
  {
    safe: { msg: "Watched fireworks with family! +7 points.", points: 7 },
    risk: [
      { msg: "Won the lucky draw! +40 points.", points: 40 },
      { msg: "Lost your ticket... -20 points.", points: -20 }
    ]
  },
  {
    safe: { msg: "Played safe at food stall. +12 points.", points: 12 },
    risk: [
      { msg: "Tried spicy golgappa! Brave! +22 points.", points: 22 },
      { msg: "Oh! Stomach ache. -17 points.", points: -17 }
    ]
  },
  {
    safe: { msg: "Helped organize decorations! +9 points.", points: 9 },
    risk: [
      { msg: "Climbed high for perfect lights! +35 points.", points: 35 },
      { msg: "Slipped from ladder... -18 points.", points: -18 }
    ]
  },
  {
    safe: { msg: "Shared sweets with neighbors! +11 points.", points: 11 },
    risk: [
      { msg: "Organized surprise celebration! +28 points.", points: 28 },
      { msg: "Party got too loud... -14 points.", points: -14 }
    ]
  }
];

export default function SmartChoiceGame({ onClose }: { onClose: () => void }) {
  const [points, setPoints] = useState(100);
  const [round, setRound] = useState(1);
  const [status, setStatus] = useState("Ready for a festival adventure! Will you play it safe or take a risk?");
  const [gamePhase, setGamePhase] = useState<'choice' | 'result'>('choice');
  const [currentScenario, setCurrentScenario] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultPoints, setResultPoints] = useState(0);
  const [celebration, setCelebration] = useState(false);

  const pointsAnim = useRef(new Animated.Value(points)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // Update animated points when points change
  useEffect(() => {
    Animated.spring(pointsAnim, {
      toValue: points,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [points]);

  const makeChoice = (isRisk: boolean) => {
    const scenario = FESTIVAL_SCENARIOS[currentScenario];

    if (!isRisk) {
      // Safe choice
      const result = scenario.safe;
      setResultMessage(result.msg);
      setResultPoints(result.points);
      setPoints(prev => prev + result.points);
    } else {
      // Risk choice - random outcome
      const riskOutcomes = scenario.risk;
      const randomOutcome = riskOutcomes[Math.floor(Math.random() * riskOutcomes.length)];
      setResultMessage(randomOutcome.msg);
      setResultPoints(randomOutcome.points);
      setPoints(prev => prev + randomOutcome.points);
    }

    setGamePhase('result');
    setShowResult(true);

    // Animate result appearance
    Animated.spring(resultAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();

    // Check for celebration
    if (points >= 150 && !celebration) {
      setCelebration(true);
    }
  };

  const nextRound = () => {
    const newRound = round + 1;
    const newScenario = (currentScenario + 1) % FESTIVAL_SCENARIOS.length;

    setRound(newRound);
    setCurrentScenario(newScenario);
    setGamePhase('choice');
    setShowResult(false);
    setStatus(`Round ${newRound}: Choose wisely for the festival!`);

    // Reset animations
    Animated.spring(resultAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  const restart = () => {
    setPoints(100);
    setRound(1);
    setCurrentScenario(0);
    setGamePhase('choice');
    setShowResult(false);
    setCelebration(false);
    setStatus("Ready for a festival adventure! Will you play it safe or take a risk?");
    pointsAnim.setValue(100);
    resultAnim.setValue(0);
  };

  const getPointsColor = (pts: number) => {
    if (pts > 0) return "#27ae60";
    if (pts < 0) return "#e74c3c";
    return "#7f8c8d";
  };

  const getChoiceEmoji = (isRisk: boolean) => {
    if (isRisk) return "🎲"; // Dice for risk
    return "🛡️"; // Shield for safe
  };

  const scenario = FESTIVAL_SCENARIOS[currentScenario];

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Smart Choice Festival</Text>
        <Text style={styles.subtitle}>Risk vs Reward Decision Making</Text>
      </View>

      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <View style={styles.pointsBox}>
          <Text style={[styles.pointsValue, { color: points >= 120 ? "#27ae60" : points <= 80 ? "#e74c3c" : "#f39c12" }]}>
            {points}
          </Text>
          <Text style={styles.pointsLabel}>Festival Points</Text>
        </View>
        <View style={styles.roundBox}>
          <Text style={styles.roundValue}>{round}</Text>
          <Text style={styles.roundLabel}>Round</Text>
        </View>
      </View>

      {/* Celebration Banner */}
      {celebration && (
        <View style={styles.celebrationBanner}>
          <Text style={styles.celebrationText}>🎉 FESTIVAL CHAMPION! 🎉</Text>
        </View>
      )}

      {/* Status Message */}
      <Text style={[styles.statusText, showResult && styles.resultStatus]}>
        {status}
      </Text>

      {/* Choice Phase */}
      {gamePhase === 'choice' && (
        <View style={styles.choiceContainer}>
          <Text style={styles.scenarioTitle}>Festival Scenario {round}:</Text>
          <Text style={styles.scenarioText}>
            {scenario.safe.msg.split('!')[0]}! What do you choose?
          </Text>

          <View style={styles.choices}>
            <TouchableOpacity
              style={[styles.choiceButton, styles.safeButton]}
              onPress={() => makeChoice(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.choiceEmoji}>{getChoiceEmoji(false)}</Text>
              <Text style={styles.choiceTitle}>Play it Safe</Text>
              <Text style={styles.choiceDesc}>
                Guaranteed moderate reward{'\n'}
                Low risk, steady gains
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceButton, styles.riskButton]}
              onPress={() => makeChoice(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.choiceEmoji}>{getChoiceEmoji(true)}</Text>
              <Text style={styles.choiceTitle}>Take a Risk</Text>
              <Text style={styles.choiceDesc}>
                Chance for big rewards{'\n'}
                Or big disappointments
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Result Phase */}
      {gamePhase === 'result' && showResult && (
        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: resultAnim,
              transform: [{
                scale: resultAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <View style={[styles.resultCard, { borderColor: getPointsColor(resultPoints) }]}>
            <Text style={styles.resultEmoji}>
              {resultPoints > 0 ? "🎉" : resultPoints < 0 ? "😅" : "🤔"}
            </Text>
            <Text style={styles.resultMessage}>{resultMessage}</Text>
            <Text style={[styles.resultPoints, { color: getPointsColor(resultPoints) }]}>
              {resultPoints > 0 ? "+" : ""}{resultPoints} points
            </Text>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextRound}
            disabled={round >= 6}
          >
            <Text style={styles.nextButtonText}>
              {round >= 6 ? "Festival Complete! 🎊" : "Next Scenario"}
            </Text>
            {round < 6 && <Ionicons name="chevron-forward" size={20} color="#fff" />}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Final Results */}
      {round >= 6 && (
        <View style={styles.finalResults}>
          <Text style={styles.finalTitle}>Festival Complete! 🎪</Text>
          <Text style={styles.finalScore}>
            Final Score: {points} points
          </Text>
          <Text style={styles.finalRating}>
            {points >= 180 ? "🏆 LEGENDARY FESTIVAL MASTER!" :
             points >= 140 ? "🎖️ SKILLED RISK TAKER!" :
             points >= 100 ? "🌟 FESTIVAL ENJOYER!" :
             "🎭 LEARNING EXPERIENCE!"}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.restartButton} onPress={restart}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.restartText}>Restart Festival</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="exit-outline" size={20} color="#666" />
          <Text style={styles.closeText}>Back to Games</Text>
        </TouchableOpacity>
      </View>

      {/* Educational Tips */}
      <View style={styles.educationBox}>
        <Text style={styles.educationTitle}>💡 Decision Making Wisdom:</Text>
        <Text style={styles.educationText}>
          • Safe choices provide steady, predictable results{'\n'}
          • Risky choices can lead to big wins or losses{'\n'}
          • Consider your goals and risk tolerance{'\n'}
          • Experience teaches better decision-making!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9ff",
    alignItems: "center",
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#7f8c8d",
    textAlign: "center",
  },
  pointsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  pointsBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
    minWidth: 100,
    minHeight: 60,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  pointsLabel: {
    fontSize: 11,
    color: "#7f8c8d",
    fontWeight: "600",
    marginTop: 2,
  },
  roundBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
    minWidth: 70,
    minHeight: 60,
  },
  roundValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3498db",
  },
  roundLabel: {
    fontSize: 11,
    color: "#7f8c8d",
    fontWeight: "600",
    marginTop: 2,
  },
  celebrationBanner: {
    backgroundColor: "#ffd700",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 3,
    width: "90%",
    alignItems: "center",
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#b8860b",
  },
  statusText: {
    fontSize: 15,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "600",
    minHeight: 35,
    paddingHorizontal: 15,
    lineHeight: 18,
  },
  resultStatus: {
    color: "#f39c12",
  },
  choiceContainer: {
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 6,
    textAlign: "center",
  },
  scenarioText: {
    fontSize: 15,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 15,
    paddingHorizontal: 15,
    lineHeight: 18,
  },
  choices: {
    flexDirection: "column",
    width: "100%",
    gap: 12,
  },
  choiceButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 3,
    minHeight: 80,
    width: "100%",
  },
  safeButton: {
    borderColor: "#27ae60",
  },
  riskButton: {
    borderColor: "#e74c3c",
  },
  choiceEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  choiceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  choiceDesc: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 15,
  },
  resultContainer: {
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  resultCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 4,
    alignItems: "center",
    borderWidth: 4,
    marginBottom: 12,
    width: "90%",
  },
  resultEmoji: {
    fontSize: 35,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 15,
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
    lineHeight: 18,
  },
  resultPoints: {
    fontSize: 18,
    fontWeight: "bold",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 3,
    minHeight: 48,
    width: "80%",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 6,
  },
  finalResults: {
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    elevation: 3,
    width: "90%",
  },
  finalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  finalScore: {
    fontSize: 16,
    color: "#27ae60",
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  finalRating: {
    fontSize: 14,
    color: "#f39c12",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 12,
  },
  restartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f39c12",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    elevation: 2,
    minHeight: 44,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  restartText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 4,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    elevation: 2,
    minHeight: 44,
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  closeText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  educationBox: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 12,
    width: "95%",
    borderWidth: 2,
    borderColor: "#d5edda",
  },
  educationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 6,
    textAlign: "center",
  },
  educationText: {
    fontSize: 13,
    color: "#2c3e50",
    lineHeight: 17,
    textAlign: "center",
  },
});
