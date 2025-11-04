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

// Game Constants
const NETWORK_LEVELS = [
  // Level 1: Simple, Level 2+: Larger, more interconnected graphs
  [
    { id: "A", label: "School", x: 0.5, y: 0.17, color: "#f9dc5c", impact: 1.2 },
    { id: "B", label: "Meals", x: 0.17, y: 0.42, color: "#f67280", impact: 1.4 },
    { id: "C", label: "Clinic", x: 0.82, y: 0.39, color: "#345995", impact: 1.6 },
    { id: "D", label: "Trees", x: 0.24, y: 0.79, color: "#70c1b3", impact: 1.1 },
    { id: "E", label: "Clean Up", x: 0.8, y: 0.75, color: "#c06c84", impact: 1.3 },
  ],
  [
    // Level 2: add more, move some, new edges
    { id: "A", label: "School", x: 0.5, y: 0.12, color: "#f9dc5c", impact: 1.1 },
    { id: "B", label: "Meals", x: 0.11, y: 0.31, color: "#f67280", impact: 1.7 },
    { id: "C", label: "Clinic", x: 0.86, y: 0.33, color: "#345995", impact: 1.3 },
    { id: "D", label: "Trees", x: 0.21, y: 0.77, color: "#70c1b3", impact: 1.5 },
    { id: "E", label: "Clean Up", x: 0.8, y: 0.74, color: "#c06c84", impact: 1.5 },
    { id: "F", label: "Shelter", x: 0.5, y: 0.87, color: "#eccd72", impact: 2.0 },
  ],
];
const NETWORK_EDGES = [
  // Level 1
  [
    ["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"], ["D", "E"]
  ],
  // Level 2 (more edges)
  [
    ["A", "B"], ["A", "C"], ["A", "F"], ["B", "D"], ["C", "E"], ["E", "F"], ["D", "F"]
  ],
];

const INIT_RUPEES = 5;
const NODE_SIZE = 70;
const screenW = Dimensions.get("window").width;
const screenH = Dimensions.get("window").height;
const playW = Math.min(screenW - 32, 350);
const playH = Math.min(screenH * 0.56, 390);

type Node = {
  id: string;
  label: string;
  x: number; // 0-1 relative
  y: number;
  color: string;
  impact: number;
  received: boolean;
  powered?: boolean;
};

type Edge = [string, string];
type Transfer = { from: string; to: string; amount: number };

