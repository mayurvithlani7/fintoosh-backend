import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
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
const ROWS_ON_SCREEN = 9;
const CELL_SIZE = 48;
const PLAYER_SIZE = 46;
const INITIAL_SCROLL_SPEED = 1600; // ms per row
const MIN_SCROLL_SPEED = 500;
const GAME_DURATION = 60; // seconds
const INITIAL_SAVINGS_GOAL = 2000;
const PLAYFIELD_PADDING = 14;
const POWERUP_DURATION = 3200;

const screenW = Dimensions.get("window").width;
const playWidth = LANE_COUNT * CELL_SIZE;
const playHeight = ROWS_ON_SCREEN * CELL_SIZE;

type CellType = "empty" | "coin" | "trap" | "barrier" | "gold" | "magnet" | "shield" | "ghost" | "timewarp";

type Cell = {
  type: CellType;
  id: number;
};

type PowerUp = "magnet" | "shield" | "ghost" | "timewarp";

export default function SavingsObstacleCourse({ onClose }: { onClose: () => void }) {
  // State
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerLane, setPlayerLane] = useState(1);
  const [playerRow] = useState(ROWS_ON_SCREEN - 1); // Fixed at bottom
  const [savings, setSavings] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [activePowerups, setActivePowerups] = useState<Partial<Record<PowerUp, boolean>>>({});
  const [collectedPowerups, setCollectedPowerups] = useState<PowerUp[]>([]);
  const [time, setTime] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<"playing" | "won" | "over">("playing");
  const [goal] = useState(INITIAL_SAVINGS_GOAL);
  const [scrollSpeed, setScrollSpeed] = useState(INITIAL_SCROLL_SPEED);
  const [systemMsg, setSystemMsg] = useState<string | null>(null);

  // Refs
  const mazeId = useRef(0);
  const scrollTimer = useRef<NodeJS.Timeout>();
  const sessionTimer = useRef<NodeJS.Timeout>();
  const comboTimer = useRef<NodeJS.Timeout>();
  const gameStartTime = useRef(Date.now());

  // Initialize maze on mount
  useEffect(() => {
    resetMaze();
    return () => {
      // Cleanup all timers
      if (scrollTimer.current) clearInterval(scrollTimer.current);
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
      if (comboTimer.current) clearTimeout(comboTimer.current);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing") {
      // Clear timers when not playing
      if (scrollTimer.current) clearInterval(scrollTimer.current);
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
      return;
    }

    // Scroll timer
    scrollTimer.current = setInterval(() => {
      scrollMaze();
    }, scrollSpeed);

    // Session timer
    sessionTimer.current = setTimeout(() => {
      setTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setGameState("over");
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (scrollTimer.current) clearInterval(scrollTimer.current);
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
    };
  }, [gameState, scrollSpeed, playerLane]);

  function resetMaze() {
    setMaze(
      Array.from({ length: ROWS_ON_SCREEN }, (_, r) =>
        Array.from({ length: LANE_COUNT }, (_, c) => ({
          type: r === ROWS_ON_SCREEN - 1 && c === 1 ? "empty" : "empty",
          id: ++mazeId.current,
        }))
      )
    );
    setPlayerLane(1);
    setSavings(0);
    setScore(0);
    setCombo(1);
    setCollectedPowerups([]);
    setActivePowerups({});
    setTime(GAME_DURATION);
    setGameState("playing");
    setSystemMsg(null);
    setScrollSpeed(INITIAL_SCROLL_SPEED);
  }

  function randomCell(): CellType {
    const r = Math.random();
    if (r < 0.08) return "barrier";
    if (r < 0.21) return "trap";
    if (r < 0.24) return "gold";
    if (r < 0.32) return "magnet";
    if (r < 0.37) return "shield";
    if (r < 0.42) return "ghost";
    if (r < 0.47) return "timewarp";
    if (r < 0.67) return "coin";
    return "empty";
  }

  // Auto-scroll the maze and handle collision
  function scrollMaze() {
    setMaze((oldMaze) => {
      // Remove bottom row, add new row at top
      const newRow: Cell[] = Array.from({ length: LANE_COUNT }, () => ({
        type: randomCell(),
        id: ++mazeId.current,
      }));
      let newMaze = [newRow, ...oldMaze.slice(0, -1)];
      // Handle player movement: player is always at fixed "visible" row (bottom)
      // Check collision at player position (lane, bottom row)
      const targetCell = newMaze[playerRow][playerLane];
      resolveCell(targetCell, playerLane, playerRow);
      // Lower combo if hit obstacle, speed up if coins collected
      if (scrollSpeed > MIN_SCROLL_SPEED && (score % 500 === 0 && score > 0)) setScrollSpeed((s) => Math.max(MIN_SCROLL_SPEED, s - 60));
      return newMaze;
    });
  }

  // Lane swipe handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event: GestureResponderEvent) => true,
      onMoveShouldSetPanResponder: (event: GestureResponderEvent) => true,
      onPanResponderMove: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        // Horizontal swipe to switch lanes
        if (Math.abs(gesture.dx) > 28) {
          let newLane = playerLane + (gesture.dx > 0 ? 1 : -1);
          newLane = Math.max(0, Math.min(newLane, LANE_COUNT - 1));
          setPlayerLane(newLane);
        }
        // Double-tap gesture for speed boost (not implemented for MVP)
      },
      onPanResponderRelease: () => {},
      onPanResponderGrant: () => {},
    })
  ).current;

  // Collision and cell effect logic
  function resolveCell(cell: Cell, lane: number, row: number) {
    if (cell.type === "coin") {
      setSavings((v) => v + 80 * combo);
      setScore((s) => s + 50 * combo);
      showSystemMsg(`+₹${80 * combo} (Savings!)`);
      handleCombo(1);
    }
    if (cell.type === "gold") {
      setSavings((v) => v + 200 * combo);
      setScore((s) => s + 180 * combo);
      showSystemMsg(`+₹${200 * combo} (Jackpot!)`);
      handleCombo(1);
    }
    if (["magnet", "shield", "ghost", "timewarp"].includes(cell.type)) {
      setCollectedPowerups((p) => [...p, cell.type as PowerUp]);
      activatePowerup(cell.type as PowerUp);
      showSystemMsg(`${cell.type.charAt(0).toUpperCase() + cell.type.slice(1)} Activated!`);
      handleCombo(1);
    }
    if (cell.type === "trap") {
      setSavings((v) => Math.max(0, v - 150));
      setScore((s) => Math.max(0, s - 120));
      setCombo(1);
      showSystemMsg("-₹150 (Trap!)");
    }
    if (cell.type === "barrier") {
      setSavings((v) => Math.max(0, v - 100));
      setScore((s) => Math.max(0, s - 70));
      setCombo(1);
      showSystemMsg("-₹100 (Obstacle)");
    }
    if (cell.type === "empty") {
      // No action
    }
    // End game if savings target reached
    if (savings >= goal) {
      setGameState("won");
    }
    if (time <= 0) {
      setGameState("over");
    }
  }

  // Combo and system message logic
  function handleCombo(delta: number) {
    setCombo((c) => {
      const newCombo = c + delta;
      if (comboTimer.current) {
        clearTimeout(comboTimer.current);
      }
      comboTimer.current = setTimeout(() => {
        setCombo(1);
      }, 2300);
      return newCombo;
    });
  }
  function showSystemMsg(msg: string) {
    setSystemMsg(msg);
    setTimeout(() => setSystemMsg(null), 1500);
  }

  // Powerup handlers
  function activatePowerup(type: PowerUp) {
    setActivePowerups((p) => ({ ...p, [type]: true }));
    setTimeout(() => {
      setActivePowerups((p) => ({ ...p, [type]: false }));
    }, POWERUP_DURATION);
  }

  // Restart game
  function restart() {
    resetMaze();
  }

  // Render
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Savings Obstacle Course</Text>
      <View style={styles.infoBar}>
        <Ionicons name="timer-outline" size={19} color="#5085cd" />
        <Text style={styles.infoText}> {time}s </Text>
        <Ionicons name="wallet-outline" size={19} color="#3b8c31" />
        <Text style={[styles.infoText, { fontWeight: "bold" }]}>₹{savings}</Text>
        <Ionicons name="star" size={19} color="#ffc440" />
        <Text style={styles.infoText}>Score: {score}</Text>
        <Ionicons name="rocket" size={19} color="#bd60ff" />
        <Text style={styles.infoText}>Combo: {combo}x</Text>
      </View>
      <View
        style={[
          styles.playArea,
          { width: playWidth + PLAYFIELD_PADDING * 2, height: playHeight + PLAYFIELD_PADDING * 2 },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.grid}>
          {maze.map((row, r) =>
            row.map((cell, c) => (
              <View
                key={cell.id}
                style={[
                  styles.cell,
                  {
                    left: c * CELL_SIZE,
                    top: r * CELL_SIZE,
                  },
                  cell.type === "barrier" && styles.barrier,
                  cell.type === "trap" && styles.trap,
                  cell.type === "coin" && styles.coin,
                  cell.type === "gold" && styles.gold,
                  cell.type === "magnet" && styles.magnet,
                  cell.type === "shield" && styles.shield,
                  cell.type === "ghost" && styles.ghost,
                  cell.type === "timewarp" && styles.timewarp,
                ]}
              >
                {["coin", "gold", "magnet", "shield", "ghost", "timewarp"].includes(cell.type) && (
                  <Ionicons
                    name={
                      cell.type === "coin"
                        ? "cash"
                        : cell.type === "gold"
                        ? "diamond"
                        : cell.type === "magnet"
                        ? "magnet"
                        : cell.type === "shield"
                        ? "shield"
                        : cell.type === "ghost"
                        ? "eye-off"
                        : "timer-outline"
                    }
                    size={cell.type === "gold" ? 26 : 20}
                    color={
                      cell.type === "coin"
                        ? "#d4bb38"
                        : cell.type === "gold"
                        ? "#ffd101"
                        : cell.type === "magnet"
                        ? "#487dcc"
                        : cell.type === "shield"
                        ? "#508c7c"
                        : cell.type === "ghost"
                        ? "#6c60c5"
                        : "#b580d8"
                    }
                  />
                )}
                {cell.type === "trap" && (
                  <Ionicons name="cart" size={22} color="#e0684b" />
                )}
                {cell.type === "barrier" && (
                  <Ionicons name="close" size={20} color="#cd3131" />
                )}
              </View>
            ))
          )}
          {/* Player */}
          <View
            style={{
              position: "absolute",
              left: playerLane * CELL_SIZE + 2,
              top: playerRow * CELL_SIZE + 2,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
            }}
          >
            <Ionicons name="navigate-circle" size={PLAYER_SIZE} color="#337bf5" />
            <Text style={{ color: "#235777", fontWeight: "bold", fontSize: 13 }}>You</Text>
          </View>
        </View>
        {/* System/message overlays */}
        {systemMsg && (
          <View style={styles.msgBox}>
            <Ionicons name="sparkles" size={19} color="#fac609" />
            <Text style={styles.msgText}>{systemMsg}</Text>
          </View>
        )}
      </View>
      {gameState !== "playing" && (
        <View style={styles.modal}>
          <Text style={styles.modalText}>
            {gameState === "won" ? "Goal Reached!" : "Game Over"}
          </Text>
          <Text style={styles.resultText}>Final Savings: ₹{savings}</Text>
          <Text style={styles.resultText}>Score: {score}</Text>
          <Text style={styles.resultText}>Combo: {combo}x</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={restart}>
            <Ionicons name="reload" size={22} color="#2273a7" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 5 }}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#f9eae2" }]}
            onPress={onClose}
          >
            <Ionicons name="exit" size={20} color="#d13223" />
            <Text style={{ fontWeight: "bold", marginLeft: 7, color: "#b93322" }}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>
        Swipe to dodge traps & obstacles, collect coins and powerups, maximize your savings!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fcfcfa",
    flex: 1,
    alignItems: "center",
    paddingTop: 19,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#36994a",
    marginBottom: 2,
    letterSpacing: 0.18,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 2,
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: 5,
  },
  playArea: {
    marginVertical: 8,
    borderRadius: 22,
    backgroundColor: "#f2ffe6",
    borderWidth: 2,
    borderColor: "#bde1b3",
    overflow: "hidden",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    alignSelf: "center",
    elevation: 7,
  },
  grid: {
    position: "relative",
    width: playWidth,
    height: playHeight,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    position: "absolute",
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffde8",
    borderWidth: 0.5,
    borderColor: "#eae6b0",
  },
  barrier: {
    backgroundColor: "#f6e5e2",
  },
  trap: {
    backgroundColor: "#fee6e3",
  },
  coin: {
    backgroundColor: "#fffdbc",
  },
  gold: {
    backgroundColor: "#fee087",
  },
  magnet: {
    backgroundColor: "#d1e2fc",
  },
  shield: {
    backgroundColor: "#e2fdee",
  },
  ghost: {
    backgroundColor: "#eee6fe",
  },
  timewarp: {
    backgroundColor: "#efedff",
  },
  msgBox: {
    position: "absolute",
    left: "17%",
    bottom: 45,
    backgroundColor: "#fef9d3",
    borderRadius: 13,
    paddingVertical: 4,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    borderWidth: 1,
    borderColor: "#ffecbc",
    zIndex: 81,
  },
  msgText: {
    color: "#b78b13",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 7,
  },
  modal: {
    position: "absolute",
    top: "27%",
    left: "11%",
    width: "78%",
    backgroundColor: "#f8fff8ee",
    borderRadius: 21,
    alignItems: "center",
    padding: 28,
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#7fd57b",
    elevation: 8,
  },
  modalText: {
    fontSize: 25,
    color: "#179c3d",
    fontWeight: "900",
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 7,
    color: "#277b51",
    fontWeight: "bold",
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf6fc",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 32,
    marginTop: 14,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 3,
  },
  hint: {
    marginTop: 8,
    color: "#3f96ae",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 3,
  },
});
