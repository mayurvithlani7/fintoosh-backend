import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Constants
const LANE_COUNT = 4;
const LANE_GAP = 6;
const ITEM_SIZE = 46;
const PLAYER_SIZE = 54;
const INITIAL_BUDGET = 2000;
const GAME_DURATION = 60; // seconds
const FALL_INTERVAL = 700;
const POWER_UP_DURATION = 3000;
const screenW = Dimensions.get("window").width;
const MARGIN_H = 18;
const mallWidth = screenW - MARGIN_H * 2;
const laneWidth = mallWidth / LANE_COUNT;

// Item data
const ITEM_SET = [
  { name: "Toy", price: 150, icon: "game-controller" },
  { name: "Book", price: 120, icon: "book" },
  { name: "T-Shirt", price: 200, icon: "shirt" },
  { name: "Video Game", price: 500, icon: "logo-playstation" },
  { name: "Phone", price: 1400, icon: "phone-portrait" },
  { name: "Laptop", price: 2900, icon: "laptop" },
  { name: "Sneaker", price: 350, icon: "footsteps" },
  { name: "Pizza", price: 80, icon: "pizza" },
  { name: "Smartwatch", price: 800, icon: "watch" },
  { name: "Chocolate", price: 60, icon: "restaurant" },
  { name: "Soda", price: 40, icon: "beer" },
  // Obstacle
  { name: "Impulse Trap", price: 7777, icon: "alert-circle", obstacle: true },
  // Power-ups
  { name: "Budget Boost", price: -200, icon: "cash", powerup: "budget" },
  { name: "Freeze Time", price: 0, icon: "snow", powerup: "freeze" },
];

type FallingItem = {
  id: number;
  lane: number;
  y: Animated.Value;
  type: typeof ITEM_SET[0];
  collected: boolean;
};

