import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

type Company = {
  name: string;
  emoji: string;
  color: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
};

const COMPANIES: Company[] = [
  {
    name: "Cricket Star Toys",
    emoji: "🏏",
    color: "#4CAF50",
    description: "Sports equipment for champions",
    trend: 'up'
  },
  {
    name: "Chaat Express",
    emoji: "🍲",
    color: "#FF9800",
    description: "Street food favorite",
    trend: 'stable'
  },
  {
    name: "Comic Store",
    emoji: "📚",
    color: "#2196F3",
    description: "Adventure stories for kids",
    trend: 'up'
  },
  {
    name: "Cycle Co.",
    emoji: "🚲",
    color: "#E91E63",
    description: "Two-wheeler adventures",
    trend: 'down'
  },
];

type MarketEvent = {
  title: string;
  description: string;
  effects: { [companyIndex: number]: number };
  probability: number;
};

const MARKET_EVENTS: MarketEvent[] = [
  {
    title: "🏏 IPL Final Day!",
    description: "Cricket fever sweeps the nation!",
    effects: { 0: 25, 1: 5, 2: -5, 3: 15 },
    probability: 0.2
  },
  {
    title: "🌧️ Rainy Season",
    description: "Outdoor activities affected",
    effects: { 0: -15, 1: -10, 2: 10, 3: -20 },
    probability: 0.25
  },
  {
    title: "🎭 ComicFest!",
    description: "Book lovers celebrate!",
    effects: { 0: 5, 1: -5, 2: 30, 3: 0 },
    probability: 0.2
  },
  {
    title: "🍽️ Food Festival",
    description: "Street food boom!",
    effects: { 0: 0, 1: 20, 2: 5, 3: 10 },
    probability: 0.15
  },
  {
    title: "🚨 Market Crash!",
    description: "Economic uncertainty hits all stocks",
    effects: { 0: -20, 1: -20, 2: -20, 3: -20 },
    probability: 0.1
  },
  {
    title: "🎊 Festival Bonus!",
    description: "Holiday shopping increases demand",
    effects: { 0: 15, 1: 10, 2: 15, 3: 5 },
    probability: 0.3
  }
];

