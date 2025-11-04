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

type TempleCause = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  baseImpact: number; // Base people helped
  category: 'temple' | 'food' | 'education' | 'healthcare' | 'community';
  multiplier: number; // How much donation multiplies impact
  stories: string[];
  culturalSignificance: string;
};

type Donation = {
  causeId: string;
  amount: number;
  timestamp: number;
};

type ChainReaction = {
  id: string;
  causeId: string;
  description: string;
  beneficiaries: number;
  nextCauses: string[]; // IDs of causes this unlocks
  story: string;
};

type GameState = {
  donationBudget: number;
  remainingBudget: number;
  donations: Donation[];
  unlockedChains: string[];
  completedChains: string[];
  totalBeneficiaries: number;
  karmaPoints: number; // Cultural/spiritual satisfaction points
  donationStreak: number;
};

const TEMPLE_CAUSES: TempleCause[] = [
  {
    id: 'main-temple',
    name: 'Main Temple Restoration',
    emoji: '🙏',
    description: 'Restore the ancient temple architecture and maintain daily rituals',
    baseImpact: 100,
    category: 'temple',
    multiplier: 2.5,
    stories: [
      'An elderly devotee can now visit the temple daily for morning prayers',
      'Young families gather for traditional ceremonies in the restored space',
      'The temple priest can continue ancient rituals that have been practiced for generations'
    ],
    culturalSignificance: 'Preserves centuries-old spiritual traditions and community gatherings'
  },
  {
    id: 'food-bank',
    name: 'Temple Food Bank',
    emoji: '🍛',
    description: 'Provide nutritious meals to families in need through temple kitchen',
    baseImpact: 200,
    category: 'food',
    multiplier: 3.0,
    stories: [
      'A mother of three receives daily meals for her children during difficult times',
      'Elderly widows get hot, nutritious food prepared with traditional recipes',
      'Working families can focus on jobs knowing their children are fed at school'
    ],
    culturalSignificance: 'Temple kitchens have fed the hungry for centuries, blending spirituality with social service'
  },
  {
    id: 'veda-school',
    name: 'Veda Learning Center',
    emoji: '📚',
    description: 'Support children learning ancient scriptures and cultural values',
    baseImpact: 75,
    category: 'education',
    multiplier: 4.0,
    stories: [
      'A young boy discovers his love for Sanskrit and becomes a future priest',
      'Girls learn about strong women in Indian mythology and gain self-confidence',
      'Families pass down cultural knowledge that would otherwise be lost'
    ],
    culturalSignificance: 'Vedas contain the foundation of Indian philosophy, science, and culture'
  },
  {
    id: 'medical-clinic',
    name: 'Temple Medical Clinic',
    emoji: '🏥',
    description: 'Free healthcare services combining modern medicine with traditional healing',
    baseImpact: 150,
    category: 'healthcare',
    multiplier: 2.8,
    stories: [
      'A farmer gets treatment for his chronic illness and can work his land again',
      'Pregnant mothers receive prenatal care in a supportive spiritual environment',
      'Elderly receive both medical care and emotional support from caring volunteers'
    ],
    culturalSignificance: 'Ancient Indian medicine (Ayurveda) originated in temple traditions'
  },
  {
    id: 'community-center',
    name: 'Community Service Center',
    emoji: '🤝',
    description: 'Multi-purpose center for education, healthcare, and cultural activities',
    baseImpact: 300,
    category: 'community',
    multiplier: 3.5,
    stories: [
      'Youth learn traditional arts and crafts that were disappearing',
      'Families find support during crises through community networks',
      'Cultural festivals bring together diverse communities in celebration'
    ],
    culturalSignificance: 'Temples have always been centers of community life, education, and social welfare'
  },
  {
    id: 'orphanage-support',
    name: 'Temple Orphanage Care',
    emoji: '👶',
    description: 'Support for children without families through educational and emotional care',
    baseImpact: 50,
    category: 'community',
    multiplier: 5.0,
    stories: [
      'A talented artist gets training and finds his calling in life',
      'Children learn moral values and cultural traditions they would otherwise miss',
      'Young adults graduate with skills to support themselves and their future families'
    ],
    culturalSignificance: 'Indian culture places great importance on caring for the vulnerable and orphaned'
  },
  {
    id: 'elderly-care',
    name: 'Senior Citizen Support',
    emoji: '👴',
    description: 'Care and companionship for elderly community members',
    baseImpact: 80,
    category: 'community',
    multiplier: 3.2,
    stories: [
      'Grandparents share wisdom and stories with younger generations',
      'Lonely seniors find friendship and purpose in temple activities',
      'Families are relieved knowing their elders are cared for with dignity'
    ],
    culturalSignificance: 'Respect for elders is a cornerstone of Indian cultural values'
  },
  {
    id: 'environmental-initiative',
    name: 'Sacred Grove Protection',
    emoji: '🌳',
    description: 'Protect and maintain temple gardens and sacred natural spaces',
    baseImpact: 500,
    category: 'community',
    multiplier: 2.0,
    stories: [
      'Local wildlife finds refuge in protected green spaces',
      'Community learns about environmental stewardship and sustainability',
      'Future generations inherit cleaner air and water from temple conservation efforts'
    ],
    culturalSignificance: 'Many Indian temples are built in harmony with nature, protecting biodiversity'
  }
];

