import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Game Constants
const STOCKS = [
  { name: "Tech Startup", color: "#14a3e2", vol: 0.8 },
  { name: "Steady Bank", color: "#6ed073", vol: 0.34 },
  { name: "CryptoCoin", color: "#ede32c", vol: 1.1 },
  { name: "Wild Penny", color: "#fb5c43", vol: 2.0 },
];
const START_BALANCE = 5000;
const TICK_MS = 650;
const ROUND_SECS = 75;
const CHART_POINTS = 28;
const PRICE_BASE = [100, 120, 250, 10];
const MARKET_EVENTS = [
  { type: "bull", label: "Bull Run", color: "#b6e245", effect: [0.9, 0.5, 1.3, 2.5] },
  { type: "bear", label: "Bear Crash", color: "#ef5555", effect: [-0.8, -0.7, -1.1, -2.2] },
  { type: "boom", label: "Super Boom", color: "#fbd427", effect: [1.5, 1.2, 2.2, 4.3] },
  { type: "flash", label: "Flash Crash", color: "#bc84d4", effect: [-2.3, -1.1, -5.1, -3.4] },
  { type: "earnings", label: "Earnings Surprise", color: "#69d9ad", effect: [2.5, 0, 1.7, 0] }
];
const { width, height } = Dimensions.get("window");
const GAME_MODAL_HEIGHT = Math.min(height * 0.85, 600);
const screenW = width;
const chartW = Math.min(screenW - 30, 340);

type Holding = { qty: number; cost: number; sale: number | null };
type PriceHistory = number[];

type Powerups = { freeze: boolean; peek: boolean; multiplier: boolean; };

