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

type Product = {
  id: string;
  name: string;
  emoji: string;
  basePrice: number;
  quality: number; // 1-10 scale
  category: 'food' | 'clothing' | 'electronics' | 'household' | 'books' | 'souvenirs';
  description: string;
  negotiable: boolean;
  bargainStrength: number; // How much price can be reduced (percentage)
};

type Vendor = {
  id: string;
  name: string;
  emoji: string;
  personality: 'friendly' | 'tough' | 'fair' | 'greedy';
  specialty: string;
  products: Product[];
  initialMood: number; // 1-10 scale (affects pricing)
  reputation: number; // 1-10 scale (affects deals)
};

type ShoppingCart = {
  productId: string;
  vendorId: string;
  quantity: number;
  negotiatedPrice: number;
  originalPrice: number;
};

type MarketState = {
  timeRemaining: number; // seconds
  crowdLevel: number; // 1-10 scale (affects prices)
  playerBudget: number;
  shoppingList: string[];
  cart: ShoppingCart[];
  reputation: number; // Overall market reputation
  completedDeals: number;
};

const VENDORS: Vendor[] = [
  {
    id: 'spice-merchant',
    name: 'Rajesh Spice Merchant',
    emoji: '🌶️',
    personality: 'friendly',
    specialty: 'Spices & Foods',
    initialMood: 8,
    reputation: 7,
    products: [
      { id: 'turmeric', name: 'Turmeric Powder', emoji: '🟡', basePrice: 120, quality: 8, category: 'food', description: 'Premium quality turmeric', negotiable: true, bargainStrength: 25 },
      { id: 'cumin', name: 'Cumin Seeds', emoji: '🌰', basePrice: 180, quality: 9, category: 'food', description: 'Aromatic cumin seeds', negotiable: true, bargainStrength: 20 },
      { id: 'cardamom', name: 'Green Cardamom', emoji: '🫘', basePrice: 450, quality: 9, category: 'food', description: 'Premium green cardamom', negotiable: true, bargainStrength: 15 },
    ]
  },
  {
    id: 'textile-trader',
    name: 'Priya Textile Trader',
    emoji: '🧵',
    personality: 'fair',
    specialty: 'Clothing & Fabrics',
    initialMood: 7,
    reputation: 8,
    products: [
      { id: 'sari', name: 'Silk Sari', emoji: '👗', basePrice: 2500, quality: 9, category: 'clothing', description: 'Handwoven silk sari', negotiable: true, bargainStrength: 30 },
      { id: 'kurti', name: 'Cotton Kurti', emoji: '👕', basePrice: 650, quality: 7, category: 'clothing', description: 'Comfortable cotton kurti', negotiable: true, bargainStrength: 20 },
      { id: 'scarf', name: 'Woolen Scarf', emoji: '🧣', basePrice: 350, quality: 8, category: 'clothing', description: 'Warm woolen scarf', negotiable: true, bargainStrength: 25 },
    ]
  },
  {
    id: 'electronics-dealer',
    name: 'Amit Electronics',
    emoji: '📱',
    personality: 'tough',
    specialty: 'Gadgets & Electronics',
    initialMood: 5,
    reputation: 6,
    products: [
      { id: 'earbuds', name: 'Wireless Earbuds', emoji: '🎧', basePrice: 1800, quality: 8, category: 'electronics', description: 'Bluetooth wireless earbuds', negotiable: true, bargainStrength: 15 },
      { id: 'charger', name: 'Fast Charger', emoji: '🔌', basePrice: 450, quality: 7, category: 'electronics', description: 'Quick charge adapter', negotiable: true, bargainStrength: 10 },
      { id: 'cable', name: 'USB Cable', emoji: '📱', basePrice: 120, quality: 6, category: 'electronics', description: 'Durable USB cable', negotiable: false, bargainStrength: 0 },
    ]
  },
  {
    id: 'book-seller',
    name: 'Suresh Book Stall',
    emoji: '📚',
    personality: 'friendly',
    specialty: 'Books & Stationery',
    initialMood: 9,
    reputation: 9,
    products: [
      { id: 'novel', name: 'Popular Novel', emoji: '📖', basePrice: 280, quality: 8, category: 'books', description: 'Bestselling fiction novel', negotiable: true, bargainStrength: 20 },
      { id: 'notebook', name: 'Spiral Notebook', emoji: '📓', basePrice: 65, quality: 7, category: 'books', description: 'Quality spiral notebook', negotiable: true, bargainStrength: 15 },
      { id: 'pen-set', name: 'Gel Pen Set', emoji: '🖊️', basePrice: 120, quality: 8, category: 'books', description: 'Smooth gel pens pack', negotiable: true, bargainStrength: 25 },
    ]
  },
  {
    id: 'souvenir-shop',
    name: 'Delhi Souvenirs',
    emoji: '🎁',
    personality: 'greedy',
    specialty: 'Souvenirs & Gifts',
    initialMood: 4,
    reputation: 5,
    products: [
      { id: 'keychain', name: 'Delhi Keychain', emoji: '🗝️', basePrice: 150, quality: 6, category: 'souvenirs', description: 'Brass Delhi keychain', negotiable: true, bargainStrength: 35 },
      { id: 'magnet', name: 'India Magnet', emoji: '🧲', basePrice: 80, quality: 7, category: 'souvenirs', description: 'Refrigerator magnet', negotiable: true, bargainStrength: 30 },
      { id: 'postcard', name: 'Delhi Postcard Set', emoji: '📬', basePrice: 60, quality: 8, category: 'souvenirs', description: 'Beautiful Delhi postcards', negotiable: true, bargainStrength: 20 },
    ]
  }
];

