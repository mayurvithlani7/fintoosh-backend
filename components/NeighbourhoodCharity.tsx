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
import { updateAchievementProgress } from "./AchievementSystem";

const { width } = Dimensions.get("window");

type CommunityCause = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  category: 'animals' | 'education' | 'healthcare' | 'environment' | 'housing' | 'elderly' | 'children' | 'emergency';
  beneficiaries: string;
  impact: string;
  sustainability: number; // 1-10 scale
};

type Allocation = {
  causeId: string;
  amount: number;
};

type CommunityImpact = {
  totalAllocated: number;
  communitySatisfaction: number;
  beneficiariesReached: number;
  sustainabilityScore: number;
  feedback: string[];
  stories: string[];
  round: number;
  seasonalEvent?: SeasonalEvent;
  longTermEffects: string[];
};

type SeasonalEvent = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  affectedCategories: string[];
  urgencyModifier: number; // How much this increases urgency
  budgetModifier: number; // Additional budget available
  specialCauses: CommunityCause[];
};

type GameState = {
  round: number;
  totalBudgetUsed: number;
  historicalAllocations: Allocation[][];
  communityHealth: number; // Overall community well-being score
  completedEvents: string[];
};

const COMMUNITY_CAUSES: CommunityCause[] = [
  // Animals
  { id: 'animal-shelter', name: 'Animal Shelter Expansion', emoji: '🐕', description: 'Build new shelters and provide veterinary care', urgency: 'high', category: 'animals', beneficiaries: '200 stray animals', impact: 'Reduce animal suffering by 40%', sustainability: 8 },
  { id: 'wildlife-protection', name: 'Wildlife Conservation', emoji: '🦌', description: 'Protect local wildlife habitats and endangered species', urgency: 'medium', category: 'animals', beneficiaries: 'Local ecosystem', impact: 'Preserve biodiversity', sustainability: 9 },

  // Education
  { id: 'school-supplies', name: 'School Supplies Program', emoji: '📚', description: 'Provide books and materials for underprivileged children', urgency: 'critical', category: 'education', beneficiaries: '500 children', impact: 'Improve education outcomes by 35%', sustainability: 6 },
  { id: 'adult-education', name: 'Adult Skill Training', emoji: '🎓', description: 'Vocational training for unemployed adults', urgency: 'high', category: 'education', beneficiaries: '150 adults', impact: 'Reduce unemployment by 25%', sustainability: 7 },
  { id: 'digital-literacy', name: 'Digital Literacy Center', emoji: '💻', description: 'Computer training and internet access for seniors', urgency: 'medium', category: 'education', beneficiaries: '200 seniors', impact: 'Bridge digital divide', sustainability: 8 },

  // Healthcare
  { id: 'medical-clinic', name: 'Community Health Clinic', emoji: '🏥', description: 'Primary healthcare services for underserved areas', urgency: 'critical', category: 'healthcare', beneficiaries: '1,000 residents', impact: 'Preventive care saves lives', sustainability: 9 },
  { id: 'mental-health', name: 'Mental Health Support', emoji: '🧠', description: 'Counseling and therapy services', urgency: 'high', category: 'healthcare', beneficiaries: '300 people', impact: 'Improve mental wellness by 50%', sustainability: 7 },
  { id: 'vaccination-drive', name: 'Vaccination Program', emoji: '💉', description: 'Essential vaccinations for children and adults', urgency: 'critical', category: 'healthcare', beneficiaries: '800 people', impact: 'Prevent disease outbreaks', sustainability: 6 },

  // Environment
  { id: 'clean-rivers', name: 'River Cleanup Initiative', emoji: '🌊', description: 'Remove pollution and restore water quality', urgency: 'high', category: 'environment', beneficiaries: '5,000 residents', impact: 'Cleaner drinking water', sustainability: 8 },
  { id: 'urban-greening', name: 'Urban Greening Project', emoji: '🌳', description: 'Plant trees and create community gardens', urgency: 'medium', category: 'environment', beneficiaries: 'Local community', impact: 'Reduce urban heat by 15%', sustainability: 9 },
  { id: 'waste-management', name: 'Waste Recycling Center', emoji: '♻️', description: 'Community recycling and waste reduction program', urgency: 'medium', category: 'environment', beneficiaries: '2,000 households', impact: 'Reduce landfill waste by 60%', sustainability: 8 },

  // Housing
  { id: 'homeless-shelter', name: 'Emergency Shelter', emoji: '🏠', description: 'Safe housing for homeless individuals', urgency: 'critical', category: 'housing', beneficiaries: '50 families', impact: 'Prevent homelessness deaths', sustainability: 5 },
  { id: 'affordable-housing', name: 'Affordable Housing Fund', emoji: '🏘️', description: 'Subsidized housing for low-income families', urgency: 'high', category: 'housing', beneficiaries: '100 families', impact: 'Stable housing for 400 people', sustainability: 8 },

  // Elderly
  { id: 'senior-center', name: 'Senior Community Center', emoji: '👴', description: 'Social activities and support for elderly', urgency: 'medium', category: 'elderly', beneficiaries: '300 seniors', impact: 'Reduce isolation by 70%', sustainability: 7 },
  { id: 'home-care', name: 'Elderly Home Care', emoji: '🏡', description: 'In-home assistance for elderly residents', urgency: 'high', category: 'elderly', beneficiaries: '150 seniors', impact: 'Independent living support', sustainability: 6 },

  // Children
  { id: 'nutrition-program', name: 'Child Nutrition Program', emoji: '👶', description: 'Healthy meals for undernourished children', urgency: 'critical', category: 'children', beneficiaries: '300 children', impact: 'Improve child health outcomes', sustainability: 7 },
  { id: 'after-school', name: 'After-School Program', emoji: '🎨', description: 'Educational activities and tutoring', urgency: 'high', category: 'children', beneficiaries: '200 children', impact: 'Better academic performance', sustainability: 8 },

  // Emergency
  { id: 'disaster-relief', name: 'Disaster Relief Fund', emoji: '🚨', description: 'Emergency response for natural disasters', urgency: 'medium', category: 'emergency', beneficiaries: '500 families', impact: 'Rapid disaster recovery', sustainability: 4 },
  { id: 'crisis-intervention', name: 'Crisis Intervention', emoji: '🆘', description: 'Emergency counseling and support services', urgency: 'high', category: 'emergency', beneficiaries: '100 people in crisis', impact: 'Prevent tragedies', sustainability: 5 },
];

