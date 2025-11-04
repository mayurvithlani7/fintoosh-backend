import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MagicPiggyBank({ onClose }: { onClose: () => void }) {
  const [balance, setBalance] = useState(0);
  const [added, setAdded] = useState(0);
  const [goal, setGoal] = useState(200);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("Tap the piggy bank to add coins! Learn how savings grow over time.");

  function addCoin() {
    const amount = Math.floor(Math.random() * 15) + 5;
    const newBalance = balance + amount;
    setBalance(newBalance);
    setAdded(added + 1);

    if (newBalance >= goal) {
      setLevel(level + 1);
      setGoal(goal + 200);
      setBalance(0);
      setAdded(0);
      setMessage(`Amazing! You reached Level ${level + 1}! Your piggy evolved! 🎉`);
      setTimeout(() => setMessage("Tap the piggy bank to add coins! Learn how savings grow over time."), 3000);
    } else {
      setMessage(`Your piggy got ₹${amount}! Keep saving... Total: ₹${newBalance}`);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐷 Magic Piggy Bank</Text>
        <Text style={styles.subtitle}>Watch your savings grow magically!</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>Level: {level}</Text>
        <Text style={styles.statText}>Goal: ₹{goal}</Text>
        <Text style={styles.statText}>Taps: {added}</Text>
      </View>

      <Text style={styles.balance}>₹{balance}</Text>

      <TouchableOpacity
        style={styles.piggyBank}
        onPress={addCoin}
        activeOpacity={0.8}
      >
        <Ionicons name="cash" size={60} color="#ebba25" />
        <Text style={styles.piggyEmoji}>🐷</Text>
        <Text style={styles.tapText}>TAP ME!</Text>
      </TouchableOpacity>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min((balance / goal) * 100, 100)}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {balance >= goal ? "🎉 Goal Reached!" : `${balance}/${goal} rupees saved`}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 What You're Learning:</Text>
        <Text style={styles.infoText}>
          • Consistent saving adds up over time{'\n'}
          • Setting goals helps you stay motivated{'\n'}
          • Small amounts grow into bigger savings{'\n'}
          • Patience and discipline pay off!
        </Text>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="exit-outline" size={20} color="#666" />
        <Text style={styles.closeText}>Back to Games</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff5e6",
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
    color: "#d2691e",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#8b4513",
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    backgroundColor: "#ffe4b5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  balance: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#228b22",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  piggyBank: {
    width: 150,
    height: 150,
    backgroundColor: "#ffb347",
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 4,
    borderColor: "#ff8c00",
    position: "relative",
  },
  piggyEmoji: {
    fontSize: 40,
    position: "absolute",
    top: 10,
  },
  tapText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 10,
  },
  message: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
    minHeight: 40,
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
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
    backgroundColor: "#27ae60",
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#e8f5e8",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    width: "100%",
    borderWidth: 2,
    borderColor: "#d5e8d5",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
    marginTop: 10,
  },
  closeText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