const SHOPPING_LISTS = [
  ['turmeric', 'cumin', 'notebook'],
  ['sari', 'earbuds', 'novel'],
  ['keychain', 'pen-set', 'charger'],
  ['scarf', 'magnet', 'cardamom']
];

export default function IndianStreetMarket({ onClose }: { onClose: () => void }) {
  const [marketState, setMarketState] = useState<MarketState>({
    timeRemaining: 600, // 10 minutes
    crowdLevel: 3,
    playerBudget: 3000,
    shoppingList: SHOPPING_LISTS[Math.floor(Math.random() * SHOPPING_LISTS.length)],
    cart: [],
    reputation: 5,
    completedDeals: 0
  });
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'shopping' | 'checkout' | 'results'>('shopping');
  const [marketResults, setMarketResults] = useState<any>(null);

  // Timer effect
  useEffect(() => {
    if (marketState.timeRemaining > 0 && gamePhase === 'shopping') {
      const timer = setTimeout(() => {
        setMarketState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
          crowdLevel: Math.min(10, prev.crowdLevel + (Math.random() > 0.95 ? 1 : 0)) // Crowd grows occasionally
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (marketState.timeRemaining === 0 && gamePhase === 'shopping') {
      handleCheckout();
    }
  }, [marketState.timeRemaining, gamePhase]);

  const getCurrentPrice = (product: Product, vendor: Vendor) => {
    const basePrice = product.basePrice;
    const crowdMultiplier = 1 + (marketState.crowdLevel - 5) * 0.05; // Crowd increases prices
    const moodMultiplier = vendor.initialMood >= 7 ? 0.95 : vendor.initialMood <= 4 ? 1.1 : 1.0;
    const reputationMultiplier = vendor.reputation >= 8 ? 0.9 : vendor.reputation <= 5 ? 1.05 : 1.0;

    return Math.round(basePrice * crowdMultiplier * moodMultiplier * reputationMultiplier);
  };

  const negotiatePrice = (product: Product, vendor: Vendor) => {
    const currentPrice = getCurrentPrice(product, vendor);
    const maxReduction = product.bargainStrength / 100;
    const negotiationSkill = Math.random() * 0.3 + 0.4; // 40-70% of max reduction
    const reduction = Math.round(currentPrice * maxReduction * negotiationSkill);

    return Math.max(currentPrice - reduction, product.basePrice * 0.7); // Minimum 70% of base price
  };

  const addToCart = (product: Product, vendor: Vendor, negotiated: boolean = false) => {
    const price = negotiated ? negotiatePrice(product, vendor) : getCurrentPrice(product, vendor);

    if (price > marketState.playerBudget) {
      Alert.alert("Insufficient Budget", "You don't have enough money for this item.");
      return;
    }

    const existingItem = marketState.cart.find(item => item.productId === product.id && item.vendorId === vendor.id);

    if (existingItem) {
      Alert.alert("Already Purchased", "You already have this item in your cart.");
      return;
    }

    const newCartItem: ShoppingCart = {
      productId: product.id,
      vendorId: vendor.id,
      quantity: 1,
      negotiatedPrice: price,
      originalPrice: getCurrentPrice(product, vendor)
    };

    setMarketState(prev => ({
      ...prev,
      cart: [...prev.cart, newCartItem],
      playerBudget: prev.playerBudget - price,
      reputation: negotiated ? prev.reputation + 1 : prev.reputation,
      completedDeals: prev.completedDeals + 1
    }));

    // Update vendor mood based on negotiation
    if (negotiated && vendor.personality === 'tough') {
      // Tough vendors get annoyed by hard bargaining
      const updatedVendor = { ...vendor, initialMood: Math.max(1, vendor.initialMood - 1) };
      // This would update the vendor in the global state
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckout = () => {
    setGamePhase('checkout');
  };

  const completeShopping = () => {
    const totalSpent = marketState.cart.reduce((sum, item) => sum + item.negotiatedPrice, 0);
    const itemsFound = marketState.shoppingList.filter(itemId =>
      marketState.cart.some(cartItem => cartItem.productId === itemId)
    ).length;
    const shoppingListCompletion = (itemsFound / marketState.shoppingList.length) * 100;

    const savings = marketState.cart.reduce((sum, item) => sum + (item.originalPrice - item.negotiatedPrice), 0);
    const negotiationSkill = marketState.cart.length > 0 ? (savings / marketState.cart.reduce((sum, item) => sum + item.originalPrice, 0)) * 100 : 0;

    const qualityScore = marketState.cart.reduce((sum, item) => {
      const product = VENDORS.find(v => v.id === item.vendorId)?.products.find(p => p.id === item.productId);
      return sum + (product?.quality || 0);
    }, 0) / Math.max(marketState.cart.length, 1);

    const results = {
      totalSpent,
      itemsPurchased: marketState.cart.length,
      shoppingListCompletion: Math.round(shoppingListCompletion),
      savings: Math.round(savings),
      negotiationSkill: Math.round(negotiationSkill),
      qualityScore: Math.round(qualityScore),
      reputation: marketState.reputation,
      timeEfficiency: Math.round(((600 - marketState.timeRemaining) / 600) * 100),
      budgetEfficiency: Math.round((totalSpent / 3000) * 100)
    };

    setMarketResults(results);
    setGamePhase('results');
  };

  const resetGame = () => {
    setMarketState({
      timeRemaining: 600,
      crowdLevel: 3,
      playerBudget: 3000,
      shoppingList: SHOPPING_LISTS[Math.floor(Math.random() * SHOPPING_LISTS.length)],
      cart: [],
      reputation: 5,
      completedDeals: 0
    });
    setSelectedVendor(null);
    setGamePhase('shopping');
    setMarketResults(null);
  };

  if (gamePhase === 'shopping') {
    const selectedVendorData = selectedVendor ? VENDORS.find(v => v.id === selectedVendor) : null;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.marketContainer}>
          <Text style={styles.title}>🏪 Indian Street Market</Text>
          <Text style={styles.subtitle}>Navigate the Bazaar & Shop Smart!</Text>

          {/* Market Status */}
          <View style={styles.marketStatus}>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>⏰ Time: {formatTime(marketState.timeRemaining)}</Text>
              <Text style={styles.statusText}>👥 Crowd: {marketState.crowdLevel}/10</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>💰 Budget: ₹{marketState.playerBudget.toLocaleString()}</Text>
              <Text style={styles.statusText}>⭐ Reputation: {marketState.reputation}/10</Text>
            </View>
          </View>

          {/* Shopping List */}
          <View style={styles.shoppingList}>
            <Text style={styles.listTitle}>🛒 Shopping List ({marketState.cart.length}/{marketState.shoppingList.length} found)</Text>
            {marketState.shoppingList.map(itemId => {
              const product = VENDORS.flatMap(v => v.products).find(p => p.id === itemId);
              const isFound = marketState.cart.some(cartItem => cartItem.productId === itemId);
              return (
                <Text key={itemId} style={[styles.listItem, isFound && styles.foundItem]}>
                  {isFound ? '✅' : '⬜'} {product?.name}
                </Text>
              );
            })}
          </View>

          {/* Cart Summary */}
          <View style={styles.cartSummary}>
            <Text style={styles.cartTitle}>🛒 Cart ({marketState.cart.length} items)</Text>
            <Text style={styles.cartTotal}>Total: ₹{marketState.cart.reduce((sum, item) => sum + item.negotiatedPrice, 0).toLocaleString()}</Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>

          {!selectedVendor ? (
            /* Vendor Selection */
            <View style={styles.vendorGrid}>
              <Text style={styles.sectionTitle}>Choose a Vendor</Text>
              {VENDORS.map(vendor => (
                <TouchableOpacity
                  key={vendor.id}
                  style={styles.vendorCard}
                  onPress={() => setSelectedVendor(vendor.id)}
                >
                  <Text style={styles.vendorEmoji}>{vendor.emoji}</Text>
                  <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName}>{vendor.name}</Text>
                    <Text style={styles.vendorSpecialty}>{vendor.specialty}</Text>
                    <Text style={styles.vendorMood}>
                      Mood: {vendor.initialMood}/10 • Rep: {vendor.reputation}/10
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          ) : selectedVendorData ? (
            /* Product Selection */
            <View style={styles.productView}>
              <View style={styles.vendorHeader}>
                <TouchableOpacity style={styles.backButton} onPress={() => setSelectedVendor(null)}>
                  <Ionicons name="arrow-back" size={24} color="#d2691e" />
                  <Text style={styles.backText}>Back to Vendors</Text>
                </TouchableOpacity>
                <View style={styles.vendorDetails}>
                  <Text style={styles.vendorTitle}>{selectedVendorData.emoji} {selectedVendorData.name}</Text>
                  <Text style={styles.vendorDesc}>{selectedVendorData.specialty}</Text>
                </View>
              </View>

              <View style={styles.productsGrid}>
                {selectedVendorData.products.map(product => {
                  const currentPrice = getCurrentPrice(product, selectedVendorData);
                  const negotiatedPrice = negotiatePrice(product, selectedVendorData);
                  const savings = currentPrice - negotiatedPrice;

                  return (
                    <View key={product.id} style={styles.productCard}>
                      <Text style={styles.productEmoji}>{product.emoji}</Text>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDesc}>{product.description}</Text>
                      <View style={styles.priceInfo}>
                        <Text style={styles.currentPrice}>₹{currentPrice}</Text>
                        {product.negotiable && (
                          <Text style={styles.negotiatedPrice}>Negotiate: ₹{negotiatedPrice} (Save ₹{savings})</Text>
                        )}
                      </View>
                      <View style={styles.productStats}>
                        <Text style={styles.statText}>Quality: {product.quality}/10</Text>
                        <Text style={styles.statText}>Negotiable: {product.negotiable ? 'Yes' : 'No'}</Text>
                      </View>

                      <View style={styles.productActions}>
                        <TouchableOpacity
                          style={styles.buyButton}
                          onPress={() => addToCart(product, selectedVendorData, false)}
                        >
                          <Text style={styles.buyText}>Buy at ₹{currentPrice}</Text>
                        </TouchableOpacity>
                        {product.negotiable && (
                          <TouchableOpacity
                            style={styles.negotiateButton}
                            onPress={() => addToCart(product, selectedVendorData, true)}
                          >
                            <Text style={styles.negotiateText}>Negotiate</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'checkout') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.checkoutContainer}>
          <Text style={styles.title}>🛒 Checkout</Text>
          <Text style={styles.subtitle}>Review Your Purchases</Text>

          {/* Final Cart */}
          <View style={styles.finalCart}>
            {marketState.cart.map((item, index) => {
              const vendor = VENDORS.find(v => v.id === item.vendorId);
              const product = vendor?.products.find(p => p.id === item.productId);
              const savings = item.originalPrice - item.negotiatedPrice;

              return (
                <View key={index} style={styles.cartItem}>
                  <Text style={styles.itemEmoji}>{product?.emoji}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{product?.name}</Text>
                    <Text style={styles.itemVendor}>from {vendor?.name}</Text>
                    <View style={styles.itemPricing}>
                      <Text style={styles.itemPrice}>₹{item.negotiatedPrice}</Text>
                      {savings > 0 && (
                        <Text style={styles.itemSavings}>(Saved ₹{savings})</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Shopping Summary */}
          <View style={styles.checkoutSummary}>
            <Text style={styles.summaryTitle}>📊 Shopping Summary</Text>
            <Text style={styles.summaryText}>
              Items Purchased: {marketState.cart.length}{'\n'}
              Total Spent: ₹{marketState.cart.reduce((sum, item) => sum + item.negotiatedPrice, 0).toLocaleString()}{'\n'}
              Budget Remaining: ₹{marketState.playerBudget.toLocaleString()}{'\n'}
              Deals Completed: {marketState.completedDeals}{'\n'}
              Market Reputation: {marketState.reputation}/10
            </Text>
          </View>

          <TouchableOpacity style={styles.completeButton} onPress={completeShopping}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.completeText}>Complete Shopping Trip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (marketResults) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.resultsContainer}>
          <Text style={styles.title}>🎉 Market Adventure Complete!</Text>

          {/* Key Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>₹{marketResults.totalSpent.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Total Spent</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{marketResults.shoppingListCompletion}%</Text>
                <Text style={styles.metricLabel}>List Completed</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>₹{marketResults.savings}</Text>
                <Text style={styles.metricLabel}>Money Saved</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{marketResults.negotiationSkill}%</Text>
                <Text style={styles.metricLabel}>Negotiation Skill</Text>
              </View>
            </View>
          </View>

          {/* Performance Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>🏆 Bazaar Shopping Rating</Text>
            <Text style={styles.rating}>
              {marketResults.shoppingListCompletion >= 80 && marketResults.negotiationSkill >= 15 ?
                "🌟 MASTER BARGAINER! Excellent shopping skills!" :
               marketResults.shoppingListCompletion >= 60 && marketResults.negotiationSkill >= 10 ?
                "🎯 SMART SHOPPER! Good value for money!" :
               marketResults.shoppingListCompletion >= 40 ?
                "👍 DECENT BUYER! Room for improvement!" :
               "🤔 NOVICE SHOPPER! Learn more bargaining techniques!"}
            </Text>
          </View>

          {/* Detailed Results */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>📈 Detailed Performance</Text>
            <Text style={styles.detailsText}>
              Items Purchased: {marketResults.itemsPurchased}{'\n'}
              Quality Score: {marketResults.qualityScore}/10{'\n'}
              Time Efficiency: {marketResults.timeEfficiency}%{'\n'}
              Budget Efficiency: {marketResults.budgetEfficiency}%{'\n'}
              Market Reputation: {marketResults.reputation}/10
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.restartText}>Shop Again</Text>
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
    backgroundColor: "#fef5e7",
  },
  marketContainer: {
    padding: 15,
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
  marketStatus: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  shoppingList: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  foundItem: {
    color: "#27ae60",
    textDecorationLine: "line-through",
  },
  cartSummary: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: "#f39c12",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  vendorGrid: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  vendorEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  vendorSpecialty: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  vendorMood: {
    fontSize: 12,
    color: "#8b4513",
  },
  productView: {
    flex: 1,
  },
  vendorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  backText: {
    color: "#d2691e",
    fontWeight: "600",
    marginLeft: 5,
  },
  vendorDetails: {
    flex: 1,
  },
  vendorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
  },
  vendorDesc: {
    fontSize: 14,
    color: "#8b4513",
  },
  productsGrid: {
    flex: 1,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
  },
  productEmoji: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  priceInfo: {
    alignItems: "center",
    marginBottom: 10,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27ae60",
  },
  negotiatedPrice: {
    fontSize: 12,
    color: "#d2691e",
    marginTop: 2,
  },
  productStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statText: {
    fontSize: 12,
    color: "#8b4513",
    fontWeight: "600",
  },
  productActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 5,
  },
  buyText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  negotiateButton: {
    flex: 1,
    backgroundColor: "#d2691e",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 5,
  },
  negotiateText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  checkoutContainer: {
    padding: 20,
  },
  finalCart: {
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },
  itemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  itemVendor: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  itemPricing: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  itemSavings: {
    fontSize: 12,
    color: "#d2691e",
    marginLeft: 8,
  },
  checkoutSummary: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: "#27ae60",
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  completeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
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
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    width: "100%",
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  detailsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
});
