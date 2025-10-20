import HelpModal from '@/components/HelpModal';
import { RupeeDenominations } from '@/components/RupeeDenominations';
import { API_URL } from '@/utils/config';
import { InterestRuleType, useCurrency } from '@/utils/currencyContext';
import { handleApiError } from '@/utils/errorHandler';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: themeColors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 22,
    marginTop: 6,
    color: themeColors.primary,
  },
  sectionCard: {
    backgroundColor: themeColors.card,
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
    minWidth: 300,
    width: "97%",
    maxWidth: 520,
    elevation: 2,
    shadowColor: themeColors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: themeColors.text,
  },
  jarBox: {
    minWidth: 85,
    alignItems: "center",
    backgroundColor: themeColors.surface,
    padding: 8,
    borderRadius: 8,
    margin: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  jarLabel: {
    fontWeight: "bold",
    marginBottom: 2,
    color: themeColors.primary,
    fontSize: 16,
  },
  jarPoints: {
    fontWeight: "700",
    fontSize: 21,
    marginBottom: 1,
    color: themeColors.text,
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
    color: themeColors.text,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 7,
    padding: 8,
    fontSize: 16,
    marginBottom: 2,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
  },
  webSelect: {
    width: "100%",
    minHeight: 38,
    borderRadius: 7,
    borderColor: themeColors.border,
    borderWidth: 1,
    fontSize: 16,
    padding: 8,
    marginTop: 1,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
  } as any,
  formBtn: { backgroundColor: themeColors.warning, padding: 14, borderRadius: 8, marginTop: 7, marginHorizontal: 4, alignSelf: "flex-end" },
  formBtnText: { fontWeight: "700", color: themeColors.text, fontSize: 15 },
  placeholder: { color: themeColors.textSecondary, fontStyle: "italic", fontSize: 15, marginBottom: 2, marginTop: 2, minHeight: 26 },
  statusMessage: { fontSize: 15, fontWeight: "600", marginTop: 3, color: themeColors.success }
});

