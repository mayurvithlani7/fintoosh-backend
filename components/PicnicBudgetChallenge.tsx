import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type PicnicItem = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: 'food' | 'drinks' | 'activities' | 'transport' | 'essentials';
  satisfaction: number; // 1-10 scale
  essential: boolean;
  description: string;
  dietary?: string[]; // dietary restrictions
};

type PicnicPlan = {
  items: PicnicItem[];
  totalCost: number;
  satisfaction: number;
  efficiency: number;
  constraints: string[];
};

const PICNIC_ITEMS: PicnicItem[] = [
  // Food
  { id: 'samosas', name: 'Samosa Platter', emoji: '🥟', price: 120, category: 'food', satisfaction: 7, essential: false, description: 'Crispy fried snacks' },
  { id: 'sandwiches', name: 'Sandwich Assortment', emoji: '🥪', price: 180, category: 'food', satisfaction: 8, essential: false, description: 'Fresh cut sandwiches' },
  { id: 'fruits', name: 'Fresh Fruit Basket', emoji: '🍎', price: 150, category: 'food', satisfaction: 6, essential: true, description: 'Healthy fruit selection' },
  { id: 'pizza', name: 'Pizza Slices', emoji: '🍕', price: 250, category: 'food', satisfaction: 9, essential: false, description: 'Cheesy pizza slices' },
  { id: 'chaat', name: 'Street Chaat', emoji: '🍲', price: 100, category: 'food', satisfaction: 8, essential: false, description: 'Spicy street food' },

  // Drinks
  { id: 'juice', name: 'Fruit Juice Pack', emoji: '🧃', price: 80, category: 'drinks', satisfaction: 7, essential: true, description: 'Assorted fruit juices' },
  { id: 'soda', name: 'Soft Drinks', emoji: '🥤', price: 60, category: 'drinks', satisfaction: 5, essential: false, description: 'Carbonated beverages' },
  { id: 'water', name: 'Mineral Water', emoji: '🥛', price: 40, category: 'drinks', satisfaction: 4, essential: true, description: 'Bottled drinking water' },
  { id: 'lassi', name: 'Sweet Lassi', emoji: '🥛', price: 90, category: 'drinks', satisfaction: 8, essential: false, description: 'Traditional yogurt drink' },

  // Activities
  { id: 'cricket', name: 'Cricket Set', emoji: '🏏', price: 300, category: 'activities', satisfaction: 9, essential: false, description: 'Complete cricket kit' },
  { id: 'frisbee', name: 'Frisbee & Discs', emoji: '🥏', price: 120, category: 'activities', satisfaction: 7, essential: false, description: 'Flying disc games' },
  { id: 'cards', name: 'Card Games', emoji: '🃏', price: 80, category: 'activities', satisfaction: 6, essential: false, description: 'Playing cards & games' },
  { id: 'music', name: 'Bluetooth Speaker', emoji: '🔊', price: 400, category: 'activities', satisfaction: 8, essential: false, description: 'Portable music player' },

  // Transport
  { id: 'auto', name: 'Auto Rickshaw', emoji: '🚗', price: 150, category: 'transport', satisfaction: 6, essential: false, description: 'Round trip rickshaw' },
  { id: 'cycle', name: 'Bicycle Rental', emoji: '🚲', price: 100, category: 'transport', satisfaction: 7, essential: false, description: 'Bike rental for group' },
  { id: 'bus', name: 'Bus Tickets', emoji: '🚌', price: 80, category: 'transport', satisfaction: 5, essential: false, description: 'Public transport' },

  // Essentials
  { id: 'blanket', name: 'Picnic Blanket', emoji: '🧺', price: 120, category: 'essentials', satisfaction: 7, essential: true, description: 'Large ground sheet' },
  { id: 'firstaid', name: 'First Aid Kit', emoji: '🩹', price: 90, category: 'essentials', satisfaction: 5, essential: true, description: 'Basic medical supplies' },
  { id: 'trash', name: 'Trash Bags', emoji: '🗑️', price: 30, category: 'essentials', satisfaction: 4, essential: true, description: 'Cleanup supplies' },
  { id: 'sunscreen', name: 'Sun Protection', emoji: '🧴', price: 70, category: 'essentials', satisfaction: 6, essential: false, description: 'Sunscreen & hats' },
];