const CHAIN_REACTIONS: { [key: string]: ChainReaction[] } = {
  'main-temple': [
    {
      id: 'temple-restoration-chain',
      causeId: 'main-temple',
      description: 'Temple restoration inspires community involvement',
      beneficiaries: 25,
      nextCauses: ['veda-school', 'community-center'],
      story: 'The beautiful restored temple attracts more devotees, who then support educational programs and community activities.'
    }
  ],
  'food-bank': [
    {
      id: 'food-bank-education',
      causeId: 'food-bank',
      description: 'Well-fed children perform better in school',
      beneficiaries: 40,
      nextCauses: ['veda-school'],
      story: 'Families receiving food support can afford school fees and supplies, leading to better education outcomes.'
    },
    {
      id: 'food-bank-health',
      causeId: 'food-bank',
      description: 'Nutrition improves overall community health',
      beneficiaries: 35,
      nextCauses: ['medical-clinic'],
      story: 'Proper nutrition reduces illness, allowing the medical clinic to focus on more serious conditions.'
    }
  ],
  'veda-school': [
    {
      id: 'education-community',
      causeId: 'veda-school',
      description: 'Educated youth become community leaders',
      beneficiaries: 60,
      nextCauses: ['community-center', 'orphanage-support'],
      story: 'Students trained in cultural values become volunteers and leaders in community service programs.'
    }
  ],
  'medical-clinic': [
    {
      id: 'health-education',
      causeId: 'medical-clinic',
      description: 'Healthy community focuses on preventive education',
      beneficiaries: 45,
      nextCauses: ['veda-school', 'community-center'],
      story: 'A healthier community invests more in education and cultural preservation.'
    }
  ],
  'community-center': [
    {
      id: 'comprehensive-impact',
      causeId: 'community-center',
      description: 'Integrated services create compounding benefits',
      beneficiaries: 100,
      nextCauses: ['orphanage-support', 'elderly-care', 'environmental-initiative'],
      story: 'The community center becomes a hub where education, healthcare, and social services reinforce each other.'
    }
  ]
};

