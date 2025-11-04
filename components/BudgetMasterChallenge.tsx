import { useTheme } from '@/utils/themeContext';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BudgetMasterChallengeProps {
  adventure: any;
  onClose: () => void;
}

export function BudgetMasterChallenge({ adventure, onClose }: BudgetMasterChallengeProps) {
  const { themeColors } = useTheme();
  const [budget, setBudget] = useState(500); // Monthly budget amount
  const [categories, setCategories] = useState([
    { name: "Food", allocated: 0, color: themeColors.success },
    { name: "Transport", allocated: 0, color: themeColors.primary },
    { name: "Entertainment", allocated: 0, color: themeColors.warning },
    { name: "Savings", allocated: 0, color: themeColors.accent },
    { name: "Other", allocated: 0, color: themeColors.secondary }
  ]);
  const [showResults, setShowResults] = useState(false);

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const remaining = budget - totalAllocated;
  const isBalanced = Math.abs(remaining) < 5; // Allow small margin for rounding

  const updateAllocation = (index: number, amount: number) => {
    setCategories(prev => prev.map((cat, i) =>
      i === index ? { ...cat, allocated: Math.max(0, amount) } : cat
    ));
  };

  const resetBudget = () => {
    setCategories(prev => prev.map(cat => ({ ...cat, allocated: 0 })));
    setShowResults(false);
  };

  const checkBudget = () => {
    setShowResults(true);
  };

  const getFeedback = () => {
    const savingsPercent = (categories[3].allocated / budget) * 100;
    if (savingsPercent >= 20) return "Excellent! Saving 20%+ is a great habit! 🏆";
    if (savingsPercent >= 10) return "Good job! Aim to save even more next time! 👍";
    return "Try to save at least 10% of your budget! 💡";
  };

  return (
    <View style={{ padding: 18, alignItems: "center" }}>
      <Text style={{
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 9,
        textAlign: "center",
        color: themeColors.primary
      }}>
        {adventure.icon} {adventure.title}
      </Text>

      {!showResults ? (
        <>
          <Text style={{
            fontSize: 16,
            textAlign: "center",
            marginBottom: 20,
            color: themeColors.text
          }}>
            Plan your monthly budget of ₹{budget}! Allocate money to different categories wisely. 💰
          </Text>

          <View style={{ width: "100%", marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 10,
              color: themeColors.text
            }}>
              Total Budget: ₹{budget}
            </Text>
            <Text style={{
              fontSize: 14,
              marginBottom: 15,
              color: themeColors.textSecondary
            }}>
              Remaining: <Text style={{
                fontWeight: "bold",
                color: remaining >= 0 ? themeColors.success : themeColors.error
              }}>
                ₹{remaining}
              </Text>
            </Text>

            {categories.map((category, index) => (
              <View key={category.name} style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
                padding: 10,
                backgroundColor: themeColors.surface,
                borderRadius: 8,
              }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: category.color,
                  marginRight: 10,
                }} />
                <Text style={{
                  flex: 1,
                  fontWeight: "bold",
                  color: themeColors.text
                }}>
                  {category.name}
                </Text>
                <Text style={{
                  marginRight: 10,
                  color: themeColors.textSecondary
                }}>
                  ₹{category.allocated}
                </Text>
                <TouchableOpacity
                  onPress={() => updateAllocation(index, category.allocated - 10)}
                  style={{
                    backgroundColor: themeColors.error + '44',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    marginRight: 5,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: themeColors.error
                  }}>-10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateAllocation(index, category.allocated + 10)}
                  style={{
                    backgroundColor: themeColors.success + '44',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: themeColors.success
                  }}>+10</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={checkBudget}
            style={{
              backgroundColor: themeColors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 25,
              alignItems: "center",
              marginBottom: 10,
              elevation: 3,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              📊 Check My Budget!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetBudget}
            style={{
              backgroundColor: themeColors.secondary,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 15,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              🔄 Reset
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={{
            backgroundColor: isBalanced ? themeColors.success + '22' : themeColors.warning + '22',
            borderRadius: 15,
            padding: 20,
            marginBottom: 20,
            alignItems: "center",
            borderWidth: 2,
            borderColor: isBalanced ? themeColors.success : themeColors.warning,
            width: "100%",
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              color: themeColors.text
            }}>
              {isBalanced ? "🎉 Budget Balanced!" : "⚠️ Budget Needs Adjustment"}
            </Text>

            <Text style={{
              fontSize: 16,
              textAlign: "center",
              marginBottom: 15,
              color: themeColors.text
            }}>
              {isBalanced
                ? "Perfect! Your budget is balanced. You allocated all ₹500 wisely!"
                : remaining > 0
                  ? `You have ₹${remaining} left to allocate. Try adding to savings!`
                  : `You're over budget by ₹${Math.abs(remaining)}. Try reducing some categories.`
              }
            </Text>

            <Text style={{
              fontSize: 14,
              textAlign: "center",
              marginBottom: 10,
              color: themeColors.textSecondary
            }}>
              {getFeedback()}
            </Text>

            <View style={{ marginTop: 10 }}>
              {categories.map((category, index) => (
                <Text key={category.name} style={{
                  fontSize: 14,
                  color: themeColors.text,
                  marginBottom: 2
                }}>
                  {category.name}: ₹{category.allocated} ({((category.allocated / budget) * 100).toFixed(0)}%)
                </Text>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowResults(false)}
            style={{
              backgroundColor: themeColors.secondary,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 20,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              🔄 Try Different Amounts
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderWidth: 1,
          paddingVertical: 7,
          paddingHorizontal: 21,
          borderRadius: 8,
          alignSelf: "center",
        }}
        onPress={() => {
          // Update budget achievement when completing budget lesson
          import('./AchievementSystem').then(({ updateAchievementProgress }) => {
            updateAchievementProgress('budget-planner', 1);
          }).catch(error => {
            console.error('Error updating budget achievement:', error);
          });
          onClose();
        }}
      >
        <Text style={{
          fontWeight: "700",
          color: themeColors.text,
        }}>
          Complete Budget Lesson
        </Text>
      </TouchableOpacity>
    </View>
  );
}