export default function PicnicBudgetChallenge({ onClose }: { onClose: () => void }) {
  const [budget, setBudget] = useState(800);
  const [groupSize, setGroupSize] = useState(4);
  const [selectedItems, setSelectedItems] = useState<PicnicItem[]>([]);
  const [currentCategory, setCurrentCategory] = useState<'food' | 'drinks' | 'activities' | 'transport' | 'essentials'>('food');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [gamePhase, setGamePhase] = useState<'setup' | 'planning' | 'results'>('setup');
  const [picnicPlan, setPicnicPlan] = useState<PicnicPlan | null>(null);

  // Timer for planning phase
  useEffect(() => {
    if (gamePhase === 'planning' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'planning' && timeLeft === 0) {
      calculateResults();
    }
  }, [gamePhase, timeLeft]);

  const startPlanning = () => {
    setGamePhase('planning');
    setTimeLeft(180);
  };

  const toggleItem = (item: PicnicItem) => {
    const currentCost = selectedItems.reduce((sum, i) => sum + i.price, 0);
    const newCost = currentCost + (selectedItems.includes(item) ? -item.price : item.price);

    if (!selectedItems.includes(item) && newCost > budget) {
      Alert.alert("Budget Exceeded", "This item would exceed your budget. Remove something else first.");
      return;
    }

    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const calculateResults = () => {
    const totalCost = selectedItems.reduce((sum, item) => sum + item.price, 0);
    const avgSatisfaction = selectedItems.length > 0
      ? selectedItems.reduce((sum, item) => sum + item.satisfaction, 0) / selectedItems.length
      : 0;
    const efficiency = budget > 0 ? (totalCost / budget) * 100 : 0;

    // Check constraints
    const constraints = [];
    const hasFood = selectedItems.some(item => item.category === 'food');
    const hasDrinks = selectedItems.some(item => item.category === 'drinks');
    const hasEssentials = selectedItems.some(item => item.category === 'essentials');

    if (!hasFood) constraints.push("No food selected - picnic might be hungry!");
    if (!hasDrinks) constraints.push("No drinks - dehydration risk!");
    if (!hasEssentials) constraints.push("Missing essentials - practical problems!");
    if (totalCost > budget) constraints.push("Over budget - financial stress!");
    if (totalCost < budget * 0.7) constraints.push("Under budget - could have more fun!");

    const plan: PicnicPlan = {
      items: selectedItems,
      totalCost,
      satisfaction: Math.round(avgSatisfaction * 10) / 10,
      efficiency: Math.round(efficiency),
      constraints
    };

    setPicnicPlan(plan);
    setGamePhase('results');
  };

  const resetGame = () => {
    setSelectedItems([]);
    setGamePhase('setup');
    setTimeLeft(180);
    setPicnicPlan(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentCost = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const remainingBudget = budget - currentCost;

  const categories = [
    { key: 'food', label: '🍽️ Food', color: '#FF9800' },
    { key: 'drinks', label: '🥤 Drinks', color: '#2196F3' },
    { key: 'activities', label: '⚽ Activities', color: '#4CAF50' },
    { key: 'transport', label: '🚗 Transport', color: '#9C27B0' },
    { key: 'essentials', label: '🧺 Essentials', color: '#FF5722' },
  ];

  const filteredItems = PICNIC_ITEMS.filter(item => item.category === currentCategory);

  if (gamePhase === 'setup') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.setupContainer}>
          <Text style={styles.title}>🧺 Picnic Budget Challenge</Text>
          <Text style={styles.subtitle}>Plan the perfect group picnic!</Text>

          {/* Group Size Selection */}
          <View style={styles.setupSection}>
            <Text style={styles.sectionTitle}>👥 Group Size</Text>
            <View style={styles.sizeSelector}>
              {[2, 3, 4, 5, 6, 8].map(size => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeButton, groupSize === size && styles.selectedSize]}
                  onPress={() => setGroupSize(size)}
                >
                  <Text style={[styles.sizeText, groupSize === size && styles.selectedSizeText]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Selection */}
          <View style={styles.setupSection}>
            <Text style={styles.sectionTitle}>💰 Budget</Text>
            <View style={styles.budgetSelector}>
              {[500, 800, 1000, 1200, 1500].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.budgetButton, budget === amount && styles.selectedBudget]}
                  onPress={() => setBudget(amount)}
                >
                  <Text style={[styles.budgetText, budget === amount && styles.selectedBudgetText]}>
                    ₹{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Challenge Info */}
          <View style={styles.challengeInfo}>
            <Text style={styles.infoTitle}>🎯 Challenge Rules:</Text>
            <Text style={styles.infoText}>
              • Plan for {groupSize} people{'\n'}
              • Stay within ₹{budget} budget{'\n'}
              • 3 minutes planning time{'\n'}
              • Balance fun, health & practicality
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startPlanning}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.startText}>Start Planning!</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="exit-outline" size={18} color="#666" />
            <Text style={styles.closeText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'results' && picnicPlan) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.resultsContainer}>
          <Text style={styles.title}>🎉 Picnic Results</Text>

          {/* Final Plan Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Picnic Plan</Text>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>₹{picnicPlan.totalCost}</Text>
                <Text style={styles.metricLabel}>Total Cost</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{picnicPlan.satisfaction}/10</Text>
                <Text style={styles.metricLabel}>Satisfaction</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{picnicPlan.efficiency}%</Text>
                <Text style={styles.metricLabel}>Budget Used</Text>
              </View>
            </View>
          </View>

          {/* Selected Items */}
          <View style={styles.itemsList}>
            <Text style={styles.itemsTitle}>📋 Your Selections:</Text>
            {picnicPlan.items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            ))}
          </View>

          {/* Feedback */}
          {picnicPlan.constraints.length > 0 && (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>💡 Suggestions:</Text>
              {picnicPlan.constraints.map((constraint, index) => (
                <Text key={index} style={styles.feedbackText}>• {constraint}</Text>
              ))}
            </View>
          )}

          {/* Performance Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>🏆 Performance Rating:</Text>
            <Text style={styles.ratingValue}>
              {picnicPlan.satisfaction >= 8 && picnicPlan.efficiency >= 80 ? "🌟 EXCELLENT PICNIC PLANNER!" :
               picnicPlan.satisfaction >= 6 && picnicPlan.efficiency >= 60 ? "🎖️ GOOD ORGANIZER!" :
               picnicPlan.satisfaction >= 4 ? "👍 DECENT PLANNING!" :
               "🤔 ROOM FOR IMPROVEMENT!"}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.restartText}>Plan Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="exit-outline" size={18} color="#666" />
              <Text style={styles.closeText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Planning Phase
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <View style={styles.planningContainer}>
        {/* Header with Timer */}
        <View style={styles.planningHeader}>
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={20} color={timeLeft < 30 ? "#e74c3c" : "#27ae60"} />
            <Text style={[styles.timerText, timeLeft < 30 && styles.timerUrgent]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
          <TouchableOpacity style={styles.finishButton} onPress={calculateResults}>
            <Text style={styles.finishText}>Finish Planning</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Status */}
        <View style={styles.budgetStatus}>
          <Text style={styles.budgetText}>Budget: ₹{budget} | Spent: ₹{currentCost} | Left: ₹{remainingBudget}</Text>
          <View style={styles.budgetBar}>
            <View style={[styles.budgetFill, { width: `${(currentCost / budget) * 100}%` }]} />
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryTab, { backgroundColor: cat.color }, currentCategory === cat.key && styles.activeTab]}
              onPress={() => setCurrentCategory(cat.key as any)}
            >
              <Text style={[styles.categoryText, currentCategory === cat.key && styles.activeTabText]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items Grid */}
        <View style={styles.itemsGrid}>
          {filteredItems.map(item => {
            const isSelected = selectedItems.includes(item);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, isSelected && styles.selectedItem]}
                onPress={() => toggleItem(item)}
                disabled={!isSelected && currentCost + item.price > budget}
              >
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
                <Text style={styles.itemSatisfaction}>⭐ {item.satisfaction}/10</Text>
                {item.essential && <Text style={styles.essentialTag}>Essential</Text>}
                {isSelected && <Ionicons name="checkmark-circle" size={20} color="#27ae60" style={styles.checkIcon} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Items Summary */}
        <View style={styles.selectedSummary}>
          <Text style={styles.summaryText}>
            Selected: {selectedItems.length} items
          </Text>
          <Text style={styles.summaryCost}>
            Total: ₹{currentCost}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  setupContainer: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 20,
    textAlign: "center",
  },
  setupSection: {
    width: "100%",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  sizeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  sizeButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#ecf0f1",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  selectedSize: {
    backgroundColor: "#3498db",
  },
  sizeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  selectedSizeText: {
    color: "#fff",
  },
  budgetSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  budgetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#ecf0f1",
    elevation: 2,
  },
  selectedBudget: {
    backgroundColor: "#27ae60",
  },
  budgetText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  selectedBudgetText: {
    color: "#fff",
  },
  challengeInfo: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#2c3e50",
    lineHeight: 18,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 3,
    marginBottom: 15,
  },
  startText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    elevation: 2,
  },
  closeText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  planningContainer: {
    flex: 1,
    padding: 15,
  },
  planningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginLeft: 6,
  },
  timerUrgent: {
    color: "#e74c3c",
  },
  finishButton: {
    backgroundColor: "#f39c12",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
  },
  finishText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  budgetStatus: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
  },
  budgetBar: {
    height: 6,
    backgroundColor: "#ecf0f1",
    borderRadius: 3,
    overflow: "hidden",
  },
  budgetFill: {
    height: "100%",
    backgroundColor: "#27ae60",
    borderRadius: 3,
  },
  categoryTabs: {
    flexDirection: "row",
    marginBottom: 15,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  activeTabText: {
    color: "#fff",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: (width - 40) / 2 - 5,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    alignItems: "center",
    position: "relative",
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: "#27ae60",
  },
  itemEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 2,
  },
  itemSatisfaction: {
    fontSize: 11,
    color: "#7f8c8d",
  },
  essentialTag: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#e74c3c",
    color: "#fff",
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: "bold",
  },
  checkIcon: {
    position: "absolute",
    top: 6,
    left: 6,
  },
  selectedSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e8f5e8",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "bold",
  },
  summaryCost: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "bold",
  },
  resultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    width: "100%",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 15,
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  metric: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27ae60",
  },
  metricLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
    marginTop: 2,
  },
  itemsList: {
    width: "100%",
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  itemDesc: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  feedbackCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 18,
    marginBottom: 4,
  },
  ratingCard: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  restartButton: {
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
  restartText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
});
