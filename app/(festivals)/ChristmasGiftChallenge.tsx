import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface GiftItem {
  id: string;
  name: string;
  price: number;
  category: 'toy' | 'book' | 'clothes' | 'experience' | 'charity';
  emoji: string;
}

interface WishListItem {
  id: string;
  item: string;
  priority: 1 | 2 | 3;
}

interface ChristmasChallengeProps {
  onClose?: () => void;
}

// Available gift items for the challenge
const GIFT_CATALOG: GiftItem[] = [
  { id: 'teddy', name: 'Soft Teddy Bear', price: 800, category: 'toy', emoji: '🧸' },
  { id: 'lego', name: 'LEGO Building Set', price: 1200, category: 'toy', emoji: '🧱' },
  { id: 'book', name: 'Story Book Collection', price: 600, category: 'book', emoji: '📚' },
  { id: 'puzzle', name: 'Jigsaw Puzzle', price: 400, category: 'toy', emoji: '🧩' },
  { id: 'art', name: 'Art Supplies Kit', price: 700, category: 'experience', emoji: '🎨' },
  { id: 'sweater', name: 'Warm Winter Sweater', price: 900, category: 'clothes', emoji: '🧥' },
  { id: 'boardgame', name: 'Family Board Game', price: 500, category: 'experience', emoji: '🎲' },
  { id: 'charity', name: 'Toy Drive Donation', price: 300, category: 'charity', emoji: '🎁' },
];

export default function ChristmasGiftChallenge({ onClose }: ChristmasChallengeProps) {
  const { themeColors } = useTheme();
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [parentWishList, setParentWishList] = useState<WishListItem[]>([]);
  const [childWishList, setChildWishList] = useState<WishListItem[]>([]);
  const [secretSantaAssignment, setSecretSantaAssignment] = useState<{
    giver: 'parent' | 'child';
    receiver: 'parent' | 'child';
  } | null>(null);
  const [selectedGifts, setSelectedGifts] = useState<GiftItem[]>([]);
  const [budgetRemaining, setBudgetRemaining] = useState(3000);
  const [isLoading, setIsLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const steps = [
    'wish-list-creation',
    'secret-santa-assignment',
    'budget-allocation',
    'charity-decision'
  ];

  // Initialize fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Handle wish list creation
  const handleWishListSubmit = useCallback(async (role: 'parent' | 'child', wishes: WishListItem[]) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_URL}/festival/christmas/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId: 'wish-list-creation',
          completed: true,
          score: 10,
          data: { role, wishes }
        }),
      });

      if (role === 'parent') {
        setParentWishList(wishes);
      } else {
        setChildWishList(wishes);
      }

      setCurrentStep(1);
    } catch (error) {
      Alert.alert('Error', 'Failed to save wish list. Please try again.');
    }
  }, []);

  // Handle Secret Santa assignment
  const handleSecretSantaAssignment = useCallback(() => {
    // Randomly assign Secret Santa (for demo, always assign child as giver)
    setSecretSantaAssignment({
      giver: 'child',
      receiver: 'parent'
    });

    setCurrentStep(2);
  }, []);

  // Handle gift selection
  const handleGiftToggle = useCallback((gift: GiftItem) => {
    setSelectedGifts(prev => {
      const isSelected = prev.some(g => g.id === gift.id);
      if (isSelected) {
        // Remove gift
        setBudgetRemaining(prevBudget => prevBudget + gift.price);
        return prev.filter(g => g.id !== gift.id);
      } else {
        // Add gift (check budget)
        if (budgetRemaining >= gift.price) {
          setBudgetRemaining(prevBudget => prevBudget - gift.price);
          return [...prev, gift];
        } else {
          Alert.alert('Budget Alert', 'Not enough budget for this gift!');
          return prev;
        }
      }
    });
  }, [budgetRemaining]);

  // Complete the challenge
  const handleCompleteChallenge = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();

      // Record final progress
      await fetch(`${API_URL}/festival/christmas/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId: 'charity-decision',
          completed: true,
          score: 20,
          data: { selectedGifts, budgetRemaining }
        }),
      });

      // Complete the festival
      await fetch(`${API_URL}/festival/christmas/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          totalScore: 70,
          badgeEarned: true
        }),
      });

      setShowCelebration(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGifts, budgetRemaining]);

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WishListStep
            onSubmit={(wishes) => handleWishListSubmit('child', wishes)}
          />
        );
      case 1:
        return (
          <SecretSantaStep
            onAssign={handleSecretSantaAssignment}
          />
        );
      case 2:
        return (
          <BudgetAllocationStep
            gifts={GIFT_CATALOG}
            selectedGifts={selectedGifts}
            budgetRemaining={budgetRemaining}
            onGiftToggle={handleGiftToggle}
            onNext={() => setCurrentStep(3)}
          />
        );
      case 3:
        return (
          <CharityDecisionStep
            budgetRemaining={budgetRemaining}
            onComplete={handleCompleteChallenge}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
      <ScrollView style={{ flex: 1, backgroundColor: themeColors.background }}>
        {/* Header */}
        <View style={{
          backgroundColor: 'linear-gradient(135deg, #d32f2f 0%, #1976d2 100%)',
          padding: 20,
          paddingTop: 40,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            🎄 Christmas Gift Economics
          </Text>
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
          }}>
            Plan your family's Secret Santa and learn about budgeting for celebrations!
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={{
          flexDirection: 'row',
          padding: 20,
          justifyContent: 'center',
        }}>
          {steps.map((step, index) => (
            <View key={step} style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: index <= currentStep ? '#4CAF50' : '#E0E0E0',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  color: index <= currentStep ? '#FFFFFF' : '#666666',
                  fontWeight: 'bold',
                }}>
                  {index + 1}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View style={{
                  width: 40,
                  height: 2,
                  backgroundColor: index < currentStep ? '#4CAF50' : '#E0E0E0',
                  marginHorizontal: 5,
                }} />
              )}
            </View>
          ))}
        </View>

        {/* Step Content */}
        <View style={{ padding: 20 }}>
          {renderStep()}
        </View>
      </ScrollView>

      {/* Celebration Modal */}
      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 30,
            alignItems: 'center',
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 48,
              marginBottom: 20,
            }}>
              🎄🎅🎁
            </Text>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#d32f2f',
              textAlign: 'center',
              marginBottom: 16,
            }}>
              Congratulations!
            </Text>
            <Text style={{
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 20,
              color: '#666666',
            }}>
              You've completed the Christmas Gift Economics challenge! You earned the Christmas Cheer Badge and learned about budgeting for celebrations.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#d32f2f',
                paddingHorizontal: 30,
                paddingVertical: 12,
                borderRadius: 25,
              }}
              onPress={() => {
                setShowCelebration(false);
                onClose?.();
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 'bold',
              }}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

