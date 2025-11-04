import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Constants
const SESSION_DURATION = 45; // seconds
const INITIAL_BUBBLE_INTERVAL = 880; // ms
const MAX_BUBBLES = 16;
const BUBBLE_SIZE = 62;
const FIELD_MARGIN = 26;

const screenW = Dimensions.get("window").width;
const screenH = Dimensions.get("window").height;
const playWidth = screenW - FIELD_MARGIN * 2;
const playHeight = Math.min(screenH * 0.75, 420);

// Bubble Types
type BubbleType = "good" | "bad" | "safe" | "gold" | "powerup";
type PowerupType = "bull" | "crash" | "freeze" | "magnet" | "multiplier";

// Bubble data
const BUBBLE_DEFINITIONS: Array<{
  type: BubbleType;
  value: number;
  color: string;
  icon: string;
  label: string;
  risk?: number;
  powerup?: PowerupType;
}> = [
  // Green: returns
  { type: "good", value: 150, color: "#58c055", icon: "trending-up", label: "+₹150", risk: 3 },
  { type: "good", value: 275, color: "#31b76a", icon: "analytics", label: "+₹275", risk: 4 },
  { type: "good", value: 500, color: "#149c18", icon: "stats-chart", label: "+₹500", risk: 6 },
  // Red: losses
  { type: "bad", value: -120, color: "#e7393a", icon: "trending-down", label: "-₹120", risk: 2 },
  { type: "bad", value: -250, color: "#ac1226", icon: "remove-circle", label: "-₹250", risk: 5 },
  { type: "bad", value: -400, color: "#ea394c", icon: "warning", label: "-₹400", risk: 7 },
  // Blue: safe/low risk
  { type: "safe", value: 55, color: "#50aaff", icon: "shield-checkmark", label: "+₹55", risk: 1 },
  { type: "safe", value: 100, color: "#487dde", icon: "cloud-done", label: "+₹100", risk: 1 },
  // Gold: high risk/high reward
  { type: "gold", value: 1000, color: "#ffe06b", icon: "flame", label: "+₹1000", risk: 9 },
  { type: "gold", value: -500, color: "#ffd81a", icon: "flash-off", label: "-₹500", risk: 9 },
  // Powerups
  { type: "powerup", value: 0, color: "#c7a7ff", icon: "construct", label: "Bull", powerup: "bull" },
  { type: "powerup", value: 0, color: "#212074", icon: "thunderstorm", label: "Crash", powerup: "crash" },
  { type: "powerup", value: 0, color: "#56e6e1", icon: "snow", label: "Freeze", powerup: "freeze" },
  { type: "powerup", value: 0, color: "#eecef6", icon: "magnet", label: "Magnet", powerup: "magnet" },
  { type: "powerup", value: 0, color: "#f55cff", icon: "star", label: "x2", powerup: "multiplier" },
];

type Bubble = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  def: typeof BUBBLE_DEFINITIONS[0];
  movement: number;
  comboWave: number; // for movement/particle effects
  landed: boolean;
};