export default function TempleDonationGame({ onClose }: { onClose: () => void }) {
  const [gameState, setGameState] = useState<GameState>({
    donationBudget: 15000,
    remainingBudget: 15000,
    donations: [],
    unlockedChains: [],
    completedChains: [],
    totalBeneficiaries: 0,
    karmaPoints: 0,
    donationStreak: 0
  });
  const [gamePhase, setGamePhase] = useState<'planning' | 'donating' | 'impact' | 'results'>('planning');
  const [selectedCause, setSelectedCause] = useState<string | null>(null);
  const [donationResults, setDonationResults] = useState<any>(null);
  const [activeChains, setActiveChains] = useState<ChainReaction[]>([]);

  const startDonating = () => {
    setGamePhase('donating');
  };

  const makeDonation = (causeId: string, amount: number) => {
    if (amount > gameState.remainingBudget) {
      Alert.alert("Insufficient Funds", "You don't have enough donation funds for this amount.");
      return;
    }

    if (amount < 100) {
      Alert.alert("Minimum Donation", "Minimum donation amount is ₹100.");
      return;
    }

    const cause = TEMPLE_CAUSES.find(c => c.id === causeId);
    if (!cause) return;

    const directBeneficiaries = Math.floor((amount / 100) * cause.baseImpact * cause.multiplier);
    const karmaGain = Math.floor(amount / 50); // Karma points for generosity

    const donation: Donation = {
      causeId,
      amount,
      timestamp: Date.now()
    };

    // Check for chain reactions
    const newChains = CHAIN_REACTIONS[causeId] || [];
    const chainBeneficiaries = newChains.reduce((sum, chain) => sum + chain.beneficiaries, 0);

    setGameState(prev => ({
      ...prev,
      donations: [...prev.donations, donation],
      remainingBudget: prev.remainingBudget - amount,
      totalBeneficiaries: prev.totalBeneficiaries + directBeneficiaries + chainBeneficiaries,
      karmaPoints: prev.karmaPoints + karmaGain,
      donationStreak: prev.donationStreak + 1,
      unlockedChains: [...new Set([...prev.unlockedChains, ...newChains.map(c => c.id)])]
    }));

    setActiveChains(prev => [...prev, ...newChains]);

    // Show donation impact
    Alert.alert(
      "Donation Successful! 🪔",
      `${cause.emoji} Your ₹${amount.toLocaleString()} donation to ${cause.name} will help ${directBeneficiaries + chainBeneficiaries} people!\n\n${cause.culturalSignificance}`,
      [{ text: "Wonderful!" }]
    );
  };

  const viewImpact = () => {
    setGamePhase('impact');
  };

  const calculateFinalResults = () => {
    const totalDonated = gameState.donations.reduce((sum, d) => sum + d.amount, 0);
    const donationEfficiency = gameState.donationBudget > 0 ? (totalDonated / gameState.donationBudget) * 100 : 0;
    const averageDonation = gameState.donations.length > 0 ? totalDonated / gameState.donations.length : 0;
    const causesSupported = new Set(gameState.donations.map(d => d.causeId)).size;
    const chainReactions = gameState.unlockedChains.length;

    const generosityScore = Math.min(100, (gameState.karmaPoints / 10) + (donationEfficiency * 0.5) + (causesSupported * 5) + (chainReactions * 10));

    const results = {
      totalDonated,
      totalBeneficiaries: gameState.totalBeneficiaries,
      karmaPoints: gameState.karmaPoints,
      causesSupported,
      chainReactions,
      donationEfficiency: Math.round(donationEfficiency),
      averageDonation: Math.round(averageDonation),
      generosityScore: Math.round(generosityScore),
      donationStreak: gameState.donationStreak
    };

    setDonationResults(results);
    setGamePhase('results');
  };

  const resetGame = () => {
    setGameState({
      donationBudget: 15000,
      remainingBudget: 15000,
      donations: [],
      unlockedChains: [],
      completedChains: [],
      totalBeneficiaries: 0,
      karmaPoints: 0,
      donationStreak: 0
    });
    setGamePhase('planning');
    setSelectedCause(null);
    setDonationResults(null);
    setActiveChains([]);
  };

  if (gamePhase === 'planning') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.planningContainer}>
          <Text style={styles.title}>🙏 Temple Donation Game</Text>
          <Text style={styles.subtitle}>Experience the Joy of Giving</Text>

          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>🪔 Your Role as Philanthropist</Text>
            <Text style={styles.setupText}>
              You have been blessed with ₹{gameState.donationBudget.toLocaleString()} to support your community through temple-based charitable initiatives.
              Your donations will create chain reactions of goodwill, helping more people than you might imagine.
              Choose wisely where to allocate your generosity - each donation has cultural significance and community impact.
            </Text>

            <View style={styles.donationTypes}>
              <Text style={styles.typesTitle}>🎯 Types of Temple Charities:</Text>
              <Text style={styles.typesText}>
                • 🙏 Temple Maintenance - Preserve spiritual heritage{'\n'}
                • 🍛 Food Banks - End hunger through temple kitchens{'\n'}
                • 📚 Education - Teach ancient wisdom and modern skills{'\n'}
                • 🏥 Healthcare - Heal body and spirit{'\n'}
                • 🤝 Community - Build stronger neighborhoods
              </Text>
            </View>

            <View style={styles.chainReactionInfo}>
              <Text style={styles.chainTitle}>🔗 Chain Reactions of Giving</Text>
              <Text style={styles.chainText}>
                Your donations don't just help directly - they create ripple effects!
                Supporting education might lead to better community health,
                or temple restoration might inspire more charitable giving.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startDonating}>
            <Ionicons name="heart" size={24} color="#fff" />
            <Text style={styles.startText}>Begin Donating</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="exit-outline" size={18} color="#666" />
            <Text style={styles.closeText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'donating') {
    const selectedCauseData = selectedCause ? TEMPLE_CAUSES.find(c => c.id === selectedCause) : null;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.donatingContainer}>
          <Text style={styles.title}>💝 Make Your Donations</Text>
          <Text style={styles.subtitle}>Choose causes that touch your heart</Text>

          {/* Donation Status */}
          <View style={styles.donationStatus}>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>💰 Budget: ₹{gameState.remainingBudget.toLocaleString()}</Text>
              <Text style={styles.statusText}>🙏 Karma: {gameState.karmaPoints}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>🎯 Donations: {gameState.donations.length}</Text>
              <Text style={styles.statusText}>❤️ Beneficiaries: {gameState.totalBeneficiaries}</Text>
            </View>
          </View>

          {/* Active Chain Reactions */}
          {activeChains.length > 0 && (
            <View style={styles.chainsCard}>
              <Text style={styles.chainsTitle}>🔗 Active Chain Reactions</Text>
              {activeChains.slice(0, 3).map(chain => (
                <View key={chain.id} style={styles.chainItem}>
                  <Text style={styles.chainEmoji}>✨</Text>
                  <View style={styles.chainInfo}>
                    <Text style={styles.chainDesc}>{chain.description}</Text>
                    <Text style={styles.chainImpact}>Helping {chain.beneficiaries} more people</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!selectedCause ? (
            /* Cause Selection */
            <View style={styles.causesGrid}>
              <Text style={styles.sectionTitle}>Choose a Cause</Text>
              {TEMPLE_CAUSES.map(cause => {
                const hasDonated = gameState.donations.some(d => d.causeId === cause.id);
                const chainsAvailable = (CHAIN_REACTIONS[cause.id] || []).length;

                return (
                  <TouchableOpacity
                    key={cause.id}
                    style={[styles.causeCard, hasDonated && styles.donatedCause]}
                    onPress={() => setSelectedCause(cause.id)}
                  >
                    <Text style={styles.causeEmoji}>{cause.emoji}</Text>
                    <View style={styles.causeInfo}>
                      <Text style={styles.causeName}>{cause.name}</Text>
                      <Text style={styles.causeDesc}>{cause.description}</Text>
                      <View style={styles.causeStats}>
                        <Text style={styles.statText}>Impact: {cause.multiplier}x</Text>
                        <Text style={styles.statText}>Chains: {chainsAvailable}</Text>
                        {hasDonated && <Text style={styles.donatedText}>✓ Donated</Text>}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : selectedCauseData ? (
            /* Donation Interface */
            <View style={styles.donationView}>
              <View style={styles.causeHeader}>
                <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCause(null)}>
                  <Ionicons name="arrow-back" size={24} color="#d2691e" />
                  <Text style={styles.backText}>Back to Causes</Text>
                </TouchableOpacity>
                <View style={styles.selectedCauseInfo}>
                  <Text style={styles.selectedEmoji}>{selectedCauseData.emoji}</Text>
                  <View style={styles.selectedDetails}>
                    <Text style={styles.selectedName}>{selectedCauseData.name}</Text>
                    <Text style={styles.selectedDesc}>{selectedCauseData.description}</Text>
                  </View>
                </View>
              </View>

              {/* Impact Preview */}
              <View style={styles.impactPreview}>
                <Text style={styles.previewTitle}>💫 Donation Impact Preview</Text>
                <View style={styles.impactGrid}>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactValue}>₹100</Text>
                    <Text style={styles.impactDesc}>Helps {Math.floor(100/100 * selectedCauseData.baseImpact * selectedCauseData.multiplier)} people</Text>
                  </View>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactValue}>₹500</Text>
                    <Text style={styles.impactDesc}>Helps {Math.floor(500/100 * selectedCauseData.baseImpact * selectedCauseData.multiplier)} people</Text>
                  </View>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactValue}>₹1000</Text>
                    <Text style={styles.impactDesc}>Helps {Math.floor(1000/100 * selectedCauseData.baseImpact * selectedCauseData.multiplier)} people</Text>
                  </View>
                </View>
              </View>

              {/* Quick Donation Buttons */}
              <View style={styles.donationButtons}>
                <Text style={styles.donationTitle}>Choose Donation Amount</Text>
                <View style={styles.buttonGrid}>
                  {[100, 250, 500, 1000, 2000, 5000].map(amount => (
                    <TouchableOpacity
                      key={amount}
                      style={[styles.amountButton, amount > gameState.remainingBudget && styles.disabledButton]}
                      onPress={() => amount <= gameState.remainingBudget && makeDonation(selectedCause, amount)}
                      disabled={amount > gameState.remainingBudget}
                    >
                      <Text style={[styles.amountText, amount > gameState.remainingBudget && styles.disabledText]}>
                        ₹{amount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cultural Significance */}
              <View style={styles.culturalCard}>
                <Text style={styles.culturalTitle}>🕉️ Cultural Significance</Text>
                <Text style={styles.culturalText}>{selectedCauseData.culturalSignificance}</Text>
              </View>
            </View>
          ) : null}

          {/* View Impact Button */}
          {gameState.donations.length > 0 && (
            <TouchableOpacity style={styles.impactButton} onPress={viewImpact}>
              <Ionicons name="analytics" size={24} color="#fff" />
              <Text style={styles.impactText}>View Donation Impact</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  if (gamePhase === 'impact') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.impactContainer}>
          <Text style={styles.title}>💫 Your Donation Impact</Text>
          <Text style={styles.subtitle}>See how your generosity creates change</Text>

          {/* Impact Summary */}
          <View style={styles.impactSummary}>
            <View style={styles.impactRow}>
              <View style={styles.impactMetric}>
                <Text style={styles.metricValue}>₹{gameState.donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Total Donated</Text>
              </View>
              <View style={styles.impactMetric}>
                <Text style={styles.metricValue}>{gameState.totalBeneficiaries}</Text>
                <Text style={styles.metricLabel}>Lives Touched</Text>
              </View>
            </View>
            <View style={styles.impactRow}>
              <View style={styles.impactMetric}>
                <Text style={styles.metricValue}>{gameState.karmaPoints}</Text>
                <Text style={styles.metricLabel}>Karma Points</Text>
              </View>
              <View style={styles.impactMetric}>
                <Text style={styles.metricValue}>{activeChains.length}</Text>
                <Text style={styles.metricLabel}>Chain Reactions</Text>
              </View>
            </View>
          </View>

          {/* Donation History */}
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>📜 Your Donation Journey</Text>
            {gameState.donations.map((donation, index) => {
              const cause = TEMPLE_CAUSES.find(c => c.id === donation.causeId);
              const directImpact = cause ? Math.floor((donation.amount / 100) * cause.baseImpact * cause.multiplier) : 0;
              const chainImpact = CHAIN_REACTIONS[donation.causeId]?.reduce((sum, chain) => sum + chain.beneficiaries, 0) || 0;

              return (
                <View key={index} style={styles.donationItem}>
                  <Text style={styles.donationEmoji}>{cause?.emoji}</Text>
                  <View style={styles.donationInfo}>
                    <Text style={styles.donationCause}>{cause?.name}</Text>
                    <Text style={styles.donationAmount}>₹{donation.amount.toLocaleString()}</Text>
                    <Text style={styles.donationImpact}>Helped {directImpact + chainImpact} people</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Active Chain Reactions */}
          {activeChains.length > 0 && (
            <View style={styles.chainsCard}>
              <Text style={styles.chainsTitle}>🔗 Chain Reactions Unlocked</Text>
              {activeChains.map(chain => (
                <View key={chain.id} style={styles.chainDetail}>
                  <Text style={styles.chainStory}>{chain.story}</Text>
                  <Text style={styles.chainBenefit}>Additional {chain.beneficiaries} beneficiaries helped</Text>
                </View>
              ))}
            </View>
          )}

          {/* Sample Stories */}
          <View style={styles.storiesCard}>
            <Text style={styles.storiesTitle}>💝 Stories of Impact</Text>
            {gameState.donations.slice(0, 2).map((donation, index) => {
              const cause = TEMPLE_CAUSES.find(c => c.id === donation.causeId);
              const randomStory = cause?.stories[Math.floor(Math.random() * cause.stories.length)];
              return (
                <Text key={index} style={styles.storyText}>
                  {cause?.emoji} {randomStory}
                </Text>
              );
            })}
          </View>

          <TouchableOpacity style={styles.resultsButton} onPress={calculateFinalResults}>
            <Ionicons name="trophy" size={24} color="#fff" />
            <Text style={styles.resultsText}>See Final Results</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (donationResults) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        <View style={styles.resultsContainer}>
          <Text style={styles.title}>🙏 Donation Journey Complete</Text>

          {/* Final Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>₹{donationResults.totalDonated.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Total Donated</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{donationResults.totalBeneficiaries}</Text>
                <Text style={styles.metricLabel}>Lives Impacted</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{donationResults.generosityScore}%</Text>
                <Text style={styles.metricLabel}>Generosity Score</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{donationResults.chainReactions}</Text>
                <Text style={styles.metricLabel}>Chain Reactions</Text>
              </View>
            </View>
          </View>

          {/* Performance Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>🪔 Philanthropy Rating</Text>
            <Text style={styles.rating}>
              {donationResults.generosityScore >= 85 ? "🌟 SUPREME PHILANTHROPIST! Your generosity creates miracles!" :
               donationResults.generosityScore >= 70 ? "🙏 BLESSED DONOR! You understand the joy of giving!" :
               donationResults.generosityScore >= 55 ? "💝 KIND HEART! Your donations make a real difference!" :
               donationResults.generosityScore >= 40 ? "🤝 COMMUNITY HELPER! Your support matters!" :
               "🌱 GROWING GIVER! Every donation is a step toward greater impact!"}
            </Text>
          </View>

          {/* Detailed Results */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>📊 Donation Analytics</Text>
            <Text style={styles.detailsText}>
              Causes Supported: {donationResults.causesSupported}{'\n'}
              Average Donation: ₹{donationResults.averageDonation.toLocaleString()}{'\n'}
              Budget Efficiency: {donationResults.donationEfficiency}%{'\n'}
              Karma Points Earned: {donationResults.karmaPoints}{'\n'}
              Donation Streak: {donationResults.donationStreak} donations
            </Text>
          </View>

          {/* Cultural Impact */}
          <View style={styles.culturalImpact}>
            <Text style={styles.culturalTitle}>🕉️ Cultural Legacy</Text>
            <Text style={styles.culturalText}>
              Your donations preserve ancient Indian traditions of charity and community service.
              Temples have served as centers of social welfare for thousands of years,
              and your generosity continues this noble tradition.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.restartText}>Donate Again</Text>
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
    backgroundColor: "#fef7e7",
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
  setupText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 15,
  },
  donationTypes: {
    backgroundColor: "#e8f5e8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  typesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  typesText: {
    fontSize: 14,
    color: "#27ae60",
    lineHeight: 20,
  },
  chainReactionInfo: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 12,
  },
  chainTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  chainText: {
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
  donatingContainer: {
    padding: 15,
  },
  donationStatus: {
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
  chainsCard: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  chainsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 10,
  },
  chainItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#d4edda",
  },
  chainEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  chainInfo: {
    flex: 1,
  },
  chainDesc: {
    fontSize: 14,
    color: "#155724",
    marginBottom: 2,
  },
  chainImpact: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "600",
  },
  causesGrid: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  causeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  donatedCause: {
    borderWidth: 2,
    borderColor: "#27ae60",
  },
  causeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  causeInfo: {
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
  },
  causeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statText: {
    fontSize: 12,
    color: "#8b4513",
    fontWeight: "600",
  },
  donatedText: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "bold",
  },
  donationView: {
    flex: 1,
  },
  causeHeader: {
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
  selectedCauseInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  selectedDetails: {
    flex: 1,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
  },
  selectedDesc: {
    fontSize: 14,
    color: "#8b4513",
  },
  impactPreview: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  impactGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  impactItem: {
    alignItems: "center",
    flex: 1,
  },
  impactValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 4,
  },
  impactDesc: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  donationButtons: {
    marginBottom: 20,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
    textAlign: "center",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  amountButton: {
    width: (width - 60) / 3,
    paddingVertical: 12,
    backgroundColor: "#d2691e",
    borderRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  amountText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  disabledText: {
    color: "#999",
  },
  culturalCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 15,
  },
  culturalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  culturalText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
  impactButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
  },
  impactText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  impactContainer: {
    padding: 20,
  },
  impactSummary: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  impactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  impactMetric: {
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
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d2691e",
    marginBottom: 15,
  },
  donationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  donationEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  donationInfo: {
    flex: 1,
  },
  donationCause: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  donationAmount: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
  },
  donationImpact: {
    fontSize: 12,
    color: "#666",
  },
  chainDetail: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  chainStory: {
    fontSize: 14,
    color: "#495057",
    fontStyle: "italic",
    marginBottom: 6,
  },
  chainBenefit: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "600",
  },
  storiesCard: {
    backgroundColor: "#e8f5e8",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  storiesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 15,
  },
  storyText: {
    fontSize: 14,
    color: "#155724",
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: "italic",
  },
  resultsButton: {
    backgroundColor: "#d2691e",
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
  culturalImpact: {
    backgroundColor: "#fff3cd",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    width: "100%",
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
