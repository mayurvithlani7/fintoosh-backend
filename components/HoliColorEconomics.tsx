import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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

type ColorType = {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  quality: number; // 1-10 scale
  vibrancy: number; // 1-10 scale
  mixingPotential: number; // 1-10 scale
  description: string;
  category: 'primary' | 'secondary' | 'specialty';
};

type ProcurementMethod = {
  id: string;
  name: string;
  emoji: string;
  costMultiplier: number; // How much more expensive than base
  qualityBonus: number; // Quality adjustment
  convenience: number; // 1-10 scale (ease of procurement)
  description: string;
};

type ColorInventory = {
  colorId: string;
  quantity: number;
  procurementMethod: string;
  totalCost: number;
};

type FestivalPlan = {
  inventory: ColorInventory[];
  mixedColors: MixedColor[];
  totalBudget: number;
  remainingBudget: number;
  familySize: number;
  satisfaction: number;
  creativity: number;
  costEfficiency: number;
  feedback: string[];
};

type MixedColor = {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[];
  quantity: number;
  quality: number;
  marketValue: number;
};

const COLOR_TYPES: ColorType[] = [
  // Primary Colors
  { id: 'red-pigment', name: 'Red Pigment', emoji: '🔴', baseCost: 50, quality: 8, vibrancy: 9, mixingPotential: 9, description: 'Rich crimson pigment for traditional colors', category: 'primary' },
  { id: 'blue-pigment', name: 'Blue Pigment', emoji: '🔵', baseCost: 45, quality: 7, vibrancy: 8, mixingPotential: 8, description: 'Deep blue for festival mixtures', category: 'primary' },
  { id: 'yellow-pigment', name: 'Yellow Pigment', emoji: '🟡', baseCost: 40, quality: 8, vibrancy: 7, mixingPotential: 10, description: 'Bright yellow for base colors', category: 'primary' },

  // Secondary Colors
  { id: 'green-mix', name: 'Green Mix', emoji: '🟢', baseCost: 60, quality: 7, vibrancy: 7, mixingPotential: 6, description: 'Pre-mixed green for convenience', category: 'secondary' },
  { id: 'purple-mix', name: 'Purple Mix', emoji: '🟣', baseCost: 65, quality: 8, vibrancy: 8, mixingPotential: 5, description: 'Royal purple festival color', category: 'secondary' },
  { id: 'orange-mix', name: 'Orange Mix', emoji: '🟠', baseCost: 55, quality: 6, vibrancy: 8, mixingPotential: 7, description: 'Vibrant orange for celebrations', category: 'secondary' },

  // Specialty Colors
  { id: 'gold-flakes', name: 'Gold Flakes', emoji: '✨', baseCost: 150, quality: 9, vibrancy: 10, mixingPotential: 3, description: 'Premium gold particles for luxury colors', category: 'specialty' },
  { id: 'silver-powder', name: 'Silver Powder', emoji: '🌟', baseCost: 120, quality: 8, vibrancy: 9, mixingPotential: 4, description: 'Shimmering silver for special effects', category: 'specialty' },
  { id: 'rainbow-mix', name: 'Rainbow Mix', emoji: '🌈', baseCost: 100, quality: 7, vibrancy: 9, mixingPotential: 8, description: 'Multi-color blend for variety', category: 'specialty' },
];

const PROCUREMENT_METHODS: ProcurementMethod[] = [
  {
    id: 'wholesale-bulk',
    name: 'Wholesale Bulk Purchase',
    emoji: '📦',
    costMultiplier: 0.7,
    qualityBonus: 0,
    convenience: 6,
    description: 'Large quantity purchase at discounted rates'
  },
  {
    id: 'manufacturer-direct',
    name: 'Direct from Manufacturer',
    emoji: '🏭',
    costMultiplier: 0.8,
    qualityBonus: 1,
    convenience: 4,
    description: 'Factory direct with quality guarantee'
  },
  {
    id: 'local-market',
    name: 'Local Market Vendor',
    emoji: '🏪',
    costMultiplier: 1.2,
    qualityBonus: 0,
    convenience: 9,
    description: 'Convenient local shopping experience'
  },
  {
    id: 'online-retail',
    name: 'Online Retail',
    emoji: '💻',
    costMultiplier: 1.1,
    qualityBonus: 0,
    convenience: 8,
    description: 'E-commerce with home delivery'
  },
  {
    id: 'premium-specialty',
    name: 'Premium Specialty Store',
    emoji: '💎',
    costMultiplier: 1.8,
    qualityBonus: 2,
    convenience: 7,
    description: 'High-end specialty color shop'
  },
];