export default function InvestmentBubblePop({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(SESSION_DURATION);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [active, setActive] = useState(true);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [powerups, setPowerups] = useState<Partial<Record<PowerupType, boolean>>>({});
  const [powerMsg, setPowerMsg] = useState<string | null>(null);
  const [particle, setParticle] = useState<{ x: number; y: number; color: string; key: number } | null>(null);

  const idCounter = useRef(0);
  const bubbleTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const freezeTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const comboTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const playfieldRef = useRef<View>(null);

  // Bubble spawning
  useEffect(() => {
    if (!active) return;
    bubbleTimer.current = setInterval(() => {
      if (bubbles.length >= MAX_BUBBLES) return;
      const typ = Math.random();
      let def = null;
      if (powerups.crash)
        def = BUBBLE_DEFINITIONS.find((d) => d.type === "bad");
      else if (powerups.bull)
        def = BUBBLE_DEFINITIONS.find((d) => d.type === "good");
      else if (typ < 0.13)
        def = BUBBLE_DEFINITIONS.find((d) => d.type === "powerup");
      else if (typ > 0.91)
        def = BUBBLE_DEFINITIONS[8 + Math.floor(Math.random() * 2)];
      else if (typ > 0.8)
        def = BUBBLE_DEFINITIONS[3 + Math.floor(Math.random() * 3)];
      else if (typ > 0.6)
        def = BUBBLE_DEFINITIONS[Math.floor(Math.random() * 2)];
      else def = BUBBLE_DEFINITIONS[Math.floor(Math.random() * 9)];

      if (!def) return;
      const startX = Math.random() * (playWidth - BUBBLE_SIZE);
      const y = new Animated.Value(playHeight + 20);
      const x = new Animated.Value(startX);
      const scale = new Animated.Value(1);

      const up = Math.random() > 0.5;
      const comboWave = Math.round(Math.random() * 10);
      const id = idCounter.current++;

      // Movement variant: zigzag, bounce, curve, accelerate
      const mvVariant = Math.floor(Math.random() * 4);

      const bubble: Bubble = {
        id,
        x,
        y,
        scale,
        def,
        movement: mvVariant,
        comboWave,
        landed: false,
      };

      setBubbles((cur) => [...cur, bubble]);

      // Animate movement
      let xMotion: Animated.CompositeAnimation | null = null;
      if (mvVariant === 0) {
        xMotion = Animated.loop(
          Animated.sequence([
            Animated.timing(x, { toValue: Math.min(startX + 52, playWidth - BUBBLE_SIZE), duration: 1400, useNativeDriver: false }),
            Animated.timing(x, { toValue: Math.max(startX - 38, 0), duration: 1300, useNativeDriver: false }),
          ]), { iterations: 5 }
        );
      }
      if (mvVariant === 1) {
        xMotion = Animated.loop(
          Animated.timing(x, { toValue: Math.random() * (playWidth - BUBBLE_SIZE), duration: 1200, useNativeDriver: false }),
          { iterations: 7 }
        );
      }
      if (mvVariant === 2) {
        xMotion = Animated.loop(
          Animated.timing(x, { toValue: Math.random() * (playWidth - BUBBLE_SIZE), duration: 1000, useNativeDriver: false }),
          { iterations: 6 }
        );
      }
      if (mvVariant === 3) {
        xMotion = Animated.loop(
          Animated.timing(x, { toValue: Math.random() * (playWidth - BUBBLE_SIZE), duration: 1100, useNativeDriver: false }),
          { iterations: 8 }
        );
      }
      if (xMotion) xMotion.start();

      // Main up/falling
      Animated.timing(y, {
        toValue: -BUBBLE_SIZE - 12,
        duration: Math.max(1150, 2300 - Math.random() * 900 - (score / 18 + combo * 11)),
        useNativeDriver: false,
      }).start(() => {
        setBubbles((cur) => cur.map((b) => (b.id === id ? { ...b, landed: true } : b)));
      });
    }, INITIAL_BUBBLE_INTERVAL - Math.round(score / 12) - combo * 4);
    return () => bubbleTimer.current && clearInterval(bubbleTimer.current);
  }, [bubbles.length, score, combo, active, powerups.crash, powerups.bull]);

  // Session timer
  useEffect(() => {
    if (!active) return;
    if (time <= 0) {
      setActive(false);
      return;
    }
    sessionTimer.current = setTimeout(() => setTime(time - 1), 1000);
    return () => sessionTimer.current && clearTimeout(sessionTimer.current);
  }, [time, active]);

  // Tap to pop - ultra simple approach with debug logging
  function onPlayfieldPress(evt: GestureResponderEvent) {
    console.log("Touch event fired!", evt.nativeEvent);
    if (!active || powerups.freeze) {
      console.log("Game not active or frozen");
      return;
    }

    const { locationX, locationY } = evt.nativeEvent;
    console.log(`Touch at: ${locationX}, ${locationY}`);

    // Check all bubbles - extremely simple approach
    setBubbles((cur) => {
      let popped = false;
      return cur.map((b) => {
        if (!b.landed && !popped) {
          // Get current position values
          const bx = (b.x as any)._value || 0;
          const by = (b.y as any)._value || 0;

          console.log(`Bubble ${b.id} at: ${bx}, ${by}`);

          // Use extremely generous touch area to account for animation timing
          const bubbleLeft = bx - 30;
          const bubbleRight = bx + BUBBLE_SIZE + 30;
          // Make vertical touch area span most of the playfield for moving bubbles
          const bubbleTop = Math.max(0, playHeight - by - BUBBLE_SIZE - 100);
          const bubbleBottom = Math.min(playHeight, playHeight - by + 100);

          console.log(`Bubble bounds: ${bubbleLeft}-${bubbleRight}, ${bubbleTop}-${bubbleBottom}`);

          if (
            locationX >= bubbleLeft &&
            locationX <= bubbleRight &&
            locationY >= bubbleTop &&
            locationY <= bubbleBottom
          ) {
            console.log("BUBBLE HIT!", b.id);
            popped = true;

            // Particle effect
            setParticle({
              x: bx + BUBBLE_SIZE / 2,
              y: bubbleTop + BUBBLE_SIZE / 2,
              color: b.def.color,
              key: b.id
            });
            setTimeout(() => setParticle(null), 500);

            // Powerup logic
            if (b.def.type === "powerup" && b.def.powerup) {
              applyPowerup(b.def.powerup);
            } else {
              // Score/currency logic
              let val = b.def.value;
              let workedCombo = combo + (b.def.value > 0 ? 1 : 0);
              setScore((s) => s + Math.round(val * (powerups.multiplier ? 2 : 1)));
              setCombo(workedCombo > 1 ? workedCombo : 0);
              setMaxCombo((mc) => Math.max(mc, workedCombo));
              if (workedCombo) {
                if (comboTimer.current) clearTimeout(comboTimer.current);
                comboTimer.current = setTimeout(() => setCombo(0), 1850);
              }
              if (b.def.type === "gold") {
                setPowerMsg(val > 0 ? "High Risk, High Reward!" : "Market Crash!");
              }
              if (b.def.type === "bad") setPowerMsg("Investment Lost!");
              if (b.def.type === "good") setPowerMsg("Great pick!");
              if (b.def.type === "safe") setPowerMsg("Safe investment");
            }
            setTimeout(() => setPowerMsg(null), 980);

            // Bubble disappears
            return { ...b, landed: true };
          }
        }
        return b;
      });
    });
  }

  // Powerup logic
  function applyPowerup(type: PowerupType) {
    if (type === "bull") {
      setPowerups((cur) => ({ ...cur, bull: true }));
      setPowerMsg("Bull Market! All green!");
      setTimeout(() => setPowerups((cur) => ({ ...cur, bull: false })), 3700);
    }
    if (type === "crash") {
      setPowerups((cur) => ({ ...cur, crash: true }));
      setPowerMsg("Crash! High risk ahead!");
      setTimeout(() => setPowerups((cur) => ({ ...cur, crash: false })), 3700);
    }
    if (type === "freeze") {
      setPowerups((cur) => ({ ...cur, freeze: true }));
      setPowerMsg("Market Frozen");
      freezeTimer.current = setTimeout(() => {
        setPowerups((cur) => ({ ...cur, freeze: false }));
        setPowerMsg(null);
      }, 3700);
    }
    if (type === "magnet") {
      setPowerups((cur) => ({ ...cur, magnet: true }));
      setPowerMsg("Magnet active!");
      setTimeout(() => setPowerups((cur) => ({ ...cur, magnet: false })), 1700);
    }
    if (type === "multiplier") {
      setPowerups((cur) => ({ ...cur, multiplier: true }));
      setPowerMsg("Multiplier (x2) active!");
      setTimeout(() => setPowerups((cur) => ({ ...cur, multiplier: false })), 6000);
    }
  }

  // Remove landed bubbles
  useEffect(() => {
    if (!active) return;
    const cull = setInterval(() => {
      setBubbles((cur) => cur.filter((b) => !b.landed));
    }, 600);
    return () => clearInterval(cull);
  }, [active]);

  // End game feedback
  function restart() {
    setScore(0);
    setTime(SESSION_DURATION);
    setCombo(0);
    setMaxCombo(0);
    setActive(true);
    setBubbles([]);
    setPowerups({});
    setPowerMsg(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Investment Bubble Pop</Text>
      <View style={styles.infoBar}>
        <Ionicons name="timer-outline" size={21} color="#516bcd" />
        <Text style={styles.infoText}>{time}s</Text>
        <Ionicons name="wallet-outline" size={21} color="#41b54a" />
        <Text style={styles.infoText}>Score: {score}</Text>
        <Ionicons name="flame" size={21} color="#FFB200" />
        <Text style={styles.infoText}>Max Combo: {maxCombo}</Text>
      </View>
      <View
        style={[styles.playfield, { width: playWidth, height: playHeight }]}
        ref={playfieldRef}
        onStartShouldSetResponder={() => true}
        onResponderRelease={onPlayfieldPress}
      >
        {/* Animate and render bubbles */}
        {bubbles.map((bub) =>
          !bub.landed ? (
            <Animated.View
              key={bub.id}
              style={[
                styles.bubble,
                {
                  left: bub.x,
                  bottom: bub.y,
                  backgroundColor: bub.def.color,
                  shadowColor: bub.def.color,
                  elevation: 3 + (bub.def.risk ?? 0),
                  zIndex: 3,
                  transform: [{ scale: bub.scale }]
                },
              ]}
            >
              <Ionicons name={bub.def.icon as any} size={28} color="#333" />
              <Text style={styles.bubbleLabel}>{bub.def.label}</Text>
            </Animated.View>
          ) : null
        )}
        {/* Combo/score visual overlays */}
        {combo > 1 && (
          <View style={styles.comboBox}>
            <Ionicons name="sparkles-outline" size={27} color="#fbb019" />
            <Text style={styles.comboText}>{combo}x Combo!</Text>
          </View>
        )}
        {powerMsg && (
          <View style={styles.powerBox}>
            <Text style={styles.powerText}>{powerMsg}</Text>
          </View>
        )}
        {particle && (
          <Animated.View
            style={[
              styles.particle,
              {
                left: particle.x,
                bottom: particle.y,
                backgroundColor: particle.color,
                opacity: 0.65,
              },
            ]}
          />
        )}
      </View>
      {!active && (
        <View style={styles.endOverlay}>
          <Text style={styles.endText}>Investment Session</Text>
          <Text style={styles.resultText}>Final Score: {score}</Text>
          <Text style={styles.resultText}>
            Max Combo: <Text style={{ color: "#d08037" }}>{maxCombo}</Text>
          </Text>
          <TouchableOpacity style={styles.endBtn} onPress={restart}>
            <Ionicons name="reload-outline" size={22} color="#2769b0" />
            <Text style={{ marginLeft: 9, fontWeight: "bold" }}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.endBtn, { backgroundColor: "#f8c1c1" }]} onPress={onClose}>
            <Ionicons name="exit" size={22} color="#9d1d19" />
            <Text style={{ color: "#a41c1b", marginLeft: 12, fontWeight: "bold" }}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>
        Tap bubbles to invest (green/gold for profit, red = losses, blue = safe). Chaining good investments = combo!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fdfaf3",
    flex: 1,
    alignItems: "center",
    paddingTop: 18,
  },
  header: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1b4380",
    marginBottom: 3,
    letterSpacing: 0.13,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 5,
    gap: 7,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 7,
  },
  playfield: {
    backgroundColor: "#e4f5ff",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#b4deff",
    marginVertical: 7,
    position: "relative",
    overflow: "hidden",
    elevation: 9,
  },
  bubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.1,
    borderColor: "#e1e0df",
    shadowRadius: 13,
  },
  bubbleLabel: {
    color: "#2d2e1c",
    fontWeight: "800",
    fontSize: 15,
    marginTop: 5,
    textShadowColor: "#fff8",
    textShadowRadius: 1,
  },
  comboBox: {
    position: "absolute",
    top: "10%",
    left: "24%",
    zIndex: 200,
    flexDirection: "row",
    backgroundColor: "#fcfaee",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff5bb",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 5,
    elevation: 5,
  },
  comboText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6a000",
    marginLeft: 8,
  },
  powerBox: {
    position: "absolute",
    top: "18%",
    left: "18%",
    backgroundColor: "#fff5f5",
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ffe0c6",
    paddingVertical: 2,
    paddingHorizontal: 13,
    elevation: 3,
    zIndex: 320,
  },
  powerText: {
    fontWeight: "800",
    color: "#bc5614",
    fontSize: 16,
  },
  particle: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 28,
    opacity: 0.7,
    zIndex: 100,
    shadowColor: "#222",
    shadowRadius: 7,
  },
  endOverlay: {
    position: "absolute",
    top: "27%",
    left: "11%",
    width: "78%",
    backgroundColor: "#f7f8faee",
    borderRadius: 22,
    alignItems: "center",
    padding: 26,
    zIndex: 999,
    borderWidth: 1.5,
    borderColor: "#aad5e6",
    elevation: 9,
  },
  endText: {
    fontSize: 25,
    fontWeight: "900",
    color: "#bc5614",
    marginBottom: 12,
  },
  resultText: {
    fontSize: 17,
    marginBottom: 7,
    color: "#317c65",
    fontWeight: "bold",
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7edfc",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 24,
    marginTop: 13,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 2,
  },
  hint: {
    marginTop: 10,
    color: "#5d82b1",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 5,
  },
});
