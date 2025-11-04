import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type Supply = {
  name: string;
  emoji: string;
  cost: number;
  quantity: number;
};

type StallLevel = {
  name: string;
  requiredProfit: number;
  description: string;
  unlocks: string[];
};

const STALL_LEVELS: StallLevel[] = [
  {
    name: "Street Vendor",
    requiredProfit: 0,
    description: "Basic stall with essential supplies",
    unlocks: ["Basic supplies"]
  },
  {
    name: "Market Stall",
    requiredProfit: 200,
    description: "Expanded stall with more variety",
    unlocks: ["Premium supplies", "Display upgrades"]
  },
  {
    name: "Shop Owner",
    requiredProfit: 500,
    description: "Established business with loyal customers",
    unlocks: ["Bulk discounts", "Marketing", "Employee"]
  },
  {
    name: "Business Mogul",
    requiredProfit: 1000,
    description: "Successful entrepreneur with multiple locations",
    unlocks: ["Franchising", "Automation", "Expansion"]
  }
];

export default function EntrepreneurStall({ onClose }: { onClose: () => void }) {
  const [cash, setCash] = useState(100);
  const [supplies, setSupplies] = useState<Supply[]>([
    { name: "Chocolates", emoji: "🍫", cost: 5, quantity: 0 },
    { name: "Candies", emoji: "🍬", cost: 3, quantity: 0 },
    { name: "Balloons", emoji: "🎈", cost: 8, quantity: 0 },
    { name: "Toys", emoji: "🧸", cost: 15, quantity: 0 },
  ]);
  const [sellingPrices, setSellingPrices] = useState([0, 0, 0, 0]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [day, setDay] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [customersServed, setCustomersServed] = useState(0);
  const [status, setStatus] = useState("Welcome to your stall! Buy supplies and set prices to start selling.");

  const level = STALL_LEVELS[currentLevel];
  const nextLevel = currentLevel < STALL_LEVELS.length - 1 ? STALL_LEVELS[currentLevel + 1] : null;

  // Check for level up
  useEffect(() => {
    if (nextLevel && totalProfit >= nextLevel.requiredProfit) {
      setCurrentLevel(currentLevel + 1);
      setStatus(`🎉 Level Up! You are now a ${nextLevel.name}! ${nextLevel.description}`);
      Alert.alert(
        "Level Up! 🎉",
        `Congratulations! You're now a ${nextLevel.name}!\n\n${nextLevel.description}\n\nNew unlocks: ${nextLevel.unlocks.join(", ")}`,
        [{ text: "Continue", style: "default" }]
      );
    }
  }, [totalProfit, nextLevel, currentLevel]);

  const buySupply = (index: number) => {
    const supply = supplies[index];
    const quantity = Math.floor(cash / supply.cost);

    if (quantity > 0) {
      const newSupplies = [...supplies];
      newSupplies[index].quantity += quantity;
      setSupplies(newSupplies);
      setCash(cash - (quantity * supply.cost));
      setStatus(`Bought ${quantity} ${supply.name} for ₹${quantity * supply.cost}`);
    } else {
      setStatus("Not enough cash to buy supplies!");
    }
  };

  const setPrice = (index: number, price: number) => {
    const newPrices = [...sellingPrices];
    newPrices[index] = Math.max(0, price);
    setSellingPrices(newPrices);
  };

  const sellDay = () => {
    let dayProfit = 0;
    let dayCustomers = 0;
    let dayReport: string[] = [];

    supplies.forEach((supply, index) => {
      if (supply.quantity > 0 && sellingPrices[index] > 0) {
        // Simulate customer demand based on price
        const baseDemand = Math.max(1, 10 - Math.floor(sellingPrices[index] / 2));
        const demand = Math.min(supply.quantity, baseDemand + Math.floor(Math.random() * 5));

        if (demand > 0) {
          const profit = demand * (sellingPrices[index] - supply.cost);
          dayProfit += profit;

          const newSupplies = [...supplies];
          newSupplies[index].quantity -= demand;
          setSupplies(newSupplies);

          dayCustomers += demand;
          dayReport.push(`${supply.emoji} ${supply.name}: ${demand} sold (+₹${profit})`);
        }
      }
    });

    setCash(cash + dayProfit);
    setTotalProfit(totalProfit + dayProfit);
    setCustomersServed(customersServed + dayCustomers);
    setDay(day + 1);

    if (dayReport.length > 0) {
      setStatus(`Day ${day} Complete!\n${dayReport.join('\n')}\nTotal Profit: ₹${dayProfit}`);
    } else {
      setStatus(`Day ${day} Complete! No sales today. Try adjusting your prices!`);
    }
  };

  const resetStall = () => {
    setCash(100);
    setSupplies(supplies.map(s => ({ ...s, quantity: 0 })));
    setSellingPrices([0, 0, 0, 0]);
    setTotalProfit(0);
    setDay(1);
    setCurrentLevel(0);
    setCustomersServed(0);
    setStatus("Stall reset! Start fresh with your business venture.");
  };

  const totalInventory = supplies.reduce((sum, s) => sum + s.quantity, 0);
  const totalInventoryValue = supplies.reduce((sum, s) => sum + (s.quantity * s.cost), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🛍️ {level.name}</Text>
        <Text style={styles.subtitle}>{level.description}</Text>
      </View>

      {/* Level Progress */}
      {nextLevel && (
        <View style={styles.levelProgress}>
          <Text style={styles.levelText}>Next Level: {nextLevel.name}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((totalProfit / nextLevel.requiredProfit) * 100, 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            ₹{totalProfit} / ₹{nextLevel.requiredProfit}
          </Text>
        </View>
      )}

      {/* Business Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{cash}</Text>
          <Text style={styles.statLabel}>Cash</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{totalProfit}</Text>
          <Text style={styles.statLabel}>Total Profit</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{day}</Text>
          <Text style={styles.statLabel}>Day</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{customersServed}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
      </View>

      {/* Status */}
      <Text style={styles.statusText}>{status}</Text>

      {/* Supplies Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Buy Supplies</Text>
        <Text style={styles.sectionSubtitle}>Build your inventory to sell</Text>

        {supplies.map((supply, index) => (
          <View key={supply.name} style={styles.supplyRow}>
            <View style={styles.supplyInfo}>
              <Text style={styles.supplyEmoji}>{supply.emoji}</Text>
              <View style={styles.supplyDetails}>
                <Text style={styles.supplyName}>{supply.name}</Text>
                <Text style={styles.supplyCost}>Cost: ₹{supply.cost} each</Text>
                <Text style={styles.supplyStock}>Stock: {supply.quantity}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.buyButton, cash < supply.cost && styles.disabledButton]}
              onPress={() => buySupply(index)}
              disabled={cash < supply.cost}
            >
              <Ionicons name="bag-add" size={16} color="#fff" />
              <Text style={styles.buttonText}>Buy</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Set Prices</Text>
        <Text style={styles.sectionSubtitle}>Price affects customer demand</Text>

        {supplies.map((supply, index) => (
          supply.quantity > 0 && (
            <View key={`price-${supply.name}`} style={styles.priceRow}>
              <View style={styles.priceInfo}>
                <Text style={styles.priceEmoji}>{supply.emoji}</Text>
                <Text style={styles.priceName}>{supply.name}</Text>
                <Text style={styles.priceCost}>Cost: ₹{supply.cost}</Text>
              </View>
              <View style={styles.priceInput}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={styles.priceField}
                  keyboardType="numeric"
                  value={sellingPrices[index].toString()}
                  onChangeText={(text) => setPrice(index, parseInt(text) || 0)}
                  placeholder="0"
                  maxLength={3}
                />
              </View>
              <Text style={styles.profitPreview}>
                {sellingPrices[index] > 0 ? `Profit: ₹${sellingPrices[index] - supply.cost}` : ''}
              </Text>
            </View>
          )
        ))}
      </View>

      {/* Inventory Summary */}
      <View style={styles.inventorySummary}>
        <Text style={styles.summaryTitle}>📊 Business Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Inventory:</Text>
          <Text style={styles.summaryValue}>{totalInventory} items</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Inventory Value:</Text>
          <Text style={styles.summaryValue}>₹{totalInventoryValue}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Net Worth:</Text>
          <Text style={styles.summaryValue}>₹{cash + totalInventoryValue}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.sellButton, totalInventory === 0 && styles.disabledButton]}
          onPress={sellDay}
          disabled={totalInventory === 0}
        >
          <Ionicons name="storefront" size={20} color="#fff" />
          <Text style={styles.sellText}>Sell for the Day</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetStall}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.resetText}>Reset Stall</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="exit-outline" size={18} color="#666" />
          <Text style={styles.closeText}>Back to Games</Text>
        </TouchableOpacity>
      </View>

      {/* Educational Tips */}
      <View style={styles.educationBox}>
        <Text style={styles.educationTitle}>💼 Business Wisdom:</Text>
        <Text style={styles.educationText}>
          • Buy low, sell high for maximum profit{'\n'}
          • Price affects customer demand{'\n'}
          • Manage inventory and cash flow{'\n'}
          • Build your business level by level!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 15,
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
    textAlign: "center",
  },
  levelProgress: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#f39c12",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
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
  },
  statusText: {
    fontSize: 14,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "600",
    minHeight: 40,
    paddingHorizontal: 15,
    lineHeight: 17,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  supplyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  supplyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  supplyEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  supplyDetails: {
    flex: 1,
  },
  supplyName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  supplyCost: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "500",
  },
  supplyStock: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  buyButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  priceInfo: {
    flex: 1,
  },
  priceEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  priceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  priceCost: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 10,
  },
  currency: {
    fontSize: 14,
    color: "#7f8c8d",
    marginRight: 4,
  },
  priceField: {
    width: 50,
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
  },
  profitPreview: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#27ae60",
    minWidth: 80,
    textAlign: "right",
  },
  inventorySummary: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 10,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "bold",
  },
  actions: {
    marginBottom: 15,
  },
  sellButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
    marginBottom: 10,
    minHeight: 48,
  },
  sellText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
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
    marginBottom: 10,
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
  educationBox: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#d5edda",
  },
  educationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 6,
    textAlign: "center",
  },
  educationText: {
    fontSize: 13,
    color: "#2c3e50",
    lineHeight: 17,
    textAlign: "center",
  },
});
