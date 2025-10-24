import Confetti from '@/components/animations/Confetti';
import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { fetchFamilyChildren, fetchTransactions } from "@/utils/api";
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from "@/utils/themeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Animated from 'react-native-reanimated';

let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (e) {}
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: themeColors.background,
    flex: 1,
    minHeight: "100%"
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 10,
    color: themeColors.primary,
  },
  sectionCard: {
    backgroundColor: themeColors.card,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    minWidth: 300,
    width: "98%",
    maxWidth: 520,
    elevation: 2,
    shadowColor: themeColors.border,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  filtersRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: 'wrap',
    rowGap: 10
  },
  filterInput: {
    backgroundColor: themeColors.surface,
    borderRadius: 7,
    padding: 7,
    flex: 1,
    borderWidth: 1,
    borderColor: themeColors.border,
    fontSize: 15,
    marginRight: 5,
    color: themeColors.text,
  },
  label: {
    fontWeight: "500",
    fontSize: 14,
    color: themeColors.text,
    marginRight: 3
  },
  list: {
    width: "100%"
  },
  txRow: {
    backgroundColor: themeColors.surface,
    borderRadius: 9,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 5,
    borderLeftColor: themeColors.border,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 80,
    color: themeColors.text,
  },
  txDesc: {
    flex: 1,
    marginLeft: 9,
    fontWeight: "500",
    color: themeColors.text,
  },
  txJar: {
    fontWeight: "bold",
    color: themeColors.success,
    marginHorizontal: 5
  },
  txDate: {
    fontSize: 13,
    color: themeColors.textSecondary,
    marginLeft: 8,
    minWidth: 72
  },
  filterLabel: {
    fontWeight: "500",
    color: themeColors.text,
    fontSize: 13,
    marginRight: 4
  },
  refreshBtn: {
    marginLeft: 10,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 7,
    backgroundColor: themeColors.primary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: themeColors.text,
  },
  txChild: {
    fontWeight: "600",
    fontSize: 13,
    minWidth: 45,
    marginRight: 6,
    color: themeColors.secondary,
  },
  dateFieldBtn: {
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    height: 40,
    paddingHorizontal: 10,
    marginBottom: 4,
    marginTop: 2
  },
  dateFieldText: {
    fontSize: 15,
  },
});

const typeLabels: { [key: string]: string } = {
  "chore-completed": "Home Task",
  "goal-completion": "Goal",
  "reward-purchase": "Reward",
  "points-move": "Move",
  "points-request": "Points Request",
  "parent-points-adjustment": "Adjustment",
  "interest-payout": "Interest Payout"
};

const jarNameMap: { [key: string]: string } = {
  current: 'Pocket Money',
  save: 'Savings Pot',
  spend: 'Spending Pot',
  donate: 'Help Others Pot',
  invest: 'Grow Money Pot'
};

// Enhanced Transaction Achievement System
const getTransactionAchievement = (tx: any) => {
  const type = tx.type;
  const amount = tx.amount;
  const description = tx.description || '';

  // Achievement badges based on transaction type and amount
  switch (type) {
    case 'chore-completed':
      if (amount >= 100) return { badge: '🏆 Super Helper!', color: '#FFD700', story: 'Amazing work on that big tasks!' };
      if (amount >= 50) return { badge: '🧹 Clean Champion!', color: '#4CAF50', story: 'You did an awesome job!' };
      return { badge: '⭐ Helper Star!', color: '#2196F3', story: 'Thanks for helping out!' };

    case 'goal-completion':
      if (amount >= 500) return { badge: '🏆 Goal Master!', color: '#FFD700', story: 'Huge achievement unlocked!' };
      if (amount >= 200) return { badge: '🎯 Target Crusher!', color: '#FF9800', story: 'You hit your goal perfectly!' };
      return { badge: '🎉 Goal Getter!', color: '#E91E63', story: 'Great job reaching your goal!' };

    case 'reward-purchase':
      if (amount <= -200) return { badge: '🎁 Big Spender!', color: '#9C27B0', story: 'Enjoy your awesome reward!' };
      return { badge: '💝 Prize Winner!', color: '#FF5722', story: 'You earned this reward!' };

    case 'points-move':
      return { badge: '🔄 Money Mover!', color: '#607D8B', story: 'Smart money management!' };

    case 'interest-payout':
      return { badge: '💰 Money Grower!', color: '#4CAF50', story: 'Your money is growing!' };

    case 'parent-points-adjustment':
      if (amount > 0) return { badge: '🎁 Parent Gift!', color: '#E91E63', story: 'Special surprise from parents!' };
      return { badge: '⚖️ Balance Fix!', color: '#FF9800', story: 'Account adjustment made.' };

    default:
      return { badge: amount > 0 ? '✨ Points Earned!' : '💰 Points Spent!', color: '#9E9E9E', story: 'Transaction completed.' };
  }
};