// Seasonal Events that can occur in Phase 2
const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'monsoon-floods',
    name: 'Monsoon Floods Emergency',
    description: 'Heavy monsoon rains have caused flooding in low-lying areas, displacing families and damaging homes.',
    emoji: '🌧️',
    affectedCategories: ['emergency', 'housing'],
    urgencyModifier: 2,
    budgetModifier: 15000,
    specialCauses: [
      { id: 'flood-relief', name: 'Flood Relief Operations', emoji: '🏠', description: 'Emergency shelter and food for flood victims', urgency: 'critical', category: 'emergency', beneficiaries: '200 families', impact: 'Provide immediate relief', sustainability: 3 },
      { id: 'flood-repair', name: 'Home Repair Fund', emoji: '🔨', description: 'Help families repair flood-damaged homes', urgency: 'critical', category: 'housing', beneficiaries: '150 families', impact: 'Restore housing stability', sustainability: 6 },
    ]
  },
  {
    id: 'education-crisis',
    name: 'Education Funding Crisis',
    description: 'Local schools are struggling with outdated materials and lack of qualified teachers.',
    emoji: '📚',
    affectedCategories: ['education', 'children'],
    urgencyModifier: 1.5,
    budgetModifier: 10000,
    specialCauses: [
      { id: 'teacher-training', name: 'Teacher Training Program', emoji: '👩‍🏫', description: 'Professional development for local teachers', urgency: 'high', category: 'education', beneficiaries: '50 teachers', impact: 'Improve education quality', sustainability: 9 },
      { id: 'digital-classrooms', name: 'Digital Classroom Initiative', emoji: '💻', description: 'Equip classrooms with modern learning tools', urgency: 'high', category: 'education', beneficiaries: '300 students', impact: 'Enhance learning outcomes', sustainability: 8 },
    ]
  },
  {
    id: 'healthcare-shortage',
    name: 'Healthcare System Overload',
    description: 'Recent disease outbreak has overwhelmed local healthcare facilities.',
    emoji: '🏥',
    affectedCategories: ['healthcare', 'elderly'],
    urgencyModifier: 2,
    budgetModifier: 20000,
    specialCauses: [
      { id: 'emergency-clinic', name: 'Emergency Treatment Center', emoji: '🚑', description: 'Temporary facility for urgent medical care', urgency: 'critical', category: 'healthcare', beneficiaries: '500 patients', impact: 'Save lives during crisis', sustainability: 4 },
      { id: 'preventive-care', name: 'Preventive Healthcare Campaign', emoji: '🩺', description: 'Community health education and screenings', urgency: 'high', category: 'healthcare', beneficiaries: '1,000 residents', impact: 'Prevent future outbreaks', sustainability: 8 },
    ]
  },
  {
    id: 'economic-downturn',
    name: 'Economic Downturn Impact',
    description: 'Rising unemployment and inflation are affecting vulnerable community members.',
    emoji: '📉',
    affectedCategories: ['housing', 'children', 'elderly'],
    urgencyModifier: 1,
    budgetModifier: 8000,
    specialCauses: [
      { id: 'food-assistance', name: 'Emergency Food Program', emoji: '🍽️', description: 'Provide meals for families facing food insecurity', urgency: 'critical', category: 'children', beneficiaries: '400 children', impact: 'Prevent malnutrition', sustainability: 5 },
      { id: 'job-training', name: 'Skills Development Center', emoji: '💼', description: 'Vocational training for unemployed adults', urgency: 'high', category: 'education', beneficiaries: '200 adults', impact: 'Reduce long-term unemployment', sustainability: 9 },
    ]
  },
  {
    id: 'environmental-crisis',
    name: 'Environmental Emergency',
    description: 'Industrial pollution has severely impacted local water sources and air quality.',
    emoji: '🌪️',
    affectedCategories: ['environment', 'healthcare'],
    urgencyModifier: 1.8,
    budgetModifier: 18000,
    specialCauses: [
      { id: 'water-purification', name: 'Water Purification Systems', emoji: '💧', description: 'Install clean water systems for affected areas', urgency: 'critical', category: 'environment', beneficiaries: '3,000 residents', impact: 'Provide safe drinking water', sustainability: 8 },
      { id: 'air-quality-monitoring', name: 'Air Quality Improvement', emoji: '🌬️', description: 'Monitor and improve local air quality standards', urgency: 'high', category: 'environment', beneficiaries: 'Local community', impact: 'Reduce respiratory illnesses', sustainability: 7 },
    ]
  }
];