export default function CharityChainReaction({ onClose }: { onClose: () => void }) {
  const [level, setLevel] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [impact, setImpact] = useState(0);
  const [rupees, setRupees] = useState(INIT_RUPEES);
  const [dragId, setDragId] = useState<string | null>(null);
  const [victory, setVictory] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Setup network
  useEffect(() => {
    startLevel(level);
  }, [level]);

  function startLevel(lvl: number) {
    const n: Node[] = NETWORK_LEVELS[lvl].map((nd) => ({ ...nd, received: false }));
    setNodes(n);
    setEdges(NETWORK_EDGES[lvl] as Edge[]);
    setTransfers([]);
    setImpact(0);
    setRupees(INIT_RUPEES + lvl * 3);
    setDragId(null);
    setVictory(false);
    setMsg(null);
  }

  // Animate chain reaction
  function chainDonate(targetId: string, multiplier = 1) {
    // If already donated or victory: do nothing
    if (nodes.find((n) => n.id === targetId)?.received) return;
    let newN = nodes.map((n) =>
      n.id === targetId ? { ...n, received: true } : n
    );
    setNodes(newN);
    let gain = nodes.find((n) => n.id === targetId)!.impact * multiplier;
    setImpact((i) => i + gain);
    setTransfers((ts) => [...ts, { from: "drop", to: targetId, amount: gain }]);
    // Spread to children after timeout (chain effect)
    setTimeout(() => {
      let children = edges
        .filter(([a, b]) => a === targetId)
        .map(([, b]) => b)
        .filter((id) => !newN.find((n) => n.id === id)?.received);
      if (children.length === 0) return;
      children.forEach((child, idx) => {
        setTimeout(() => {
          chainDonate(child, multiplier * 0.85);
        }, 310 + idx * 60);
      });
    }, 430);
  }

  // Pan/drag rupee logic
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        setDragId("R-" + Date.now());
      },
      onPanResponderMove: () => {},
      onPanResponderRelease: (e: GestureResponderEvent, gesture: PanResponderGestureState) => {
        // If released over node, donate
        let { locationX, locationY } = e.nativeEvent;
        const rx = locationX / playW;
        const ry = locationY / playH;
        let found: Node | undefined;
        for (const n of nodes) {
          const dist = Math.sqrt(
            Math.pow(n.x * playW - rx * playW, 2) + Math.pow(n.y * playH - ry * playH, 2)
          );
          if (dist < NODE_SIZE * 0.62 && !n.received) {
            found = n;
            break;
          }
        }
        if (found && rupees > 0 && !victory) {
          setRupees((r) => r - 1);
          showMsg(`Donated to ${found.label}!`);
          chainDonate(found.id);
        }
        setDragId(null);
      },
    })
  ).current;

  // Victory detection
  useEffect(() => {
    if (
      nodes.length > 0 &&
      nodes.every((n) => n.received) &&
      !victory
    ) {
      setVictory(true);
      showMsg("Chain Complete! 🌟");
      setTimeout(() => setMsg(null), 1000);
    }
  }, [nodes, victory]);

  function nextLevel() {
    setLevel((l) => (l + 1) % NETWORK_LEVELS.length);
  }
  function restart() {
    startLevel(level);
  }
  function showMsg(txt: string) {
    setMsg(txt);
    setTimeout(() => setMsg(null), 1200);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Charity Chain Reaction</Text>
      <Text style={styles.subtitle}>See how your generosity spreads!</Text>
      <View style={styles.infoBar}>
        <Ionicons name="wallet" size={17} color="#caaa36" />
        <Text style={styles.infoText}>Rupees: {rupees}</Text>
        <Ionicons name="ribbon" size={17} color="#20be97" />
        <Text style={styles.infoText}>Impact: {Math.round(impact * 10) / 10}</Text>
        <Ionicons name="star" size={17} color="#fdc11a" />
        <Text style={styles.infoText}>Level: {level + 1}</Text>
      </View>
      <View
        style={[
          styles.field,
          { width: playW, height: playH },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Edges (behind nodes) */}
        {edges.map(([a, b], i) => {
          const from = nodes.find((n) => n.id === a);
          const to = nodes.find((n) => n.id === b);
          if (!from || !to) return null;
          return (
            <Animated.View
              key={i}
              style={[
                styles.edgeLine,
                {
                  left: from.x * playW + NODE_SIZE / 2 - 6,
                  top: from.y * playH + NODE_SIZE / 2 - 9,
                  width: Math.max(30, Math.abs(to.x - from.x) * playW),
                  height: Math.max(18, Math.abs(to.y - from.y) * playH),
                },
              ]}
            />
          );
        })}
        {/* Nodes (causes) */}
        {nodes.map((n, idx) => (
          <TouchableOpacity
            key={n.id}
            activeOpacity={n.received || victory || rupees === 0 ? 1 : 0.72}
            style={[
              styles.node,
              {
                left: n.x * playW,
                top: n.y * playH,
                backgroundColor: n.color,
                opacity: n.received ? 0.68 : 1.0,
                borderWidth: n.received ? 4 : 2,
                borderColor: n.received ? "#fff7cf" : "#fff",
              },
            ]}
            disabled={n.received || victory || rupees === 0}
            onPress={() => {
              if (!n.received && !victory && rupees > 0) {
                setRupees(r => r - 1);
                showMsg(`Donated to ${n.label}!`);
                chainDonate(n.id);
              }
            }}
          >
            <Ionicons
              name="heart"
              size={37}
              color={n.received ? "#b5acff" : "#d73363"}
              style={{ marginBottom: -7 }}
            />
            <Text style={styles.nodeLabel}>{n.label}</Text>
            <Text style={styles.nodeImpact}>+Impact</Text>
          </TouchableOpacity>
        ))}
        {/* Drag rupee */}
        {dragId && (
          <Animated.View
            style={[
              styles.rupee,
              {
                left: playW / 2 - 24,
                top: playH / 2 - 24,
                opacity: 0.87,
              },
            ]}
          >
            <Ionicons name="cash" size={46} color="#ebba25" />
          </Animated.View>
        )}
      </View>
      {/* Donation rupee (start drag) */}
      {!victory && rupees > 0 && (
        <View style={styles.rupeeTray}>
          <View style={styles.rupeeBtn}>
            <Ionicons name="cash" size={35} color="#ebba25" />
            <Text style={styles.rupeeText}>Drag to donate!</Text>
          </View>
        </View>
      )}
      {msg && (
        <View style={styles.msgBox}>
          <Ionicons name="sparkles" size={17} color="#c078ff" />
          <Text style={styles.msgText}>{msg}</Text>
        </View>
      )}
      {victory && (
        <View style={styles.modal}>
          <Text style={styles.modalMain}>Charity Chain Complete!</Text>
          <Text style={styles.modalInf}>Total Impact: {Math.round(impact * 10) / 10}</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={nextLevel}>
            <Ionicons name="arrow-forward" size={22} color="#219a6b" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 9 }}>
              Next Level
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#fbecd5" }]}
            onPress={onClose}
          >
            <Ionicons name="exit-outline" size={22} color="#b76320" />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                color: "#ad8422",
                marginLeft: 7,
              }}
            >
              Back to Games
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>
        Drag rupee to a cause to start a chain! See how your generosity multiplies across the network.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fcf7ee",
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7e5f26",
    marginBottom: 1,
    letterSpacing: 0.14,
  },
  subtitle: {
    color: "#9b8b67",
    fontSize: 14,
    marginBottom: 1,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    marginBottom: 2,
    gap: 9,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "600",
  },
  field: {
    backgroundColor: "#fefae5",
    borderRadius: 19,
    alignSelf: "center",
    marginVertical: 9,
    elevation: 7,
    position: "relative",
    overflow: "hidden",
  },
  node: {
    position: "absolute",
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#fff",
    elevation: 3,
  },
  nodeLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#563522",
    marginTop: -2,
  },
  nodeImpact: {
    fontSize: 10,
    color: "#6d813b",
    marginTop: -1,
    fontStyle: "italic",
  },
  edgeLine: {
    position: "absolute",
    height: 4,
    backgroundColor: "#ddbf76",
    borderRadius: 2,
    opacity: 0.24,
    zIndex: 2,
  },
  rupeeTray: {
    marginTop: 12,
    marginBottom: 0,
    alignItems: "center",
  },
  rupeeBtn: {
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#fff5db",
    borderRadius: 19,
    padding: 13,
    elevation: 2,
    shadowColor: "#ecc30b",
    shadowRadius: 7,
  },
  rupeeText: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 12,
    color: "#b38c27",
  },
  rupee: {
    position: "absolute",
    width: 48,
    height: 48,
    zIndex: 100,
  },
  msgBox: {
    position: "absolute",
    left: "17%",
    top: "9%",
    backgroundColor: "#ede1fb",
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0d8f6",
    zIndex: 81,
  },
  msgText: {
    color: "#a38aec",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 7,
  },
  modal: {
    position: "absolute",
    top: "27%",
    left: "16%",
    width: "68%",
    backgroundColor: "#fbffe8ee",
    borderRadius: 20,
    alignItems: "center",
    padding: 29,
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#b09d73",
    elevation: 9,
  },
  modalMain: {
    fontSize: 23,
    color: "#a69733",
    fontWeight: "900",
    marginBottom: 9,
  },
  modalInf: {
    fontSize: 15,
    marginBottom: 8,
    color: "#315f23",
    fontWeight: "bold",
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ebfae4",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 13,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 4,
  },
  hint: {
    marginTop: 8,
    color: "#ba9938",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 2,
  },
});