export default function MarketRollercoaster({ onClose }: { onClose: () => void }) {
  const [balances, setBalances] = useState<number[]>(STOCKS.map(() => 0));
  const [holdings, setHoldings] = useState<Holding[]>(
    STOCKS.map(() => ({ qty: 0, cost: 0, sale: null }))
  );
  const [prices, setPrices] = useState<PriceHistory[]>(
    PRICE_BASE.map((p) => Array(CHART_POINTS).fill(p))
  );
  const [funds, setFunds] = useState(START_BALANCE);
  const [tick, setTick] = useState(0);
  const [timer, setTimer] = useState(ROUND_SECS);
  const [profits, setProfits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [event, setEvent] = useState<{ label: string; color: string } | null>(null);
  const [power, setPower] = useState<Powerups>({ freeze: false, peek: false, multiplier: false });
  const [achievement, setAchievement] = useState<string | null>(null);
  const [end, setEnd] = useState(false);

  const tickTimer = useRef<NodeJS.Timeout>();
  const roundTimer = useRef<NodeJS.Timeout>();
  const powerTimers = useRef<{ [k: string]: NodeJS.Timeout | undefined }>({});

  // Main ticker for price and game progression
  useEffect(() => {
    if (end) return;
    if (timer <= 0) {
      setEnd(true);
      return;
    }
    roundTimer.current = setTimeout(() => setTimer((t) => t - 1), 1000);

    tickTimer.current = setTimeout(() => {
      setTick((t) => t + 1);
      // Market event randomizer
      let evt =
        Math.random() < 0.11
          ? MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)]
          : null;

      // Pricing logic
      setPrices((oldPrices) => {
        return oldPrices.map((arr, sIdx) => {
          let lastP = arr[arr.length - 1];
          let baseFluct = (Math.random() - 0.5) * STOCKS[sIdx].vol * (evt ? 2.0 : 1.0) * 10;
          let eventFluct = evt ? (evt.effect[sIdx] ?? 0) * (Math.random() + 0.5) : 0;
          let next = Math.max(
            4,
            lastP +
              baseFluct +
              eventFluct +
              (power.freeze ? 0 : 0) +
              Math.sin((tick + sIdx) / 9.1) * 3
          );
          return arr.slice(1).concat([next]);
        });
      });
      if (evt) {
        setEvent({ label: evt.label, color: evt.color });
        setTimeout(() => setEvent(null), 2300);
      }
    }, power.freeze ? TICK_MS * 7 : TICK_MS);
    return () => {
      if (tickTimer.current) clearTimeout(tickTimer.current);
      if (roundTimer.current) clearTimeout(roundTimer.current);
    };
    // eslint-disable-next-line
  }, [tick, power, end, timer]);

  // Powerup usage
  function powerUse(type: keyof Powerups) {
    setPower((curr) => ({ ...curr, [type]: true }));
    if (powerTimers.current[type]) clearTimeout(powerTimers.current[type]);
    powerTimers.current[type] = setTimeout(() => {
      setPower((curr) => ({ ...curr, [type]: false }));
    }, type === "multiplier" ? 6400 : 3600);
  }

  // Buy/Sell logic
  function buyStock(sIdx: number) {
    if (funds < prices[sIdx][prices[sIdx].length - 1]) return;
    let price = prices[sIdx][prices[sIdx].length - 1];
    setHoldings((h) =>
      h.map((val, idx) =>
        idx === sIdx
          ? {
              qty: val.qty + 1,
              cost: (val.cost * val.qty + price) / (val.qty + 1),
              sale: null
            }
          : val
      )
    );
    setFunds((f) => Math.max(0, f - price));
    setAchievement("Buy!");
    setTimeout(() => setAchievement(null), 700);
  }

  function sellStock(sIdx: number) {
    if (!holdings[sIdx].qty) return;
    let price = prices[sIdx][prices[sIdx].length - 1];
    let profit = price - holdings[sIdx].cost;
    let realProfit = power.multiplier ? profit * 2 : profit;
    setFunds((f) => f + price);
    setHoldings((h) =>
      h.map((val, idx) =>
        idx === sIdx
          ? { qty: Math.max(0, val.qty - 1), cost: val.cost, sale: price }
          : val
      )
    );
    setProfits((p) => p + realProfit);
    if (realProfit > 160) {
      setCombo((c) => {
        setAchievement("Perfect Timing! (Combo!)");
        return c + 1;
      });
      setTimeout(() => setAchievement(null), 1100);
    } else {
      setCombo(0);
      setAchievement("Sale!");
      setTimeout(() => setAchievement(null), 900);
    }
  }

  function restart() {
    setHoldings(() =>
      STOCKS.map(() => ({ qty: 0, cost: 0, sale: null }))
    );
    setBalances(STOCKS.map(() => 0));
    setProfits(0);
    setFunds(START_BALANCE);
    setTimer(ROUND_SECS);
    setTick(0);
    setCombo(0);
    setPower({ freeze: false, peek: false, multiplier: false });
    setEvent(null);
    setAchievement(null);
    setEnd(false);
  }

  // Chart rendering helper (returns React Native View-based line chart)
  function renderChartLine(points: number[], color: string, width: number, height: number) {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const xStep = width / (points.length - 1);
    const range = max - min || 1;

    // Create line segments
    const segments = [];
    for (let i = 1; i < points.length; i++) {
      const x1 = (i - 1) * xStep;
      const y1 = height - ((points[i - 1] - min) / range) * (height - 12) - 6;
      const x2 = i * xStep;
      const y2 = height - ((points[i] - min) / range) * (height - 12) - 6;

      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

      segments.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            left: x1,
            top: y1,
            width: length,
            height: 3,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: '0 0',
          }}
        />
      );
    }

    return (
      <View style={{ position: "absolute", left: 0, top: 0, width, height }}>
        {segments}
      </View>
    );
  }

  // Powerup buttons
  function renderPowerups() {
    return (
      <View style={styles.powerBar}>
        <TouchableOpacity
          style={[
            styles.powBtn,
            power.freeze && { backgroundColor: "#d6edff" }
          ]}
          onPress={() => powerUse("freeze")}
        >
          <Ionicons name="pause-circle" size={23} color="#2b6bee" />
          <Text style={styles.powText}>Freeze</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.powBtn,
            power.peek && { backgroundColor: "#f6ece7" }
          ]}
          onPress={() => powerUse("peek")}
        >
          <Ionicons name="eye" size={23} color="#d69825" />
          <Text style={styles.powText}>Peek</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.powBtn,
            power.multiplier && { backgroundColor: "#fff3cc" }
          ]}
          onPress={() => powerUse("multiplier")}
        >
          <Ionicons name="flash" size={23} color="#d7b112" />
          <Text style={styles.powText}>x2</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#e7f1ff" }}
      contentContainerStyle={{
        paddingTop: 22,
        paddingHorizontal: 20,
        paddingBottom: 120,
        alignItems: "center",
        minHeight: GAME_MODAL_HEIGHT + 200
      }}
      showsVerticalScrollIndicator={true}
      bounces={true}
      scrollEnabled={true}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Market Rollercoaster</Text>
        <Text style={styles.subtitle}>
          Ride the charts, buy low, sell high, and master the waves!
        </Text>
      <View style={styles.infoBar}>
        <Ionicons name="alarm" size={18} color="#2b6bee" />
        <Text style={styles.infoText}> {timer}s </Text>
        <Ionicons name="wallet" size={18} color="#4e8723" />
        <Text style={styles.infoText}>₹{Math.round(funds)}</Text>
        <Ionicons name="analytics" size={18} color="#c19c0e" />
        <Text style={styles.infoText}>Profit: {Math.round(profits)}</Text>
        <Ionicons name="star" size={18} color="#fa9a14" />
        <Text style={styles.infoText}>Combo: {combo}</Text>
      </View>
      {renderPowerups()}
      {event && (
        <View style={[styles.eventBar, { backgroundColor: event.color + "cc" }]}>
          <Ionicons name="rocket" size={22} color="#fff" />
          <Text style={styles.eventText}>{event.label}</Text>
        </View>
      )}
      <View style={styles.chartsWrap}>
        {STOCKS.map((stock, idx) => (
          <View
            key={stock.name}
            style={[styles.chartBox, { backgroundColor: stock.color + "10" }]}
          >
            <Text style={styles.stockName}>{stock.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="trending-up" size={16} color={stock.color} />
              <Text style={styles.stockPrice}>
                ₹{Math.round(prices[idx][prices[idx].length - 1])}
              </Text>
            </View>
            <View style={{ flex: 1, marginTop: 3 }}>
              {renderChartLine(prices[idx], stock.color, chartW / 1.15, 69)}
              {power.peek && (
                <View
                  style={{
                    position: "absolute",
                    left: chartW / 2.1,
                    width: 55,
                    top: 25,
                    backgroundColor: "#fffc705e",
                    borderRadius: 9,
                    padding: 5,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#e58e23", fontWeight: "bold" }}>
                    Next: ₹
                    {Math.round(
                      prices[idx][prices[idx].length - 1] + (Math.random() - 0.5) * 29
                    )}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[
                  styles.buyBtn,
                  {
                    backgroundColor: "#d7fde4",
                  },
                ]}
                onPress={() => buyStock(idx)}
                disabled={end || funds < prices[idx][prices[idx].length - 1]}
              >
                <Ionicons name="trending-up" size={18} color="#2ae255" />
                <Text style={{ fontWeight: "bold", marginLeft: 6 }}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sellBtn,
                  {
                    backgroundColor: "#fff7e1",
                  },
                ]}
                onPress={() => sellStock(idx)}
                disabled={end || holdings[idx].qty === 0}
              >
                <Ionicons name="trending-down" size={18} color="#e25819" />
                <Text style={{ fontWeight: "bold", marginLeft: 6 }}>Sell</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      {achievement && (
        <View style={styles.achieveBox}>
          <Ionicons name="trophy" size={21} color="#ffe073" />
          <Text style={styles.achieveText}>{achievement}</Text>
        </View>
      )}
      {end && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>
            {profits > 700 ? "Market Master!" : profits > 0 ? "Well Done!" : "Try Again!"}
          </Text>
          <Text style={styles.modalInfo}>Final Profit: ₹{Math.round(profits)}</Text>
          <Text style={styles.modalInfo}>Combo: {combo}</Text>
          <TouchableOpacity style={styles.btnRow} onPress={restart}>
            <Ionicons name="reload" size={21} color="#396aad" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 7 }}>
              Trade Again
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnRow, { backgroundColor: "#fff7e1" }]}
            onPress={onClose}
          >
            <Ionicons name="exit-outline" size={21} color="#816b38" />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                color: "#bc9c34",
                marginLeft: 7,
              }}
            >
              Back to Games
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>
        Buy low, sell high, use powerups and combos. Can you ride the market to riches?
      </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e7f1ff",
    flex: 1,
    alignItems: "center",
    paddingTop: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0d4f8e",
    marginBottom: 0,
    letterSpacing: 0.14,
  },
  subtitle: {
    color: "#57697d",
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
  infoText: {
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: 6,
  },
  chartsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "98%",
    marginTop: 12,
    marginBottom: 14,
  },
  chartBox: {
    margin: 10,
    borderRadius: 17,
    padding: 12,
    width: chartW,
    backgroundColor: "#fff5",
    elevation: 4,
    alignItems: "flex-start",
    height: 142,
    shadowColor: "#5b7aaf",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.09,
    shadowRadius: 4,
    borderWidth: 1.2,
    borderColor: "#ced8e5",
  },
  stockName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#50597a",
    letterSpacing: 0.12,
    marginBottom: 1,
  },
  stockPrice: {
    color: "#10497a",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 4,
  },
  actionBar: {
    flexDirection: "row",
    marginTop: 6,
    gap: 13,
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  buyBtn: {
    backgroundColor: "#e7fbd1",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 20,
    marginLeft: 0,
    gap: 5,
    elevation: 2,
  },
  sellBtn: {
    backgroundColor: "#fde8df",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 20,
    marginLeft: 0,
    gap: 5,
    elevation: 2,
  },
  powerBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 2,
    gap: 8,
    width: "100%"
  },
  powBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: "#eaf6fa",
    borderRadius: 13,
    gap: 7,
    borderWidth: 1,
    borderColor: "#d7e7ec",
    elevation: 1.1,
  },
  powText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#234f64",
    marginLeft: 2,
  },
  eventBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 13,
    borderWidth: 1.4,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginVertical: 4,
    elevation: 2,
    gap: 7,
  },
  eventText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 5,
  },
  achieveBox: {
    position: "absolute",
    left: "22%",
    top: "8%",
    backgroundColor: "#fffbe7",
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 23,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    borderWidth: 1,
    borderColor: "#fff0bc",
    zIndex: 171
  },
  achieveText: {
    color: "#fac155",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 10,
  },
  modal: {
    position: "absolute",
    top: "27%",
    left: "12%",
    width: "78%",
    backgroundColor: "#eaeef7ee",
    borderRadius: 20,
    alignItems: "center",
    padding: 29,
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#9ecae2",
    elevation: 9,
  },
  modalTitle: {
    fontSize: 25,
    color: "#3c9d4e",
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center"
  },
  modalInfo: {
    fontSize: 16,
    marginBottom: 8,
    color: "#0b3446",
    fontWeight: "bold",
    textAlign: "center"
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d0e9fc",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 30,
    marginTop: 13,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 4,
  },
  hint: {
    marginTop: 7,
    color: "#3382ae",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 2,
  }
});
