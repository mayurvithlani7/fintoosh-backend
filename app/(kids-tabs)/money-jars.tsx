import HelpModal from '@/components/HelpModal';
import { RupeeDenominations } from '@/components/RupeeDenominations';
import { API_URL } from '@/utils/config';
import { InterestRuleType, useCurrency } from '@/utils/currencyContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 22,
    marginTop: 6,
    color: "#154477",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
    minWidth: 300,
    width: "97%",
    maxWidth: 520,
    elevation: 2,
    shadowColor: "#aaa",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#234",
  },
  jarBox: {
    minWidth: 85,
    alignItems: "center",
    backgroundColor: "#f6faff",
    padding: 8,
    borderRadius: 8,
    margin: 8,
    borderWidth: 1,
    borderColor: "#abe",
  },
  jarLabel: {
    fontWeight: "bold",
    marginBottom: 2,
    color: "#167",
    fontSize: 16,
  },
  jarPoints: {
    fontWeight: "700",
    fontSize: 21,
    marginBottom: 1,
    color: "#201828",
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  formGroup: { flex: 1, marginHorizontal: 4 },
  inputLabel: {
    fontWeight: "500",
    marginBottom: 4,
    color: "#234",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 7,
    padding: 8,
    fontSize: 16,
    marginBottom: 2,
    backgroundColor: "#f5fafd",
    color: "#112",
  },
  webSelect: {
    width: "100%",
    minHeight: 38,
    borderRadius: 7,
    borderColor: "#abc",
    borderWidth: 1,
    fontSize: 16,
    padding: 8,
    marginTop: 1,
    backgroundColor: "#f8fafd",
    color: "#112",
  } as any,
  formBtn: { backgroundColor: "#ffc46b", padding: 10, borderRadius: 8, marginTop: 7, marginHorizontal: 4, alignSelf: "flex-end" },
  formBtnText: { fontWeight: "700", color: "#6d3a00", fontSize: 15 },
  placeholder: { color: "#99a", fontStyle: "italic", fontSize: 15, marginBottom: 2, marginTop: 2, minHeight: 26 },
  statusMessage: { fontSize: 15, fontWeight: "600", marginTop: 3, color: "#18722a" }
});

