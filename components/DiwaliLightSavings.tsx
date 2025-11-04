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

type LightType = {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  quality: number; // 1-10 scale
  culturalValue: number; // 1-10 scale
  energyEfficiency: number; // 1-10 scale
  description: string;
  category: 'entrance' | 'interior' | 'courtyard' | 'community';
};

type SavingsPlan = {
  monthlySavings: number;
  monthsToSave: number;
  totalSaved: number;
  interestEarned: number;
  festivalBudget: number;
  lightsPurchased: LightType[];
  satisfaction: number;
  culturalScore: number;
  familyHappiness: number;
  feedback: string[];
};

const LIGHT_TYPES: LightType[] = [
  // Entrance Lights
  { id: 'traditional-diya', name: 'Traditional Oil Diyas', emoji: '🪔', baseCost: 200, quality: 6, culturalValue: 9, energyEfficiency: 3, description: 'Authentic clay oil lamps', category: 'entrance' },
  { id: 'led-entrance', name: 'LED Entrance String Lights', emoji: '✨', baseCost: 800, quality: 8, culturalValue: 6, energyEfficiency: 9, description: 'Modern LED light strings', category: 'entrance' },
  { id: 'decorative-lanterns', name: 'Decorative Lanterns', emoji: '🏮', baseCost: 600, quality: 7, culturalValue: 8, energyEfficiency: 5, description: 'Handcrafted decorative lanterns', category: 'entrance' },

  // Interior Lights
  { id: 'interior-led', name: 'LED Interior Lights', emoji: '💡', baseCost: 400, quality: 8, culturalValue: 5, energyEfficiency: 9, description: 'Energy-efficient room lighting', category: 'interior' },
  { id: 'candle-stands', name: 'Decorative Candle Stands', emoji: '🕯️', baseCost: 300, quality: 6, culturalValue: 7, energyEfficiency: 4, description: 'Traditional candle arrangements', category: 'interior' },
  { id: 'diwali-lamps', name: 'Festival Hanging Lamps', emoji: '🎐', baseCost: 500, quality: 7, culturalValue: 8, energyEfficiency: 6, description: 'Colorful hanging light fixtures', category: 'interior' },

  // Courtyard Lights
  { id: 'courtyard-setup', name: 'Courtyard Light Setup', emoji: '🎆', baseCost: 1200, quality: 9, culturalValue: 8, energyEfficiency: 7, description: 'Complete outdoor lighting display', category: 'courtyard' },
  { id: 'ground-lanterns', name: 'Ground Lanterns', emoji: '🏮', baseCost: 350, quality: 6, culturalValue: 7, energyEfficiency: 5, description: 'Pathway and garden lanterns', category: 'courtyard' },
  { id: 'solar-lights', name: 'Solar Festival Lights', emoji: '☀️', baseCost: 700, quality: 7, culturalValue: 6, energyEfficiency: 10, description: 'Eco-friendly solar powered lights', category: 'courtyard' },

  // Community Contribution
  { id: 'temple-lights', name: 'Temple Light Contribution', emoji: '🙏', baseCost: 300, quality: 8, culturalValue: 10, energyEfficiency: 6, description: 'Lights for local temple/community', category: 'community' },
  { id: 'street-lighting', name: 'Street Lighting Project', emoji: '🏘️', baseCost: 500, quality: 7, culturalValue: 9, energyEfficiency: 8, description: 'Neighborhood street illumination', category: 'community' },
];