// Expandable Transaction Card Component
const TransactionCard = ({ tx, themeColors, isExpanded, onToggle }: {
  tx: any;
  themeColors: any;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  const achievement = getTransactionAchievement(tx);

  useEffect(() => {
    if (tx.amount > 0 && Math.random() < 0.1) { // 10% chance for celebration
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [tx.amount]);

  const quickReactions = ['👍', '🎉', '💪', '😊', '🌟'];

  return (
    <View style={{ marginBottom: 4 }}>
      {/* Main Transaction Row */}
      <TouchableOpacity
        style={[
          {
            backgroundColor: themeColors.surface,
            borderRadius: 12,
            marginBottom: 4,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderLeftWidth: 4,
            borderLeftColor: tx.amount > 0 ? themeColors.success : themeColors.error,
            elevation: 1,
            shadowColor: themeColors.border,
          }
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {/* Achievement Badge */}
        <View style={{
          backgroundColor: achievement.color + '20',
          borderRadius: 16,
          paddingHorizontal: 8,
          paddingVertical: 4,
          marginRight: 10,
          borderWidth: 1,
          borderColor: achievement.color + '40'
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: achievement.color
          }}>
            {achievement.badge}
          </Text>
        </View>

        {/* Transaction Info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: themeColors.text,
            marginBottom: 2
          }}>
            {tx.amount > 0 ? '+' : ''}{tx.amount} points
          </Text>
          <Text style={{
            fontSize: 12,
            color: themeColors.textSecondary
          }}>
            {(tx.date || tx.createdAt || "").slice(0, 10)} • {tx.childName || "Child"}
          </Text>
        </View>

        {/* Expand Indicator */}
        <Text style={{
          fontSize: 16,
          color: themeColors.primary,
          fontWeight: 'bold'
        }}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {/* Expanded Details */}
      {isExpanded && (
        <Animated.View
          style={{
            backgroundColor: themeColors.card,
            borderRadius: 12,
            padding: 16,
            marginLeft: 20,
            marginRight: 4,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: themeColors.border,
          }}
        >
          {/* Achievement Story */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            padding: 8,
            backgroundColor: achievement.color + '10',
            borderRadius: 8
          }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>{achievement.badge.split(' ')[0]}</Text>
            <Text style={{
              fontSize: 14,
              color: themeColors.text,
              flex: 1
            }}>
              {achievement.story}
            </Text>
          </View>

          {/* Transaction Details */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontSize: 14,
              color: themeColors.text,
              marginBottom: 4
            }}>
              <Text style={{ fontWeight: 'bold' }}>Details:</Text> {
                (tx.description || typeLabels[tx.type] || tx.type)
                  .replace(/current/g, 'Pocket Money')
                  .replace(/save/g, 'Savings Pot')
                  .replace(/spend/g, 'Spending Pot')
                  .replace(/donate/g, 'Help Others Pot')
                  .replace(/invest/g, 'Grow Money Pot')
                  .replace(/\sjar/g, '')
              }
            </Text>

            {tx.fromJar && (
              <Text style={{
                fontSize: 12,
                color: themeColors.textSecondary
              }}>
                From: {tx.fromJar.replace(/current/g, 'Pocket Money').replace(/save/g, 'Savings Pot').replace(/spend/g, 'Spending Pot').replace(/donate/g, 'Help Others Pot').replace(/invest/g, 'Grow Money Pot')}
              </Text>
            )}

            {(tx.toJar || tx.type === "points-move") && (
              <Text style={{
                fontSize: 12,
                color: themeColors.textSecondary
              }}>
                To: {tx.toJar ? tx.toJar.replace(/current/g, 'Pocket Money').replace(/save/g, 'Savings Pot').replace(/spend/g, 'Spending Pot').replace(/donate/g, 'Help Others Pot').replace(/invest/g, 'Grow Money Pot') : 'Different Pot'}
              </Text>
            )}
          </View>

          {/* Quick Reactions */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{
              fontSize: 12,
              color: themeColors.textSecondary,
              marginBottom: 6
            }}>
              How do you feel about this?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {quickReactions.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: reaction === emoji ? themeColors.primary + '20' : themeColors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: reaction === emoji ? themeColors.primary : themeColors.border
                  }}
                  onPress={() => setReaction(reaction === emoji ? null : emoji)}
                >
                  <Text style={{ fontSize: 16 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Confetti Celebration */}
      {showConfetti && (
        <Confetti
          duration={2000}
          onComplete={() => setShowConfetti(false)}
        />
      )}
    </View>
  );
};

function TypeSelect({ value, onChange, themeColors }: { value: string; onChange: (val: string) => void; themeColors: any }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const typeOptions = [
    { label: 'All', value: '' },
    { label: 'Home Task', value: 'chore-completed' },
    { label: 'Goal', value: 'goal-completion' },
    { label: 'Reward', value: 'reward-purchase' },
    { label: 'Move', value: 'points-move' },
    { label: 'Points Request', value: 'points-request' },
    { label: 'Adjustment', value: 'parent-points-adjustment' },
   
  ];

  const selectedLabel = typeOptions.find(opt => opt.value === value)?.label || 'All';

  if (Platform.OS === "web") {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          backgroundColor: themeColors.surface,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: themeColors.border,
          fontSize: 15,
          padding: 8,
          width: "100%",
          minHeight: 35,
          color: themeColors.text,
        }}
      >
           <option value="">All</option>
        <option value="chore-completed">Task</option>
        <option value="goal-completion">Goal</option>
        <option value="reward-purchase">Reward</option>
        <option value="points-move">Move</option>
        <option value="parent-points-adjustment">Adjustment</option>
      </select>
    );
  }
  return (
    <View style={{ position: 'relative' }}>
      <TouchableOpacity
        style={{
          height: 45,
          backgroundColor: themeColors.surface,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: themeColors.border,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          flexDirection: 'row',
          marginBottom: 10,
        }}
        onPress={() => setDropdownVisible(true)}
      >
        <Text style={{
          fontSize: 15,
          color: themeColors.text,
          flex: 1
        }}>
          {selectedLabel}
        </Text>
        <Text style={{
          fontSize: 16,
          color: themeColors.primary,
          fontWeight: 'bold'
        }}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 7,
              borderWidth: 1,
              borderColor: themeColors.border,
              minWidth: 200,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              maxWidth: 300
            }}
            activeOpacity={1}
          >
            {typeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{
                  padding: 16,
                  borderBottomWidth: option.value === 'others' ? 0 : 1,
                  borderBottomColor: themeColors.border
                }}
                onPress={() => {
                  onChange(option.value);
                  setDropdownVisible(false);
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: themeColors.text
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function DateInput({ value, onChange, placeholder, themeColors }: {
  value: string, onChange: (val: string) => void, placeholder?: string, themeColors: any
}) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          backgroundColor: themeColors.surface,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: themeColors.border,
          fontSize: 15,
          padding: 8,
          minHeight: 35,
          minWidth: 110,
          width: "100%",
          color: themeColors.text,
        }}
        placeholder={placeholder}
      />
    );
  }
  // Native mobile: use button+modal for readability/tap, plus DateTimePicker popup
  return (
    <View style={{ width: "100%" }}>
      <TouchableOpacity
        style={{
          backgroundColor: themeColors.surface,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: themeColors.border,
          justifyContent: "space-between",
          alignItems: "center",
          height: 40,
          paddingHorizontal: 10,
          marginBottom: 4,
          marginTop: 2,
          flexDirection: "row"
        }}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 15,
            color: value ? themeColors.text : themeColors.textSecondary,
            flex: 1
          }}
        >
          {value ? value : (placeholder || "Select Date")}
        </Text>
        <Text style={{
          fontSize: 16,
          color: themeColors.primary,
          fontWeight: 'bold'
        }}>
          📅
        </Text>
      </TouchableOpacity>
      {show && DateTimePicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={(_event: any, d?: Date) => {
            setShow(false);
            if (d) {
              // Format as YYYY-MM-DD
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              onChange(`${year}-${month}-${day}`);
            }
          }}
        />
      )}
    </View>
  );
}

