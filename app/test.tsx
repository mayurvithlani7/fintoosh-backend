import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
// --- KidGoalsRewardsSection (display only, no add, claim-only) ---
function KidGoalsRewardsSection() {
  // Mock parent-issued goals and rewards
  const [goals, setGoals] = React.useState<
    { id: number; name: string; needed: number; progress: number }[]
  >([
    { id: 1, name: "Buy a book", needed: 150, progress: 150 },
    { id: 2, name: "Basketball", needed: 200, progress: 30 }
  ]);
  const [rewards, setRewards] = React.useState<
    { id: number; name: string; points: number; claimed: boolean }[]
  >([
    { id: 1, name: "Ice cream", points: 60, claimed: false },
    { id: 2, name: "Movie night", points: 100, claimed: false }
  ]);
  const [msg, setMsg] = React.useState("");

  function handleClaimGoal(id: number) {
    setGoals(goals.filter((g) => g.id !== id));
    setMsg("Goal claimed! Great job!");
    setTimeout(() => setMsg(""), 5000);
  }

  function handleClaimReward(id: number) {
    setRewards(
      rewards.map((r) =>
        r.id === id ? { ...r, claimed: true } : r
      )
    );
    setMsg("Reward claimed! Congratulations!");
    setTimeout(() => setMsg(""), 5000);
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Goals & Rewards</Text>
      <Text style={[styles.sectionTitle, { fontSize: 17, marginBottom: 4 }]}>My Goals</Text>
      {goals.length === 0 ? (
        <Text style={styles.placeholder}>No goals yet.</Text>
      ) : (
        goals.map((g) => (
          <View
            key={g.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff9e3",
              marginBottom: 7,
              borderRadius: 6,
              padding: 9,
              borderWidth: 1,
              borderColor: "#eedaa3",
            }}
          >
            <Text style={{ flex: 2, fontWeight: "bold", color: "#824" }}>{g.name}</Text>
            <Text style={{ flex: 1, color: "#273", fontSize: 16 }}>
              {g.progress}/{g.needed} pts
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#bbfbc1",
                paddingVertical: 5,
                paddingHorizontal: 13,
                borderRadius: 8,
                marginLeft: 11,
              }}
              onPress={() => handleClaimGoal(g.id)}
            >
              <Text style={{ color: "#185b2a", fontWeight: "bold" }}>Claim</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      <Text style={[styles.sectionTitle, { fontSize: 17, marginBottom: 4 }]}>Earnable Rewards</Text>
      {rewards.length === 0 ? (
        <Text style={styles.placeholder}>No rewards yet.</Text>
      ) : (
        rewards.map((r) => (
          <View
            key={r.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#e9f7fd",
              marginBottom: 7,
              borderRadius: 6,
              padding: 9,
              borderWidth: 1,
              borderColor: "#abd6ee",
            }}
          >
            <Text style={{ flex: 2, fontWeight: "bold", color: "#287" }}>{r.name}</Text>
            <Text style={{ flex: 1, color: "#385", fontSize: 16 }}>
              {r.points} pts
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: r.claimed ? "#ddd" : "#aacdfa",
                paddingVertical: 5,
                paddingHorizontal: 13,
                borderRadius: 8,
                marginLeft: 11,
              }}
              onPress={() => !r.claimed && handleClaimReward(r.id)}
              disabled={r.claimed}
            >
              <Text style={{ color: r.claimed ? "#a99" : "#2850a7", fontWeight: "bold" }}>
                {r.claimed ? "Claimed" : "Claim"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      {msg ? <Text style={styles.statusMessage}>{msg}</Text> : null}
    </View>
  );
}

// --- FinancialLessonsSection: list of clickable lessons, with launch feedback ---
function FinancialLessonsSection() {
  const [msg, setMsg] = React.useState("");
  const lessons = [
    { id: "saving", title: "What is Saving?" },
    { id: "spending", title: "What is Spending?" },
    { id: "donating", title: "What is Donating?" },
    { id: "investing", title: "What is Investing?" },
    { id: "quiz", title: "Financial Quiz" },
    { id: "needs-wants-game", title: "Needs vs. Wants Sort" },
    { id: "understanding-allowance", title: "Understanding Allowance" },
    { id: "smart-shopping", title: "Smart Shopping" },
    { id: "savings-calculator", title: "Savings Calculator" },
    { id: "multiplier-game", title: "Multiplier Wheel" },
    { id: "assessments", title: "Assessments" }
  ];

  function launchLesson(lesson: string) {
    setMsg(`Launching lesson: "${lesson}" (Integrate real interactive lesson here)`);
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Financial Lessons</Text>
      {lessons.map(l => (
        <TouchableOpacity
          key={l.id}
          style={styles.formBtn}
          onPress={() => launchLesson(l.title)}
        >
          <Text style={styles.formBtnText}>{l.title}</Text>
        </TouchableOpacity>
      ))}
      {msg ? <Text style={styles.statusMessage}>{msg}</Text> : null}
    </View>
  );
}

export default function TestScreen() {
  const [currentView, setCurrentView] = React.useState<'goals' | 'lessons'>('goals');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Test Components</Text>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setCurrentView('goals')}
        >
          <Text style={styles.navBtnText}>Goals & Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setCurrentView('lessons')}
        >
          <Text style={styles.navBtnText}>Financial Lessons</Text>
        </TouchableOpacity>
      </View>

      {currentView === 'goals' ? <KidGoalsRewardsSection /> : <FinancialLessonsSection />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  navRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: 10,
  },
  navBtn: {
    backgroundColor: "#4fc1e9",
    borderRadius: 7,
    marginHorizontal: 4,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  navBtnText: {
    color: "#16556c",
    fontWeight: "bold",
    fontSize: 15,
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
  formBtn: {
    backgroundColor: "#ffc46b",
    padding: 10,
    borderRadius: 8,
    marginTop: 7,
    marginHorizontal: 4,
    alignSelf: "flex-end",
  },
  formBtnText: { fontWeight: "700", color: "#6d3a00", fontSize: 15 },
  placeholder: {
    color: "#99a",
    fontStyle: "italic",
    fontSize: 15,
    marginBottom: 2,
    marginTop: 2,
    minHeight: 26,
  },
  statusMessage: { fontSize: 15, fontWeight: "600", marginTop: 3, color: "#18722a" }
});