const FESTIVAL_COLOR_RECIPES: { [key: string]: { name: string; emoji: string; ingredients: string[]; ratio: number[]; quality: number } } = {
  'pink-delight': {
    name: 'Pink Delight',
    emoji: '🌸',
    ingredients: ['red-pigment', 'yellow-pigment'],
    ratio: [2, 1],
    quality: 8
  },
  'royal-purple': {
    name: 'Royal Purple',
    emoji: '👑',
    ingredients: ['red-pigment', 'blue-pigment'],
    ratio: [3, 2],
    quality: 9
  },
  'sunset-orange': {
    name: 'Sunset Orange',
    emoji: '🌅',
    ingredients: ['red-pigment', 'yellow-pigment'],
    ratio: [1, 1],
    quality: 7
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    emoji: '🌊',
    ingredients: ['blue-pigment', 'yellow-pigment'],
    ratio: [3, 1],
    quality: 8
  },
  'emerald-green': {
    name: 'Emerald Green',
    emoji: '💚',
    ingredients: ['blue-pigment', 'yellow-pigment'],
    ratio: [1, 2],
    quality: 8
  }
};

export default function HoliColorEconomics({ onClose }: { onClose: () => void }) {
  const [familySize, setFamilySize] = useState(4);
  const [festivalBudget, setFestivalBudget] = useState(2000);
  const [colorInventory, setColorInventory] = useState<ColorInventory[]>([]);
  const [mixedColors, setMixedColors] = useState<MixedColor[]>([]);
  const [selectedProcurement, setSelectedProcurement] = useState<string>('local-market');
  const [gamePhase, setGamePhase] = useState<'planning' | 'procurement' | 'mixing' | 'celebration' | 'results'>('planning');
  const [festivalPlan, setFestivalPlan] = useState<FestivalPlan | null>(null);

  const startProcurement = () => {
    setGamePhase('procurement');
  };

  const addToInventory = (colorId: string, quantity: number) => {
    const color = COLOR_TYPES.find(c => c.id === colorId);
    const method = PROCUREMENT_METHODS.find(m => m.id === selectedProcurement);

    if (!color || !method) return;

    const unitCost = color.baseCost * method.costMultiplier;
    const totalCost = unitCost * quantity;
    const currentTotal = colorInventory.reduce((sum, item) => sum + item.totalCost, 0);

    if (currentTotal + totalCost > festivalBudget) {
      Alert.alert("Budget Exceeded", "This purchase would exceed your festival budget.");
      return;
    }

    const newInventory = colorInventory.filter(item => item.colorId !== colorId);
    newInventory.push({
      colorId,
      quantity: (colorInventory.find(item => item.colorId === colorId)?.quantity || 0) + quantity,
      procurementMethod: selectedProcurement,
      totalCost: (colorInventory.find(item => item.colorId === colorId)?.totalCost || 0) + totalCost
    });

    setColorInventory(newInventory);
  };

  const startMixing = () => {
    setGamePhase('mixing');
  };

  const mixColor = (recipeId: string) => {
    const recipe = FESTIVAL_COLOR_RECIPES[recipeId];
    if (!recipe) return;

    // Check if we have enough ingredients
    const canMix = recipe.ingredients.every((ingredientId, index) => {
      const inventoryItem = colorInventory.find(item => item.colorId === ingredientId);
      const requiredQuantity = recipe.ratio[index] * 10; // Base mixing quantity
      return inventoryItem && inventoryItem.quantity >= requiredQuantity;
    });

    if (!canMix) {
      Alert.alert("Insufficient Ingredients", "You don't have enough pigments to mix this color.");
      return;
    }

    // Consume ingredients
    const newInventory = [...colorInventory];
    recipe.ingredients.forEach((ingredientId, index) => {
      const inventoryItem = newInventory.find(item => item.colorId === ingredientId);
      if (inventoryItem) {
        inventoryItem.quantity -= recipe.ratio[index] * 10;
      }
    });

    // Add mixed color
    const mixedQuantity = Math.min(...recipe.ingredients.map((id, index) =>
      Math.floor((colorInventory.find(item => item.colorId === id)?.quantity || 0) / recipe.ratio[index])
    ));

    const newMixedColor: MixedColor = {
      id: recipeId + '-' + Date.now(),
      name: recipe.name,
      emoji: recipe.emoji,
      ingredients: recipe.ingredients,
      quantity: mixedQuantity,
      quality: recipe.quality,
      marketValue: mixedQuantity * 20 // Base market value per unit
    };

    setColorInventory(newInventory);
    setMixedColors([...mixedColors, newMixedColor]);
  };

  const startCelebration = () => {
    setGamePhase('celebration');
  };

  const calculateFestivalResults = () => {
    const totalSpent = colorInventory.reduce((sum, item) => sum + item.totalCost, 0);
    const remainingBudget = festivalBudget - totalSpent;

    // Calculate satisfaction metrics
    const totalColors = mixedColors.length + colorInventory.filter(item => item.quantity > 0).length;
    const avgQuality = mixedColors.length > 0
      ? mixedColors.reduce((sum, color) => sum + color.quality, 0) / mixedColors.length
      : 5;

    const creativity = mixedColors.length * 10 + (totalColors - mixedColors.length) * 5;
    const costEfficiency = festivalBudget > 0 ? (remainingBudget / festivalBudget) * 100 : 0;

    // Color variety bonus
    const uniqueColors = new Set([...mixedColors.map(c => c.name), ...colorInventory.filter(item => item.quantity > 0).map(item => COLOR_TYPES.find(c => c.id === item.colorId)?.name || '')]);
    const varietyBonus = uniqueColors.size >= 5 ? 20 : uniqueColors.size >= 3 ? 10 : 0;

    let satisfactionScore = 40;
    satisfactionScore += (avgQuality - 5) * 8;
    satisfactionScore += creativity * 0.5;
    satisfactionScore += Math.min(costEfficiency / 2, 20);
    satisfactionScore += varietyBonus;

    const feedback: string[] = [];
    if (mixedColors.length >= 3) feedback.push("Excellent creativity in color mixing!");
    if (costEfficiency > 70) feedback.push("Great budget management for the festival!");
    if (varietyBonus >= 20) feedback.push("Wonderful color variety for maximum celebration!");
    if (avgQuality >= 8) feedback.push("Premium quality colors for an authentic experience!");
    if (totalColors < 3) feedback.push("Consider adding more color variety for better celebration!");

    const plan: FestivalPlan = {
      inventory: colorInventory,
      mixedColors,
      totalBudget: festivalBudget,
      remainingBudget,
      familySize,
      satisfaction: Math.max(0, Math.min(100, satisfactionScore)),
      creativity: Math.min(100, creativity),
      costEfficiency: Math.round(costEfficiency),
      feedback
    };

    setFestivalPlan(plan);
    setGamePhase('results');
  };

  const resetGame = () => {
    setColorInventory([]);
    setMixedColors([]);
    setGamePhase('planning');
    setFestivalPlan(null);
  };

  const currentSpent = colorInventory.reduce((sum, item) => sum + item.totalCost, 0);
  const remainingBudget = festivalBudget - currentSpent;

  if (gamePhase === 'planning') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.planningContainer}>
          <Text style={styles.title}>🎨 Holi Color Economics</Text>
          <Text style={styles.subtitle}>Strategic Festival Color Planning</Text>

          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>🎯 Festival Planning Parameters</Text>

            {/* Family Size */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>👥 Family Size (including extended family)</Text>
              <View style={styles.sizeSelector}>
                {[3, 4, 5, 6, 8, 10].map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeButton, familySize === size && styles.selectedSize]}
                    onPress={() => setFamilySize(size)}
                  >
                    <Text style={[styles.sizeText, familySize === size && styles.selectedSizeText]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Festival Budget */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>💰 Holi Color Budget (₹)</Text>
              <View style={styles.budgetSelector}>
                {[1000, 1500, 2000, 3000, 5000].map(budget => (
                  <TouchableOpacity
                    key={budget}
                    style={[styles.budgetButton, festivalBudget === budget && styles.selectedBudget]}
                    onPress={() => setFestivalBudget(budget)}
                  >
                    <Text style={[styles.budgetText, festivalBudget === budget && styles.selectedBudgetText]}>
                      ₹{budget.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Planning Insights */}
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>💡 Festival Economics Strategy</Text>
              <Text style={styles.insightsText}>
                • Plan for {familySize} people celebrating together{'\n'}
                • Budget allocation: ₹{festivalBudget.toLocaleString()} total{'\n'}
                • Consider mixing vs. buying pre-made colors{'\n'}
                • Balance quality, creativity, and cost efficiency
              </Text>
            </View>

            <View style={styles.procurementPreview}>
              <Text style={styles.previewTitle}>🛒 Procurement Strategy Options:</Text>
              <Text style={styles.previewText}>
                • Wholesale bulk buying (cost-effective){'\n'}
                • Direct manufacturer (quality-focused){'\n'}
                • Local market (convenient){'\n'}
                • Premium specialty (luxury experience)
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startProcurement}>
            <Ionicons name="color-palette" size={24} color="#fff" />
            <Text style={styles.startText}>Start Color Procurement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="exit-outline" size={18} color="#666" />
            <Text style={styles.closeText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'procurement') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.procurementContainer}>
          <Text style={styles.title}>🛒 Color Procurement</Text>
          <Text style={styles.subtitle}>Choose Your Procurement Strategy</Text>

          {/* Budget Summary */}
          <View style={styles.budgetSummary}>
            <Text style={styles.budgetTitle}>💰 Festival Budget</Text>
            <Text style={styles.budgetAmount}>₹{festivalBudget.toLocaleString()}</Text>
            <Text style={styles.spentText}>Spent: ₹{currentSpent.toLocaleString()}</Text>
            <Text style={[styles.remainingText, remainingBudget < 0 && styles.overBudget]}>
              Remaining: ₹{remainingBudget.toLocaleString()}
            </Text>
          </View>

          {/* Procurement Methods */}
          <View style={styles.methodsContainer}>
            <Text style={styles.sectionTitle}>🏪 Procurement Methods</Text>
            {PROCUREMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, selectedProcurement === method.id && styles.selectedMethod]}
                onPress={() => setSelectedProcurement(method.id)}
              >
                <View style={styles.methodHeader}>
                  <Text style={styles.methodEmoji}>{method.emoji}</Text>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDesc}>{method.description}</Text>
                  </View>
                </View>
                <View style={styles.methodStats}>
                  <Text style={styles.statText}>Cost: {Math.round(method.costMultiplier * 100)}%</Text>
                  <Text style={styles.statText}>Quality: +{method.qualityBonus}</Text>
                  <Text style={styles.statText}>Convenience: {method.convenience}/10</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Selection */}
          <View style={styles.colorsContainer}>
            <Text style={styles.sectionTitle}>🎨 Available Colors</Text>
            {COLOR_TYPES.map(color => (
              <View key={color.id} style={styles.colorCard}>
                <View style={styles.colorInfo}>
                  <Text style={styles.colorEmoji}>{color.emoji}</Text>
                  <View style={styles.colorDetails}>
                    <Text style={styles.colorName}>{color.name}</Text>
                    <Text style={styles.colorDesc}>{color.description}</Text>
                    <View style={styles.colorStats}>
                      <Text style={styles.statText}>Quality: {color.quality}/10</Text>
                      <Text style={styles.statText}>Vibrancy: {color.vibrancy}/10</Text>
                      <Text style={styles.statText}>Mixing: {color.mixingPotential}/10</Text>
                    </View>
                  </View>
                  <View style={styles.colorPricing}>
                    <Text style={styles.basePrice}>₹{color.baseCost}/unit</Text>
                    <Text style={styles.adjustedPrice}>
                      ₹{Math.round(color.baseCost * (PROCUREMENT_METHODS.find(m => m.id === selectedProcurement)?.costMultiplier || 1))}
                    </Text>
                  </View>
                </View>

                <View style={styles.quantityControls}>
                  {[10, 25, 50, 100].map(quantity => (
                    <TouchableOpacity
                      key={quantity}
                      style={styles.quantityButton}
                      onPress={() => addToInventory(color.id, quantity)}
                    >
                      <Text style={styles.quantityText}>+{quantity}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Inventory Summary */}
          <View style={styles.inventorySummary}>
            <Text style={styles.summaryTitle}>📦 Current Inventory</Text>
            {colorInventory.filter(item => item.quantity > 0).map(item => {
              const color = COLOR_TYPES.find(c => c.id === item.colorId);
              return (
                <Text key={item.colorId} style={styles.inventoryText}>
                  {color?.emoji} {color?.name}: {item.quantity} units (₹{item.totalCost.toLocaleString()})
                </Text>
              );
            })}
            {colorInventory.length === 0 && (
              <Text style={styles.emptyText}>No colors purchased yet</Text>
            )}
          </View>

          <TouchableOpacity style={styles.mixingButton} onPress={startMixing}>
            <Ionicons name="flask" size={24} color="#fff" />
            <Text style={styles.mixingText}>Start Color Mixing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'mixing') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.mixingContainer}>
          <Text style={styles.title}>🧪 Color Mixing Laboratory</Text>
          <Text style={styles.subtitle}>Create Unique Festival Colors</Text>

          {/* Current Inventory */}
          <View style={styles.inventoryCard}>
            <Text style={styles.inventoryTitle}>🧳 Available Pigments</Text>
            {colorInventory.filter(item => item.quantity > 0).map(item => {
              const color = COLOR_TYPES.find(c => c.id === item.colorId);
              return (
                <Text key={item.colorId} style={styles.inventoryItem}>
                  {color?.emoji} {color?.name}: {item.quantity} units available
                </Text>
              );
            })}
          </View>

          {/* Mixing Recipes */}
          <View style={styles.recipesContainer}>
            <Text style={styles.sectionTitle}>📖 Color Mixing Recipes</Text>
            {Object.entries(FESTIVAL_COLOR_RECIPES).map(([recipeId, recipe]) => {
              const canMix = recipe.ingredients.every((ingredientId, index) => {
                const inventoryItem = colorInventory.find(item => item.colorId === ingredientId);
                const requiredQuantity = recipe.ratio[index] * 10;
                return inventoryItem && inventoryItem.quantity >= requiredQuantity;
              });

              return (
                <TouchableOpacity
                  key={recipeId}
                  style={[styles.recipeCard, !canMix && styles.disabledRecipe]}
                  onPress={() => canMix && mixColor(recipeId)}
                  disabled={!canMix}
                >
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <Text style={styles.recipeIngredients}>
                        Requires: {recipe.ingredients.map((id, index) => {
                          const color = COLOR_TYPES.find(c => c.id === id);
                          return `${recipe.ratio[index]}× ${color?.name}`;
                        }).join(', ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recipeStats}>
                    <Text style={styles.qualityText}>Quality: {recipe.quality}/10</Text>
                    <Text style={styles.mixText}>{canMix ? 'Ready to Mix' : 'Missing Ingredients'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Mixed Colors Display */}
          <View style={styles.mixedColorsCard}>
            <Text style={styles.mixedTitle}>🎨 Your Mixed Colors</Text>
            {mixedColors.map(color => (
              <View key={color.id} style={styles.mixedColor}>
                <Text style={styles.mixedEmoji}>{color.emoji}</Text>
                <View style={styles.mixedInfo}>
                  <Text style={styles.mixedName}>{color.name}</Text>
                  <Text style={styles.mixedQuantity}>Quantity: {color.quantity} • Quality: {color.quality}/10</Text>
                </View>
                <Text style={styles.mixedValue}>₹{color.marketValue}</Text>
              </View>
            ))}
            {mixedColors.length === 0 && (
              <Text style={styles.emptyMixed}>No colors mixed yet</Text>
            )}
          </View>

          <TouchableOpacity style={styles.celebrationButton} onPress={startCelebration}>
            <Ionicons name="balloon" size={24} color="#fff" />
            <Text style={styles.celebrationText}>Start Holi Celebration</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'celebration') {
    const totalColors = mixedColors.length + colorInventory.filter(item => item.quantity > 0).length;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.celebrationContainer}>
          <Text style={styles.title}>🎉 Holi Celebration</Text>
          <Text style={styles.subtitle}>Time to Play with Colors!</Text>

          {/* Celebration Stats */}
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationTitle}>📊 Your Holi Setup</Text>
            <View style={styles.celebrationStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{totalColors}</Text>
                <Text style={styles.statLabel}>Total Colors</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{mixedColors.length}</Text>
                <Text style={styles.statLabel}>Mixed Colors</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{familySize}</Text>
                <Text style={styles.statLabel}>Family Members</Text>
              </View>
            </View>
          </View>

          {/* Color Inventory */}
          <View style={styles.finalInventory}>
            <Text style={styles.inventoryTitle}>🎨 Final Color Collection</Text>

            {/* Mixed Colors */}
            {mixedColors.length > 0 && (
              <View style={styles.colorSection}>
                <Text style={styles.sectionTitle}>🧪 Mixed Colors</Text>
                {mixedColors.map(color => (
                  <View key={color.id} style={styles.finalColor}>
                    <Text style={styles.finalEmoji}>{color.emoji}</Text>
                    <Text style={styles.finalName}>{color.name}</Text>
                    <Text style={styles.finalQuantity}>{color.quantity} units</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Purchased Colors */}
            {colorInventory.filter(item => item.quantity > 0).length > 0 && (
              <View style={styles.colorSection}>
                <Text style={styles.sectionTitle}>🛒 Purchased Colors</Text>
                {colorInventory.filter(item => item.quantity > 0).map(item => {
                  const color = COLOR_TYPES.find(c => c.id === item.colorId);
                  return (
                    <View key={item.colorId} style={styles.finalColor}>
                      <Text style={styles.finalEmoji}>{color?.emoji}</Text>
                      <Text style={styles.finalName}>{color?.name}</Text>
                      <Text style={styles.finalQuantity}>{item.quantity} units</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.resultsButton} onPress={calculateFestivalResults}>
            <Ionicons name="analytics" size={24} color="#fff" />
            <Text style={styles.resultsText}>View Festival Results</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (festivalPlan) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.resultsContainer}>
          <Text style={styles.title}>🎊 Holi Festival Results</Text>

          {/* Key Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{festivalPlan.satisfaction}%</Text>
                <Text style={styles.metricLabel}>Festival Satisfaction</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{festivalPlan.creativity}%</Text>
                <Text style={styles.metricLabel}>Creativity Score</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{festivalPlan.costEfficiency}%</Text>
                <Text style={styles.metricLabel}>Budget Efficiency</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{festivalPlan.mixedColors.length}</Text>
                <Text style={styles.metricLabel}>Colors Mixed</Text>
              </View>
            </View>
          </View>

          {/* Performance Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>🏆 Festival Economics Rating</Text>
            <Text style={styles.rating}>
              {festivalPlan.satisfaction >= 85 ? "🌈 EXCEPTIONAL HOLI CELEBRATION!" :
               festivalPlan.satisfaction >= 70 ? "🎨 CREATIVE COLOR MASTER!" :
               festivalPlan.satisfaction >= 55 ? "🎉 GOOD FESTIVAL ECONOMICS!" :
               festivalPlan.satisfaction >= 40 ? "🎊 DECENT COLOR PLANNING!" :
               "🤔 ROOM FOR IMPROVEMENT!"}
            </Text>
          </View>

          {/* Color Analysis */}
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>📈 Festival Color Analysis</Text>
            <Text style={styles.analysisText}>
              Total Colors Created: {festivalPlan.inventory.filter(item => item.quantity > 0).length + festivalPlan.mixedColors.length}{'\n'}
              Mixed Colors: {festivalPlan.mixedColors.length}{'\n'}
              Purchased Colors: {festivalPlan.inventory.filter(item => item.quantity > 0).length}{'\n'}
              Budget Remaining: ₹{festivalPlan.remainingBudget.toLocaleString()}
            </Text>
          </View>

          {/* Feedback */}
          {festivalPlan.feedback.length > 0 && (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>💡 Festival Planning Insights</Text>
              {festivalPlan.feedback.map((feedback, index) => (
                <Text key={index} style={styles.feedbackText}>• {feedback}</Text>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.restartText}>Plan Another Holi</Text>
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

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef3e0",
  },
  planningContainer: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#8b4513",
    marginBottom: 20,
    textAlign: "center",
  },
  setupCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    width: "100%",
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8b4513",
    marginBottom: 10,
  },
  sizeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  sizeButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#f4e4bc",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    margin: 2,
  },
  selectedSize: {
    backgroundColor: "#d2691e",
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8b4513",
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
    backgroundColor: "#f4e4bc",
    elevation: 2,
  },
  selectedBudget: {
    backgroundColor: "#d2691e",
  },
  budgetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8b4513",
  },
  selectedBudgetText: {
    color: "#fff",
  },
  insightsCard: {
    backgroundColor: "#e8f5e8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 14,
    color: "#27ae60",
    lineHeight: 20,
  },
  procurementPreview: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d2691e",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
    marginBottom: 15,
  },
  startText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
  },
  closeText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  procurementContainer: {
    padding: 15,
  },
  budgetSummary: {
    backgroundColor: "#e8f5e8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  budgetTitle: {
    fontSize: 16,
    color: "#27ae60",
    fontWeight: "600",
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27ae60",
  },
  spentText: {
    fontSize: 14,
    color: "#27ae60",
    marginTop: 5,
  },
  remainingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginTop: 5,
  },
  overBudget: {
    color: "#e74c3c",
  },
  methodsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  methodCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  selectedMethod: {
    borderWidth: 2,
    borderColor: "#d2691e",
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  methodEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 14,
    color: "#666",
  },
  methodStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statText: {
    fontSize: 12,
    color: "#8b4513",
    fontWeight: "600",
  },
  colorsContainer: {
    marginBottom: 20,
  },
  colorCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  colorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  colorEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  colorDetails: {
    flex: 1,
  },
  colorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  colorDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  colorStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  colorPricing: {
    alignItems: "center",
  },
  basePrice: {
    fontSize: 12,
    color: "#666",
    textDecorationLine: "line-through",
  },
  adjustedPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  quantityControls: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quantityButton: {
    backgroundColor: "#d2691e",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    elevation: 2,
  },
  quantityText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inventorySummary: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  inventoryText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  mixingButton: {
    backgroundColor: "#9c27b0",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  mixingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  mixingContainer: {
    padding: 15,
  },
  inventoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  inventoryItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  recipesContainer: {
    marginBottom: 20,
  },
  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  disabledRecipe: {
    opacity: 0.5,
  },
  recipeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  recipeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  recipeIngredients: {
    fontSize: 14,
    color: "#666",
  },
  recipeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qualityText: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
  },
  mixText: {
    fontSize: 12,
    color: "#d2691e",
    fontWeight: "600",
  },
  mixedColorsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  mixedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  mixedColor: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  mixedEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  mixedInfo: {
    flex: 1,
  },
  mixedName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  mixedQuantity: {
    fontSize: 12,
    color: "#666",
  },
  mixedValue: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
  },
  emptyMixed: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  celebrationButton: {
    backgroundColor: "#ff5722",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  celebrationText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  celebrationContainer: {
    padding: 15,
  },
  celebrationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  celebrationStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27ae60",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  finalInventory: {
    marginBottom: 20,
  },
  colorSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  finalColor: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  finalEmoji: {
    fontSize: 20,
    marginRight: 10,
    width: 30,
  },
  finalName: {
    flex: 1,
    fontSize: 14,
    color: "#2c3e50",
  },
  finalQuantity: {
    fontSize: 12,
    color: "#666",
  },
  resultsButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  resultsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  resultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  metricsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    width: "100%",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  metric: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#27ae60",
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginTop: 4,
  },
  ratingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    width: "100%",
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    textAlign: "center",
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d2691e",
    textAlign: "center",
  },
  analysisCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    width: "100%",
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  analysisText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  restartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f39c12",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
  },
  restartText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
});
