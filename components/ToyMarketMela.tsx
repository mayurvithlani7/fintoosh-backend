import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

type Toy = {
  name: string;
  emoji: string;
  basePrice: number;
  currentPrice: number;
  owned: number;
  trend: '📈' | '📉' | '➡️';
  description: string;
};

type MarketEvent = {
  title: string;
  description: string;
  effects: { [toyIndex: number]: number };
  icon: string;
};

const INITIAL_TOYS: Omit<Toy, 'currentPrice' | 'owned' | 'trend'>[] = [
  {
    name: "Cricket Bat",
    emoji: "🏏",
    basePrice: 45,
    description: "Sports champion's choice"
  },
  {
    name: "Ludo Game",
    emoji: "🎲",
    basePrice: 35,
    description: "Classic family game"
  },
  {
    name: "Spinning Top",
    emoji: "🌀",
    basePrice: 18,
    description: "Traditional toy favorite"
  },
  {
    name: "Dancing Doll",
    emoji: "🪆",
    basePrice: 50,
    description: "Magical moving doll"
  },
];

const MARKET_EVENTS: MarketEvent[] = [
  {
    title: "🏏 IPL Fever!",
    description: "Cricket season boosts sports toys!",
    effects: { 0: 40, 1: 10, 2: 5, 3: -5 },
    icon: "🏏"
  },
  {
    title: "🌧️ Rainy Weather",
    description: "Outdoor toys less popular today",
    effects: { 0: -25, 1: -10, 2: -15, 3: 15 },
    icon: "🌧️"
  },
  {
    title: "🎭 Game Festival",
    description: "Board games trending high!",
    effects: { 0: -5, 1: 35, 2: 10, 3: 5 },
    icon: "🎲"
  },
  {
    title: "🎪 Mela Special",
    description: "Festival prices everywhere!",
    effects: { 0: 20, 1: 15, 2: 25, 3: 30 },
    icon: "🎪"
  },
  {
    title: "📉 Market Dip",
    description: "Economic slowdown affects all toys",
    effects: { 0: -20, 1: -20, 2: -20, 3: -20 },
    icon: "📉"
  },
  {
    title: "🎁 Holiday Rush",
    description: "Gift shopping season boom!",
    effects: { 0: 15, 1: 20, 2: 10, 3: 35 },
    icon: "🎁"
  }
];

