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

// Game Settings
const PLAYFIELD_M = 16;
const PLAYER_SIZE = 56;
const INCOME_SIZE = 38;
const EXPENSE_SIZE = 44;
const POWERUP_SIZE = 38;
const INIT_LIVES = 3;
const INIT_SPAWN_INTERVAL = 900;
const MIN_SPAWN_INTERVAL = 365;
const GAME_DURATION = 60;

const screenW = Dimensions.get("window").width;
const screenH = Dimensions.get("window").height;
const playWidth = Math.min(360, screenW - PLAYFIELD_M * 2);
const playHeight = Math.min(420, screenH * 0.65);

// Asset pools
const INCOME_ICONS = ["cash", "add-circle", "leaf", "medal"];
const EXPENSE_ICONS = [
  "basket",
  "pizza",
  "ice-cream",
  "shirt",
  "watch",
  "bag-handle",
  "game-controller",
  "cafe",
  "trophy",
];
const EXPENSE_COLORS = ["#e7665c", "#ed96da", "#f6c943", "#f49a2f", "#ae74f0"];
const POWERUP_TYPES = ["shield", "magnet", "speed", "freeze"];
const POWERUP_ICONS = {
  shield: "shield",
  magnet: "magnet",
  speed: "rocket",
  freeze: "snow",
};

type Obstacle = {
  id: number;
  type: "income" | "expense" | "powerup";
  icon: string;
  color: string;
  x: Animated.Value;
  y: Animated.Value;
  vx: number;
  vy: number;
  kind?: string; // For powerups
  size: number;
  landed: boolean;
};
type PowerState = {
  shield?: boolean;
  magnet?: boolean;
  speed?: boolean;
  freeze?: boolean;
};