// Step Components
function WishListStep({ onSubmit }: { onSubmit: (wishes: WishListItem[]) => void }) {
  const [wishes, setWishes] = useState<WishListItem[]>([
    { id: '1', item: '', priority: 1 },
    { id: '2', item: '', priority: 2 },
    { id: '3', item: '', priority: 3 },
  ]);

  const handleSubmit = () => {
    if (wishes.some(w => !w.item.trim())) {
      Alert.alert('Incomplete', 'Please fill in all three wishes!');
      return;
    }
    onSubmit(wishes);
  };

  return (
    <View>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#d32f2f',
      }}>
        Create Your Wish List 🎁
      </Text>
      <Text style={{
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: '#666666',
      }}>
        What are your top 3 Christmas wishes?
      </Text>

      {wishes.map((wish, index) => (
        <View key={wish.id} style={{
          marginBottom: 16,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#d32f2f',
          }}>
            #{wish.priority} Priority Wish:
          </Text>
          <TextInput
            style={{
              borderWidth: 2,
              borderColor: '#E0E0E0',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: '#FFFFFF',
            }}
            placeholder="What do you want for Christmas?"
            value={wish.item}
            onChangeText={(text) => {
              const newWishes = [...wishes];
              newWishes[index].item = text;
              setWishes(newWishes);
            }}
          />
        </View>
      ))}

      <TouchableOpacity
        style={{
          backgroundColor: '#d32f2f',
          padding: 16,
          borderRadius: 25,
          alignItems: 'center',
          marginTop: 20,
        }}
        onPress={handleSubmit}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: 'bold',
        }}>
          Submit Wish List
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SecretSantaStep({ onAssign }: { onAssign: () => void }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#d32f2f',
      }}>
        Secret Santa Assignment 🎅
      </Text>
      <Text style={{
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: '#666666',
      }}>
        Time to find out who you're buying a gift for!
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: '#d32f2f',
          padding: 20,
          borderRadius: 25,
          alignItems: 'center',
          marginTop: 20,
        }}
        onPress={onAssign}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
          🎁 Reveal My Assignment!
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function BudgetAllocationStep({
  gifts,
  selectedGifts,
  budgetRemaining,
  onGiftToggle,
  onNext
}: {
  gifts: GiftItem[];
  selectedGifts: GiftItem[];
  budgetRemaining: number;
  onGiftToggle: (gift: GiftItem) => void;
  onNext: () => void;
}) {
  const totalSpent = selectedGifts.reduce((sum, gift) => sum + gift.price, 0);

  return (
    <View>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#d32f2f',
      }}>
        Gift Shopping 🛍️
      </Text>

      {/* Budget Display */}
      <View style={{
        backgroundColor: '#FFF8E1',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#FFD54F',
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#F57C00',
        }}>
          Budget: ₹{budgetRemaining} remaining
        </Text>
        <Text style={{
          fontSize: 14,
          textAlign: 'center',
          color: '#666666',
          marginTop: 4,
        }}>
          Spent: ₹{totalSpent} / ₹3000
        </Text>
      </View>

      {/* Gift Catalog */}
      <Text style={{
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#d32f2f',
      }}>
        Available Gifts:
      </Text>

      {gifts.map((gift) => {
        const isSelected = selectedGifts.some(g => g.id === gift.id);
        const canAfford = budgetRemaining >= gift.price;

        return (
          <TouchableOpacity
            key={gift.id}
            style={{
              backgroundColor: isSelected ? '#E8F5E8' : '#FFFFFF',
              borderWidth: 2,
              borderColor: isSelected ? '#4CAF50' : '#E0E0E0',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => onGiftToggle(gift)}
            disabled={!canAfford && !isSelected}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {gift.emoji}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: isSelected ? '#2E7D32' : '#333333',
              }}>
                {gift.name}
              </Text>
              <Text style={{
                fontSize: 14,
                color: canAfford ? '#666666' : '#F44336',
              }}>
                ₹{gift.price}
              </Text>
            </View>
            {isSelected && (
              <Text style={{
                fontSize: 20,
                color: '#4CAF50',
                fontWeight: 'bold',
              }}>
                ✓
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={{
          backgroundColor: selectedGifts.length > 0 ? '#d32f2f' : '#E0E0E0',
          padding: 16,
          borderRadius: 25,
          alignItems: 'center',
          marginTop: 20,
        }}
        onPress={onNext}
        disabled={selectedGifts.length === 0}
      >
        <Text style={{
          color: selectedGifts.length > 0 ? '#FFFFFF' : '#666666',
          fontSize: 16,
          fontWeight: 'bold',
        }}>
          Continue to Charity Decision
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CharityDecisionStep({
  budgetRemaining,
  onComplete,
  isLoading
}: {
  budgetRemaining: number;
  onComplete: () => void;
  isLoading: boolean;
}) {
  const [charityChoice, setCharityChoice] = useState<'donate' | 'save' | null>(null);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#d32f2f',
      }}>
        Giving Back ❤️
      </Text>

      <View style={{
        backgroundColor: '#FFF8E1',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#FFD54F',
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#F57C00',
          marginBottom: 8,
        }}>
          You have ₹{budgetRemaining} left!
        </Text>
        <Text style={{
          fontSize: 16,
          textAlign: 'center',
          color: '#666666',
        }}>
          What would you like to do with the remaining budget?
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: charityChoice === 'donate' ? '#4CAF50' : '#E0E0E0',
          padding: 20,
          borderRadius: 12,
          marginBottom: 16,
          width: '100%',
          alignItems: 'center',
        }}
        onPress={() => setCharityChoice('donate')}
      >
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: charityChoice === 'donate' ? '#FFFFFF' : '#666666',
        }}>
          🎁 Donate to Charity
        </Text>
        <Text style={{
          fontSize: 14,
          color: charityChoice === 'donate' ? '#E8F5E8' : '#999999',
          marginTop: 4,
        }}>
          Help other children this Christmas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: charityChoice === 'save' ? '#2196F3' : '#E0E0E0',
          padding: 20,
          borderRadius: 12,
          marginBottom: 24,
          width: '100%',
          alignItems: 'center',
        }}
        onPress={() => setCharityChoice('save')}
      >
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: charityChoice === 'save' ? '#FFFFFF' : '#666666',
        }}>
          💰 Save for Next Time
        </Text>
        <Text style={{
          fontSize: 14,
          color: charityChoice === 'save' ? '#E3F2FD' : '#999999',
          marginTop: 4,
        }}>
          Keep the money for future celebrations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: charityChoice ? '#d32f2f' : '#E0E0E0',
          padding: 16,
          borderRadius: 25,
          alignItems: 'center',
          width: '100%',
        }}
        onPress={charityChoice ? onComplete : undefined}
        disabled={!charityChoice || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{
            color: charityChoice ? '#FFFFFF' : '#666666',
            fontSize: 16,
            fontWeight: 'bold',
          }}>
            Complete Christmas Challenge! 🎄
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