export default function MoneyJarsScreen() {
  const { themeColors } = useTheme();
  const { formatAmount, showDenominations, convertToINR, interestRule } = useCurrency();
  const [jars, setJars] = useState([
    { label: 'Pocket Money', key: 'current', value: 0, color: themeColors.jarColors.current, icon: '💰' },
    { label: 'Savings Pot', key: 'save', value: 0, color: themeColors.jarColors.save, icon: '🐷' },
    { label: 'Spending Pot', key: 'spend', value: 0, color: themeColors.jarColors.spend, icon: '🛒' },
    { label: 'Help Others Pot', key: 'donate', value: 0, color: themeColors.jarColors.donate, icon: '🤲' },
    { label: 'Grow Money Pot', key: 'invest', value: 0, color: themeColors.jarColors.invest, icon: '📈' }
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optimisticRequests, setOptimisticRequests] = useState<any[]>([]); // For optimistic updates
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const router = useRouter();

  // Load user data and jar values from backend
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await getAuthToken();
        const storedUser = await AsyncStorage.getItem('user');

        if (!token || !storedUser) {
          Alert.alert('Error', 'Not authenticated. Please login again.');
          return;
}

/* (daysUntilPayout now moved above for type safety and correct hoisting) */

        const user = JSON.parse(storedUser);
        const userId = user.id;

      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load user data');
        }

        const freshUserData = await response.json();

        setJars([
          { label: 'Pocket Money', key: 'current', value: freshUserData.currentPoints || 0, color: themeColors.jarColors.current, icon: '💰' },
          { label: 'Savings Pot', key: 'save', value: freshUserData.savePoints || 0, color: themeColors.jarColors.save, icon: '🐷' },
          { label: 'Spending Pot', key: 'spend', value: freshUserData.spendPoints || 0, color: themeColors.jarColors.spend, icon: '🛒' },
          { label: 'Help Others Pot', key: 'donate', value: freshUserData.donatePoints || 0, color: themeColors.jarColors.donate, icon: '🤲' },
          { label: 'Grow Money Pot', key: 'invest', value: freshUserData.investPoints || 0, color: themeColors.jarColors.invest, icon: '📈' }
        ]);

      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reload data when screen comes into focus
      const reloadData = async () => {
        try {
          const token = await getAuthToken();
          const storedUser = await AsyncStorage.getItem('user');

          if (!token || !storedUser) return;

          const user = JSON.parse(storedUser);
          const userId = user.id;

          const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            const freshUserData = await response.json();
            setJars([
              { label: 'Pocket Money', key: 'current', value: freshUserData.currentPoints || 0, color: themeColors.jarColors.current, icon: '💰' },
              { label: 'Savings Pot', key: 'save', value: freshUserData.savePoints || 0, color: themeColors.jarColors.save, icon: '🐷' },
              { label: 'Spending Pot', key: 'spend', value: freshUserData.spendPoints || 0, color: themeColors.jarColors.spend, icon: '🛒' },
              { label: 'Help Others Pot', key: 'donate', value: freshUserData.donatePoints || 0, color: themeColors.jarColors.donate, icon: '🤲' },
              { label: 'Grow Money Pot', key: 'invest', value: freshUserData.investPoints || 0, color: themeColors.jarColors.invest, icon: '📈' }
            ]);
          }
        } catch (error) {
          console.error('Error reloading data:', error);
        }
      };

      reloadData();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) return;

      const user = JSON.parse(storedUser);
      const userId = user.id;

          const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

      if (response.ok) {
        const freshUserData = await response.json();
        setJars([
          { label: 'Pocket Money', key: 'current', value: freshUserData.currentPoints || 0, color: themeColors.jarColors.current, icon: '💰' },
          { label: 'Savings Pot', key: 'save', value: freshUserData.savePoints || 0, color: themeColors.jarColors.save, icon: '🐷' },
          { label: 'Spending Pot', key: 'spend', value: freshUserData.spendPoints || 0, color: themeColors.jarColors.spend, icon: '🛒' },
          { label: 'Help Others Pot', key: 'donate', value: freshUserData.donatePoints || 0, color: themeColors.jarColors.donate, icon: '🤲' },
          { label: 'Grow Money Pot', key: 'invest', value: freshUserData.investPoints || 0, color: themeColors.jarColors.invest, icon: '📈' }
        ]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  // Helper needed before use, TS fix
  function daysUntilPayout(rule: InterestRuleType): number {
    const now = new Date();
    let daysToAdd = rule.frequency === "monthly" ? 30 : 7;
    return daysToAdd;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.surface,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => router.push('./')}
        >
          <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.primary }]}>🏺 My Money Pots</Text>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
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

      {/* Refresh Button */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.formBtn, { backgroundColor: themeColors.primary, alignSelf: 'center', minWidth: 200 }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Text style={[styles.formBtnText, { color: themeColors.card }]}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh Points'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* JARS DISPLAY */}
      <View style={{flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", marginVertical: 18}}>
        {jars.map(jar => (
          <View
            key={jar.label}
            style={{
              backgroundColor: themeColors.jarColors[jar.key as keyof typeof themeColors.jarColors] || themeColors.surface,
              borderRadius: 14,
              padding: 14,
              minWidth: 84,
              alignItems: "center",
              marginHorizontal: 8,
              marginBottom: 8,
              borderWidth: 1.2,
              borderColor: themeColors.border
            }}
          >
            <Text style={{ fontSize: 25, marginBottom: 3 }}>{jar.icon}</Text>
            <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 3, color: themeColors.text }}>{formatAmount(jar.value)}</Text>
            <Text style={{ fontWeight: "bold", color: themeColors.primary, fontSize: 13 }}>{jar.label}</Text>
            {showDenominations && (
              <RupeeDenominations amount={convertToINR(jar.value)} />
            )}
            {/* Show projected interest for Savings Pot */}
            {jar.key === "save" && interestRule && (
              <Text style={{
                marginTop: 4,
                fontSize: 13,
                color: themeColors.success,
                backgroundColor: themeColors.success + "25",
                borderRadius: 5,
                paddingHorizontal: 7,
                paddingVertical: 3,
                fontWeight: "600"
              }}>
                🏦 Your points are earning!
                {"\n"}
                Next payout in {daysUntilPayout(interestRule)} days
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* MOVE POINTS SECTION */}
      <MovePointsSection jars={jars} setJars={setJars} />

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🏺 My Money Pots - Help"
        tabs={[
          {
            title: "Super Secret Money Jars! 🔒",
            content: [
              {
                type: "text",
                text: "Whoa! Your money jars are like magical treasure chests! 🏺✨ You have 5 special jars that keep your points safe and organized for different adventures!",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "🎨 Each jar has its own cool color and fun emoji!"
              },
              {
                type: "bullet",
                text: "🤖 Points jump into jars automatically when you earn them!"
              },
              {
                type: "bullet",
                text: "🔄 You can ask to move points between jars (with permission!)"
              },
              {
                type: "highlight",
                text: "Your parents are the jar masters - they decide where points go! 👑",
                icon: "👨‍👩‍👧‍👦"
              }
            ]
          },
          {
            title: "Meet Your 5 Money Heroes! 🦸‍♂️",
            content: [
              {
                type: "text",
                text: "Your money jars are superheroes, each with their own special power:",
                icon: "🏦"
              },
              {
                type: "bullet",
                text: "💰 Pocket Money - Your instant fun buddy for treats and toys!"
              },
              {
                type: "bullet",
                text: "🐷 Savings Pot - Your future dreams collector for big wishes!"
              },
              {
                type: "bullet",
                text: "🛒 Spending Pot - Your shopping sidekick for cool stuff!"
              },
              {
                type: "bullet",
                text: "🤲 Help Others Pot - Your kindness champion for giving and sharing!"
              },
              {
                type: "bullet",
                text: "📈 Grow Money Pot - Your magic grower for long-term treasures!"
              },
              {
                type: "highlight",
                text: "Each hero teaches you different money superpowers! 💪🎓",
                icon: "🎓"
              }
            ]
          },
          {
            title: "Jar-to-Jar Point Adventures! 🚀",
            content: [
              {
                type: "text",
                text: "Ready for an epic point-moving quest?",
                icon: "🔄"
              },
              {
                type: "bullet",
                text: "🎯 Choose how many points to send on their journey"
              },
              {
                type: "bullet",
                text: "🏠 Pick which jar to take points FROM (their starting point)"
              },
              {
                type: "bullet",
                text: "🎪 Pick which jar to move points TO (their destination!)"
              },
              {
                type: "bullet",
                text: "💌 Add a special note explaining your adventure plan"
              },
              {
                type: "highlight",
                text: "Parent approval makes the magic happen - safety first! ✨🛡️",
                icon: "✅"
              }
            ]
          },
          {
            title: "Why Parents Are The Boss? 👑",
            content: [
              {
                type: "text",
                text: "Moving points needs parent permission because they're your money mentors:",
                icon: "🛡️"
              },
              {
                type: "bullet",
                text: "🎯 They help you make super smart money choices!"
              },
              {
                type: "bullet",
                text: "🧠 They explain the 'why' behind every decision"
              },
              {
                type: "bullet",
                text: "📚 It teaches you to plan like a money wizard!"
              },
              {
                type: "highlight",
                text: "Parents want you to become a money master - you're learning! 🧙‍♂️❤️",
                icon: "❤️"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}

/**
 * Move Points Section
 * Allows transferring points between jars, updating local state.
 * Props:
 *  - jars: Array of { key, label, value, color, icon }
 *  - setJars: Setter to update jars array by state
 */
function MovePointsSection({ jars, setJars }: {
  jars: { key: string; label: string; value: number; color: string; icon: string }[],
  setJars: React.Dispatch<React.SetStateAction<any>>
}) {
  const { themeColors } = useTheme();
  const [amount, setAmount] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [note, setNote] = React.useState("");
  const [status, setStatus] = React.useState<{ type: "error" | "ok"; msg: string } | null>(null);

  async function handleMovePoints() {
    // Validation
    const amt = Number(amount);
    if (!from || !to || !amt || amt <= 0) {
      setStatus({ type: "error", msg: "Fill all fields with a valid amount." });
      return;
    }
    if (from === to) {
      setStatus({ type: "error", msg: "Choose two different pots." });
      return;
    }
    const fromJar = jars.find(j => j.key === from);
    if (!fromJar || fromJar.value < amt) {
      setStatus({ type: "error", msg: "Not enough points in selected pot." });
      return;
    }

    // Optimistic update: Clear form and show pending status immediately
    const originalAmount = amount;
    const originalFrom = from;
    const originalTo = to;
    const originalNote = note;

    setAmount("");
    setFrom("");
    setTo("");
    setNote("");
    setStatus({ type: "ok", msg: "Sending request..." });

    try {
      // Get stored user data and token
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) {
        setStatus({ type: "error", msg: "Not authenticated. Please login again." });
        // Revert form on error
        setAmount(originalAmount);
        setFrom(originalFrom);
        setTo(originalTo);
        setNote(originalNote);
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id; // Use custom user ID for API calls

      // Submit approval request for moving points
      const toJar = jars.find(j => j.key === to);
      const requestData: any = {
        userId: userId,
        type: 'move-points',
        name: `Move ${amt} points from ${fromJar.label} to ${toJar?.label}`,
        amount: amt,
        from: from,
        to: to,
        fromBalance: fromJar.value,
        toBalance: toJar?.value || 0,
        reason: `Child requested to move ${amt} points from ${fromJar.label} to ${toJar?.label}`
      };

      if (originalNote.trim()) {
        requestData.note = originalNote.trim();
      }

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setStatus({ type: "error", msg: errorData.message || "Failed to submit request." });
        // Revert form on error
        setAmount(originalAmount);
        setFrom(originalFrom);
        setTo(originalTo);
        setNote(originalNote);
        return;
      }

      setStatus({ type: "ok", msg: "Request sent to parent for approval! ✅" });
      setTimeout(() => setStatus(null), 3000);

    } catch (error) {
      console.error('Error submitting move points request:', error);
      setStatus({ type: "error", msg: "Network error. Please try again." });
      // Revert form on error
      setAmount(originalAmount);
      setFrom(originalFrom);
      setTo(originalTo);
      setNote(originalNote);
    }
  }

  return (
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Move Points Between Pots</Text>
        <View style={{ marginBottom: 10, alignItems: "center", width: "100%" }}>

          <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
            <Text style={styles.inputLabel}>Points to Move:</Text>
            <TextInput
              placeholder="Enter points"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={[styles.input, { width: "100%" }]}
            />
          </View>

          <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
            <Text style={styles.inputLabel}>From Which Pot?</Text>
            <View style={{
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 7,
              width: "100%",
              alignSelf: "center"
            }}>
              <Picker
                selectedValue={from}
                onValueChange={v => setFrom(v)}
                style={{ height: 37, minWidth: 120, width: "100%" }}
              >
                <Picker.Item label="Choose a Pot" value="" />
                {jars.map(j => (
                  <Picker.Item label={`${j.label} (${j.value})`} value={j.key} key={j.key} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
            <Text style={styles.inputLabel}>To Which Pot?</Text>
            <View style={{
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 7,
              width: "100%",
              alignSelf: "center"
            }}>
              <Picker
                selectedValue={to}
                onValueChange={v => setTo(v)}
                style={{ height: 37, minWidth: 120, width: "100%" }}
              >
                <Picker.Item label="Choose a Pot" value="" />
                {jars.map(j => (
                  <Picker.Item label={j.label} value={j.key} key={j.key} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
            <Text style={styles.inputLabel}>Note to Parent (Optional):</Text>
            <TextInput
              placeholder="Why do you want to move these points?"
              value={note}
              onChangeText={setNote}
              multiline={true}
              numberOfLines={2}
              maxLength={200}
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top', width: "100%" }]}
            />
          </View>

          <View style={{ width: "100%", maxWidth: 220 }}>
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.warning + "33",
                borderRadius: 8,
                paddingVertical: 8,
                marginTop: 7,
                alignItems: "center",
                width: "100%"
              }}
              onPress={handleMovePoints}
            >
              <Text style={{ color: themeColors.warning, fontWeight: "bold", fontSize: 16 }}>
                Ask to Move Points
              </Text>
            </TouchableOpacity>
          </View>

          {status && (
            <Text style={{
              marginTop: 7,
              color: status.type === "error" ? themeColors.error : themeColors.success,
              fontWeight: "bold",
              textAlign: "center"
            }}>
              {status.msg}
            </Text>
          )}

        </View>
      </View>
  );
}