export default function ExpenseDodger({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INIT_LIVES);
  const [combo, setCombo] = useState(0);
  const [coins, setCoins] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timer, setTimer] = useState(GAME_DURATION);
  const [gameover, setGameover] = useState<null | "win" | "lose">(null);
  const [power, setPower] = useState<PowerState>({});
  const [powerMsg, setPowerMsg] = useState<string | null>(null);
  const [particle, setParticle] = useState<{ x: number; y: number; color: string, key: number } | null>(null);

  // Player state
  const [playerPos, setPlayerPos] = useState({ x: playWidth / 2, y: playHeight - PLAYER_SIZE - 6 });

  // Obstacles (moving obstacles)
  const [objects, setObjects] = useState<Obstacle[]>([]);
  const idCounter = useRef(0);
  const spawnTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const moveInt = useRef<NodeJS.Timeout | undefined>(undefined);
  const collisionInt = useRef<NodeJS.Timeout | undefined>(undefined);
  const timeInt = useRef<NodeJS.Timeout | undefined>(undefined);
  const powerTimers = useRef<{ [k: string]: NodeJS.Timeout | undefined }>({});

  // Handle swipes/touch
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event: GestureResponderEvent, gesture: PanResponderGestureState) => true,
      onMoveShouldSetPanResponder: (event: GestureResponderEvent, gesture: PanResponderGestureState) => true,
      onPanResponderMove: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        let nx = playerPos.x + gesture.dx;
        let ny = playerPos.y + gesture.dy;
        nx = Math.max(0, Math.min(nx, playWidth - PLAYER_SIZE));
        ny = Math.max(0, Math.min(ny, playHeight - PLAYER_SIZE));
        setPlayerPos({ x: nx, y: ny });
      },
      onPanResponderRelease: () => {},
      onPanResponderGrant: () => {},
    })
  ).current;

  // Game session management
  useEffect(() => {
    if (gameover) return;
    spawnTimer.current = setInterval(() => {
      if (power.freeze) return; // Pause spawns during freeze
      let typeRand = Math.random();
      let type: "income" | "expense" | "powerup" =
        typeRand < 0.13 ? "powerup" : typeRand < 0.48 ? "income" : "expense";
      let icon =
        type === "income"
          ? INCOME_ICONS[Math.floor(Math.random() * INCOME_ICONS.length)]
          : type === "expense"
          ? EXPENSE_ICONS[Math.floor(Math.random() * EXPENSE_ICONS.length)]
          : POWERUP_ICONS[POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)] as keyof typeof POWERUP_ICONS];
      let color =
        type === "income"
          ? "#3bcc58"
          : type === "expense"
          ? EXPENSE_COLORS[Math.floor(Math.random() * EXPENSE_COLORS.length)]
          : "#4ebdf2";
      let kind: string | undefined =
        type === "powerup" ? POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)] : undefined;
      let size =
        type === "income"
          ? INCOME_SIZE
          : type === "expense"
          ? EXPENSE_SIZE
          : POWERUP_SIZE;
      // Start at random top or side
      let edge = Math.random();
      let x, y, vx, vy;
      if (edge < 0.35) {
        // From top
        x = Math.random() * (playWidth - size);
        y = -size * 1.5;
        vx = (Math.random() - 0.5) * 2.3;
        vy = 2.8 + Math.random() * 1.6;
      } else if (edge < 0.65) {
        // From left
        x = -size * 1.5;
        y = Math.random() * (playHeight - size);
        vx = 2.4 + Math.random() * 1.3;
        vy = (Math.random() - 0.45) * 2.15;
      } else {
        // From right
        x = playWidth + size * 0.5;
        y = Math.random() * (playHeight - size);
        vx = -2 - Math.random() * 2.7;
        vy = (Math.random() - 0.5) * 2.67;
      }
      let id = idCounter.current++;
      setObjects((objs) => [
        ...objs,
        {
          id,
          type,
          icon: typeof icon === "string" ? icon : "",
          color,
          x: new Animated.Value(x),
          y: new Animated.Value(y),
          vx,
          vy,
          kind,
          size,
          landed: false,
        },
      ]);
    }, Math.max(INIT_SPAWN_INTERVAL - Math.floor(timer / 7) * 70, MIN_SPAWN_INTERVAL));
    return () => spawnTimer.current && clearInterval(spawnTimer.current);
  }, [timer, power.freeze, gameover]);

  // Animate and move obstacles
  useEffect(() => {
    if (gameover) return;
    moveInt.current = setInterval(() => {
      setObjects((objs) =>
        objs.map((o) => {
          if (o.landed) return o;
          let nx = (o.x as any)._value + o.vx * (power.speed ? 2.3 : 1);
          let ny = (o.y as any)._value + o.vy * (power.speed ? 2.3 : 1);
          o.x.setValue(nx);
          o.y.setValue(ny);
          // Mark as landed if out of bounds
          return {
            ...o,
            landed:
              nx < -o.size || nx > playWidth + o.size ||
              ny < -o.size || ny > playHeight + o.size
          };
        })
      );
    }, power.speed ? 13 : 22);
    return () => moveInt.current && clearInterval(moveInt.current);
  }, [power.speed, playWidth, playHeight, gameover]);

  // Collision detection - runs on fixed interval
  useEffect(() => {
    if (gameover) return;
    collisionInt.current = setInterval(() => {
      setObjects((objs) =>
        objs.map((o) => {
          if (o.landed) return o;
          const px = playerPos.x,
            py = playerPos.y,
            osz = o.size,
            ox = (o.x as any)._value,
            oy = (o.y as any)._value;
          // Circle collision
          const collides =
            Math.abs(ox + osz / 2 - (px + PLAYER_SIZE / 2)) < (osz + PLAYER_SIZE) / 2 - 5 &&
            Math.abs(oy + osz / 2 - (py + PLAYER_SIZE / 2)) < (osz + PLAYER_SIZE) / 2 - 5;
          if (collides) {
            // Power-ups
            if (o.type === "powerup" && o.kind) {
              setPower((cur) => ({ ...cur, [o.kind!]: true }));
              setPowerMsg(o.kind!.charAt(0).toUpperCase() + o.kind!.slice(1) + "!");
              // Set duration off
              if (powerTimers.current[o.kind!]) clearTimeout(powerTimers.current[o.kind!]);
              powerTimers.current[o.kind!] = setTimeout(() => {
                setPower((cur) => ({ ...cur, [o.kind!]: false }));
                setPowerMsg(null);
              }, 3000);
              return { ...o, landed: true };
            }
            // Income
            if (o.type === "income") {
              setScore((s) => s + 90 * (1 + combo));
              setCoins((c) => c + 1);
              setCombo((prev) => prev + 1);
              setBestCombo((b) => Math.max(b, combo + 1));
              // Particle
              setParticle({ x: ox, y: oy, color: "#3bcc58", key: o.id });
              setTimeout(() => setParticle(null), 700);
              return { ...o, landed: true };
            }
            // Expense with shield
            if (o.type === "expense" && power.shield) {
              setPowerMsg("Shield Block!");
              setTimeout(() => setPowerMsg(null), 1000);
              setParticle({ x: ox, y: oy, color: "#c7e4ff", key: o.id });
              setTimeout(() => setParticle(null), 500);
              return { ...o, landed: true };
            }
            // Expense normal
            if (o.type === "expense") {
              setCombo(0);
              setLives((l) => l - 1);
              setPowerMsg("Dodged!");
              setParticle({ x: ox, y: oy, color: "#e7665c", key: o.id });
              setTimeout(() => setParticle(null), 600);
              return { ...o, landed: true };
            }
          }
          // Magnet: pull incomes towards player
          if (o.type === "income" && power.magnet) {
            const dx = px - ox;
            const dy = py - oy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              const mag = dist < 10 ? 0 : 0.6; // Attraction force
              o.x.setValue(ox + dx * mag * 0.09);
              o.y.setValue(oy + dy * mag * 0.09);
            }
          }
          return o;
        })
      );
    }, 50); // Check collisions 20 times per second
    return () => collisionInt.current && clearInterval(collisionInt.current);
  }, [playerPos, combo, power, lives, gameover]);

  // Progress: time, win check
  useEffect(() => {
    if (gameover) return;
    timeInt.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1 && !gameover) {
          setGameover("win");
        }
        return t - 1;
      });
    }, 1000);
    return () => timeInt.current && clearInterval(timeInt.current);
  }, [gameover]);

  // Remove landed (off-screen) objects
  useEffect(() => {
    setObjects((objs) => objs.filter((o) => !o.landed));
  }, [objects]);

  // Restart logic
  function restart() {
    setScore(0);
    setCoins(0);
    setCombo(0);
    setBestCombo(0);
    setLives(INIT_LIVES);
    setTimer(GAME_DURATION);
    setPlayerPos({ x: playWidth / 2, y: playHeight - PLAYER_SIZE - 6 });
    setObjects([]);
    setParticle(null);
    setPower({});
    setGameover(null);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Expense Dodger</Text>
      <View style={styles.infoBar}>
        <Ionicons name="timer-outline" size={18} color="#516bcd" />
        <Text style={styles.infoText}> {timer}s </Text>
        <Ionicons name="wallet-outline" size={18} color="#44aa3f" />
        <Text style={styles.infoText}> Rupees: {coins}</Text>
        <Ionicons name="star-sharp" size={18} color="#ffcc30" />
        <Text style={styles.infoText}>Score: {score}</Text>
        <Ionicons name="flame" size={18} color="#ef8414" />
        <Text style={styles.infoText}>Combo: {combo}</Text>
        <Ionicons name="heart" size={18} color="#dd4e5d" />
        <Text style={styles.infoText}>Lives: {lives}</Text>
      </View>
      <View
        style={[
          styles.playArea,
          { width: playWidth, height: playHeight },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Render all objects */}
        {objects.map((o) =>
          !o.landed ? (
            <Animated.View
              key={o.id}
              style={{
                position: "absolute",
                left: o.x,
                top: o.y,
                width: o.size,
                height: o.size,
                borderRadius: o.size / 2,
                zIndex: 2,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: o.type === "expense" ? o.color : o.type === "income" ? "#baf5cf" : "#d0e5fa",
                opacity: 0.93,
                borderWidth: o.type === "expense" ? 2 : 0,
                borderColor: o.type === "expense" ? "#aa324a" : "transparent",
                shadowColor: o.color,
                shadowOpacity: 0.13,
                shadowRadius: 8,
              }}
            >
              <Ionicons
                name={o.icon as any}
                size={o.type === "powerup" ? 29 : 25}
                color={o.type === "expense" ? "#fff" : o.type === "income" ? "#2f9e47" : "#448ef8"}
              />
            </Animated.View>
          ) : null
        )}
        {/* Player */}
        <Animated.View
          style={{
            position: "absolute",
            left: playerPos.x,
            top: playerPos.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            borderRadius: PLAYER_SIZE / 2,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 11,
          }}
        >
          <Ionicons name="person" size={PLAYER_SIZE} color="#377cb5" />
          <Text
            style={{
              position: "absolute",
              top: PLAYER_SIZE / 2 - 9,
              left: 0,
              width: PLAYER_SIZE,
              textAlign: "center",
              color: "#6b3975",
              fontWeight: "bold",
              fontSize: 11,
            }}
          >
            You
          </Text>
        </Animated.View>
        {/* Combo/Reward Popups */}
        {combo >= 3 && (
          <View style={styles.comboBox}>
            <Ionicons name="ribbon" size={19} color="#fdc11a" />
            <Text style={styles.comboText}>{combo}x Combo!</Text>
          </View>
        )}
        {particle && (
          <Animated.View
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
                opacity: 0.6,
              },
            ]}
          />
        )}
        {powerMsg && (
          <View style={styles.powerBox}>
            <Ionicons name="sparkles" size={20} color="#ffa60f" />
            <Text style={styles.powerText}>{powerMsg}</Text>
          </View>
        )}
      </View>
      {/* End/gameover/celebration */}
      {gameover && (
        <View style={styles.modal}>
          <Text style={styles.modalText}>
            {gameover === "win"
              ? "Savings Streak Completed!"
              : "Expenses Caught You"}
          </Text>
          <Text style={styles.resultText}>Coins: {coins}</Text>
          <Text style={styles.resultText}>Score: {score}</Text>
          <Text style={styles.resultText}>Combo: {bestCombo}x</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={restart}>
            <Ionicons name="reload-circle" size={23} color="#2c82b8" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 6 }}>
              Play Again
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#fee8e5" }]}
            onPress={onClose}
          >
            <Ionicons name="exit-outline" size={22} color="#9f2d1a" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 8, color: "#ac3521" }}>
              Back to Games
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>
        Drag to move, dodge expenses, catch rupees, collect powerups. How long can you survive the expense storm?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#e0f0ff",
    flex: 1,
    alignItems: "center",
    paddingTop: 17,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#446095",
    marginBottom: 2,
    letterSpacing: 0.16,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 2,
    gap: 7,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: 4,
  },
  playArea: {
    marginVertical: 9,
    borderRadius: 18,
    backgroundColor: "#f6faff",
    borderWidth: 2,
    borderColor: "#a3d6e7",
    overflow: "hidden",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    alignSelf: "center",
    elevation: 6,
  },
  comboBox: {
    position: "absolute",
    top: "10%",
    left: "23%",
    zIndex: 40,
    flexDirection: "row",
    backgroundColor: "#fffbe9",
    borderRadius: 13,
    borderWidth: 1.4,
    borderColor: "#feefa8",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  comboText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fdc11a",
    marginLeft: 6,
  },
  powerBox: {
    position: "absolute",
    top: "17%",
    left: "17%",
    backgroundColor: "#f5f5ff",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#eed6ae",
    paddingVertical: 2,
    paddingHorizontal: 12,
    elevation: 3,
    zIndex: 320,
  },
  powerText: {
    fontWeight: "800",
    color: "#308096",
    fontSize: 15,
  },
  particle: {
    position: "absolute",
    width: 37,
    height: 37,
    borderRadius: 18,
    opacity: 0.6,
    zIndex: 22,
    shadowColor: "#222",
    shadowRadius: 6,
  },
  modal: {
    position: "absolute",
    top: "27%",
    left: "13%",
    width: "74%",
    backgroundColor: "#f5f6f9ee",
    borderRadius: 19,
    alignItems: "center",
    padding: 26,
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#adbdfc",
    elevation: 8,
  },
  modalText: {
    fontSize: 24,
    color: "#5041ac",
    fontWeight: "900",
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 7,
    color: "#336c4c",
    fontWeight: "bold",
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f4fa",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 30,
    marginTop: 13,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 3,
  },
  hint: {
    marginTop: 8,
    color: "#628dac",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 3,
  },
});
