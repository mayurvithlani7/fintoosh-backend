import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const COIN_DROP_INTERVAL = 800; // ms between new coins
const COIN_FALL_SPEED = 260; // px/sec
const COIN_SIZE = 36;
const JAR_WIDTH = 78;
const JAR_HEIGHT = 44;
const GAME_DURATION = 30; // seconds

const screenW = Dimensions.get("window").width;
const screenH = Dimensions.get("window").height;
const playAreaHeight = Math.min(screenH * 0.75, 400);

type Coin = {
  id: number;
  x: number;
  y: Animated.Value;
  caught: boolean;
};

export default function MoneyRainCatcher({
  onClose,
}: {
  onClose: () => void;
}) {
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [jarX, setJarX] = useState(screenW / 2 - JAR_WIDTH / 2);
  const [gameState, setGameState] = useState<"playing" | "over">("playing");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const coinIdCounter = useRef(0);
  const animTimer = useRef<any>();
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event: GestureResponderEvent, gesture: PanResponderGestureState) => true,
      onMoveShouldSetPanResponder: (event: GestureResponderEvent, gesture: PanResponderGestureState) => false,
      onPanResponderGrant: (event: GestureResponderEvent, gesture: PanResponderGestureState) => {},
      onPanResponderMove: (e: GestureResponderEvent, gesture: PanResponderGestureState) => {
        let pos = gesture.moveX - JAR_WIDTH / 2;
        pos = Math.max(0, Math.min(pos, screenW - JAR_WIDTH));
        setJarX(pos);
      },
      onPanResponderRelease: (event: GestureResponderEvent, gesture: PanResponderGestureState) => {},
    })
  ).current;

  // Drop new coins at intervals
  useEffect(() => {
    if (gameState !== "playing") return;
    const dropper = setInterval(() => {
      const x = Math.random() * (screenW - COIN_SIZE);
      const y = new Animated.Value(0);
      const id = coinIdCounter.current++;
      setCoins((curr) => [...curr, { id, x, y, caught: false }]);

      // Animate fall
      Animated.timing(y, {
        toValue: playAreaHeight - JAR_HEIGHT - COIN_SIZE,
        duration: ((playAreaHeight - JAR_HEIGHT - COIN_SIZE) / COIN_FALL_SPEED) * 1000,
        useNativeDriver: false,
      }).start();
    }, COIN_DROP_INTERVAL);
    return () => clearInterval(dropper);
  }, [gameState]);

  // Coin catch/check interval
  useEffect(() => {
    if (gameState !== "playing") return;
    animTimer.current = setInterval(() => {
      setCoins((curr) =>
        curr.map((coin) => {
          if (coin.caught) return coin;
          const currY = (coin.y as any)._value;
          if (
            currY >= playAreaHeight - JAR_HEIGHT - COIN_SIZE - 4 &&
            coin.x + COIN_SIZE > jarX &&
            coin.x < jarX + JAR_WIDTH
          ) {
            setScore((s) => s + 1);
            return { ...coin, caught: true };
          }
          return coin;
        })
      );
    }, 60);
    return () => clearInterval(animTimer.current);
  }, [jarX, gameState]);

  // Remove coins once past play area/caught
  useEffect(() => {
    if (gameState !== "playing") return;
    const cleaner = setInterval(() => {
      setCoins((curr) =>
        curr.filter(
          (coin) =>
            (coin.y as any)._value <
              playAreaHeight - JAR_HEIGHT - COIN_SIZE + 24 && !coin.caught
        )
      );
    }, 1200);
    return () => clearInterval(cleaner);
  }, [gameState]);

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      setGameState("over");
    } else {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, gameState]);

  function restart() {
    setScore(0);
    setCoins([]);
    setJarX(screenW / 2 - JAR_WIDTH / 2);
    setGameState("playing");
    setTimeLeft(GAME_DURATION);
    coinIdCounter.current = 0;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Money Rain Catcher</Text>
      <View style={styles.scoreBar}>
        <Ionicons name="cash-outline" size={20} color="#509925" />
        <Text style={styles.scoreText}> Score: {score} </Text>
        <Ionicons name="timer-outline" size={20} color="#336699" />
        <Text style={styles.timerText}>{timeLeft}s</Text>
      </View>

      <View
        style={[
          styles.playArea,
          { width: screenW, height: playAreaHeight },
        ]}
        {...panResponder.panHandlers}
      >
        {coins.map(
          (coin) =>
            !coin.caught && (
              <Animated.View
                key={coin.id}
                style={{
                  position: "absolute",
                  left: coin.x,
                  top: coin.y,
                  width: COIN_SIZE,
                  height: COIN_SIZE,
                  zIndex: 2,
                  opacity: 1,
                }}
              >
                <Ionicons
                  name="logo-bitcoin"
                  size={COIN_SIZE}
                  color="#f2b23a"
                  style={{ textShadowColor: "#905a0b", textShadowRadius: 2 }}
                />
              </Animated.View>
            )
        )}

        <View
          style={{
            position: "absolute",
            left: jarX,
            top: playAreaHeight - JAR_HEIGHT,
            width: JAR_WIDTH,
            height: JAR_HEIGHT,
            backgroundColor: "#fff7e0",
            borderColor: "#c9b166",
            borderWidth: 2,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3,
          }}
        >
          <Ionicons
            name="archive-outline"
            size={42}
            color="#ddae30"
            style={{ marginBottom: -7 }}
          />
          <Text style={{ fontSize: 15, color: "#705d15" }}>Jar</Text>
        </View>
      </View>

      {gameState === "over" && (
        <View style={styles.overlay}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScore}>Your Score: {score}</Text>
          <TouchableOpacity onPress={restart} style={styles.button}>
            <Ionicons name="reload-circle" size={36} color="#397b50" />
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.exitButton}>
            <Ionicons name="close-circle" size={34} color="#a12c2c" />
            <Text style={styles.buttonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.helpText}>
        Drag or tap to move the jar. Catch as many coins as you can!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#fbfaf5",
    paddingVertical: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6a9238",
    letterSpacing: 0.18,
    marginBottom: 0,
  },
  scoreBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
    gap: 8,
  },
  scoreText: {
    color: "#509925",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 6,
  },
  timerText: {
    fontWeight: "bold",
    color: "#336699",
    fontSize: 16,
    marginLeft: 3,
  },
  playArea: {
    position: "relative",
    backgroundColor: "#e3f5fb",
    borderRadius: 22,
    overflow: "hidden",
    marginVertical: 7,
    borderWidth: 2,
    borderColor: "#b6d4e1",
  },
  overlay: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    backgroundColor: "#fffbeaee",
    borderRadius: 18,
    alignItems: "center",
    padding: 24,
    zIndex: 100,
    borderWidth: 2,
    borderColor: "#cdb77e",
    elevation: 7,
  },
  gameOverText: {
    fontSize: 26,
    color: "#a12c2c",
    fontWeight: "bold",
    marginBottom: 12,
  },
  finalScore: {
    fontSize: 18,
    color: "#35797b",
    fontWeight: "600",
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3fcd3",
    padding: 11,
    borderRadius: 14,
    marginVertical: 6,
    paddingHorizontal: 18,
    elevation: 2,
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffe9e2",
    padding: 10,
    borderRadius: 14,
    marginTop: 7,
    paddingHorizontal: 18,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#397b50",
    marginLeft: 10,
  },
  helpText: {
    fontSize: 13,
    color: "#6097cc",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 2,
    fontStyle: "italic",
  },
});