export default function ParentTransactionHistoryScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [childMap, setChildMap] = useState<{ [key: string]: string }>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  // Removed isRefreshing state - no longer needed without pull-to-refresh

  const loadTransactions = async (page = 1, append = false) => {
    if (!append) setLoading(true);
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) throw new Error("Not authenticated.");
      const parent = JSON.parse(storedUser);
      const familyId = parent.familyId;
      const children = await fetchFamilyChildren(familyId, token);
      const childIdMap: { [key: string]: string } = {};
      children.forEach((c: any) => {
        childIdMap[c._id] = c.name || c.id;
        childIdMap[c.id] = c.name || c.id;
      });
      setChildMap(childIdMap);

      let allTxs: any[] = append ? [...transactions] : [];
      for (const child of children) {
        const txs = await fetchTransactions(child.id, token, page);
        if (txs && txs.transactions) {
          allTxs = allTxs.concat((txs.transactions || []).map((t: any) => ({ ...t, childName: child.name || child.id })));
        }
      }
      setTransactions(allTxs);
    } catch {
      if (!append) setTransactions([]);
    }
    if (!append) setLoading(false);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filtering logic
  const filtered = transactions.filter(tx => {
    const txDateStr = tx.date || tx.createdAt || "";
    const txDate = new Date(txDateStr);
    let afterStart = true; let beforeEnd = true;
    if (startDate && startDate.trim()) {
      const startFilter = new Date(startDate.trim());
      afterStart = !isNaN(txDate.getTime()) && !isNaN(startFilter.getTime()) && txDate.getTime() >= startFilter.getTime();
    }
    if (endDate && endDate.trim()) {
      const endFilter = new Date(endDate.trim() + "T23:59:59.999Z");
      beforeEnd = !isNaN(txDate.getTime()) && !isNaN(endFilter.getTime()) && txDate.getTime() <= endFilter.getTime();
    }
    if (!afterStart || !beforeEnd) return false;
    if (type && tx.type !== type) return false;
    if (search && !`${tx.description || ""} ${tx.type}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 560, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.primary,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.title, { color: themeColors.primary }]}>Family Points Story</Text>
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card }]}>
        {/* Filters, vertical on mobile, horizontal on web */}
        <View style={styles.filtersRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Search</Text>
            <TextInput
              placeholder="Type to search..."
              style={styles.filterInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Filter by Type</Text>
            <TypeSelect value={type} onChange={setType} themeColors={themeColors} />
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadTransactions()} accessibilityLabel="Refresh transaction list">
            <Text style={{ color: themeColors.card, fontWeight: "bold" }}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        {/* Date Range Filter */}
        <View style={[styles.filtersRow, {marginTop: 8}]}>
          <View style={{ flex: 1, minWidth: 120, marginRight: 8 }}>
            <Text style={[styles.label, { color: themeColors.text }]}>From Date</Text>
            <DateInput
              value={startDate}
              onChange={setStartDate}
              placeholder="YYYY-MM-DD"
              themeColors={themeColors}
            />
          </View>
          <View style={{ flex: 1, minWidth: 120, marginLeft: 8 }}>
            <Text style={[styles.label, { color: themeColors.text }]}>To Date</Text>
            <DateInput
              value={endDate}
              onChange={setEndDate}
              placeholder="YYYY-MM-DD"
              themeColors={themeColors}
            />
          </View>
          {(startDate || endDate) && (
            <TouchableOpacity
              style={[styles.refreshBtn, {backgroundColor: themeColors.surface, alignSelf: 'flex-end'}]}
              onPress={() => {setStartDate(""); setEndDate("");}}
            >
              <Text style={{ color: themeColors.primary, fontWeight: "bold" }}>✕ Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        {(startDate && endDate && startDate > endDate) && (
          <Text style={{ color: themeColors.error, fontWeight: "bold", marginLeft: 4, marginTop: 2, fontSize: 14 }}>
            Start date cannot be after end date.
          </Text>
        )}
      </View>
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Family Points Activity</Text>
          {(() => {
            const lastUpdated = new Date();
            return (
              <Text style={{ fontSize: 12, color: themeColors.textSecondary, fontStyle: "italic" }}>
                Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
              </Text>
            );
          })()}
        </View>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={filtered.sort((a, b) => {
              const dateA = new Date(a.date || a.createdAt || "1970-01-01");
              const dateB = new Date(b.date || b.createdAt || "1970-01-01");
              return dateB.getTime() - dateA.getTime();
            })}
            keyExtractor={(item) => item._id || Math.random().toString()}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index
            })}
            renderItem={({ item: tx }) => (
              <TransactionCard
                tx={tx}
                themeColors={themeColors}
                isExpanded={expandedTransactionId === (tx._id || tx.id)}
                onToggle={() => {
                  setExpandedTransactionId((prev: string | null) => {
                    const txId = tx._id || tx.id || Math.random().toString();
                    return prev === txId ? null : txId;
                  });
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: themeColors.textSecondary, padding: 10, fontStyle: "italic" }}>
                No points activity found.
              </Text>
            }
            // Load more only when explicitly requested - disabled continuous loading
            // Users can manually refresh for more data if needed
          />
        )}
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="Transaction History Help"
        tabs={[
          {
            title: "Overview",
            content: [
              {
                type: "text",
                text: "The Transaction History shows all points earned, spent, and moved by your children. This helps you track their financial activity and understand their spending/saving patterns.",
              },
              {
                type: "highlight",
                text: "💡 Use filters to find specific transactions and monitor your child's financial behavior over time!",
              },
            ],
          },
          {
            title: "Understanding Transactions",
            content: [
              {
                type: "text",
                text: "Each transaction shows:",
              },
              {
                type: "bullet",
                text: "Child's name - which family member the transaction belongs to",
              },
              {
                type: "bullet",
                text: "Amount - points earned (+) or spent (-) with color coding",
              },
              {
                type: "bullet",
                text: "Description - what the transaction was for (chore, reward, points movement, etc.)",
              },
              {
                type: "bullet",
                text: "Jar movement - shows which money jars points were moved between",
              },
              {
                type: "bullet",
                text: "Date - when the transaction occurred",
              },
              {
                type: "highlight",
                text: "🟢 Green border = points earned, 🔴 Red border = points spent, ⚪ Gray border = adjustments",
              },
            ],
          },
          {
            title: "Transaction Types",
            content: [
              {
                type: "text",
                text: "Different types of financial activities:",
              },
              {
                type: "bullet",
                text: "Home Task - points earned from completing chores",
              },
              {
                type: "bullet",
                text: "Goal - points used to complete savings goals",
              },
              {
                type: "bullet",
                text: "Reward - points spent on rewards from the store",
              },
              {
                type: "bullet",
                text: "Move - points transferred between money jars",
              },
              {
                type: "bullet",
                text: "Points Request - requests for additional points",
              },
              {
                type: "bullet",
                text: "Adjustment - manual point changes by parents",
              },
              {
                type: "highlight",
                text: "📊 Filter by type to see specific activities like all rewards purchased or chores completed!",
              },
            ],
          },
          {
            title: "Filtering & Searching",
            content: [
              {
                type: "text",
                text: "Find exactly what you're looking for:",
              },
              {
                type: "bullet",
                text: "Search box - type keywords to find transactions (e.g., 'dishes', 'bike', 'allowance')",
              },
              {
                type: "bullet",
                text: "Type filter - select specific transaction types from the dropdown",
              },
              {
                type: "bullet",
                text: "Date range - choose 'From' and 'To' dates to see activity in a specific period",
              },
              {
                type: "bullet",
                text: "Clear button - removes date filters to see all transactions",
              },
              {
                type: "highlight",
                text: "🔍 Combine filters for powerful searches - e.g., all rewards purchased in the last month!",
              },
            ],
          },
          {
            title: "Money Jars Explained",
            content: [
              {
                type: "text",
                text: "Points are organized in 5 money jars:",
              },
              {
                type: "bullet",
                text: "Pocket Money - immediate spending money",
              },
              {
                type: "bullet",
                text: "Savings Pot - money saved for bigger goals",
              },
              {
                type: "bullet",
                text: "Spending Pot - planned spending on wants",
              },
              {
                type: "bullet",
                text: "Help Others Pot - money for donations and giving",
              },
              {
                type: "bullet",
                text: "Grow Money Pot - long-term investing and growth",
              },
              {
                type: "highlight",
                text: "🏦 Watch how your child moves points between jars to learn about their financial priorities!",
              },
            ],
          },
          {
            title: "Using the Data",
            content: [
              {
                type: "text",
                text: "Make the most of transaction history:",
              },
              {
                type: "bullet",
                text: "Track spending patterns - see what rewards your child values most",
              },
              {
                type: "bullet",
                text: "Monitor saving habits - check how often they move points to savings",
              },
              {
                type: "bullet",
                text: "Review chore completion - see consistency in earning points",
              },
              {
                type: "bullet",
                text: "Identify teaching moments - discuss decisions and learnings",
              },
              {
                type: "bullet",
                text: "Set goals together - use data to plan future financial targets",
              },
              {
                type: "highlight",
                text: "📈 Regular review of transaction history helps you guide your child's financial development!",
              },
            ],
          },
        ]}
      />
    </View>
  );
}
