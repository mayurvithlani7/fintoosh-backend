import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateAchievementProgress } from "./AchievementSystem";

// Coin denominations and coloring
const COINS = [
  { value: 1, color: "#eee5c0" },
  { value: 2, color: "#d6d7e6" },
  { value: 5, color: "#efcccb" },
  { value: 10, color: "#f2e6b2" },
  { value: 20, color: "#d1ecdd" },
];

const CARD_SIZE = 64;
const GRID_SIZE = 4;
const MATCH_DELAY = 800;
const screenW = Dimensions.get("window").width;
const gridPad = 8;
const playWidth = Math.min(screenW - 32, GRID_SIZE * (CARD_SIZE + gridPad)) + gridPad;

type Card = {
  id: number;
  coin: { value: number; color: string };
  flipped: boolean;
  matched: boolean;
  anim: Animated.Value;
};

function shuffle<T>(array: T[]): T[] {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CoinMatchingFrenzy({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  // Game setup
  useEffect(() => {
    startGame();
  }, []);

  function startGame() {
    let pairs: Card[] = [];
    let idx = 0;
    // Create exactly 8 pairs (16 cards total for 4x4 grid)
    const numPairs = (GRID_SIZE * GRID_SIZE) / 2; // 8 pairs

    // Create pairs by repeating each coin type multiple times to fill the grid
    for (let i = 0; i < numPairs; i++) {
      let coinIndex = i % COINS.length; // Cycle through available coins
      let c = COINS[coinIndex];

      // Add two cards with the same coin (a pair)
      pairs.push({
        id: idx++,
        coin: c,
        flipped: false,
        matched: false,
        anim: new Animated.Value(0),
      });
      pairs.push({
        id: idx++,
        coin: c,
        flipped: false,
        matched: false,
        anim: new Animated.Value(0),
      });
    }

    let deck = shuffle(pairs);
    setCards(deck);
    setFlipped([]);
    setMatchedCount(0);
    setMoves(0);
    setStartTime(new Date());
    setEndTime(null);
    setBusy(false);
  }

  // Flip and match logic
  function flipCard(idx: number) {
    if (busy || cards[idx].flipped || cards[idx].matched || flipped.length === 2) return;
    let nCards = cards.slice();
    nCards[idx].flipped = true;
    Animated.timing(nCards[idx].anim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();

    const newFlipped = [...flipped, idx];
    setCards(nCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setBusy(true);
      setTimeout(() => {
        const [i1, i2] = newFlipped;
        if (
          cards[i1].coin.value === cards[i2].coin.value &&
          i1 !== i2
        ) {
          // Matched
          let afterMatch = cards.slice();
          afterMatch[i1].matched = true;
          afterMatch[i2].matched = true;
          setCards(afterMatch);
          setMatchedCount((c) => c + 1);
        } else {
          // Miss, unflip
          let afterMiss = cards.slice();
          Animated.timing(afterMiss[i1].anim, {
            toValue: 0,
            duration: 320,
            useNativeDriver: false,
          }).start();
          Animated.timing(afterMiss[i2].anim, {
            toValue: 0,
            duration: 320,
            useNativeDriver: false,
          }).start();
          afterMiss[i1].flipped = false;
          afterMiss[i2].flipped = false;
          setCards(afterMiss);
        }
        setFlipped([]);
        setBusy(false);
      }, MATCH_DELAY);
    }
  }

  useEffect(() => {
    // End condition: GRID_SIZE * GRID_SIZE / 2 pairs
    if (matchedCount === (GRID_SIZE * GRID_SIZE) / 2 && !endTime) {
      setEndTime(new Date());
      // Update achievement for completing a game
      updateAchievementProgress('game-completed', 1).catch((error: unknown) => {
        console.error('Error updating game achievement:', error);
      });
    }
  }, [matchedCount, endTime]);

  // Time formatting
  function formatDuration(start: Date, end: Date) {
    let ms = Math.max(0, end.getTime() - start.getTime());
    let s = Math.floor(ms / 1000);
    let min = Math.floor(s / 60);
    s = s % 60;
    let cs = Math.floor((ms % 1000) / 10);
    return `${min}:${s < 10 ? "0" : ""}${s}.${cs < 10 ? "0" : ""}${cs}`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coin Matching Frenzy</Text>
      <Text style={styles.subtitle}>Match pairs of INR coins!</Text>
      <View style={styles.infoBar}>
        <Ionicons name="rocket" size={15} color="#bc841f" />
        <Text style={styles.infoVal}> Moves: {moves} </Text>
        <Ionicons name="alarm" size={15} color="#5a91eb" />
        <Text style={styles.infoVal}>
          Time:{" "}
          {startTime && endTime
            ? formatDuration(startTime, endTime)
            : startTime && !endTime
            ? formatDuration(startTime, new Date())
            : "--"}
        </Text>
      </View>
      <View
        style={[
          styles.grid,
          { width: playWidth, height: GRID_SIZE * (CARD_SIZE + gridPad) + gridPad },
        ]}
      >
        {cards.map((card, idx) => {
          // Card flip: interpolate rotation and color
          const rotateY = card.anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "180deg"],
          });
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                {
                  left: (idx % GRID_SIZE) * (CARD_SIZE + gridPad) + gridPad,
                  top:
                    Math.floor(idx / GRID_SIZE) * (CARD_SIZE + gridPad) +
                    gridPad,
                },
              ]}
              activeOpacity={0.95}
              disabled={card.flipped || card.matched || busy || endTime !== null}
              onPress={() => flipCard(idx)}
            >
              <Animated.View
                style={[
                  styles.cardFlip,
                  {
                    transform: [{ rotateY }],
                    backgroundColor: card.flipped || card.matched ? card.coin.color : "#d1d3b7",
                  },
                ]}
              >
                {card.flipped || card.matched ? (
                  <View style={styles.coinFace}>
                    <Ionicons
                      name="ellipse"
                      size={CARD_SIZE * 0.77}
                      color="#ffffff"
                      style={styles.coinEllipse}
                    />
                    <Text style={styles.coinText}>₹{card.coin.value}</Text>
                  </View>
                ) : (
                  <View style={styles.cardBack}>
                    <Ionicons
                      name="help-circle-outline"
                      size={CARD_SIZE * 0.7}
                      color="#b0b8b2"
                    />
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
      {endTime && (
        <View style={styles.modal}>
          <Text style={styles.modalWin}>All Coins Matched!</Text>
          <Text style={styles.modalStats}>Moves: {moves}</Text>
          <Text style={styles.modalStats}>
            Time: {startTime && endTime ? formatDuration(startTime, endTime) : "--"}
          </Text>
          <TouchableOpacity style={styles.modalBtn} onPress={startGame}>
            <Ionicons name="reload" size={21} color="#337bb5" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 8 }}>
              Play Again
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#fbffe4" }]}
            onPress={onClose}
          >
            <Ionicons name="exit-outline" size={21} color="#94742d" />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                color: "#ac9720",
                marginLeft: 8,
              }}
            >
              Back to Games
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>
        Tap two cards to flip. Match all rupee pairs with few moves and fastest time!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#eeeae0",
    flex: 1,
    alignItems: "center",
    paddingTop: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2b5c96",
    marginBottom: 1,
    letterSpacing: 0.14,
  },
  subtitle: {
    color: "#7a8066",
    fontSize: 14,
    marginBottom: 1,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    marginBottom: 2,
    gap: 7,
  },
  infoVal: {
    fontSize: 15,
    fontWeight: "600",
  },
  grid: {
    backgroundColor: "#e4f1e8",
    borderRadius: 21,
    borderWidth: 2.5,
    borderColor: "#c3eddf",
    position: "relative",
    alignSelf: "center",
    marginVertical: 12,
    elevation: 6,
  },
  card: {
    position: "absolute",
    width: CARD_SIZE,
    height: CARD_SIZE,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFlip: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#fcffe3",
    elevation: 2,
    backfaceVisibility: "hidden",
  },
  coinFace: {
    position: "absolute",
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  cardBack: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  coinEllipse: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.76,
  },
  coinText: {
    fontSize: 21,
    color: "#454100",
    fontWeight: "bold",
    textShadowColor: "#fff8",
    textShadowRadius: 1,
    letterSpacing: 0.7,
    zIndex: 5,
  },
  modal: {
    position: "absolute",
    top: "27%",
    left: "12%",
    width: "76%",
    backgroundColor: "#f6ffe0ee",
    borderRadius: 20,
    alignItems: "center",
    padding: 28,
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#9ede92",
    elevation: 8,
  },
  modalWin: {
    fontSize: 25,
    color: "#92bb43",
    fontWeight: "900",
    marginBottom: 10,
  },
  modalStats: {
    fontSize: 16,
    marginBottom: 8,
    color: "#2f8546",
    fontWeight: "bold",
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#cbeefb",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 30,
    marginTop: 12,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 3,
  },
  hint: {
    marginTop: 7,
    color: "#6a8247",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 2,
  },
});