export default function NeighbourhoodCharity({ onClose }: { onClose: () => void }) {
  const [budget, setBudget] = useState(25000);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [gamePhase, setGamePhase] = useState<'setup' | 'allocation' | 'impact'>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [impact, setImpact] = useState<CommunityImpact | null>(null);
  const [showStories, setShowStories] = useState(false);

  const startAllocation = () => {
    setGamePhase('allocation');
  };

  const allocateFunds = (causeId: string, amount: number) => {
    const currentTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
    const newTotal = currentTotal - (allocations.find(a => a.causeId === causeId)?.amount || 0) + amount;

    if (newTotal > budget) {
      Alert.alert("Budget Exceeded", `Your total allocation of ₹${newTotal.toLocaleString()} exceeds your budget of ₹${budget.toLocaleString()}.`);
      return;
    }

    const newAllocations = allocations.filter(a => a.causeId !== causeId);
    if (amount > 0) {
      newAllocations.push({ causeId, amount });
    }
    setAllocations(newAllocations);
  };

  const calculateImpact = () => {
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    const efficiency = budget > 0 ? (totalAllocated / budget) * 100 : 0;

    // Calculate beneficiaries and impact
    let totalBeneficiaries = 0;
    let sustainabilityScore = 0;
    const feedback: string[] = [];
    const stories: string[] = [];

    allocations.forEach(allocation => {
      const cause = COMMUNITY_CAUSES.find(c => c.id === allocation.causeId);
      if (cause) {
        // Calculate beneficiaries based on allocation
        const beneficiaryMultiplier = allocation.amount / 1000; // ₹1000 = 1 unit of beneficiaries
        totalBeneficiaries += parseInt(cause.beneficiaries.replace(/[^\d]/g, '')) * beneficiaryMultiplier * 0.1;
        sustainabilityScore += cause.sustainability * (allocation.amount / totalAllocated);

        // Generate feedback
        if (cause.urgency === 'critical' && allocation.amount < 1000) {
          feedback.push(`${cause.name} is critically urgent but received minimal funding.`);
        } else if (cause.urgency === 'high' && allocation.amount > 5000) {
          feedback.push(`Excellent priority given to ${cause.name} - this addresses a major community need!`);
        }

        // Generate stories
        if (allocation.amount > 2000) {
          stories.push(`${cause.emoji} Thanks to your generous support for ${cause.name}, ${cause.beneficiaries} lives have been positively impacted. "${cause.impact}"`);
        }
      }
    });

    // Calculate community satisfaction
    let satisfactionScore = 50; // Base satisfaction
    if (efficiency > 90) satisfactionScore += 20;
    else if (efficiency > 70) satisfactionScore += 10;
    else if (efficiency < 30) satisfactionScore -= 15;

    // Category balance bonus
    const categoriesUsed = new Set(allocations.map(a => COMMUNITY_CAUSES.find(c => c.id === a.causeId)?.category));
    if (categoriesUsed.size >= 4) satisfactionScore += 15;

    // Critical needs check
    const criticalCauses = COMMUNITY_CAUSES.filter(c => c.urgency === 'critical');
    const criticalFunded = criticalCauses.filter(c => allocations.some(a => a.causeId === c.id && a.amount > 0));
    if (criticalFunded.length === criticalCauses.length) satisfactionScore += 10;

    const communityImpact: CommunityImpact = {
      totalAllocated,
      communitySatisfaction: Math.max(0, Math.min(100, satisfactionScore)),
      beneficiariesReached: Math.round(totalBeneficiaries),
      sustainabilityScore: Math.round(sustainabilityScore / allocations.length) || 0,
      feedback,
      stories,
      round: 1,
      longTermEffects: [
        "Community health improved by " + Math.round(satisfactionScore * 0.1) + "%",
        "Long-term sustainability established for funded programs",
        "Social cohesion strengthened through collaborative efforts"
      ]
    };

    // Update charity achievement with total amount donated
    if (totalAllocated > 0) {
      updateAchievementProgress('charity-helper', totalAllocated).catch((error: unknown) => {
        console.error('Error updating charity achievement:', error);
      });
    }

    setImpact(communityImpact);
    setGamePhase('impact');
  };

  const resetGame = () => {
    setAllocations([]);
    setGamePhase('setup');
    setImpact(null);
    setShowStories(false);
  };

  const currentTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingBudget = budget - currentTotal;

  const categories = [
    { key: 'all', label: 'All Causes', color: '#666' },
    { key: 'animals', label: '🐾 Animals', color: '#8B4513' },
    { key: 'education', label: '📚 Education', color: '#4169E1' },
    { key: 'healthcare', label: '🏥 Healthcare', color: '#DC143C' },
    { key: 'environment', label: '🌱 Environment', color: '#228B22' },
    { key: 'housing', label: '🏠 Housing', color: '#8B4513' },
    { key: 'elderly', label: '👴 Elderly', color: '#708090' },
    { key: 'children', label: '👶 Children', color: '#FF69B4' },
    { key: 'emergency', label: '🚨 Emergency', color: '#B22222' },
  ];

  const filteredCauses = selectedCategory === 'all'
    ? COMMUNITY_CAUSES
    : COMMUNITY_CAUSES.filter(cause => cause.category === selectedCategory);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#DC143C';
      case 'high': return '#FF8C00';
      case 'medium': return '#FFD700';
      case 'low': return '#32CD32';
      default: return '#666';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  if (gamePhase === 'setup') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.setupContainer}>
          <Text style={styles.title}>🌍 Neighbourhood Charity</Text>
          <Text style={styles.subtitle}>Strategic Community Investment</Text>

          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>🎯 Your Role as Community Leader</Text>
            <Text style={styles.setupText}>
              You have been entrusted with ₹{budget.toLocaleString()} to improve your community.
              Your decisions will affect thousands of lives. Choose wisely where to allocate funds
              across different social causes, balancing immediate needs with long-term sustainability.
            </Text>

            <View style={styles.budgetDisplay}>
              <Text style={styles.budgetLabel}>Community Budget</Text>
              <Text style={styles.budgetAmount}>₹{budget.toLocaleString()}</Text>
            </View>

            <View style={styles.challengePoints}>
              <Text style={styles.pointsTitle}>📊 Success Factors:</Text>
              <Text style={styles.pointsText}>• Address critical community needs</Text>
              <Text style={styles.pointsText}>• Balance short-term and long-term impact</Text>
              <Text style={styles.pointsText}>• Maximize community satisfaction</Text>
              <Text style={styles.pointsText}>• Ensure sustainable solutions</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startAllocation}>
            <Ionicons name="heart" size={24} color="#fff" />
            <Text style={styles.startText}>Begin Allocation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="exit-outline" size={18} color="#666" />
            <Text style={styles.closeText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'impact' && impact) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.impactContainer}>
          <Text style={styles.title}>📊 Community Impact Report</Text>

          {/* Key Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>₹{impact.totalAllocated.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Funds Allocated</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{impact.communitySatisfaction}%</Text>
                <Text style={styles.metricLabel}>Community Satisfaction</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{impact.beneficiariesReached}</Text>
                <Text style={styles.metricLabel}>Lives Impacted</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{impact.sustainabilityScore}/10</Text>
                <Text style={styles.metricLabel}>Sustainability Score</Text>
              </View>
            </View>
          </View>

          {/* Performance Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>🏆 Leadership Rating</Text>
            <Text style={styles.rating}>
              {impact.communitySatisfaction >= 85 ? "🌟 EXCEPTIONAL COMMUNITY LEADER" :
               impact.communitySatisfaction >= 70 ? "🎖️ EXCELLENT PHILANTHROPIST" :
               impact.communitySatisfaction >= 55 ? "👍 GOOD COMMUNITY CONTRIBUTOR" :
               impact.communitySatisfaction >= 40 ? "🤔 DECENT EFFORT" :
               "💭 ROOM FOR IMPROVEMENT"}
            </Text>
          </View>

          {/* Feedback */}
          {impact.feedback.length > 0 && (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>💡 Community Feedback</Text>
              {impact.feedback.map((feedback, index) => (
                <Text key={index} style={styles.feedbackText}>• {feedback}</Text>
              ))}
            </View>
          )}

          {/* Success Stories */}
          <TouchableOpacity
            style={styles.storiesButton}
            onPress={() => setShowStories(!showStories)}
          >
            <Ionicons name={showStories ? "chevron-up" : "chevron-down"} size={20} color="#fff" />
            <Text style={styles.storiesButtonText}>
              {showStories ? "Hide" : "Show"} Success Stories ({impact.stories.length})
            </Text>
          </TouchableOpacity>

          {showStories && (
            <View style={styles.storiesCard}>
              {impact.stories.map((story, index) => (
                <Text key={index} style={styles.storyText}>{story}</Text>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.restartText}>New Allocation</Text>
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

  // Allocation Phase
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <View style={styles.allocationContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.budgetSummary}>
            <Text style={styles.budgetText}>Budget: ₹{budget.toLocaleString()}</Text>
            <Text style={styles.spentText}>Allocated: ₹{currentTotal.toLocaleString()}</Text>
            <Text style={[styles.remainingText, remainingBudget < 0 && styles.overBudget]}>
              Remaining: ₹{remainingBudget.toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.calculateButton} onPress={calculateImpact}>
            <Text style={styles.calculateText}>Calculate Impact</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryButton, { backgroundColor: cat.color }, selectedCategory === cat.key && styles.activeCategory]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.key && styles.activeCategoryText]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Causes List */}
        <View style={styles.causesList}>
          {filteredCauses.map(cause => {
            const allocation = allocations.find(a => a.causeId === cause.id);
            const allocatedAmount = allocation?.amount || 0;

            return (
              <View key={cause.id} style={styles.causeCard}>
                <View style={styles.causeHeader}>
                  <View style={styles.causeInfo}>
                    <Text style={styles.causeEmoji}>{cause.emoji}</Text>
                    <View style={styles.causeDetails}>
                      <Text style={styles.causeName}>{cause.name}</Text>
                      <Text style={styles.causeDesc}>{cause.description}</Text>
                      <View style={styles.causeMeta}>
                        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(cause.urgency) }]}>
                          <Text style={styles.urgencyText}>{getUrgencyLabel(cause.urgency)}</Text>
                        </View>
                        <Text style={styles.beneficiariesText}>{cause.beneficiaries}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.allocationSection}>
                  <View style={styles.allocationControls}>
                    <TouchableOpacity
                      style={styles.amountButton}
                      onPress={() => allocateFunds(cause.id, Math.max(0, allocatedAmount - 1000))}
                    >
                      <Ionicons name="remove" size={20} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.amountDisplay}>
                      <Text style={styles.amountText}>₹{allocatedAmount.toLocaleString()}</Text>
                      <Text style={styles.amountLabel}>Allocated</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.amountButton}
                      onPress={() => allocateFunds(cause.id, allocatedAmount + 1000)}
                      disabled={currentTotal + 1000 > budget}
                    >
                      <Ionicons name="add" size={20} color="#27ae60" />
                    </TouchableOpacity>
                  </View>

                  {allocatedAmount > 0 && (
                    <View style={styles.impactPreview}>
                      <Text style={styles.impactText}>
                        Potential Impact: {cause.impact}
                      </Text>
                      <Text style={styles.sustainabilityText}>
                        Sustainability: {cause.sustainability}/10
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.allocationSummary}>
          <Text style={styles.summaryText}>
            {allocations.length} causes funded • {Math.round((currentTotal / budget) * 100)}% of budget used
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  setupContainer: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
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
    color: "#2c3e50",
    marginBottom: 12,
  },
  setupText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 15,
  },
  budgetDisplay: {
    backgroundColor: "#e8f5e8",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  budgetLabel: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
  },
  budgetAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#27ae60",
  },
  challengePoints: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 12,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    color: "#856404",
    marginBottom: 4,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
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
  allocationContainer: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  budgetSummary: {
    flex: 1,
  },
  budgetText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 2,
  },
  spentText: {
    fontSize: 14,
    color: "#e74c3c",
    marginBottom: 2,
  },
  remainingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  overBudget: {
    color: "#e74c3c",
  },
  calculateButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
  },
  calculateText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  categoryFilter: {
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    elevation: 2,
  },
  activeCategory: {
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  activeCategoryText: {
    color: "#fff",
  },
  causesList: {
    flex: 1,
  },
  causeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
  },
  causeHeader: {
    marginBottom: 15,
  },
  causeInfo: {
    flexDirection: "row",
  },
  causeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  causeDetails: {
    flex: 1,
  },
  causeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  causeDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  causeMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  urgencyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  urgencyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  beneficiariesText: {
    fontSize: 13,
    color: "#27ae60",
    fontWeight: "600",
  },
  allocationSection: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  allocationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  amountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  amountDisplay: {
    alignItems: "center",
    marginHorizontal: 20,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  amountLabel: {
    fontSize: 12,
    color: "#666",
  },
  impactPreview: {
    backgroundColor: "#e8f5e8",
    padding: 10,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 13,
    color: "#27ae60",
    fontWeight: "600",
    marginBottom: 4,
  },
  sustainabilityText: {
    fontSize: 12,
    color: "#666",
  },
  allocationSummary: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    elevation: 2,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
  },
  impactContainer: {
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
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    textAlign: "center",
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
  storiesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17a2b8",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
    marginBottom: 15,
  },
  storiesButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  storiesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: "100%",
    elevation: 2,
  },
  storyText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
    fontStyle: "italic",
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