export default function ToyMarketMela({ onClose }: { onClose: () => void }) {
  const [toys, setToys] = useState<Toy[]>([]);
  const [pocketMoney, setPocketMoney] = useState(200);
  const [totalProfit, setTotalProfit] = useState(0);
  const [day, setDay] = useState(1);
  const [status, setStatus] = useState("Welcome to Toy Market Mela! Buy low, sell high, and watch for market events!");
  const [eventActive, setEventActive] = useState(false);
  const [eventMessage, setEventMessage] = useState("");
  const [tradesMade, setTradesMade] = useState(0);
  const [bestTrade, setBestTrade] = useState(0);

  // Initialize toys
  useEffect(() => {
    const initializedToys = INITIAL_TOYS.map(toy => ({
      ...toy,
      currentPrice: toy.basePrice,
      owned: 0,
      trend: '➡️' as const,
    }));
    setToys(initializedToys);
  }, []);

  const buyToy = (index: number) => {
    const toy = toys[index];
    if (pocketMoney >= toy.currentPrice) {
      const newToys = [...toys];
      newToys[index].owned += 1;
      setToys(newToys);
      setPocketMoney(pocketMoney - toy.currentPrice);
      setTradesMade(tradesMade + 1);
      setStatus(`Bought ${toy.emoji} ${toy.name} for ₹${toy.currentPrice}!`);
    } else {
      setStatus("Not enough pocket money! 💸");
    }
  };

  const sellToy = (index: number) => {
    const toy = toys[index];
    if (toy.owned > 0) {
      const profit = toy.currentPrice - toy.basePrice;
      const newToys = [...toys];
      newToys[index].owned -= 1;
      setToys(newToys);
      setPocketMoney(pocketMoney + toy.currentPrice);
      setTotalProfit(totalProfit + profit);
      setTradesMade(tradesMade + 1);

      if (profit > bestTrade) {
        setBestTrade(profit);
      }

      setStatus(`Sold ${toy.emoji} ${toy.name} for ₹${toy.currentPrice}! Profit: ₹${profit > 0 ? '+' : ''}${profit}`);
    } else {
      setStatus("You don't own any of these toys!");
    }
  };

  const nextMelaDay = () => {
    setEventActive(false);

    // Random price changes
    const newToys = toys.map(toy => {
      const change = Math.floor(Math.random() * 31) - 15; // -15 to +15
      const newPrice = Math.max(5, toy.basePrice + change);
      return {
        ...toy,
        currentPrice: newPrice,
        trend: newPrice > toy.currentPrice ? '📈' as const : newPrice < toy.currentPrice ? '📉' as const : '➡️' as const,
      };
    });

    // Market event chance (30%)
    if (Math.random() < 0.3) {
      const event = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
      setEventActive(true);
      setEventMessage(`${event.icon} ${event.title}\n${event.description}`);

      // Apply event effects
      newToys.forEach((toy, index) => {
        const effect = event.effects[index] || 0;
        const eventPrice = Math.max(5, toy.currentPrice + Math.floor(toy.currentPrice * effect / 100));
        newToys[index] = {
          ...toy,
          currentPrice: eventPrice,
          trend: eventPrice > toy.currentPrice ? '📈' : eventPrice < toy.currentPrice ? '📉' : '➡️',
        };
      });

      setTimeout(() => {
        setEventActive(false);
        setEventMessage("");
      }, 4000);
    }

    setToys(newToys);
    setDay(day + 1);

    const totalValue = newToys.reduce((sum, toy) => sum + (toy.owned * toy.currentPrice), 0);
    setStatus(`Day ${day + 1}: Market prices updated! Portfolio value: ₹${pocketMoney + totalValue}`);
  };

  const resetMela = () => {
    const resetToys = INITIAL_TOYS.map(toy => ({
      ...toy,
      currentPrice: toy.basePrice,
      owned: 0,
      trend: '➡️' as const,
    }));
    setToys(resetToys);
    setPocketMoney(200);
    setTotalProfit(0);
    setDay(1);
    setTradesMade(0);
    setBestTrade(0);
    setEventActive(false);
    setStatus("Mela reset! Fresh start with new market opportunities!");
  };

  const totalPortfolio = toys.reduce((sum, toy) => sum + (toy.owned * toy.currentPrice), 0);
  const netWorth = pocketMoney + totalPortfolio;
  const returnPercentage = ((netWorth - 200) / 200 * 100).toFixed(1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <View style={styles.header}>
        <Text style={styles.title}>🎪 Toy Market Mela</Text>
        <Text style={styles.subtitle}>Strategic Trading Adventure</Text>
      </View>

      {/* Market Status */}
      <View style={[styles.marketStatus, eventActive && styles.eventActive]}>
        <Text style={styles.statusText}>
          {eventActive ? "🎯 MARKET EVENT!" : "📊 Mela Open"}
        </Text>
        {eventActive && (
          <Text style={styles.eventText}>{eventMessage}</Text>
        )}
      </View>

      {/* Portfolio Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{pocketMoney}</Text>
          <Text style={styles.statLabel}>Pocket Money</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{totalPortfolio}</Text>
          <Text style={styles.statLabel}>Portfolio Value</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: totalProfit >= 0 ? '#e8f5e8' : '#ffeaea' }]}>
          <Text style={[styles.statValue, { color: totalProfit >= 0 ? '#27ae60' : '#e74c3c' }]}>
            {totalProfit >= 0 ? '+' : ''}₹{totalProfit}
          </Text>
          <Text style={styles.statLabel}>Total Profit</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{day}</Text>
          <Text style={styles.statLabel}>Day</Text>
        </View>
      </View>

      {/* Performance Summary */}
      <View style={styles.performanceBox}>
        <Text style={styles.performanceTitle}>📊 Trading Performance</Text>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Net Worth:</Text>
          <Text style={styles.performanceValue}>₹{netWorth}</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Return:</Text>
          <Text style={[styles.performanceValue, { color: parseFloat(returnPercentage) >= 0 ? '#27ae60' : '#e74c3c' }]}>
            {parseFloat(returnPercentage) >= 0 ? '+' : ''}{returnPercentage}%
          </Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Trades Made:</Text>
          <Text style={styles.performanceValue}>{tradesMade}</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Best Single Trade:</Text>
          <Text style={styles.performanceValue}>₹{bestTrade}</Text>
        </View>
      </View>

      {/* Status Message */}
      <Text style={styles.statusMessage}>{status}</Text>

      {/* Toys Trading */}
      <View style={styles.toysContainer}>
        {toys.map((toy, index) => (
          <View key={toy.name} style={styles.toyCard}>
            <View style={styles.toyHeader}>
              <View style={styles.toyInfo}>
                <Text style={styles.toyEmoji}>{toy.emoji}</Text>
                <View style={styles.toyDetails}>
                  <Text style={styles.toyName}>{toy.name}</Text>
                  <Text style={styles.toyDesc}>{toy.description}</Text>
                </View>
              </View>
              <Text style={styles.trendIcon}>{toy.trend}</Text>
            </View>

            <View style={styles.priceSection}>
              <View style={styles.priceInfo}>
                <Text style={styles.currentPrice}>₹{toy.currentPrice}</Text>
                <Text style={styles.basePrice}>(Base: ₹{toy.basePrice})</Text>
                <Text style={styles.ownedText}>Owned: {toy.owned}</Text>
              </View>

              <View style={styles.profitPreview}>
                <Text style={styles.profitLabel}>Potential Profit:</Text>
                <Text style={[
                  styles.profitValue,
                  { color: (toy.currentPrice - toy.basePrice) >= 0 ? '#27ae60' : '#e74c3c' }
                ]}>
                  ₹{(toy.currentPrice - toy.basePrice) >= 0 ? '+' : ''}{toy.currentPrice - toy.basePrice}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.buyButton]}
                onPress={() => buyToy(index)}
                disabled={pocketMoney < toy.currentPrice}
              >
                <Ionicons name="bag-add" size={18} color="#fff" />
                <Text style={styles.buttonText}>Buy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.sellButton]}
                onPress={() => sellToy(index)}
                disabled={toy.owned === 0}
              >
                <Ionicons name="cash" size={18} color="#fff" />
                <Text style={styles.buttonText}>Sell</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Next Day Button */}
      <TouchableOpacity
        style={[styles.nextDayButton, eventActive && styles.nextDayDisabled]}
        onPress={nextMelaDay}
        disabled={eventActive}
      >
        <Ionicons name="sunny" size={24} color="#fff" />
        <Text style={styles.nextDayText}>Next Mela Day</Text>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Trading Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>💡 Trading Strategies:</Text>
        <Text style={styles.tipsText}>
          • Watch for market events that can dramatically change prices{'\n'}
          • Buy during market dips and sell during booms{'\n'}
          • Diversify across different toy types{'\n'}
          • Timing is everything in the mela market!
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.resetButton} onPress={resetMela}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.resetText}>Reset Mela</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="exit-outline" size={18} color="#666" />
          <Text style={styles.closeText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: "#7f8c8d",
  },
  marketStatus: {
    backgroundColor: "#e8f5e8",
    marginHorizontal: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },
  eventActive: {
    backgroundColor: "#fff3cd",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27ae60",
    textAlign: "center",
  },
  eventText: {
    fontSize: 12,
    color: "#856404",
    textAlign: "center",
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 2,
    minWidth: 70,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27ae60",
  },
  statLabel: {
    fontSize: 10,
    color: "#7f8c8d",
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  performanceBox: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
    textAlign: "center",
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  performanceLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "600",
  },
  performanceValue: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "bold",
  },
  statusMessage: {
    fontSize: 14,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "600",
    minHeight: 35,
    paddingHorizontal: 15,
    lineHeight: 17,
  },
  toysContainer: {
    paddingHorizontal: 15,
  },
  toyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  toyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  toyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toyEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  toyDetails: {
    flex: 1,
  },
  toyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  toyDesc: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  trendIcon: {
    fontSize: 20,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceInfo: {
    flex: 1,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27ae60",
  },
  basePrice: {
    fontSize: 11,
    color: "#7f8c8d",
  },
  ownedText: {
    fontSize: 12,
    color: "#34495e",
    fontWeight: "600",
    marginTop: 2,
  },
  profitPreview: {
    alignItems: "flex-end",
  },
  profitLabel: {
    fontSize: 10,
    color: "#7f8c8d",
  },
  profitValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
    minWidth: 80,
    justifyContent: "center",
  },
  buyButton: {
    backgroundColor: "#27ae60",
  },
  sellButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  nextDayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    marginHorizontal: 15,
    marginVertical: 15,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 3,
    minHeight: 48,
  },
  nextDayDisabled: {
    backgroundColor: "#bdc3c7",
  },
  nextDayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  tipsBox: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#d5edda",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 6,
    textAlign: "center",
  },
  tipsText: {
    fontSize: 13,
    color: "#2c3e50",
    lineHeight: 17,
    textAlign: "center",
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f39c12",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    elevation: 2,
    minHeight: 44,
    justifyContent: "center",
  },
  resetText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
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
    justifyContent: "center",
  },
  closeText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});