export default function MoneyJarsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
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
  const [optimisticRequests, setOptimisticRequests] = useState<any[]>([]);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const router = useRouter();

  const loadUserData = async (showErrors = true) => {
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) {
        if (showErrors) {
          Alert.alert('Error', 'Not authenticated. Please login again.');
        }
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id;

      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (showErrors) {
          await handleApiError(response, { showError: (msg) => Alert.alert('Error', msg), feature: 'Money Jars - User Data' });
        }
        return;
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
      if (showErrors) {
        Alert.alert('Error', 'Failed to load user data. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadUserData(false);
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }]}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  function daysUntilPayout(rule: InterestRuleType): number {
    const now = new Date();
    let daysToAdd = rule.frequency === "monthly" ? 30 : 7;
    return daysToAdd;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: themeColors.background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              elevation: 2,
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            accessibilityHint="Double tap to return to the main dashboard"
          >
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              elevation: 2,
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setHelpModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Double tap to open help guide for money pots"
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>🏺 My Money Pots</Text>
        </View>
      </View>

      {/* Refresh Button */}
      <View style={[styles.sectionCard]}>
        <TouchableOpacity
          style={[styles.formBtn, { backgroundColor: themeColors.primary, alignSelf: 'center', minWidth: 200 }]}
          onPress={onRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel={refreshing ? "Refreshing money pot points" : "Refresh money pot points"}
          accessibilityHint="Double tap to reload your current point balances"
          accessibilityState={{ disabled: refreshing }}
        >
          <Text style={[styles.formBtnText, { color: themeColors.card }]}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh Points'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* JARS DISPLAY */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", marginVertical: 18 }}>
        {jars.map(jar => (
          <View
            key={jar.label}
            style={[
              styles.jarBox,
              { backgroundColor: jar.color || themeColors.surface, borderColor: themeColors.border }
            ]}
          >
            <Text style={{ fontSize: 25, marginBottom: 3 }}>{jar.icon}</Text>
            <Text style={[styles.jarPoints]}>{formatAmount(jar.value)}</Text>
            <Text style={[styles.jarLabel]}>{jar.label}</Text>
            {showDenominations && (
              <RupeeDenominations amount={convertToINR(jar.value)} />
            )}
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

  // Validation states
  const [amountError, setAmountError] = React.useState<string | null>(null);
  const [fromError, setFromError] = React.useState<string | null>(null);
  const [toError, setToError] = React.useState<string | null>(null);

  // Validation functions (unchanged...)
  const validateAmount = (value: string) => {
    const num = Number(value);
    if (!value.trim()) {
      setAmountError("Please enter the number of points to move");
      return false;
    }
    if (isNaN(num) || num <= 0) {
      setAmountError("Please enter a valid positive number");
      return false;
    }
    if (num > 10000) {
      setAmountError("Maximum 10,000 points per transfer");
      return false;
    }
    if (!Number.isInteger(num)) {
      setAmountError("Points must be whole numbers");
      return false;
    }
    setAmountError(null);
    return true;
  };

  const validateFromJar = (value: string) => {
    if (!value) {
      setFromError("Please select a source jar");
      return false;
    }
    const jar = jars.find(j => j.key === value);
    if (!jar) {
      setFromError("Selected jar not found");
      return false;
    }
    if (jar.value <= 0) {
      setFromError("This jar is empty");
      return false;
    }
    setFromError(null);
    return true;
  };

  const validateToJar = (value: string, fromValue?: string) => {
    if (!value) {
      setToError("Please select a destination jar");
      return false;
    }
    if (value === fromValue) {
      setToError("Cannot move points to the same jar");
      return false;
    }
    setToError(null);
    return true;
  };

  // Input handlers (unchanged...)
  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    if (numericValue) {
      validateAmount(numericValue);
    } else {
      setAmountError(null);
    }
  };

  const handleFromChange = (value: string) => {
    setFrom(value);
    if (value) {
      validateFromJar(value);
      if (to && value === to) {
        setToError("Cannot move points to the same jar");
      } else if (to) {
        validateToJar(to, value);
      }
    } else {
      setFromError(null);
    }
  };

  const handleToChange = (value: string) => {
    setTo(value);
    if (value) {
      validateToJar(value, from);
    } else {
      setToError(null);
    }
  };

  async function handleMovePoints() {
    const amountValid = validateAmount(amount);
    const fromValid = validateFromJar(from);
    const toValid = validateToJar(to, from);

    if (!amountValid || !fromValid || !toValid) {
      setStatus({ type: "error", msg: "Please fix the errors above before submitting." });
      return;
    }

    const amt = Number(amount);
    const fromJar = jars.find(j => j.key === from);
    if (!fromJar || fromJar.value < amt) {
      setStatus({ type: "error", msg: "Not enough points in selected pot." });
      return;
    }

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
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) {
        setStatus({ type: "error", msg: "Not authenticated. Please login again." });
        setAmount(originalAmount);
        setFrom(originalFrom);
        setTo(originalTo);
        setNote(originalNote);
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id;

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
      setAmount(originalAmount);
      setFrom(originalFrom);
      setTo(originalTo);
      setNote(originalNote);
    }
  }

  return (
    <View style={[{
      backgroundColor: themeColors.card,
      borderRadius: 14,
      marginBottom: 16,
      padding: 18,
      minWidth: 300,
      width: "97%",
      maxWidth: 520,
      elevation: 2,
      shadowColor: themeColors.border,
    }]}>
      <Text style={{
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 8,
        color: themeColors.text,
      }}>Move Points Between Pots</Text>
      <View style={{ marginBottom: 10, alignItems: "center", width: "100%" }}>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
          }}>Points to Move:</Text>
          <TextInput
            placeholder="Enter points"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: amountError ? themeColors.error : themeColors.border,
              borderRadius: 7,
              padding: 8,
              fontSize: 16,
              marginBottom: 2,
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              width: "100%"
            }}
            placeholderTextColor={themeColors.textSecondary}
            accessibilityLabel="Points to move"
            accessibilityHint="Enter the number of points you want to transfer between money pots"
          />
          {amountError && (
            <Text style={{
              color: themeColors.error,
              fontSize: 12,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {amountError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
          }}>From Which Pot?</Text>
          <View style={{
            borderWidth: 1,
            borderColor: fromError ? themeColors.error : themeColors.border,
            borderRadius: 7,
            width: "100%",
            alignSelf: "center"
          }}>
            <Picker
              selectedValue={from}
              onValueChange={handleFromChange}
              style={{ height: 37, minWidth: 120, width: "100%" }}
              accessibilityLabel="Source money pot"
              accessibilityHint="Select which money pot to take points from"
            >
              <Picker.Item label="Select Pot" value="" />
              {jars.map(j => (
                <Picker.Item label={`${j.label} (${j.value})`} value={j.key} key={j.key} />
              ))}
            </Picker>
          </View>
          {fromError && (
            <Text style={{
              color: themeColors.error,
              fontSize: 12,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {fromError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
          }}>To Which Pot?</Text>
          <View style={{
            borderWidth: 1,
            borderColor: toError ? themeColors.error : themeColors.border,
            borderRadius: 7,
            width: "100%",
            alignSelf: "center"
          }}>
            <Picker
              selectedValue={to}
              onValueChange={handleToChange}
              style={{ height: 37, minWidth: 120, width: "100%" }}
              accessibilityLabel="Destination money pot"
              accessibilityHint="Select which money pot to send points to"
            >
              <Picker.Item label="Select Pot" value="" />
              {jars.map(j => (
                <Picker.Item label={j.label} value={j.key} key={j.key} />
              ))}
            </Picker>
          </View>
          {toError && (
            <Text style={{
              color: themeColors.error,
              fontSize: 12,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {toError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
          }}>Note to Parent (Optional):</Text>
          <TextInput
            placeholder="Why do you want to move these points?"
            value={note}
            onChangeText={setNote}
            multiline={true}
            numberOfLines={2}
            maxLength={200}
            style={{
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 7,
              padding: 8,
              fontSize: 16,
              marginBottom: 2,
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              minHeight: 60,
              textAlignVertical: 'top',
              width: "100%"
            }}
            placeholderTextColor={themeColors.textSecondary}
            accessibilityLabel="Optional note to parent"
            accessibilityHint="Add a message explaining why you want to move these points"
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
            accessibilityRole="button"
            accessibilityLabel="Submit point transfer request"
            accessibilityHint="Send request to parent to move points between money pots"
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
          }}
          accessibilityLabel={`${status.type === "error" ? "Error" : "Success"}: ${status.msg}`}
          >
            {status.msg}
          </Text>
        )}

      </View>
    </View>
  );
}