export default function DiwaliLightSavings({ onClose }: { onClose: () => void }) {
  const [familySize, setFamilySize] = useState(4);
  const [monthlyIncome, setMonthlyIncome] = useState(50000);
  const [savingsGoal, setSavingsGoal] = useState(8000);
  const [currentSavings, setCurrentSavings] = useState(2000);
  const [monthlySavings, setMonthlySavings] = useState(1000);
  const [selectedLights, setSelectedLights] = useState<LightType[]>([]);
  const [gamePhase, setGamePhase] = useState<'planning' | 'saving' | 'festival' | 'results'>('planning');
  const [savingsPlan, setSavingsPlan] = useState<SavingsPlan | null>(null);
  const [monthsElapsed, setMonthsElapsed] = useState(0);

  const startSaving = () => {
    const monthsNeeded = Math.ceil((savingsGoal - currentSavings) / monthlySavings);
    setGamePhase('saving');
  };

  const advanceMonth = () => {
    setMonthsElapsed(prev => prev + 1);
    setCurrentSavings(prev => prev + monthlySavings + (prev * 0.005)); // 0.5% monthly interest

    if (currentSavings + (monthlySavings * (monthsElapsed + 1)) >= savingsGoal) {
      prepareFestival();
    }
  };

  const prepareFestival = () => {
    setGamePhase('festival');
  };

  const purchaseLight = (light: LightType) => {
    const currentCost = selectedLights.reduce((sum, l) => sum + l.baseCost, 0);
    const newCost = currentCost + light.baseCost;

    if (newCost > currentSavings) {
      Alert.alert("Insufficient Funds", "You don't have enough saved for this lighting option.");
      return;
    }

    if (selectedLights.includes(light)) {
      setSelectedLights(selectedLights.filter(l => l.id !== light.id));
    } else {
      setSelectedLights([...selectedLights, light]);
    }
  };

  const calculateFestivalResults = () => {
    const totalSpent = selectedLights.reduce((sum, l) => sum + l.baseCost, 0);
    const remainingBudget = currentSavings - totalSpent;

    // Calculate satisfaction scores
    const avgQuality = selectedLights.length > 0
      ? selectedLights.reduce((sum, l) => sum + l.quality, 0) / selectedLights.length
      : 0;
    const avgCulturalValue = selectedLights.length > 0
      ? selectedLights.reduce((sum, l) => sum + l.culturalValue, 0) / selectedLights.length
      : 0;
    const avgEfficiency = selectedLights.length > 0
      ? selectedLights.reduce((sum, l) => sum + l.energyEfficiency, 0) / selectedLights.length
      : 0;

    // Category balance
    const hasEntrance = selectedLights.some(l => l.category === 'entrance');
    const hasInterior = selectedLights.some(l => l.category === 'interior');
    const hasCourtyard = selectedLights.some(l => l.category === 'courtyard');
    const hasCommunity = selectedLights.some(l => l.category === 'community');
    const categoryBalance = [hasEntrance, hasInterior, hasCourtyard, hasCommunity].filter(Boolean).length;

    let satisfactionScore = 50;
    satisfactionScore += (avgQuality - 5) * 5;
    satisfactionScore += (avgCulturalValue - 5) * 4;
    satisfactionScore += categoryBalance * 8;
    satisfactionScore += Math.min(remainingBudget / currentSavings * 50, 20);

    const feedback: string[] = [];
    if (avgCulturalValue >= 8) feedback.push("Excellent cultural authenticity maintained!");
    if (avgEfficiency >= 8) feedback.push("Great choice for energy efficiency and cost savings!");
    if (categoryBalance >= 3) feedback.push("Well-balanced lighting across all areas!");
    if (remainingBudget > currentSavings * 0.3) feedback.push("Considered future expenses wisely!");
    if (selectedLights.length === 0) feedback.push("Remember, Diwali is about light and joy!");

    const plan: SavingsPlan = {
      monthlySavings,
      monthsToSave: monthsElapsed,
      totalSaved: currentSavings,
      interestEarned: currentSavings - (currentSavings - (monthlySavings * monthsElapsed)),
      festivalBudget: totalSpent,
      lightsPurchased: selectedLights,
      satisfaction: Math.max(0, Math.min(100, satisfactionScore)),
      culturalScore: Math.round(avgCulturalValue),
      familyHappiness: Math.round(avgQuality * 0.7 + avgCulturalValue * 0.3),
      feedback
    };

    setSavingsPlan(plan);
    setGamePhase('results');
  };

  const resetGame = () => {
    setSelectedLights([]);
    setGamePhase('planning');
    setSavingsPlan(null);
    setMonthsElapsed(0);
    setCurrentSavings(2000);
  };

  const filteredLights = LIGHT_TYPES.filter(light => {
    const currentCost = selectedLights.reduce((sum, l) => sum + l.baseCost, 0);
    return currentCost + light.baseCost <= currentSavings || selectedLights.includes(light);
  });

  if (gamePhase === 'planning') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.planningContainer}>
          <Text style={styles.title}>🪔 Diwali Light Savings</Text>
          <Text style={styles.subtitle}>Plan Your Festival Illumination</Text>

          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>💰 Family Financial Profile</Text>

            {/* Family Size */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>👥 Family Size</Text>
              <View style={styles.sizeSelector}>
                {[3, 4, 5, 6, 8].map(size => (
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

            {/* Monthly Income */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>💼 Monthly Income (₹)</Text>
              <View style={styles.incomeSelector}>
                {[30000, 50000, 75000, 100000].map(income => (
                  <TouchableOpacity
                    key={income}
                    style={[styles.incomeButton, monthlyIncome === income && styles.selectedIncome]}
                    onPress={() => setMonthlyIncome(income)}
                  >
                    <Text style={[styles.incomeText, monthlyIncome === income && styles.selectedIncomeText]}>
                      ₹{income.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Savings Goal */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>🎯 Diwali Lighting Budget Goal (₹)</Text>
              <View style={styles.goalSelector}>
                {[5000, 8000, 12000, 15000].map(goal => (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.goalButton, savingsGoal === goal && styles.selectedGoal]}
                    onPress={() => setSavingsGoal(goal)}
                  >
                    <Text style={[styles.goalText, savingsGoal === goal && styles.selectedGoalText]}>
                      ₹{goal.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Current Savings */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>🏦 Current Savings (₹)</Text>
              <Text style={styles.currentSavings}>₹{currentSavings.toLocaleString()}</Text>
            </View>

            {/* Monthly Savings Commitment */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>📅 Monthly Savings (₹)</Text>
              <View style={styles.savingsSelector}>
                {[500, 1000, 1500, 2000].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.savingsButton, monthlySavings === amount && styles.selectedSavings]}
                    onPress={() => setMonthlySavings(amount)}
                  >
                    <Text style={[styles.savingsText, monthlySavings === amount && styles.selectedSavingsText]}>
                      ₹{amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Planning Summary */}
            <View style={styles.planningSummary}>
              <Text style={styles.summaryTitle}>📊 Your Savings Plan</Text>
              <Text style={styles.summaryText}>
                • Target: ₹{savingsGoal.toLocaleString()} for Diwali lighting{'\n'}
                • Monthly commitment: ₹{monthlySavings.toLocaleString()}{'\n'}
                • Months to reach goal: {Math.ceil((savingsGoal - currentSavings) / monthlySavings)}{'\n'}
                • Festival celebration: 6 months from now
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startSaving}>
            <Ionicons name="wallet" size={24} color="#fff" />
            <Text style={styles.startText}>Start Saving Journey</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="exit-outline" size={18} color="#666" />
            <Text style={styles.closeText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'saving') {
    const monthsNeeded = Math.ceil((savingsGoal - currentSavings) / monthlySavings);
    const progressPercent = Math.min((currentSavings / savingsGoal) * 100, 100);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.savingContainer}>
          <Text style={styles.title}>💰 Diwali Savings Journey</Text>
          <Text style={styles.subtitle}>Month {monthsElapsed + 1} of {monthsNeeded}</Text>

          {/* Progress Tracking */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>🎯 Savings Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressText}>Saved: ₹{currentSavings.toLocaleString()}</Text>
              <Text style={styles.progressText}>Goal: ₹{savingsGoal.toLocaleString()}</Text>
              <Text style={styles.progressText}>Remaining: ₹{(savingsGoal - currentSavings).toLocaleString()}</Text>
            </View>
          </View>

          {/* Monthly Activity */}
          <View style={styles.monthCard}>
            <Text style={styles.monthTitle}>📅 This Month's Savings</Text>
            <View style={styles.monthStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>₹{monthlySavings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Monthly Savings</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>₹{(currentSavings * 0.005).toFixed(0)}</Text>
                <Text style={styles.statLabel}>Interest Earned</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>₹{(monthlySavings + (currentSavings * 0.005)).toFixed(0)}</Text>
                <Text style={styles.statLabel}>Total Added</Text>
              </View>
            </View>
          </View>

          {/* Festival Countdown */}
          <View style={styles.countdownCard}>
            <Text style={styles.countdownTitle}>🪔 Diwali Festival</Text>
            <Text style={styles.countdownText}>
              {Math.max(0, 6 - monthsElapsed)} months until Diwali celebration
            </Text>
            <Text style={styles.festivalTip}>
              💡 Tip: Prices increase closer to festival. Early planning saves money!
            </Text>
          </View>

          {currentSavings >= savingsGoal ? (
            <TouchableOpacity style={styles.festivalButton} onPress={prepareFestival}>
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.festivalText}>Diwali Festival Time!</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.advanceButton} onPress={advanceMonth}>
              <Ionicons name="calendar" size={24} color="#fff" />
              <Text style={styles.advanceText}>Complete Month & Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'festival') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.festivalContainer}>
          <Text style={styles.title}>🪔 Diwali Festival Planning</Text>
          <Text style={styles.subtitle}>Choose Your Lighting Setup</Text>

          {/* Budget Summary */}
          <View style={styles.budgetSummary}>
            <Text style={styles.budgetTitle}>💰 Festival Budget</Text>
            <Text style={styles.budgetAmount}>₹{currentSavings.toLocaleString()} available</Text>
          </View>

          {/* Light Categories */}
          <View style={styles.categoriesContainer}>
            {(['entrance', 'interior', 'courtyard', 'community'] as const).map(category => {
              const categoryLights = filteredLights.filter(light => light.category === category);
              const selectedInCategory = selectedLights.filter(light => light.category === category);

              return (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>
                    {category === 'entrance' ? '🚪 Entrance Lights' :
                     category === 'interior' ? '🏠 Interior Lights' :
                     category === 'courtyard' ? '🌳 Courtyard Lights' :
                     '🙏 Community Lights'}
                  </Text>

                  {categoryLights.map(light => {
                    const isSelected = selectedLights.includes(light);
                    return (
                      <TouchableOpacity
                        key={light.id}
                        style={[styles.lightCard, isSelected && styles.selectedLight]}
                        onPress={() => purchaseLight(light)}
                      >
                        <View style={styles.lightInfo}>
                          <Text style={styles.lightEmoji}>{light.emoji}</Text>
                          <View style={styles.lightDetails}>
                            <Text style={styles.lightName}>{light.name}</Text>
                            <Text style={styles.lightDesc}>{light.description}</Text>
                            <View style={styles.lightMetrics}>
                              <Text style={styles.metricText}>Quality: {light.quality}/10</Text>
                              <Text style={styles.metricText}>Culture: {light.culturalValue}/10</Text>
                              <Text style={styles.metricText}>Efficiency: {light.energyEfficiency}/10</Text>
                            </View>
                          </View>
                          <View style={styles.lightCost}>
                            <Text style={styles.costText}>₹{light.baseCost}</Text>
                            {isSelected && <Ionicons name="checkmark-circle" size={24} color="#27ae60" />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>

          {/* Selection Summary */}
          <View style={styles.selectionSummary}>
            <Text style={styles.summaryTitle}>🛒 Your Lighting Selection</Text>
            <Text style={styles.summaryText}>
              {selectedLights.length} lighting items selected • Total cost: ₹{selectedLights.reduce((sum, l) => sum + l.baseCost, 0).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.calculateButton}
            onPress={calculateFestivalResults}
            disabled={selectedLights.length === 0}
          >
            <Ionicons name="sparkles" size={24} color="#fff" />
            <Text style={styles.calculateText}>Celebrate Diwali!</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (savingsPlan) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.resultsContainer}>
          <Text style={styles.title}>🎉 Diwali Celebration Results</Text>

          {/* Key Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>₹{savingsPlan.totalSaved.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Total Saved</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{savingsPlan.satisfaction}%</Text>
                <Text style={styles.metricLabel}>Festival Satisfaction</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{savingsPlan.culturalScore}/10</Text>
                <Text style={styles.metricLabel}>Cultural Authenticity</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{savingsPlan.familyHappiness}%</Text>
                <Text style={styles.metricLabel}>Family Happiness</Text>
              </View>
            </View>
          </View>

          {/* Performance Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>🏆 Festival Planning Rating</Text>
            <Text style={styles.rating}>
              {savingsPlan.satisfaction >= 85 ? "🌟 EXCEPTIONAL DIWALI CELEBRATION!" :
               savingsPlan.satisfaction >= 70 ? "🪔 AUTHENTIC FESTIVAL SPIRIT!" :
               savingsPlan.satisfaction >= 55 ? "✨ GOOD FAMILY CELEBRATION!" :
               savingsPlan.satisfaction >= 40 ? "🎊 DECENT FESTIVAL PLANNING!" :
               "💭 ROOM FOR IMPROVEMENT!"}
            </Text>
          </View>

          {/* Lighting Setup */}
          <View style={styles.lightingCard}>
            <Text style={styles.lightingTitle}>🪔 Your Diwali Lighting Setup</Text>
            {savingsPlan.lightsPurchased.map(light => (
              <View key={light.id} style={styles.lightRow}>
                <Text style={styles.lightEmoji}>{light.emoji}</Text>
                <View style={styles.lightInfo}>
                  <Text style={styles.lightName}>{light.name}</Text>
                  <Text style={styles.lightDesc}>{light.description}</Text>
                </View>
                <Text style={styles.lightCost}>₹{light.baseCost}</Text>
              </View>
            ))}
          </View>

          {/* Feedback */}
          {savingsPlan.feedback.length > 0 && (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>💡 Festival Planning Insights</Text>
              {savingsPlan.feedback.map((feedback, index) => (
                <Text key={index} style={styles.feedbackText}>• {feedback}</Text>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.restartText}>Plan Another Diwali</Text>
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
    backgroundColor: "#fef7e0",
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
  },
  sizeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f4e4bc",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  selectedSize: {
    backgroundColor: "#d2691e",
  },
  sizeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8b4513",
  },
  selectedSizeText: {
    color: "#fff",
  },
  incomeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  incomeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f4e4bc",
    elevation: 2,
  },
  selectedIncome: {
    backgroundColor: "#d2691e",
  },
  incomeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8b4513",
  },
  selectedIncomeText: {
    color: "#fff",
  },
  goalSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  goalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f4e4bc",
    elevation: 2,
  },
  selectedGoal: {
    backgroundColor: "#d2691e",
  },
  goalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8b4513",
  },
  selectedGoalText: {
    color: "#fff",
  },
  currentSavings: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27ae60",
    textAlign: "center",
  },
  savingsSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  savingsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f4e4bc",
    elevation: 2,
  },
  selectedSavings: {
    backgroundColor: "#d2691e",
  },
  savingsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8b4513",
  },
  selectedSavingsText: {
    color: "#fff",
  },
  planningSummary: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  summaryText: {
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
  savingContainer: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f4e4bc",
    borderRadius: 4,
    marginBottom: 15,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#d2691e",
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 14,
    color: "#8b4513",
    fontWeight: "600",
  },
  monthCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  monthStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27ae60",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  countdownCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 10,
  },
  countdownText: {
    fontSize: 16,
    color: "#856404",
    marginBottom: 10,
  },
  festivalTip: {
    fontSize: 14,
    color: "#856404",
    fontStyle: "italic",
  },
  advanceButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  advanceText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  festivalButton: {
    backgroundColor: "#d2691e",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  festivalText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  festivalContainer: {
    padding: 20,
  },
  budgetSummary: {
    backgroundColor: "#e8f5e8",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
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
  categoriesContainer: {
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  lightCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  selectedLight: {
    borderWidth: 2,
    borderColor: "#d2691e",
  },
  lightInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  lightEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  lightDetails: {
    flex: 1,
  },
  lightName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  lightDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  lightMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricText: {
    fontSize: 12,
    color: "#8b4513",
    fontWeight: "600",
  },
  lightCost: {
    alignItems: "center",
  },
  costText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 5,
  },
  selectionSummary: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  calculateButton: {
    backgroundColor: "#d2691e",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  calculateText: {
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
  lightingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    width: "100%",
  },
  lightingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  lightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