export default function BudgetDash({ onClose }: { onClose: () => void }) {
  // State
  const [playerLane, setPlayerLane] = useState(1);
  const [falling, setFalling] = useState<FallingItem[]>([]);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState<NodeJS.Timeout | null>(null);
  const [bestCombo, setBestCombo] = useState(0);
  const [time, setTime] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<"playing" | "over" | "success">("playing");
  const [freeze, setFreeze] = useState(false);
  const [budgetBoostActive, setBudgetBoostActive] = useState(false);
  const [powerupMessage, setPowerupMessage] = useState<string | null>(null);

  // Refs
  const itemCounter = useRef(0);
  const animationTimers = useRef<any[]>([]);
  const fallDropTimer = useRef<NodeJS.Timeout | null>(null);
  const freezeTimer = useRef<NodeJS.Timeout | null>(null);

  // PanResponder for player movement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e: GestureResponderEvent, g: PanResponderGestureState) => true,
      onMoveShouldSetPanResponder: (e: GestureResponderEvent, g: PanResponderGestureState) => true,
      onPanResponderMove: (_e: GestureResponderEvent, gesture: PanResponderGestureState) => {
        // Determine which lane by horizontal position
        const relativeX = gesture.moveX - MARGIN_H;
        let lane = Math.floor(relativeX / laneWidth);
        lane = Math.max(0, Math.min(lane, LANE_COUNT - 1));
        setPlayerLane(lane);
      },
      onPanResponderRelease: () => {},
      onPanResponderGrant: () => {},
    })
  ).current;

  // Drop falling items
  useEffect(() => {
    if (gameState !== "playing" || freeze) return;
    fallDropTimer.current = setInterval(() => {
      // Dynamic selection logic
      let difficulty = Math.floor(score / 600) + 2;
      let availableItems = ITEM_SET.filter(
        (item) =>
          (item.price <= budget * (Math.random() * 1.5 + 0.4) && !item.obstacle && !item.powerup) ||
          (item.obstacle && Math.random() < 0.18) ||
          (item.powerup && Math.random() < 0.08)
      );
      if (availableItems.length === 0) availableItems = ITEM_SET.slice(0, 4);
      const item = availableItems[Math.floor(Math.random() * availableItems.length)];
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const y = new Animated.Value(-ITEM_SIZE);

      const id = itemCounter.current++;
      const fallTime = Math.max(900, 3000 - score * 4 - difficulty * 150 + Math.random() * 200);

      const newItem: FallingItem = {
        id,
        lane,
        y,
        type: item,
        collected: false,
      };
      setFalling((prev) => [...prev, newItem]);

      // Animate item
      const anim = Animated.timing(y, {
        toValue: 375,
        duration: fallTime,
        useNativeDriver: false,
      });
      anim.start();
      animationTimers.current.push(anim);
    }, freeze ? 99999 : Math.max(FALL_INTERVAL, 300 - score / 9));
    return () => {
      if (fallDropTimer.current) clearInterval(fallDropTimer.current);
    };
    // eslint-disable-next-line
  }, [gameState, freeze, score, budget]);

  // Falling item collision detection
  useEffect(() => {
    if (gameState !== "playing") return;
    const detectInterval = setInterval(() => {
      setFalling((prev) =>
        prev.map((item) => {
          if (item.collected) return item;
          const y = (item.y as any)._value;
          if (y >= 325 && item.lane === playerLane) {
            // Budget, Powerup, or Obstacle logic
            if (item.type.powerup === "budget") {
              setBudget((b) => Math.max(0, b + 200));
              setPowerupMessage("Budget Boost! +₹200");
              setBudgetBoostActive(true);
              setTimeout(() => setBudgetBoostActive(false), POWER_UP_DURATION);
            }
            if (item.type.powerup === "freeze") {
              setFreeze(true);
              setPowerupMessage("Time Frozen!");
              freezeTimer.current = setTimeout(() => {
                setFreeze(false);
                setPowerupMessage(null);
              }, POWER_UP_DURATION);
            }
            if (item.type.obstacle) {
              setBudget((b) => Math.max(0, b - 500));
              setScore((s) => Math.max(0, s - 100));
              setPowerupMessage("Impulse Trap! -₹500");
              setCombo(0);
              return { ...item, collected: true };
            }
            // Normal items (purchasable)
            if (!item.type.obstacle && !item.type.powerup) {
              if (budget < item.type.price) {
                setPowerupMessage("Overspent!");
                setBudget((b) => Math.max(0, b - 200));
                setScore((s) => Math.max(0, s - 40));
                setCombo(0);
              } else {
                setBudget((b) => b - item.type.price);
                setScore((s) => s + Math.round(item.type.price / 10));
                setCombo((c) => {
                  if (comboTimer) clearTimeout(comboTimer);
                  const timeout = setTimeout(() => {
                    setCombo(0);
                  }, 2400);
                  setComboTimer(timeout);
                  const newCombo = c + 1;
                  setBestCombo((bc) => Math.max(bc, newCombo));
                  return newCombo;
                });
                setPowerupMessage(`+${item.type.name} ₹${item.type.price}`);
              }
            }
            return { ...item, collected: true };
          }
          return item;
        })
      );
    }, 55);
    return () => clearInterval(detectInterval);
    // eslint-disable-next-line
  }, [playerLane, gameState, budget, score, combo]);

  // Combo reset logic
  useEffect(() => {
    if (combo === 0 && comboTimer) {
      clearTimeout(comboTimer);
      setComboTimer(null);
    }
    // eslint-disable-next-line
  }, [combo]);

  // Remove collected/fallen items
  useEffect(() => {
    if (gameState !== "playing") return;
    const filterTimer = setInterval(() => {
      setFalling((prev) => prev.filter((item) => (item.y as any)._value < 400 && !item.collected));
    }, 230);
    return () => clearInterval(filterTimer);
  }, [gameState]);

  // Timer/End game logic
  useEffect(() => {
    if (gameState !== "playing" || freeze) return;
    if (time <= 0 || budget <= 0) {
      setGameState(budget > 0 ? "success" : "over");
      return;
    }
    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time, gameState, budget, freeze]);

  function restart() {
    setPlayerLane(1);
    setFalling([]);
    setBudget(INITIAL_BUDGET);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTime(GAME_DURATION);
    setGameState("playing");
    setFreeze(false);
    setBudgetBoostActive(false);
    setPowerupMessage(null);
    itemCounter.current = 0;
  }

  // RENDER
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Budget Dash</Text>
      <View style={styles.infoBar}>
        <Ionicons name="timer-outline" size={18} color="#516bcd" />
        <Text style={styles.infoText}> {time}s </Text>
        <Ionicons name="cash" size={18} color="#68a039" />
        <Text style={[styles.infoText, budget <= 200 && { color: "#d42828" }, budgetBoostActive && { fontWeight: "bold" }]}>
          ₹{budget}
        </Text>
        <Ionicons name="star" size={18} color="#ffcc30" />
        <Text style={styles.infoText}>Score: {score}</Text>
        <Ionicons name="flame" size={18} color="#ea7100" />
        <Text style={styles.infoText}>Combo: {combo}</Text>
      </View>

      <View
        style={[
          styles.mall,
          {
            width: mallWidth,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {[...Array(LANE_COUNT)].map((_, idx) => (
          <View
            key={`lane-${idx}`}
            style={{
              position: "absolute",
              left: laneWidth * idx,
              top: 0,
              width: laneWidth,
              height: "100%",
              backgroundColor: idx % 2 === 0 ? "#f9ffe7" : "#f1f1ff",
              borderLeftColor: "#e8e3be",
              borderLeftWidth: idx > 0 ? 1 : 0,
            }}
          />
        ))}

        {falling.map((item) =>
          !item.collected ? (
            <Animated.View
              key={item.id}
              style={[
                {
                  position: "absolute",
                  left: item.lane * laneWidth + laneWidth / 2 - ITEM_SIZE / 2,
                  top: item.y,
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  zIndex: 3,
                  borderWidth: item.type.obstacle ? 2 : 0,
                  borderColor: item.type.obstacle ? "#c41c26" : "#f5e49c",
                  borderRadius: 18,
                  backgroundColor: item.type.powerup ? "#a8ddff" : "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Ionicons
                name={item.type.icon as any}
                size={32}
                color={
                  item.type.obstacle
                    ? "#c41c26"
                    : item.type.powerup
                    ? "#3670ab"
                    : "#676000"
                }
                style={{ marginBottom: 2 }}
              />
              <Text
                style={{
                  fontSize: item.type.obstacle ? 13 : 12,
                  color: item.type.obstacle
                    ? "#c41c26"
                    : item.type.powerup
                    ? "#3670ab"
                    : "#786c23",
                  fontWeight: item.type.obstacle ? "bold" : "500",
                }}
              >
                {item.type.obstacle
                  ? "Trap"
                  : item.type.powerup
                  ? item.type.powerup === "budget"
                    ? "+₹200"
                    : "Freeze"
                  : `₹${item.type.price}`}
              </Text>
            </Animated.View>
          ) : null
        )}

        {/* Player */}
        <Animated.View
          style={{
            position: "absolute",
            left: playerLane * laneWidth + laneWidth / 2 - PLAYER_SIZE / 2,
            bottom: 8,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE + 8,
            alignItems: "center",
            justifyContent: "flex-end",
            zIndex: 40,
          }}
        >
          <Ionicons name="person-circle" size={PLAYER_SIZE} color="#3879ef" />
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#3879ef" }}>
            You
          </Text>
        </Animated.View>
      </View>

      {powerupMessage && (
        <View style={styles.powerupMessage}>
          <Ionicons name="sparkles" size={20} color="#ffa60f" />
          <Text style={styles.powerupText}>{powerupMessage}</Text>
        </View>
      )}

      {gameState !== "playing" && (
        <View style={styles.gameOverModal}>
          <Text style={styles.gameOverText}>
            {gameState === "over" ? "Budget Over!" : "You Win!"}
          </Text>
          <Text style={styles.resultSub}>
            Final Score: <Text style={{ color: "#346b33" }}>{score}</Text>
          </Text>
          <Text style={styles.resultSub}>
            Best Combo: <Text style={{ color: "#ea7100" }}>{bestCombo}</Text>
          </Text>
          <TouchableOpacity style={styles.modalBtn} onPress={restart}>
            <Ionicons name="reload" size={22} color="#2166b0" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 5 }}>
              Play Again
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#f6cece" }]}
            onPress={onClose}
          >
            <Ionicons name="exit-outline" size={20} color="#c2162c" />
            <Text style={{ fontWeight: "bold", marginLeft: 7, color: "#c2162c" }}>
              Back to Games
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>
        Swipe or tap any lane to move. Collect items, budget wisely, chain combos, and avoid traps!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#f7f8fa",
    flex: 1,
    alignItems: "center",
    paddingTop: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#22793b",
    marginBottom: 2,
    letterSpacing: 0.18,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    marginBottom: 2,
    gap: 6,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: 5,
  },
  mall: {
    position: "relative",
    backgroundColor: "#eef2fc",
    borderRadius: 18,
    marginVertical: 12,
    height: 390,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#a7bbd8",
    elevation: 2,
    width: mallWidth,
  },
  powerupMessage: {
    position: "absolute",
    left: "18%",
    top: 48,
    backgroundColor: "#fff7e9",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 999,
    shadowColor: "#faa600",
    shadowOpacity: 0.11,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 8,
  },
  powerupText: {
    color: "#dd810e",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 10,
  },
  gameOverModal: {
    position: "absolute",
    top: "23%",
    left: "9%",
    width: "82%",
    backgroundColor: "#f6fff2ee",
    borderRadius: 22,
    alignItems: "center",
    padding: 30,
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#99d6ad",
    elevation: 6,
  },
  gameOverText: {
    fontSize: 26,
    color: "#c2162c",
    fontWeight: "bold",
    marginBottom: 8,
  },
  resultSub: {
    fontSize: 17,
    marginBottom: 9,
    color: "#35847d",
    fontWeight: "bold",
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ddeeff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 36,
    marginTop: 12,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 2,
  },
  hint: {
    marginTop: 9,
    color: "#516bcd",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 3,
  },
});
