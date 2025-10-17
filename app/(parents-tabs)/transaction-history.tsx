import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { fetchFamilyChildren, fetchTransactions } from "@/utils/api";
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from "@/utils/themeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: "#f6fafd",
    flex: 1,
    minHeight: "100%"
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 10,
    color: "#174389",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    minWidth: 300,
    width: "98%",
    maxWidth: 560,
    elevation: 2,
    shadowColor: "#aaa",
  },
  filtersRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  filterInput: {
    backgroundColor: "#fafafa",
    borderRadius: 7,
    padding: 7,
    flex: 1,
    borderWidth: 1,
    borderColor: "#cedbef",
    fontSize: 15,
    marginRight: 5
  },
  label: {
    fontWeight: "500",
    fontSize: 14,
    color: "#48509b",
    marginRight: 3
  },
  list: {
    width: "100%"
  },
  txRow: {
    backgroundColor: "#f8fafd",
    borderRadius: 9,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#eee"
  },
  txChild: {
    fontWeight: "600",
    fontSize: 13,
    color: "#693acd",
    minWidth: 45,
    marginRight: 6,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 80
  },
  txDesc: {
    flex: 1,
    marginLeft: 9,
    fontWeight: "500",
    color: "#443d58"
  },
  txJar: {
    fontWeight: "bold",
    color: "#238216",
    marginHorizontal: 5
  },
  txDate: {
    fontSize: 13,
    color: "#8796ab",
    marginLeft: 8,
    minWidth: 74
  },
  filterLabel: {
    fontWeight: "500",
    color: "#346",
    fontSize: 13,
    marginRight: 4
  },
  refreshBtn: {
    marginLeft: 10,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 7,
    backgroundColor: "#dcecf1"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#234",
  },
});

