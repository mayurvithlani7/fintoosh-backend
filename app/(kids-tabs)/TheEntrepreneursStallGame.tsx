import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createTransaction } from "../../utils/api";
import { INITIAL_STATE, StallItem, useAsyncStorageStall } from "../../utils/useAsyncStorageStall";

function getRandomCost(base: number) {
  // Simulate supply price fluctuation (±20%)
  const variance = 0.8 + Math.random() * 0.4;
  return Math.max(1, Math.round(base * variance));
}

function EntrepreneurStallGame({ onClose }: { onClose: () => void }) {
  // Custom hook to load and persist stall state
  const { loading, error, stall, setStall } = useAsyncStorageStall();
  const [selectedItem, setSelectedItem] = useState(0);
  const [buyQty, setBuyQty] = useState("1");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [saleSimulation, setSaleSimulation] = useState<{ sold: number; revenue: number; nextWeek: number } | null>(null);

  // (AsyncStorage state loading & persisting is now handled by useAsyncStorageStall)

  // Calculates random demand for item, given price and level
  function simulateSales(sellPrice: number, baseBuyCost: number, level: number, qty: number) {
    const demandBase = 10 + level * 2;
    const idealMargin = (sellPrice - baseBuyCost) / baseBuyCost;
    let expectedSales = Math.round(demandBase * (1 - Math.max(0, Math.min(1, (idealMargin - 0.6)))));
    // Add sales randomness
    expectedSales += Math.floor(Math.random() * 3) - 1; // -1/0/+1
    return Math.max(1, Math.min(qty, expectedSales));
  }

  // Buy supply logic
  function buySupply() {
    if (!stall) return;
    const qty = parseInt(buyQty);
    if (isNaN(qty) || qty <= 0) {
      setMessage("Enter a valid quantity.");
      return;
    }
    const item = stall.inventory[selectedItem];
    const cost = item.buyCost * qty;
    if (stall.funds < cost) {
      setMessage("Not enough funds to buy supplies!");
      return;
    }
    const newInventory = stall.inventory.map((it: StallItem, i: number) =>
      i === selectedItem ? { ...it, quantity: it.quantity + qty } : it
    );
    setStall({
      ...stall,
      funds: stall.funds - cost,
      inventory: newInventory,
    });
    setMessage(`Bought ${qty} ${item.name}(s).`);
  }

  // Set sell price logic
  function handleSetPrice() {
    if (!stall) return;
    const newPrice = Number(price);
    if (isNaN(newPrice) || newPrice <= 0) {
      setMessage("Enter a valid price.");
      return;
    }
    const newInventory = stall.inventory.map((it: StallItem, i: number) =>
      i === selectedItem ? { ...it, sellPrice: newPrice } : it
    );
    setStall({
      ...stall,
      inventory: newInventory,
    });
    setMessage("Price set!");
  }

  // Simulate sales for the week
  function handleSimulateSale() {
    if (!stall) return;
    const item = stall.inventory[selectedItem];
    if (item.quantity <= 0) {
      setMessage("No inventory to sell!");
      return;
    }
    const sold = simulateSales(item.sellPrice, item.buyCost, stall.level, item.quantity);
    const revenue = sold * item.sellPrice;
    const left = item.quantity - sold;
    const profit = revenue - sold * item.buyCost;
    const newProfit = stall.profit + profit;
    // Calculate next milestone (every 100 profit)
    let levelUp = false, milestone = stall.lastMilestone;
    let newLevel = stall.level;
    let mainPointReward = 0;
    if (newProfit - milestone >= 100) {
      levelUp = true;
      newLevel++;
      milestone += 100;
      mainPointReward = 50;
    }
    // Could unlock new items on level up
    let unlockedItems = [...stall.unlockedItems];
    let newInventory = [...stall.inventory];
    if (levelUp && !unlockedItems.includes("Mango Shake")) {
      unlockedItems.push("Mango Shake");
      newInventory.push({ name: "Mango Shake", quantity: 0, buyCost: 10, sellPrice: 16 });
    }

    newInventory = newInventory.map((it: StallItem, i: number) =>
      i === selectedItem
        ? { ...it, quantity: left }
        : it
    );
    setStall({
      ...stall,
      week: stall.week + 1,
      funds: stall.funds + revenue,
      inventory: newInventory,
      profit: newProfit,
      level: newLevel,
      lastMilestone: milestone,
      unlockedItems,
    });
    setSaleSimulation({ sold, revenue, nextWeek: stall.week + 1 });
    setMessage(`Sold ${sold} items for ₹${revenue}${levelUp ? " - Level up!" : ""}`);
    // Trigger API reward call if milestone hit
    if (mainPointReward > 0) sendMilestoneReward(mainPointReward, newLevel);
  }

  // Reward via main app points after milestone
  async function sendMilestoneReward(amount: number, level: number) {
    try {
      // Find userId & token from AsyncStorage
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");
      if (!userStr || !token) return;
      const user = JSON.parse(userStr);
      // Send transaction
      await createTransaction(
        {
          userId: user.id,
          type: "stall-milestone",
          description: `Milestone: Reached level ${level} in The Entrepreneur's Stall`,
          amount: amount,
          toJar: "current",
        },
        undefined
      );
      setMessage("Level up! Bonus points added to your main account.");
    } catch {
      setMessage("Level up! But could not send point reward (network error).");
    }
  }

  // Reset stall state (for testing/player)
  function resetStall() {
    setStall({ ...INITIAL_STATE, inventory: [{ ...INITIAL_STATE.inventory[0], buyCost: getRandomCost(5) }] });
    setSaleSimulation(null);
    setMessage("Stall reset!");
  }

  // Weekly supply cost fluctuation
  function refreshSupplyCosts() {
    if (!stall) return;
    setStall({
      ...stall,
      inventory: stall.inventory.map((it: StallItem) => ({
        ...it,
        buyCost: getRandomCost(it.buyCost),
      })),
    });
    setMessage("Supply costs refreshed!");
  }

  if (loading || !stall) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <ActivityIndicator size="large" color="#3ac670" />
        <Text style={{ marginTop: 16 }}>Loading your stall...</Text>
      </View>
    );
  }

  const item = stall.inventory[selectedItem];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛍️ My Entrepreneur{"'"}s Stall</Text>
      <Text style={styles.desc}>Level {stall.level} | Week {stall.week} | Stall Funds: ₹{stall.funds} | Total Profit: ₹{stall.profit}</Text>

      <Text style={styles.itemSelectTitle}>Inventory</Text>
      <View style={styles.row}>
        {stall.inventory.map((it: StallItem, idx: number) => (
          <TouchableOpacity
            key={it.name}
            style={[styles.itemTab, selectedItem === idx && styles.itemTabSelected]}
            onPress={() => setSelectedItem(idx)}
          >
            <Text style={{ fontWeight: "bold" }}>{it.name}</Text>
            <Text style={{ color: "#227", fontSize: 13 }}>{it.quantity} left</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Buy Supplies</Text>
      <View style={styles.row}>
        <Text>Buy Cost: ₹{item.buyCost} each</Text>
        <TextInput
          style={styles.input}
          placeholder="Qty"
          keyboardType="numeric"
          value={buyQty}
          onChangeText={setBuyQty}
        />
        <TouchableOpacity style={styles.button} onPress={buySupply}>
          <Text style={styles.buttonText}>Buy</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.refreshBtn} onPress={refreshSupplyCosts}>
        <Text style={styles.refreshText}>Refresh Supply Costs ⚡</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Set Sell Price</Text>
      <View style={styles.row}>
        <Text>Current: ₹{item.sellPrice}</Text>
        <TextInput
          style={styles.input}
          placeholder="Set price"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <TouchableOpacity style={styles.button} onPress={handleSetPrice}>
          <Text style={styles.buttonText}>Set</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Simulate Sales</Text>
      <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateSale}>
        <Text style={styles.simulateText}>Sell To Customers</Text>
      </TouchableOpacity>
      {saleSimulation && (
        <View style={styles.simResult}>
          <Text>Sold: {saleSimulation.sold}</Text>
          <Text>Revenue: ₹{saleSimulation.revenue}</Text>
          <Text>Next Week: {saleSimulation.nextWeek}</Text>
        </View>
      )}
      <Text style={styles.sectionTitle}>Level & Rewards</Text>
      <Text>
        {stall.level <= 1
          ? "Level up by earning ₹100 profit. Unlock new items at higher levels."
          : `Level: ${stall.level}. Next unlock at ₹${stall.lastMilestone + 100} profit!`}
      </Text>
      <TouchableOpacity style={styles.resetBtn} onPress={resetStall}>
        <Text style={styles.resetText}>Reset Stall</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
      {message && <Text style={styles.message}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "bold", color: "#2b2f5b", marginBottom: 4 },
  desc: { color: "#364", marginBottom: 10 },
  itemSelectTitle: { fontWeight: "bold", marginTop: 10 },
  sectionTitle: { fontWeight: "600", fontSize: 16, marginTop: 18, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#bbb", borderRadius: 7, padding: 7, width: 60, marginLeft: 6, marginRight: 4, textAlign: "center", backgroundColor: "#f8fcfa" },
  button: { backgroundColor: "#87ceeb", padding: 8, borderRadius: 7 },
  buttonText: { fontWeight: "bold", color: "#056", fontSize: 14 },
  refreshBtn: { alignSelf: "flex-end", backgroundColor: "#fffbe6", borderRadius: 8, padding: 5, marginVertical: 5, borderWidth: 1, borderColor: "#ffd93a" },
  refreshText: { color: "#c89b0e", fontWeight: "600", fontSize: 13 },
  simulateBtn: { backgroundColor: "#169353", borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 5, minWidth: 180, alignItems: "center" },
  simulateText: { color: "#fff", fontWeight: "bold" },
  simResult: { backgroundColor: "#dbfff0", borderRadius: 8, padding: 7, marginTop: 3, alignItems: "center" },
  resetBtn: { marginTop: 17, backgroundColor: "#ffe0e0", padding: 8, borderRadius: 7, minWidth: 116, alignItems: "center" },
  resetText: { color: "#bb052d", fontWeight: "700" },
  closeBtn: { backgroundColor: "#e9ecef", padding: 11, borderRadius: 21, alignItems: "center", marginTop: 18, width: '75%' },
  closeButtonText: { fontSize: 16, fontWeight: '600', color: '#495057' },
  message: { color: "#334", fontStyle: "italic", marginTop: 10, textAlign: "center", fontSize: 15 },
  itemTab: { marginHorizontal: 3, marginVertical: 4, padding: 9, borderRadius: 9, borderWidth: 1, borderColor: "#bbb", backgroundColor: "#f9fcfa" },
  itemTabSelected: { borderColor: "#2063b5", backgroundColor: "#e6f2ff" },
});

export default EntrepreneurStallGame;
