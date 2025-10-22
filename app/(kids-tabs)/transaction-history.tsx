import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { fetchTransactions } from "@/utils/api";
import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (e) {}
}

// Dynamic styles that use theme colors
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
});

const typeLabels: { [key: string]: string } = {
  "chore-completion": "Task",
  "goal-completion": "Goal",
  "reward-purchase": "Reward",
  "points-move": "Move",
  "points-request": "Points Request",
  "parent-points-adjustment": "Adjustment",
  "interest-payout": "Interest Payout"
};

function TypeSelect({ value, onChange, themeColors }: { value: string; onChange: (val: string) => void; themeColors: any }) {
  const [dropdownVisible, setDropdownVisible] = React.useState(false);

  const typeOptions = [
    { label: 'All', value: '' },
    { label: 'Task', value: 'chore-completion' },
    { label: 'Goal', value: 'goal-completion' },
    { label: 'Reward', value: 'reward-purchase' },
    { label: 'Move', value: 'points-move' },
    { label: 'Points Request', value: 'points-request' },
    { label: 'Adjustment', value: 'parent-points-adjustment' },
    { label: 'Interest Payout', value: 'interest-payout' },
    { label: 'Others', value: 'others' }
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
        <option value="chore-completion">Task</option>
        <option value="goal-completion">Goal</option>
        <option value="reward-purchase">Reward</option>
        <option value="points-move">Move</option>
        <option value="points-request">Points Request</option>
        <option value="parent-points-adjustment">Adjustment</option>
        <option value="interest-payout">Interest Payout</option>
        <option value="others">Others</option>
      </select>
    );
  }
  return (
    <View style={{ position: 'relative', marginRight: 5 }}>
      <TouchableOpacity
        style={{
          height: 40,
          backgroundColor: themeColors.surface,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: themeColors.border,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          flexDirection: 'row',
          minWidth: 120
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

export default function TransactionHistoryScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  // Date filter logic
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Performance enhancements
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Removed isRefreshing state - no longer needed without pull-to-refresh
  const [visibleCount, setVisibleCount] = useState(20); // Lazy loading chunk size
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  const loadTransactions = async (isBackground = false, page = 1) => {
    if (!isBackground) setLoading(true);
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) throw new Error("Not authenticated.");
      const user = JSON.parse(storedUser);
      let userId = user.id || user._id;

      if (fetchTransactions) {
        const result = await fetchTransactions(userId, token, page);
        if (page === 1) {
          setTransactions(result.transactions || []);
        } else {
          setTransactions(prev => [...prev, ...(result.transactions || [])]);
        }
        setLastUpdated(new Date());
      } else {
        // fallback direct fetch
        const res = await fetch(`${API_URL}/transactions/${userId}?page=${page}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          if (page === 1) {
            setTransactions(result.transactions || []);
          } else {
            setTransactions(prev => [...prev, ...(result.transactions || [])]);
          }
          setLastUpdated(new Date());
        } else if (res.status === 429) {
          // Rate limited - don't update transactions, just log
          console.warn('Transaction history refresh rate limited, skipping update');
          if (!isBackground) {
            // Show user-friendly message for manual refresh
            Alert.alert('Please Wait', 'Too many requests. Please wait a moment before refreshing again.');
          }
          return; // Exit early without updating
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Only clear transactions on actual errors, not rate limiting
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('429')) {
        setTransactions([]);
      }
    }
    if (!isBackground) setLoading(false);
  };

  // Background sync - reduced frequency to prevent rate limiting
  useEffect(() => {
    const startBackgroundSync = () => {
      refreshIntervalRef.current = setInterval(() => {
        loadTransactions(true);
      }, 120000); // 2 minutes instead of 30 seconds
    };

    const stopBackgroundSync = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };

    // Listen to app state changes for focus-based refresh with delay to avoid immediate API calls
    let focusTimeout: NodeJS.Timeout;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Delay focus refresh to avoid immediate API calls when switching screens
        focusTimeout = setTimeout(() => {
          loadTransactions(true);
        }, 2000); // 2 second delay
      } else {
        // Clear timeout if app goes inactive
        if (focusTimeout) {
          clearTimeout(focusTimeout);
        }
      }
    });

    startBackgroundSync();

    return () => {
      stopBackgroundSync();
      subscription?.remove();
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
    };
  }, []);

  useEffect(() => {
    loadTransactions();
  }, []);

  // filter search/type/date
  const filtered = transactions.filter(tx => {
    const txDateStr = tx.date || tx.createdAt || "";
    const txDate = new Date(txDateStr);
    const txTime = txDate.getTime();
    // Date logic
    let afterStart = true; let beforeEnd = true;
    if (startDate) afterStart = !isNaN(txTime) && txTime >= new Date(startDate).getTime();
    if (endDate) beforeEnd = !isNaN(txTime) && txTime <= new Date(endDate + "T23:59:59.999Z").getTime();
    if (!afterStart || !beforeEnd) return false;
    if (type && tx.type !== type) return false;
    if (search && !`${tx.description || ""} ${tx.type}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back" to="/(kids-tabs)" />
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 4,
            elevation: 2,
            minWidth: 32,
            alignItems: 'center',
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.title, { color: themeColors.primary }]}>My Points Story</Text>
      <View style={styles.sectionCard}>
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
        <View style={[styles.filtersRow, {marginTop: 4}]}>
          <View style={{ flex: 1, minWidth: 120 }}>
            <Text style={[styles.label, { color: themeColors.text }]}>From Date</Text>
            <DateInput
              value={startDate}
              onChange={setStartDate}
              placeholder="YYYY-MM-DD"
              themeColors={themeColors}
            />
          </View>
          <View style={{ flex: 1, minWidth: 120 }}>
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
        {/* Show validation if start > end */}
        {(startDate && endDate && startDate > endDate) && (
          <Text style={{ color: themeColors.error, fontWeight: "bold", marginLeft: 4, marginTop: 2, fontSize: 14 }}>
            Start date cannot be after end date.
          </Text>
        )}
      </View>
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Points Activity</Text>
          {lastUpdated && (
            <Text style={{ fontSize: 12, color: themeColors.textSecondary, fontStyle: "italic" }}>
              Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
            </Text>
          )}
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
              <View
                style={[
                  styles.txRow,
                  {
                    borderLeftColor:
                      tx.amount > 0 ? themeColors.success :
                      tx.amount < 0 ? themeColors.error : themeColors.border
                  }
                ]}
              >
                {tx.type === "interest-payout" ? (
                  <>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: themeColors.success }
                      ]}
                    >
                      +{tx.amount}
                    </Text>
                    <Text style={styles.txDesc}>
                      Interest Payout
                    </Text>
                    <Text style={[styles.txJar, { color: themeColors.success }]}>
                      Savings Pot
                    </Text>
                    <Text style={styles.txDate}>
                      {(tx.date || tx.createdAt || "").slice(0, 10)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: tx.amount > 0 ? themeColors.success : tx.amount < 0 ? themeColors.error : themeColors.text }
                      ]}
                    >
                      {tx.amount > 0 ? "+" : tx.amount < 0 ? "" : ""}
                      {tx.amount}
                    </Text>
                    <Text style={styles.txDesc}>
                      {(tx.description || typeLabels[tx.type] || tx.type)
                        .replace(/current/g, 'Pocket Money')
                        .replace(/save/g, 'Savings Pot')
                        .replace(/spend/g, 'Spending Pot')
                        .replace(/donate/g, 'Help Others Pot')
                        .replace(/invest/g, 'Grow Money Pot')
                        .replace(/\sjar/g, '')}
                    </Text>
                    <Text style={styles.txJar}>
                      {tx.fromJar
                        ? `→ ${tx.fromJar.replace(/current/g, 'Pocket Money').replace(/save/g, 'Savings Pot').replace(/spend/g, 'Spending Pot').replace(/donate/g, 'Help Others Pot').replace(/invest/g, 'Grow Money Pot')}`
                        : tx.type === "points-move" && tx.toJar
                        ? `→ ${tx.toJar.replace(/current/g, 'Pocket Money').replace(/save/g, 'Savings Pot').replace(/spend/g, 'Spending Pot').replace(/donate/g, 'Help Others Pot').replace(/invest/g, 'Grow Money Pot')}`
                        : ""}
                    </Text>
                    <Text style={styles.txDate}>
                      {(tx.date || tx.createdAt || "").slice(0, 10)}
                    </Text>
                  </>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: themeColors.textSecondary, padding: 10, fontStyle: "italic" }}>
                No transactions found.
              </Text>
            }
            // Pull-to-refresh removed to prevent auto-refresh during scrolling
            onEndReached={() => {
              // Load more data when reaching the end
              const currentPage = Math.ceil(transactions.length / 50) + 1;
              loadTransactions(false, currentPage);
            }}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="📊 My Points Story - Help"
        tabs={[
          {
            title: "What's This Page?",
            content: [
              {
                type: "text",
                text: "This is like your money diary! It shows everything you did with your points, like earning them and spending them.",
                icon: "📚"
              },
              {
                type: "bullet",
                text: "🟢 Green means you GOT points!"
              },
              {
                type: "bullet",
                text: "🔴 Red means you SPENT points"
              },
              {
                type: "bullet",
                text: "See when things happened and why"
              },
              {
                type: "highlight",
                text: "Watch your money story grow! 🌟",
                icon: "✨"
              }
            ]
          },
          {
            title: "Finding Your Points",
            content: [
              {
                type: "text",
                text: "Want to find a specific thing? Use these fun tools:",
                icon: "🔍"
              },
              {
                type: "bullet",
                text: "🔤 Search box - Type what you're looking for!"
              },
              {
                type: "bullet",
                text: "📋 Type picker - Show only tasks, rewards, or moves"
              },
              {
                type: "bullet",
                text: "📅 Date picker - See points from certain days"
              },
              {
                type: "highlight",
                text: "Mix and match to find exactly what you want!",
                icon: "🎯"
              }
            ]
          },
          {
            title: "How You Get Points",
            content: [
              {
                type: "text",
                text: "Here are all the fun ways you can earn and spend points:",
                icon: "🎉"
              },
              {
                type: "bullet",
                text: "🧹 Tasks - Doing chores around the house"
              },
              {
                type: "bullet",
                text: "🎯 Goals - Reaching your savings targets"
              },
              {
                type: "bullet",
                text: "🎁 Rewards - Buying things you earned"
              },
              {
                type: "bullet",
                text: "🔄 Moves - Switching points between your pots"
              },
              {
                type: "bullet",
                text: "👨‍👩‍👧‍👦 Parent gifts - Extra points from Mom/Dad!"
              },
              {
                type: "highlight",
                text: "Every point tells part of your awesome story!",
                icon: "📖"
              }
            ]
          }
        ]}
      />
    </View>
  );
}