const typeLabels: { [key: string]: string } = {
  "chore-completion": "Home Task",
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

function DateInput({ value, onChange, min, max, placeholder }: {
  value: string, onChange: (val: string) => void, min?: string, max?: string, placeholder?: string
}) {
  if (Platform.OS === "web") {
    return (
      <input
        type="date"
        style={{
          backgroundColor: "#fafafa",
          borderRadius: 7,
          padding: 7,
          flex: 1,
          borderWidth: 1,
          borderColor: "#cedbef",
          fontSize: 15,
          marginRight: 5
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
      />
    );
  }
  return (
    <TextInput
      style={styles.filterInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
    />
  )
}

export default function ParentTransactionHistoryScreen() {
  const { themeColors } = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [childMap, setChildMap] = useState<{ [key: string]: string }>({});
  // Date filter logic
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Native modal pickers
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  // Help modal
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) throw new Error("Not authenticated.");
      const parent = JSON.parse(storedUser);
      // Get all children
      const familyId = parent.familyId;
      const children = await fetchFamilyChildren(familyId, token);
      const childIdMap: { [key: string]: string } = {};
      children.forEach((c: any) => { 
        childIdMap[c._id] = c.name || c.id;
        childIdMap[c.id] = c.name || c.id;
      });
      setChildMap(childIdMap);

      let allTxs: any[] = [];
      for (const child of children) {
        const txs = await fetchTransactions(child.id, token);
        allTxs = allTxs.concat((txs || []).map((t: any) => ({...t, childName: child.name || child.id})));
      }
      setTransactions(allTxs);
    } catch {
      setTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filtering logic: apply type/search/date range
  const filtered = transactions.filter(tx => {
    const txDateStr = tx.date || tx.createdAt || "";
    const txDate = new Date(txDateStr);
    // Date logic
    let afterStart = true; let beforeEnd = true;
    if (startDate) afterStart = !isNaN(txDate) && txDate.getTime() >= new Date(startDate).getTime();
    if (endDate) beforeEnd = !isNaN(txDate) && txDate.getTime() <= new Date(endDate + "T23:59:59.999Z").getTime();
    if (!afterStart || !beforeEnd) return false;
    if (type && tx.type !== type) return false;
    if (search && !`${tx.description || ""} ${tx.type}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ScrollView style={{ backgroundColor: themeColors.background }} contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
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
      <Text style={[styles.title, { color: themeColors.primary }]}>Child's Points History</Text>
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card }]}>
        <View style={[styles.filtersRow, { flexWrap: 'wrap', rowGap: 10 }]}>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Text style={[styles.label, { color: themeColors.text } ]}>Search</Text>
            <TextInput
              placeholder="Type to search..."
              style={[styles.filterInput, { backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={themeColors.textSecondary}
            />
          </View>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={[styles.label, { color: themeColors.text }]}>Filter by Type</Text>
            <View style={{
              backgroundColor: themeColors.surface,
              borderRadius: 7,
              borderWidth: 1,
              borderColor: themeColors.border,
              marginRight: 5,
              minWidth: 120,
              height: 40,
              justifyContent: 'center'
            }}>
              {Platform.OS === 'web' ? (
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  style={{
                    padding: 8,
                    fontSize: 15,
                    backgroundColor: "transparent",
                    color: "#222",
                    border: 0,
                    borderRadius: 7,
                    width: "100%",
                    height: 36
                  }}
                >
                  <option value="">All</option>
                  <option value="chore-completion">Home Task</option>
                  <option value="goal-completion">Goal</option>
                  <option value="reward-purchase">Reward</option>
                  <option value="points-move">Move</option>
                  <option value="points-request">Points Request</option>
                  <option value="parent-points-adjustment">Adjustment</option>
                  <option value="interest-payout">Interest Payout</option>
                  <option value="others">Others</option>
                </select>
              ) : (
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1}>
                  <TextInput
                    style={{ color: themeColors.text, fontSize: 15 }}
                    placeholder="Filter..."
                    value={type}
                    editable={false}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.refreshBtn,
              {
                alignSelf: "center",
                minWidth: 40,
                height: 40,
                paddingVertical: 7,
                marginTop: Platform.OS === "web" ? 0 : 10,
                backgroundColor: themeColors.secondary
              }
            ]}
            onPress={loadTransactions}
            accessibilityLabel="Refresh transaction list"
          >
            <Text style={{ color: themeColors.card, fontWeight: "bold" }}>🔄 Refresh Child's History</Text>
          </TouchableOpacity>
        </View>
        {/* Date Range Picker for Transactions */}
        <View style={[styles.filtersRow, {marginTop: 4}]}>
          {/* From picker */}
          <View style={{ flex: 1, maxWidth: 136 }}>
            <Text style={styles.filterLabel}>From</Text>
            {Platform.OS === "web"
              ? <DateInput value={startDate} onChange={setStartDate} {...(Platform.OS === "web" ? { max: (endDate || undefined) } : {})} placeholder="YYYY-MM-DD" />
              : (
                <TouchableOpacity
                  style={[styles.filterInput, { justifyContent: "center" }]}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text style={{ color: startDate ? "#234" : "#999", fontSize: 15 }}>
                    {startDate ? startDate : "Select date"}
                  </Text>
                  {showFromPicker && (
                    <DateTimePicker
                      value={startDate ? new Date(startDate) : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      maximumDate={endDate ? new Date(endDate) : undefined}
                      onChange={(_, selectedDate) => {
                        setShowFromPicker(false);
                        if (selectedDate) {
                          const pad = (n: number) => n < 10 ? "0"+n : n;
                          const str = selectedDate.getFullYear()+"-"+pad(selectedDate.getMonth()+1)+"-"+pad(selectedDate.getDate());
                          setStartDate(str);
                        }
                      }}
                    />
                  )}
                </TouchableOpacity>
              )
            }
          </View>
          {/* To picker */}
          <View style={{ flex: 1, maxWidth: 136 }}>
            <Text style={styles.filterLabel}>To</Text>
            {Platform.OS === "web"
              ? <DateInput value={endDate} onChange={setEndDate} {...(Platform.OS === "web" ? { min: (startDate || undefined) } : {})} placeholder="YYYY-MM-DD" />
              : (
                <TouchableOpacity
                  style={[styles.filterInput, { justifyContent: "center" }]}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text style={{ color: endDate ? "#234" : "#999", fontSize: 15 }}>
                    {endDate ? endDate : "Select date"}
                  </Text>
                  {showToPicker && (
                    <DateTimePicker
                      value={endDate ? new Date(endDate) : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      minimumDate={startDate ? new Date(startDate) : undefined}
                      onChange={(_, selectedDate) => {
                        setShowToPicker(false);
                        if (selectedDate) {
                          const pad = (n: number) => n < 10 ? "0"+n : n;
                          const str = selectedDate.getFullYear()+"-"+pad(selectedDate.getMonth()+1)+"-"+pad(selectedDate.getDate());
                          setEndDate(str);
                        }
                      }}
                    />
                  )}
                </TouchableOpacity>
              )
            }
          </View>
          {(startDate || endDate) && (
            <TouchableOpacity
              style={[styles.refreshBtn, {backgroundColor: themeColors.surface }]}
              onPress={() => {setStartDate(""); setEndDate("");}}
            >
              <Text style={{ color: themeColors.textSecondary, fontWeight: "bold" }}>✕ Clear</Text>
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
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Points Activity Log</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.list}>
            {filtered.length === 0 ? (
              <Text style={{ color: themeColors.textSecondary, padding: 10, fontStyle: "italic" }}>No points activity found.</Text>
            ) : (
              filtered
                .sort((a, b) => new Date(b.date || b.createdAt || "").getTime() - new Date(a.date || a.createdAt || "").getTime())
                .map((tx, idx) => (
                  <View
                    key={tx._id || idx}
                    style={[
                      styles.txRow,
                      {
                        backgroundColor: themeColors.surface,
                        borderLeftColor:
                          tx.amount > 0 ? themeColors.success :
                          tx.amount < 0 ? themeColors.error : themeColors.border,
                      }
                    ]}
                  >
                    <Text style={[styles.txChild, { color: themeColors.secondary }]}>{tx.childName || childMap[tx.user] || ""}</Text>
                    {tx.type === "interest-payout" ? (
                      <>
                        <Text style={[styles.txAmount, { color: themeColors.success }]}>
                          +{tx.amount}
                        </Text>
                        <Text style={[styles.txDesc, { color: themeColors.text }]} numberOfLines={2} ellipsizeMode="tail">
                          Interest Payout
                        </Text>
                        <Text style={[styles.txJar, { color: themeColors.success }]}>
                          Savings Pot
                        </Text>
                        <Text style={[styles.txDate, { color: themeColors.textSecondary }]}>
                          {(tx.date || tx.createdAt || "").slice(0, 10)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.txAmount,
                            {
                              color:
                                tx.amount > 0 ? themeColors.primary :
                                  tx.amount < 0 ? themeColors.error : themeColors.textSecondary
                            }
                          ]}
                        >
                          {tx.amount > 0 ? "+" : tx.amount < 0 ? "" : ""}
                          {tx.amount}
                        </Text>
                        <Text
                          style={[styles.txDesc, { color: themeColors.text }]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {(tx.description || typeLabels[tx.type] || tx.type)
                            .replace(/current/g, 'Pocket Money')
                            .replace(/save/g, 'Savings Pot')
                            .replace(/spend/g, 'Spending Pot')
                            .replace(/donate/g, 'Help Others Pot')
                            .replace(/invest/g, 'Grow Money Pot')
                            .replace(/\sjar/g, '')}
                        </Text>
                        <Text style={[styles.txJar, { color: themeColors.secondary }]}>
                          {tx.fromJar
                            ? `→ ${jarNameMap[tx.fromJar] || tx.fromJar}`
                            : tx.type === "points-move" && tx.toJar
                              ? `→ ${jarNameMap[tx.toJar] || tx.toJar}`
                              : ""}
                        </Text>
                        <Text style={[styles.txDate, { color: themeColors.textSecondary }]}>
                          {(tx.date || tx.createdAt || "").slice(0, 10)}
                        </Text>
                      </>
                    )}
                  </View>
                ))
            )}
          </View>
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
    </ScrollView>
  );
}