export default function StockMarketAdventure({ onClose }: { onClose: () => void }) {
  const [prices, setPrices] = useState([50, 30, 35, 40]);
  const [owned, setOwned] = useState([0, 0, 0, 0]);
  const [funds, setFunds] = useState(150);
  const [day, setDay] = useState(1);
  const [message, setMessage] = useState("Welcome to the Stock Market! Buy low, sell high, and watch for market events!");
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [eventActive, setEventActive] = useState(false);
  const [animations, setAnimations] = useState<any>({});

  // Initialize animations
  useEffect(() => {
    const anims: any = {};
    COMPANIES.forEach((_, index) => {
      anims[index] = new Animated.Value(1);
    });
    setAnimations(anims);
  }, []);

  // Calculate portfolio value
  useEffect(() => {
    const value = owned.reduce((sum, shares, index) => sum + shares * prices[index], 0);
    setPortfolioValue(value);
    setTotalReturn(funds + value - 150); // Starting funds were 150
  }, [prices, owned, funds]);

  const animatePriceChange = (companyIndex: number, isIncrease: boolean) => {
    Animated.sequence([
      Animated.timing(animations[companyIndex], {
        toValue: isIncrease ? 1.2 : 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animations[companyIndex], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const buyStock = (index: number) => {
    if (funds >= prices[index]) {
      const newOwned = [...owned];
      newOwned[index]++;
      setOwned(newOwned);
      setFunds(funds - prices[index]);
      setMessage(`Bought 1 share of ${COMPANIES[index].name} for ₹${prices[index]}! 📈`);

      animatePriceChange(index, true);
    } else {
      setMessage("Not enough funds! 💸");
    }
  };

  const sellStock = (index: number) => {
    if (owned[index] > 0) {
      const newOwned = [...owned];
      newOwned[index]--;
      setOwned(newOwned);
      setFunds(funds + prices[index]);
      setMessage(`Sold 1 share of ${COMPANIES[index].name} for ₹${prices[index]}! 💰`);

      animatePriceChange(index, false);
    } else {
      setMessage("No shares to sell! 📉");
    }
  };

  const nextDay = () => {
    setEventActive(false);

    // Random price changes
    const newPrices = prices.map(price => {
      const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
      return Math.max(5, price + change); // Minimum price of 5
    });

    // Check for market events
    const eventRoll = Math.random();
    let cumulativeProb = 0;
    let triggeredEvent: MarketEvent | null = null;

    for (const event of MARKET_EVENTS) {
      cumulativeProb += event.probability;
      if (eventRoll <= cumulativeProb) {
        triggeredEvent = event;
        break;
      }
    }

    if (triggeredEvent) {
      setEventActive(true);
      setMessage(`${triggeredEvent.title} ${triggeredEvent.description}`);

      // Apply event effects
      const eventPrices = newPrices.map((price, index) => {
        const effect = triggeredEvent!.effects[index] || 0;
        const newPrice = Math.max(5, price + Math.floor(price * effect / 100));
        animatePriceChange(index, newPrice > price);
        return newPrice;
      });

      setPrices(eventPrices);

      setTimeout(() => {
        setEventActive(false);
        setMessage("Market event concluded. Prices have stabilized.");
      }, 3000);
    } else {
      setPrices(newPrices);
      // Animate price changes
      newPrices.forEach((newPrice, index) => {
        animatePriceChange(index, newPrice > prices[index]);
      });
    }

    setDay(day + 1);
  };

  const getPriceChangeColor = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) return "#27ae60";
    if (newPrice < oldPrice) return "#e74c3c";
    return "#7f8c8d";
  };

  const getPriceChangeIcon = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) return "📈";
    if (newPrice < oldPrice) return "📉";
    return "➡️";
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Stock Market Adventure</Text>
        <Text style={styles.subtitle}>Buy low, sell high, watch for events!</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{funds}</Text>
          <Text style={styles.statLabel}>Cash</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{portfolioValue}</Text>
          <Text style={styles.statLabel}>Portfolio</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: totalReturn >= 0 ? '#e8f5e8' : '#ffeaea' }]}>
          <Text style={[styles.statValue, { color: totalReturn >= 0 ? '#27ae60' : '#e74c3c' }]}>
            {totalReturn >= 0 ? '+' : ''}₹{totalReturn}
          </Text>
          <Text style={styles.statLabel}>Total Return</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{day}</Text>
          <Text style={styles.statLabel}>Day</Text>
        </View>
      </View>

      {/* Market Status */}
      <View style={[styles.marketStatus, eventActive && styles.eventActive]}>
        <Text style={styles.statusText}>
          {eventActive ? "🎯 MARKET EVENT ACTIVE!" : "📊 Market Open"}
        </Text>
      </View>

      {/* Message */}
      <Text style={[styles.message, eventActive && styles.eventMessage]}>
        {message}
      </Text>

      {/* Companies */}
      <View style={styles.companiesContainer}>
        {COMPANIES.map((company, index) => (
          <Animated.View
            key={company.name}
            style={[
              styles.companyCard,
              { transform: [{ scale: animations[index] || 1 }] }
            ]}
          >
            <View style={styles.companyHeader}>
              <Text style={styles.companyEmoji}>{company.emoji}</Text>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companyDesc}>{company.description}</Text>
              </View>
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.priceText}>₹{prices[index]}</Text>
              <Text style={styles.ownedText}>
                Owned: {owned[index]} {owned[index] === 1 ? 'share' : 'shares'}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.buyButton]}
                onPress={() => buyStock(index)}
                disabled={funds < prices[index]}
              >
                <Ionicons name="arrow-up" size={16} color="#fff" />
                <Text style={styles.buttonText}>Buy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.sellButton]}
                onPress={() => sellStock(index)}
                disabled={owned[index] === 0}
              >
                <Ionicons name="arrow-down" size={16} color="#fff" />
                <Text style={styles.buttonText}>Sell</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Next Day Button */}
      <TouchableOpacity
        style={[styles.nextDayButton, eventActive && styles.nextDayDisabled]}
        onPress={nextDay}
        disabled={eventActive}
      >
        <Ionicons name="sunny" size={24} color="#fff" />
        <Text style={styles.nextDayText}>Next Trading Day</Text>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Performance Summary */}
      <View style={styles.performanceContainer}>
        <Text style={styles.performanceTitle}>📊 Your Performance</Text>
        <View style={styles.performanceStats}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Portfolio Value</Text>
            <Text style={styles.performanceValue}>₹{portfolioValue}</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Total Assets</Text>
            <Text style={styles.performanceValue}>₹{funds + portfolioValue}</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Return %</Text>
            <Text style={[
              styles.performanceValue,
              { color: totalReturn >= 0 ? '#27ae60' : '#e74c3c' }
            ]}>
              {((totalReturn / 150) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Educational Tips */}
      <View style={styles.educationBox}>
        <Text style={styles.educationTitle}>💡 Investment Wisdom:</Text>
        <Text style={styles.educationText}>
          • Buy low, sell high - timing matters!{'\n'}
          • Diversify across different companies{'\n'}
          • Market events can create opportunities{'\n'}
          • Patience and research lead to success
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="exit-outline" size={20} color="#666" />
          <Text style={styles.closeText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    minWidth: 70,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
    marginTop: 2,
  },
  marketStatus: {
    backgroundColor: "#e8f5e8",
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  eventActive: {
    backgroundColor: "#fff3cd",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27ae60",
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
  eventMessage: {
    color: "#f39c12",
  },
  companiesContainer: {
    paddingHorizontal: 20,
  },
  companyCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  companyEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  companyDesc: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27ae60",
  },
  ownedText: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
  },
  buyButton: {
    backgroundColor: "#27ae60",
  },
  sellButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 4,
  },
  nextDayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
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
  performanceContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
    textAlign: "center",
  },
  performanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  performanceItem: {
    alignItems: "center",
  },
  performanceLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginTop: 2,
  },
  educationBox: {
    backgroundColor: "#e8f5e8",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#d5edda",
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  educationText: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
  },
  bottomActions: {
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
  },
  closeText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
