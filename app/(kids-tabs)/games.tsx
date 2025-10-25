import HelpModal from '@/components/HelpModal';
import { useTheme } from '@/utils/themeContext';
import { router } from 'expo-router';
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { AnimatedProgressBar } from '../../components/animations/AnimatedProgressBar';
import EntrepreneurStallGame from "./TheEntrepreneursStallGame";

const createGameStyles = (themeColors: any) => StyleSheet.create({
  gameModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: themeColors.primary,
  },
  gameButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  gameButtonText: {
    color: themeColors.card,
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: themeColors.surface,
    borderColor: themeColors.border,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
  },
  resultText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
  },
  gameText: {
    color: themeColors.text,
    fontSize: 16,
  },
  gameTextSecondary: {
    color: themeColors.textSecondary,
    fontSize: 14,
  },
  gameCard: {
    backgroundColor: themeColors.card,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
});

/* --- Fun, India-centric Kid Games for Ages 7-12 --- */

/* 2. Toy Market Mela (Stock Market) */
function ToyMarketMelaGame({ onClose, gameStyles, themeColors }: { onClose: () => void; gameStyles: any; themeColors: any }) {
  const toys = [
    { name: "Cricket Bat", emoji: "🏏" },
    { name: "Ludo Game", emoji: "🎲" },
    { name: "Spinning Top", emoji: "🌀" },
    { name: "Dancing Doll", emoji: "🪆" },
  ];
  const [prices, setPrices] = useState([45, 35, 18, 50]);
  const [owned, setOwned] = useState([0, 0, 0, 0]);
  const [funds, setFunds] = useState(100);
  const [message, setMessage] = useState("");
  const [days, setDays] = useState(1);

  function buy(idx: number) {
    if (funds >= prices[idx]) {
      const newOwned = [...owned];
      newOwned[idx]++;
      setOwned(newOwned);
      setFunds(funds - prices[idx]);
      setMessage(`You got a ${toys[idx].name}!`);
    } else {
      setMessage("Not enough pocket money!");
    }
  }
  function sell(idx: number) {
    if (owned[idx] > 0) {
      const newOwned = [...owned];
      newOwned[idx]--;
      setOwned(newOwned);
      setFunds(funds + prices[idx]);
      setMessage(`Sold your ${toys[idx].name}.`);
    } else {
      setMessage("You have none left!");
    }
  }
  function nextMelaDay() {
    setPrices(prices.map(p => Math.max(10, p + Math.floor(Math.random() * 15) - 5)));
    setDays(days + 1);
    setMessage("New mela day! Toy prices changed.");
  }
  return (
    <View style={{ padding: 10 }}>
      <Text style={gameStyles.gameModalTitle}>🎪 Toy Market Mela</Text>
      <Text style={{ textAlign: "center", marginBottom: 6 }}>Pocket Money: ₹{funds} | Day {days}</Text>
      {toys.map((toy, i) => (
        <View key={toy.name} style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
          <Text style={{ width: 110 }}>{toy.emoji} {toy.name}: ₹{prices[i]} ({owned[i]} owned)</Text>
          <TouchableOpacity style={[gameStyles.gameButton, { marginRight: 3, backgroundColor: themeColors.warning }]} onPress={() => buy(i)}>
            <Text style={gameStyles.gameButtonText}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[gameStyles.gameButton, { backgroundColor: themeColors.error }]} onPress={() => sell(i)}>
            <Text style={gameStyles.gameButtonText}>Sell</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={[gameStyles.gameButton, { backgroundColor: themeColors.accent }]} onPress={nextMelaDay}>
        <Text style={gameStyles.gameButtonText}>Next Mela Day 🎉</Text>
      </TouchableOpacity>
      <Text style={[gameStyles.resultText, { color: themeColors.warning }]}>{message}</Text>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

/* 3. Picnic Budget Challenge (Budget Challenge) */
function PicnicBudgetChallengeGame({ onClose, gameStyles, themeColors }: { onClose: () => void; gameStyles: any; themeColors: any }) {
  const [budget, setBudget] = useState(120);
  const [spent, setSpent] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const items = [
    { name: "Samosa Box", price: 20, emoji: "🥟" },
    { name: "Mango Juice", price: 15, emoji: "🥭" },
    { name: "Cricket Set", price: 40, emoji: "🏏" },
    { name: "Coloring Kit", price: 25, emoji: "🖍️" },
    { name: "Ice Cream", price: 10, emoji: "🍦" },
    { name: "Book", price: 20, emoji: "📚" },
  ];
  function addItem(idx: number) {
    if (spent + items[idx].price > budget) {
      setMessage("Arre! Not enough pocket money for this.");
      return;
    }
    setPicked([...picked, items[idx].name]);
    setSpent(spent + items[idx].price);
    setMessage(`Added ${items[idx].name}!`);
  }
  function reset() {
    setSpent(0);
    setPicked([]);
    setMessage("");
  }
  return (
    <View style={{ padding: 10 }}>
      <Text style={gameStyles.gameModalTitle}>🧺 Picnic Budget Challenge</Text>
      <Text style={{ textAlign: "center" }}>Your Budget: ₹{budget} | Spent: ₹{spent}</Text>
      <Text style={{ textAlign: "center", marginVertical: 8 }}>Pick what you want to bring to the picnic:</Text>
      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.name}
          style={[gameStyles.gameButton, { marginBottom: 5, backgroundColor: picked.includes(item.name) ? themeColors.warning : themeColors.primary }]}
          onPress={() => addItem(idx)}
          disabled={picked.includes(item.name)}
        >
          <Text style={gameStyles.gameButtonText}>{item.emoji} {item.name} (₹{item.price})</Text>
        </TouchableOpacity>
      ))}
      <Text style={[gameStyles.resultText, { color: themeColors.error }]}>{message}</Text>
      <Text style={{ textAlign: "center", marginTop: 8 }}>Items picked: {picked.length ? picked.join(", ") : "none chosen yet"}</Text>
      <TouchableOpacity style={gameStyles.gameButton} onPress={reset}>
        <Text style={gameStyles.gameButtonText}>Reset Choice</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

/* 7. Stock Market Adventure (Stock Simulator) */
function StockMarketAdventureGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const companies = [
    { name: "Cricket Star Toys", emoji: "🏏", color: "#fde68a" },
    { name: "Chaat Express", emoji: "🍲", color: "#fdba74" },
    { name: "Comic Store", emoji: "📚", color: "#a7f3d0" },
    { name: "Cycle Co.", emoji: "🚲", color: "#dbeafe" }
  ];
  const [prices, setPrices] = useState([50, 30, 35, 40]);
  const [owned, setOwned] = useState([0, 0, 0, 0]);
  const [funds, setFunds] = useState(120);
  const [message, setMessage] = useState("Try your luck buying and selling shares in kid-favorite companies!");
  const [day, setDay] = useState(1);

  function buy(idx: number) {
    if (funds >= prices[idx]) {
      const o = [...owned];
      o[idx]++;
      setOwned(o);
      setFunds(funds - prices[idx]);
      setMessage(`Bought 1 share of ${companies[idx].name}!`);
    } else setMessage("Not enough funds to buy.");
  }
  function sell(idx: number) {
    if (owned[idx] > 0) {
      const o = [...owned];
      o[idx]--;
      setOwned(o);
      setFunds(funds + prices[idx]);
      setMessage(`Sold 1 share of ${companies[idx].name}.`);
    } else setMessage("No shares to sell.");
  }
  function nextDay() {
    // Fun events on each day
    const events = [
      "IPL Final Day! Cricket Star Toys price surges!",
      "Rainy Day! Cycle Co. dips.",
      "ComicFest! Comics Store pops up.",
      "Food Festival! Chaat Express jumps high.",
      "Stock crash in market! Everyone goes down.",
      "Big Sale! All prices on discount."
    ];
    const eventIdx = Math.floor(Math.random() * events.length);
    let newPrices = prices.map(p => p + Math.floor(Math.random() * 16) - 7);
    if(eventIdx === 0) newPrices[0] += 18;
    if(eventIdx === 1) newPrices[3] -= 12;
    if(eventIdx === 2) newPrices[2] += 12;
    if(eventIdx === 3) newPrices[1] += 10;
    if(eventIdx === 4) newPrices = newPrices.map(p=>Math.max(8,p-15));
    if(eventIdx === 5) newPrices = newPrices.map(p=>Math.max(10,p-7));
    // Clamp to minimum price 8
    newPrices = newPrices.map(p => Math.max(8, p));
    setPrices(newPrices);
    setDay(day + 1);
    setMessage(events[eventIdx]);
  }
  return (
    <View style={{ padding: 10 }}>
      <Text style={gameStyles.gameModalTitle}>🚀 Stock Market Adventure</Text>
      <Text style={{ textAlign: "center" }}>Funds: ₹{funds} | Day {day}</Text>
      {companies.map((co, idx) => (
        <View key={co.name} style={{ flexDirection: "row", alignItems: "center", marginBottom: 9 }}>
          <Text style={{ width: 118 }}>{co.emoji} {co.name}: ₹{prices[idx]} ({owned[idx]} stk)</Text>
          <TouchableOpacity style={[gameStyles.gameButton, { backgroundColor: co.color, marginRight: 3 }]} onPress={() => buy(idx)}>
            <Text style={gameStyles.gameButtonText}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[gameStyles.gameButton, { backgroundColor: "#bbf7d0" }]} onPress={() => sell(idx)}>
            <Text style={gameStyles.gameButtonText}>Sell</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={[gameStyles.gameButton, { backgroundColor: "#818cf8", marginVertical: 8 }]} onPress={nextDay}>
        <Text style={gameStyles.gameButtonText}>Next Market Day</Text>
      </TouchableOpacity>
      <Text style={{ color: "#e11d48", marginBottom: 8, fontWeight: "bold", textAlign: "center" }}>{message}</Text>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

/* 6. Dream Jar Builder (Goal Planner) */
function DreamJarBuilderGame({ onClose, gameStyles, themeColors }: { onClose: () => void; gameStyles: any; themeColors: any }) {
  const dreams = [
    { name: "Cricket Bat", target: 300, emoji: "🏏" },
    { name: "New Bicycle", target: 500, emoji: "🚲" },
    { name: "School Bag", target: 220, emoji: "🎒" },
    { name: "Board Game", target: 150, emoji: "🎲" }
  ];
  const [dreamIdx, setDreamIdx] = useState(0);
  const [saved, setSaved] = useState(0);
  const [drops, setDrops] = useState(0);
  const [msg, setMsg] = useState("Add coins to fill the jar for your goal!");
  function addCoin() {
    const amt = Math.floor(Math.random() * 21) + 10;
    if (saved + amt >= dreams[dreamIdx].target) {
      setMsg(`Goal reached! Enjoy your ${dreams[dreamIdx].emoji} ${dreams[dreamIdx].name}!`);
      setSaved(dreams[dreamIdx].target);
    } else {
      setSaved(saved + amt);
      setDrops(drops + 1);
      setMsg(`Jar got ₹${amt}! Keep saving...`);
    }
  }
  function pickNewGoal() {
    setDreamIdx((dreamIdx + 1) % dreams.length);
    setSaved(0);
    setDrops(0);
    setMsg("New jar—let's start saving!");
  }
  return (
    <View style={{ padding: 10, alignItems: "center" }}>
      <Text style={gameStyles.gameModalTitle}>🥛 Dream Jar Builder</Text>
      <Text style={{ marginBottom: 4, color: themeColors.primary }}>
        Goal: {dreams[dreamIdx].emoji} {dreams[dreamIdx].name} (₹{dreams[dreamIdx].target})
      </Text>
      <View
        style={{
          marginVertical: 16,
          height: 120,
          width: 60,
          backgroundColor: themeColors.surface,
          borderRadius: 25,
          borderWidth: 2,
          borderColor: themeColors.border,
          alignItems: "center",
          justifyContent: "flex-end",
          position: "relative",
        }}
      >
        <View style={{
          height: Math.max(10, (saved / dreams[dreamIdx].target) * 110),
          width: 45,
          backgroundColor: themeColors.success + "44",
          borderRadius: 20,
          marginBottom: 6,
        }} />
        <Text style={{
          position: "absolute", bottom: 50, width: "100%",
          color: themeColors.primary, fontWeight: "bold", textAlign: "center"
        }}>
          {saved >= dreams[dreamIdx].target ? dreams[dreamIdx].emoji : ""}
        </Text>
      </View>
      <Text style={{ marginBottom: 7, color: themeColors.primary }}>Saved: ₹{saved} / ₹{dreams[dreamIdx].target}</Text>
      <TouchableOpacity style={gameStyles.gameButton} onPress={addCoin}>
        <Text style={gameStyles.gameButtonText}>Drop Coin in Jar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.gameButton} onPress={pickNewGoal}>
        <Text style={gameStyles.gameButtonText}>Pick a New Dream</Text>
      </TouchableOpacity>
      <Text style={{ color: "#ba181b", fontWeight: "bold", margin: 8 }}>{msg}</Text>
      <Text style={{ color: "#116530" }}>Drops: {drops}</Text>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

/* 5. Magic Piggy Bank (Savings Calculator) */
function MagicPiggyBankGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [balance, setBalance] = useState(0);
  const [added, setAdded] = useState(0);
  const [goal, setGoal] = useState(200);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("Tap the piggy bank to add coins!");

  function addCoin() {
    const amount = Math.floor(Math.random() * 15) + 5;
    setBalance(balance + amount);
    setAdded(added + 1);
    setMessage(`Piggy got ₹${amount}! 🐷`);
    if (balance + amount >= goal) {
      setLevel(level + 1);
      setGoal(goal + 200);
      setBalance(0);
      setAdded(0);
      setMessage("Wow! Goal reached! 🎉 Piggy evolved, new level!");
    }
  }
  return (
    <View style={{ padding: 10, alignItems: "center" }}>
      <Text style={gameStyles.gameModalTitle}>🐷 Magic Piggy Bank</Text>
      <Text style={{ textAlign: "center", fontWeight: "bold" }}>Tap piggy to save and grow money!</Text>
      <TouchableOpacity
        onPress={addCoin}
        style={{
          marginVertical: 18,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "#ffe6ae",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 4,
          borderColor: "#fabb05",
          shadowColor: "#faa",
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.7,
          elevation: 5
        }}
      >
        <Text style={{ fontSize: 42 }}>🐷</Text>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#e63946" }}>+₹</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 24, color: "#606c38" }}>₹{balance}</Text>
      <Text style={{ marginTop: 6 }}>Target: ₹{goal}</Text>
      <Text style={{ marginTop: 5, marginBottom: 9, color: "#ba181b", fontWeight: "bold" }}>{message}</Text>
      <Text style={{ color: "#408fa6", marginBottom: 7 }}>Savings streak: {added} taps</Text>
      <Text>Level: {level}</Text>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

/* 4. Neighbourhood Helper (Charity Helper) */
function NeighbourhoodCharityGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [points, setPoints] = useState(100);
  const [donated, setDonated] = useState([0, 0, 0, 0]);
  const [msg, setMsg] = useState("");
  const charities = [
    { name: "Feed Stray Animals", emoji: "🐕", color: "#ffb703" },
    { name: "Plant a Tree", emoji: "🌳", color: "#90be6d" },
    { name: "Clean Park", emoji: "🏞️", color: "#a0c4ff" },
    { name: "School Books", emoji: "📚", color: "#ffafcc" },
  ];
  function donate(idx: number) {
    if (points < 25) {
      setMsg("No points left to donate!");
      return;
    }
    const newDon = [...donated];
    newDon[idx] += 25;
    setDonated(newDon);
    setPoints(points - 25);
    setMsg(`Donated 25 to ${charities[idx].name}`);
  }
  function reset() {
    setPoints(100);
    setDonated([0, 0, 0, 0]);
    setMsg("");
  }
  return (
    <View style={{ padding: 10 }}>
      <Text style={gameStyles.gameModalTitle}>🏡 Neighbourhood Helper</Text>
      <Text style={{ textAlign: "center", marginBottom: 10 }}>
        Points to donate: {points}
      </Text>
      {charities.map((char, idx) => (
        <TouchableOpacity
          key={char.name}
          style={[gameStyles.gameButton, { marginBottom: 6, backgroundColor: char.color }]}
          onPress={() => donate(idx)}
        >
          <Text style={gameStyles.gameButtonText}>{char.emoji} {char.name} (+25 pts)</Text>
        </TouchableOpacity>
      ))}
      <Text style={{ marginTop: 10, color: "#00509e", textAlign: "center" }}>
        {donated.map((don, idx) => don ? `${charities[idx].name}: ${don} pts` : "").join(" ")}
      </Text>
      <Text style={[gameStyles.resultText, { color: "#2c5aa0" }]}>{msg}</Text>
      <TouchableOpacity style={gameStyles.gameButton} onPress={reset}>
        <Text style={gameStyles.gameButtonText}>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

/* 8. Smart Choice Game (Risk-Reward) */
function SmartChoiceGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [points, setPoints] = useState(100);
  const [round, setRound] = useState(1);
  const [status, setStatus] = useState("Ready for a festival adventure! Will you play it safe or take a risk?");
  const scenarios = [
    {
      safe: { msg: "You enjoyed a ladoo! +8 points.", points: 8 },
      risk: [
        { msg: "Your firecracker lit up the night! +25 points.", points: 25 },
        { msg: "Oh no! The firecracker fizzled out... -15 points.", points: -15 }
      ]
    },
    {
      safe: { msg: "You danced in the Holi rain! +10 points.", points: 10 },
      risk: [
        { msg: "Huge color splash! +30 points.", points: 30 },
        { msg: "You slipped on water... -12 points.", points: -12 }
      ]
    },
    {
      safe: { msg: "Watched fireworks with family! +7 points.", points: 7 },
      risk: [
        { msg: "Won the lucky draw! +40 points.", points: 40 },
        { msg: "Lost your ticket... -20 points.", points: -20 }
      ]
    },
    {
      safe: { msg: "Played safe at food stall. +12 points.", points: 12 },
      risk: [
        { msg: "Tried spicy golgappa! Brave! +22 points.", points: 22 },
        { msg: "Oh! Stomach ache. -17 points.", points: -17 }
      ]
    }
  ];
  function play(isRisk: boolean) {
    const scenario = scenarios[(round-1) % scenarios.length];
    let result;
    if (!isRisk) {
      result = scenario.safe;
    } else {
      result = scenario.risk[Math.floor(Math.random() * scenario.risk.length)];
    }
    setPoints(points + result.points);
    setStatus(result.msg + " Total: " + (points + result.points));
    setRound(round + 1);
  }
  function restart() {
    setPoints(100);
    setRound(1);
    setStatus("Ready for a festival adventure! Will you play it safe or take a risk?");
  }
  return (
    <View style={{padding:16, alignItems:"center"}}>
      <Text style={gameStyles.gameModalTitle}>⚡ Smart Choice Festival</Text>
      <Text style={{fontSize:17, marginTop:5}}>Points: {points}</Text>
      <Text style={{marginVertical:10, color:"#2274a5"}}>{status}</Text>
      <TouchableOpacity style={[gameStyles.gameButton, {backgroundColor:"#e76f51"}]} onPress={()=>play(true)}>
        <Text style={gameStyles.gameButtonText}>Take a Risk</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[gameStyles.gameButton, {backgroundColor:"#a3be8c"}]} onPress={()=>play(false)}>
        <Text style={gameStyles.gameButtonText}>Play it Safe</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.gameButton} onPress={restart}>
        <Text style={gameStyles.gameButtonText}>Restart Game</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// 1. Nimbu Pani Stall (Lemonade Stand)
function NimbuPaniStallGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [glasses, setGlasses] = useState(8);
  const [price, setPrice] = useState(5);
  const [balance, setBalance] = useState(15);
  const [message, setMessage] = useState("");
  const [weather, setWeather] = useState("🌞 Hot");
  const [customers, setCustomers] = useState(0);

  function sellNimbuPani() {
    if (glasses <= 0) {
      setMessage("No nimbu paani left! Buy more lemons!");
      return;
    }
    // Weather and price affect buyers
    let baseDemand = weather === "🌞 Hot" ? 5 : 3;
    let bought = Math.max(1, baseDemand + Math.floor(Math.random() * 4) - Math.floor(price / 8));
    bought = Math.min(bought, glasses);
    setGlasses(glasses - bought);
    setBalance(balance + bought * price);
    setCustomers(customers + bought);
    setMessage(`Sold ${bought} glasses!`);
  }

  function refill() {
    if (balance < 8) {
      setMessage("Not enough money for more lemons!");
    } else {
      setGlasses(glasses + 8);
      setBalance(balance - 8);
      setMessage("Bought lemons and sugar! 🍋");
    }
  }

  function changeWeather() {
    const weatherOptions = [
      "🌞 Hot", "☁️ Cloudy", "🌧️ Rainy"
    ];
    const next = weatherOptions[(weatherOptions.indexOf(weather) + 1) % weatherOptions.length];
    setWeather(next);
    setMessage(`Weather changed to ${next}`);
  }

  return (
    <View style={{ padding: 10 }}>
      <Text style={gameStyles.gameModalTitle}>🍋 Nimbu Pani Stall</Text>
      <Text style={{ textAlign: "center" }}>
        {weather} | Rupees: ₹{balance} | Glasses left: {glasses}
      </Text>
      <Text style={{ textAlign: "center", marginTop: 7 }}>
        {customers} customers served!
      </Text>
      <Text style={{ textAlign: "center", marginTop: 7 }}>
        Set your price per glass (₹):
      </Text>
      <TextInput
        style={gameStyles.input}
        keyboardType="numeric"
        value={String(price)}
        onChangeText={txt => setPrice(Number(txt))}
      />
      <TouchableOpacity style={gameStyles.gameButton} onPress={sellNimbuPani}>
        <Text style={gameStyles.gameButtonText}>Sell Nimbu Pani 🥤</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.gameButton} onPress={refill}>
        <Text style={gameStyles.gameButtonText}>Buy Lemons & Sugar (₹8)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.gameButton} onPress={changeWeather}>
        <Text style={gameStyles.gameButtonText}>Change Weather</Text>
      </TouchableOpacity>
      <Text style={[gameStyles.resultText, { color: "#2c5aa0" }]}>{message}</Text>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Add getGameComponent utility function ---

function getGameComponent(gameId: string, onClose: () => void, styles: any, themeColors: any, gameStyles: any) {
  switch (gameId) {
    case "entrepreneurs-stall":
      return <EntrepreneurStallGame onClose={onClose} />;
    case "diwali-savings":
      return <DiwaliLightSavingsGame onClose={onClose} gameStyles={gameStyles} />;
    case "holi-colors":
      return <HoliColorEconomicsGame onClose={onClose} gameStyles={gameStyles} />;
    case "street-market":
      return <IndianStreetMarketGame onClose={onClose} gameStyles={gameStyles} />;
    case "temple-donation":
      return <TempleDonationGame onClose={onClose} gameStyles={gameStyles} />;
    // You can implement proper components for these as needed
    case "lemonade-stand":
      return <NimbuPaniStallGame onClose={onClose} gameStyles={gameStyles} />;
    case "stock-market":
      return <ToyMarketMelaGame onClose={onClose} gameStyles={gameStyles} themeColors={themeColors} />;
    case "budget-planner":
      return <PicnicBudgetChallengeGame onClose={onClose} gameStyles={gameStyles} themeColors={themeColors} />;
    case "charity-allocator":
      return <NeighbourhoodCharityGame onClose={onClose} gameStyles={gameStyles} />;
    case "savings-calculator":
      return <MagicPiggyBankGame onClose={onClose} gameStyles={gameStyles} />;
    case "stock-simulator":
      return <StockMarketAdventureGame onClose={onClose} gameStyles={gameStyles} />;
    case "goal-planner":
      return <DreamJarBuilderGame onClose={onClose} gameStyles={gameStyles} themeColors={themeColors} />;
    case "risk-reward":
      return <SmartChoiceGame onClose={onClose} gameStyles={gameStyles} />;
    default:
      return (
        <View style={{ alignItems: "center", padding: 24, backgroundColor: themeColors?.background || "#fff" }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#ab2525" }}>Game not found!</Text>
          <Text style={{ textAlign: "center", color: "#912841" }}>
            Sorry, this game could not be loaded.
          </Text>
          <TouchableOpacity style={{
            backgroundColor: "#eebaba",
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 32
          }} onPress={onClose}>
            <Text style={{ fontWeight: "bold", color: "#721212" }}>Close</Text>
          </TouchableOpacity>
        </View>
      );
  }
}

// --- (IDENTICAL UP TO: MiniGames & getGameComponent as in previous file) ---

// (CUT SECTION here for brevity)

// --- Indian-Themed Games Implementation ---

// 1. Diwali Light Savings
function DiwaliLightSavingsGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [step, setStep] = useState<'choose' | 'save' | 'shop' | 'celebrate'>('choose');
  const [theme, setTheme] = useState<string | null>(null);
  const [savedPoints, setSavedPoints] = useState(0);
  const [goal, setGoal] = useState(200);
  const [purchased, setPurchased] = useState<string[]>([]);
  const decorations = [
    { name: 'Basic Lights', price: 50, emoji: '💡' },
    { name: 'Fancy Lanterns', price: 150, emoji: '🏮' },
    { name: 'Grand Light Show', price: 300, emoji: '🎆' },
  ];

  if (step === 'choose') {
    return (
      <View>
      <Text style={gameStyles.gameModalTitle}>🪔 Diwali Light Savings</Text>
        <Text style={{ marginBottom: 10, textAlign: 'center' }}>
          Choose your Diwali celebration theme!
        </Text>
        {['Traditional', 'Modern', 'Eco-friendly'].map(option => (
          <TouchableOpacity
            key={option}
            style={[gameStyles.gameButton, { marginVertical: 4 }]}
            onPress={() => { setTheme(option); setStep('save'); }}
          >
            <Text style={gameStyles.gameButtonText}>{option}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'save') {
    return (
      <View>
        <Text style={gameStyles.gameModalTitle}>💰 Save for Diwali</Text>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>
          Earn points by decorating and learning Diwali facts!
        </Text>
        <AnimatedProgressBar
          progress={savedPoints / goal}
          height={14}
          color="#fca311"
          showPercentage
        />
        <Text style={{ textAlign: 'center', marginTop: 7 }}>
          Savings: ₹{savedPoints}
        </Text>
        <TouchableOpacity
          style={gameStyles.gameButton}
          onPress={() => setSavedPoints(p => p + Math.floor(Math.random() * 40 + 20))}
        >
          <Text style={gameStyles.gameButtonText}>Decorate 🏠 (+points)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={gameStyles.gameButton}
          onPress={() => setSavedPoints(p => p + Math.floor(Math.random() * 50 + 30))}
        >
          <Text style={gameStyles.gameButtonText}>Learn a Diwali Fact 💡 (+points)</Text>
        </TouchableOpacity>
        {savedPoints >= 50 && (
          <TouchableOpacity
            style={[gameStyles.gameButton, { backgroundColor: '#fca311' }]}
            onPress={() => setStep('shop')}
          >
            <Text style={gameStyles.gameButtonText}>Go Shopping 🛍️</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'shop') {
    return (
      <View>
        <Text style={gameStyles.gameModalTitle}>🪔 Diwali Shopping</Text>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>
          Spend your savings on decorations!
        </Text>
        <Text style={{ textAlign: 'center' }}>
          Savings: ₹{savedPoints}
        </Text>
        {decorations.map(decoration => (
          <TouchableOpacity
            key={decoration.name}
            style={[
              gameStyles.gameButton,
              {
                backgroundColor: purchased.includes(decoration.name)
                  ? '#6c757d'
                  : '#c77d0a',
                marginVertical: 4
              }
            ]}
            disabled={purchased.includes(decoration.name) || savedPoints < decoration.price}
            onPress={() => {
              setPurchased(prev => [...prev, decoration.name]);
              setSavedPoints(p => p - decoration.price);
            }}
          >
            <Text style={gameStyles.gameButtonText}>
              {decoration.emoji} {decoration.name} - ₹{decoration.price}
            </Text>
          </TouchableOpacity>
        ))}
        {purchased.length > 0 && (
          <TouchableOpacity
            style={gameStyles.gameButton}
            onPress={() => setStep('celebrate')}
          >
            <Text style={gameStyles.gameButtonText}>Celebrate Diwali! 🎆</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Celebrate phase
  return (
    <View>
      <Text style={gameStyles.gameModalTitle}>🎆 Happy Diwali!</Text>
      <Text style={{ textAlign: 'center', marginBottom: 10 }}>
        You celebrated Diwali with:
      </Text>
      {purchased.map(name => (
        <Text key={name} style={{ textAlign: 'center' }}>- {name}</Text>
      ))}
      <Text style={{ fontSize: 16, color: '#fca311', marginVertical: 10, textAlign: 'center' }}>
        {theme && <>Theme: <Text style={{ fontWeight: 'bold' }}>{theme}</Text></>}
      </Text>
      <Text style={{ textAlign: 'center', marginVertical: 8 }}>
        Well done on saving, planning, and celebrating the festival!
      </Text>
      <TouchableOpacity
        style={gameStyles.gameButton}
        onPress={() => {
          setTheme(null); setSavedPoints(0); setGoal(200);
          setPurchased([]); setStep('choose');
        }}
      >
        <Text style={gameStyles.gameButtonText}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// 2. Holi Color Economics
function HoliColorEconomicsGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [budget] = useState(200);
  const [purchases, setPurchases] = useState<{ [name: string]: number }>({});
  const [mixResult, setMixResult] = useState<string | null>(null);
  const [phase, setPhase] = useState<'shop' | 'mix' | 'festival'>('shop');
  const colorTypes = [
    { name: 'Basic Color', price: 20 },
    { name: 'Organic Color', price: 50 },
    { name: 'Special Effect', price: 80 },
    { name: 'Protective Gear', price: 30 },
  ];

  const spent = Object.entries(purchases).reduce((sum, [key, val]) =>
    sum + (colorTypes.find(c => c.name === key)?.price || 0) * val, 0
  );
  const remaining = budget - spent;

  function buyColor(name: string) {
    setPurchases(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
    setMixResult(null);
  }

  function mix() {
    // Demo "randomness" of mixing, opportunity cost
    if ((purchases['Basic Color'] || 0) + (purchases['Organic Color'] || 0) === 0) {
      setMixResult("Not enough colors! Buy more to mix.");
    } else if (Math.random() < 0.3) {
      setMixResult("Uh oh! The colors mixed strangely and made brown mud. Try a different combo.");
    } else {
      setMixResult("You mixed a unique Holi color burst! 🌈");
    }
  }

  if (phase === 'shop') {
    return (
      <View>
        <Text style={gameStyles.gameModalTitle}>🎨 Holi Color Economics</Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }}>
          Budget: ₹{budget} | Remaining: ₹{remaining}
        </Text>
        {colorTypes.map(color => (
          <TouchableOpacity
            key={color.name}
            style={[
              gameStyles.gameButton,
              { marginVertical: 4, backgroundColor: '#ee61c3' }
            ]}
            disabled={remaining < color.price}
            onPress={() => buyColor(color.name)}
          >
            <Text style={gameStyles.gameButtonText}>
              {color.name} - ₹{color.price}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={gameStyles.gameButton}
          onPress={() => setPhase('mix')}
        >
          <Text style={gameStyles.gameButtonText}>Mix Colors!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'mix') {
    return (
      <View>
        <Text style={gameStyles.gameModalTitle}>🎨 Color Mixing</Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }}>
          Try to mix your colors to make something special!
        </Text>
        <TouchableOpacity
          style={gameStyles.gameButton}
          onPress={mix}
        >
          <Text style={gameStyles.gameButtonText}>Mix Now</Text>
        </TouchableOpacity>
        {mixResult && (
          <Text style={[
            gameStyles.resultText,
            { color: mixResult.includes("unique") ? '#10b981' : '#bd1515' }
          ]}>{mixResult}</Text>
        )}
        <TouchableOpacity
          style={gameStyles.gameButton}
          onPress={() => setPhase('festival')}
        >
          <Text style={gameStyles.gameButtonText}>Start Holi Festival!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Festival
  return (
    <View>
      <Text style={gameStyles.gameModalTitle}>🌈 Happy Holi!</Text>
      <Text style={{ textAlign: 'center', marginBottom: 8 }}>
        {mixResult || "Your festival is bursting with colors!"}
      </Text>
      <Text style={{ textAlign: 'center', marginVertical: 4 }}>
        Colors bought:
      </Text>
      {Object.entries(purchases).map(([name, qty]) => (
        <Text key={name} style={{ textAlign: 'center' }}>
          {name}: {qty}
        </Text>
      ))}
      <TouchableOpacity
        style={gameStyles.gameButton}
        onPress={() => {
          setPurchases({});
          setMixResult(null);
          setPhase('shop');
        }}
      >
        <Text style={gameStyles.gameButtonText}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// 3. Indian Street Market
function IndianStreetMarketGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [step, setStep] = useState<'market' | 'checkout' | 'done'>('market');
  const [budget, setBudget] = useState(500);
  const [basket, setBasket] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const goods = [
    { name: 'Spices', min: 40, max: 100 },
    { name: 'Textiles', min: 120, max: 220 },
    { name: 'Jewelry', min: 350, max: 500 },
    { name: 'Street Food', min: 20, max: 45 },
    { name: 'Handicrafts', min: 50, max: 150 },
  ];
  // Randomize stall prices
  const [prices] = useState(() =>
    goods.map(g => ({
      ...g,
      price: Math.floor(Math.random() * (g.max - g.min + 1)) + g.min,
      vendor: 'Vendor ' + String.fromCharCode(65 + Math.floor(Math.random() * 4))
    }))
  );
  function buy(name: string) {
    const item = prices.find(p => p.name === name);
    if (item && budget >= item.price) {
      setBasket(b => [...b, name]);
      setBudget(budget - item.price);
      setFeedback(`You got a deal from ${item.vendor}!`);
    } else {
      setFeedback("Not enough money!");
    }
  }
  function bargain(name: string) {
    const itemIdx = prices.findIndex(p => p.name === name);
    if (itemIdx === -1) return;
    // Try to bargain for 10-25% less, sometimes works
    if (Math.random() < 0.5) {
      const newPrice = Math.max(prices[itemIdx].min, prices[itemIdx].price - Math.floor(prices[itemIdx].price * (0.1 + Math.random() * 0.15)));
      prices[itemIdx].price = newPrice;
      setFeedback("Bargain accepted! Lower price.");
    } else {
      setFeedback("No luck, price stays the same.");
    }
  }

  if (step === 'market') {
    return (
      <View>
        <Text style={gameStyles.gameModalTitle}>🏪 Indian Street Market</Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }}>
          Budget: ₹{budget}
        </Text>
        {prices.map(item => (
          <View key={item.name} style={{ marginVertical: 6, backgroundColor: '#eafbe0', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.name} <Text style={{ color: '#9e6b10' }}>({item.vendor})</Text></Text>
            <Text style={{ color: '#555' }}>₹{item.price}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <TouchableOpacity style={gameStyles.gameButton} onPress={() => buy(item.name)}>
                <Text style={gameStyles.gameButtonText}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gameStyles.gameButton, { backgroundColor: '#2db166' }]} onPress={() => bargain(item.name)}>
                <Text style={gameStyles.gameButtonText}>Bargain</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={[gameStyles.gameButton, { backgroundColor: '#2db166' }]}
          onPress={() => setStep('checkout')}
        >
          <Text style={gameStyles.gameButtonText}>Go to Checkout</Text>
        </TouchableOpacity>
        {feedback && (
          <Text style={[gameStyles.resultText, { color: '#2db166' }]}>{feedback}</Text>
        )}
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (step === 'checkout') {
    return (
      <View>
        <Text style={gameStyles.gameModalTitle}>🛍️ Purchase Summary</Text>
        <Text style={{ textAlign: 'center', marginVertical: 8 }}>
          Budget left: ₹{budget}
        </Text>
        {basket.length === 0 ? (
          <Text style={{ textAlign: 'center' }}>No items bought yet!</Text>
        ) : (
          basket.map((name, idx) => <Text key={idx} style={{ textAlign: 'center' }}>- {name}</Text>)
        )}
        <TouchableOpacity
          style={gameStyles.gameButton}
          onPress={() => setStep('done')}
        >
          <Text style={gameStyles.gameButtonText}>Finish Shopping</Text>
        </TouchableOpacity>
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View>
      <Text style={gameStyles.gameModalTitle}>🎉 Shopping Complete!</Text>
      <Text style={{ textAlign: 'center', marginVertical: 8 }}>
        Total Items: {basket.length}
      </Text>
      <Text style={{ textAlign: 'center', marginBottom: 10 }}>
        You bagged great deals in the Indian bazaar!
      </Text>
      <TouchableOpacity
        style={gameStyles.gameButton}
        onPress={() => {
          setStep('market'); setBudget(500); setBasket([]); setFeedback("");
        }}
      >
        <Text style={gameStyles.gameButtonText}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// 4. Temple Donation Game
function TempleDonationGame({ onClose, gameStyles }: { onClose: () => void; gameStyles: any }) {
  const [donations, setDonations] = useState<{ [cause: string]: number }>({});
  const [points] = useState(300);
  const [phase, setPhase] = useState<'choose' | 'impact'>('choose');
  const causes = [
    { name: 'Temple Offerings', price: 50, emoji: '⛩️' },
    { name: 'Food for Needy', price: 100, emoji: '🍲' },
    { name: 'Educational Materials', price: 150, emoji: '📚' },
    { name: 'Environmental Projects', price: 200, emoji: '🌱' }
  ];
  const donated = Object.values(donations).reduce((sum, val) => sum + val, 0);
  const remaining = points - donated;
  function donate(cause: string, price: number) {
    if (remaining >= price) {
      setDonations(prev => ({ ...prev, [cause]: (prev[cause] || 0) + price }));
    }
  }
  if (phase === 'choose') {
    return (
      <View>
        <Text style={gameStyles.gameModalTitle}>🙏 Temple Donation Game</Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }}>
          Distribute your points to help different causes!
        </Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }}>
          Donation Points: {remaining} / {points}
        </Text>
        {causes.map(cause => (
          <View key={cause.name} style={{ marginVertical: 6 }}>
            <Text style={{ fontWeight: 'bold' }}>
              {cause.emoji} {cause.name}
            </Text>
            <TouchableOpacity
              style={gameStyles.gameButton}
              onPress={() => donate(cause.name, cause.price)}
              disabled={remaining < cause.price}
            >
              <Text style={gameStyles.gameButtonText}>
                Donate ₹{cause.price}
              </Text>
            </TouchableOpacity>
            <Text style={{ textAlign: 'center', color: '#8168c1', marginTop: 2 }}>
              Donated: ₹{donations[cause.name] || 0}
            </Text>
          </View>
        ))}
        {remaining <= 0 && (
          <TouchableOpacity
            style={[gameStyles.gameButton, { backgroundColor: '#8168c1' }]}
            onPress={() => setPhase('impact')}
          >
            <Text style={gameStyles.gameButtonText}>See Your Impact</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
          <Text style={gameStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // Impact
  return (
    <View>
      <Text style={gameStyles.gameModalTitle}>🌟 Your Giving Impact</Text>
      <Text style={{ textAlign: 'center', marginBottom: 8 }}>
        You made a big difference!
      </Text>
      {causes.map(cause => (
        donations[cause.name] ? (
          <Text key={cause.name} style={{ textAlign: 'center', color: '#8168c1', marginBottom: 4 }}>
            {cause.emoji} {cause.name}: ₹{donations[cause.name]}
          </Text>
        ) : null
      ))}
      <Text style={{ textAlign: 'center', marginVertical: 10 }}>
        Family blessing earned! Karma points +10 🌼
      </Text>
      <TouchableOpacity
        style={gameStyles.gameButton}
        onPress={() => {
          setDonations({}); setPhase('choose');
        }}
      >
        <Text style={gameStyles.gameButtonText}>Donate Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={gameStyles.closeButton} onPress={onClose}>
        <Text style={gameStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function GamesScreen() {
  const { themeColors } = useTheme();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Create game styles with theme colors
  const gameStyles = createGameStyles(themeColors);

  // Create styles with theme colors
  const styles = StyleSheet.create({
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
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 8,
      color: themeColors.text,
    },
    gameCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      alignItems: "center",
    },
    gameTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
    },
    gameDescription: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 12,
    },
    playButton: {
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      elevation: 2,
    },
    playButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      borderRadius: 20,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
  });

  const miniGames = [
    {
      id: 'entrepreneurs-stall',
      title: '🛍️ My Stall',
      description: "Own a stall! Buy supplies, set prices & earn profit. Level up to unlock new inventory and rewards.",
      icon: '🛍️',
      color: themeColors.primary,
    },
    {
      id: 'stock-market',
      title: '📈 Stock Market',
      description: 'Predict which toys will be popular! Learn about supply and demand.',
      icon: '📈',
      color: themeColors.secondary,
    },
    {
      id: 'budget-planner',
      title: '💰 Budget Challenge',
      description: 'Plan your spending for a fun day out! Stay within your budget.',
      icon: '💰',
      color: themeColors.success,
    },
    {
      id: 'charity-allocator',
      title: '🤝 Charity Helper',
      description: 'Decide how to share your points between different charities.',
      icon: '🤝',
      color: themeColors.warning,
    },
    // Indian-Themed Games
    {
      id: 'diwali-savings',
      title: '🪔 Diwali Light Savings',
      description: 'Save for Diwali festival lights and decorations!',
      icon: '🪔',
      color: '#fca311',
    },
    {
      id: 'holi-colors',
      title: '🎨 Holi Color Economics',
      description: 'Budget and buy magical Holi colors for the festival!',
      icon: '🎨',
      color: '#ee61c3',
    },
    {
      id: 'street-market',
      title: '🏪 Indian Street Market',
      description: 'Test your shopping skills in a bustling Indian bazaar.',
      icon: '🏪',
      color: '#2db166',
    },
    {
      id: 'temple-donation',
      title: '🙏 Temple Donation Game',
      description: 'Learn about giving by making donations to temples and good causes.',
      icon: '🙏',
      color: '#8168c1',
    },
  ];

  const investmentGames = [
    {
      id: 'savings-calculator',
      title: '🐷 Money Magic Calculator',
      description: 'Watch your points grow bigger like magic!',
      icon: '🐷',
      color: themeColors.primary,
    },
    {
      id: 'stock-simulator',
      title: '🚀 Stock Market Adventure',
      description: 'Buy and sell pretend stocks like a super trader!',
      icon: '🚀',
      color: themeColors.secondary,
    },
    {
      id: 'goal-planner',
      title: '🎯 Dream Goal Builder',
      description: 'Plan how to save for your biggest wishes!',
      icon: '🎯',
      color: themeColors.success,
    },
    {
      id: 'risk-reward',
      title: '⚖️ Smart Choice Game',
      description: 'Learn to make wise decisions with your points!',
      icon: '⚖️',
      color: themeColors.error,
    },
  ];

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
  };

  const handleCloseGame = () => {
    setSelectedGame(null);
  };

  return (
    <>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 6 }}>
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
              onPress={() => router.push('/(kids-tabs)')}
              accessibilityRole="button"
              accessibilityLabel="Go back to home"
              accessibilityHint="Return to the main kids dashboard"
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
              accessibilityHint="Open help guide for money games"
            >
              <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.title, { color: themeColors.primary }]}>🎮 Play Money Games</Text>
          </View>
        </View>

        {/* Money Growing Games */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🌱 Money Growing Games</Text>
          <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
            Watch your points grow bigger and learn about money magic! ✨
          </Text>

          {investmentGames.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, {
                backgroundColor: themeColors.card,
                borderColor: game.color
              }]}
              onPress={() => handleGameSelect(game.id)}
              accessibilityRole="button"
              accessibilityLabel={`Learn with ${game.title}: ${game.description}`}
              accessibilityHint="Opens the selected investment learning tool"
            >
              <Text style={[styles.gameTitle, { color: themeColors.text }]}>{game.title}</Text>
              <Text style={[styles.gameDescription, { color: themeColors.textSecondary }]}>
                {game.description}
              </Text>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: game.color }]}
                onPress={() => handleGameSelect(game.id)}
              >
                <Text style={styles.playButtonText}>Learn Now</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mini Games & Festivals */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🎉 Mini Games & Festivals</Text>
          <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
            Play fun mini-games and explore Indian festivals!
          </Text>
          {miniGames.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { borderColor: game.color }]}
              onPress={() => handleGameSelect(game.id)}
              accessibilityRole="button"
              accessibilityLabel={`${game.title}: ${game.description}`}
              accessibilityHint="Opens the selected mini-game"
            >
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={[styles.gameDescription, { color: themeColors.textSecondary }]}>
                {game.description}
              </Text>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: game.color }]}
                onPress={() => handleGameSelect(game.id)}
              >
                <Text style={styles.playButtonText}>Play Now</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Game Modals */}
      <Modal
        visible={!!selectedGame}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseGame}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: themeColors.card,
            shadowColor: themeColors.border,
            borderWidth: 1,
            borderColor: themeColors.border,
            maxHeight: '85%',
            flex: 1
          }]}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedGame && getGameComponent(selectedGame, handleCloseGame, styles, themeColors, gameStyles)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🎮 Fun Money Games - Help!"
        tabs={[
          {
            title: "What's So Cool About These Games?",
            content: [
              {
                type: "text",
                text: "Hey there, money explorer! 🎉 These games are super fun ways to learn about rupees, saving, and spending. Each game teaches you something awesome about money!",
                icon: "🎮"
              },
              {
                type: "bullet",
                text: "🌱 Money Growing Games - Watch your rupees grow like magic! ✨"
              },
              {
                type: "bullet",
                text: "🎲 Mini Games - Quick adventures and challenges!"
              },
              {
                type: "bullet",
                text: "🪔 Festival Games - Celebrate Indian festivals while learning!"
              },
              {
                type: "highlight",
                text: "Remember: It's all pretend money! No real rupees needed! 🎈",
                icon: "🛡️"
              }
            ]
          },
          {
            title: "🌱 Money Growing Games",
            content: [
              {
                type: "text",
                text: "These games show how your rupees can grow bigger and bigger! 🚀",
                icon: "🌱"
              },
              {
                type: "bullet",
                text: "🐷 Piggy Bank Magic - Tap the cute piggy to make rupees appear!"
              },
                {
                type: "bullet",
                text: "🚀 Stock Market Adventure - Be a super trader and buy/sell shares!"
              },
              {
                type: "bullet",
                text: "🎯 Dream Jar Builder - Fill jars with coins to reach your goals!"
              },
              {
                type: "bullet",
                text: "⚖️ Smart Choice Game - Make wise decisions to win big!"
              },
              {
                type: "highlight",
                text: "These games teach you to be patient and plan ahead! ⏰",
                icon: "⏰"
              }
            ]
          },
          {
            title: "🎲 Mini Games - Quick Fun!",
            content: [
              {
                type: "text",
                text: "Jump into these fast and exciting mini games! 🎯",
                icon: "🎲"
              },
              {
                type: "bullet",
                text: "🏪 Lemonade Stall - Run your own yummy drink shop!"
              },
              {
                type: "bullet",
                text: "📈 Toy Market Mela - Buy and sell toys at the fair!"
              },
              {
                type: "bullet",
                text: "💰 Picnic Budget - Plan the perfect picnic adventure!"
              },
              {
                type: "bullet",
                text: "🤝 Charity Helper - Share points with friends and animals!"
              },
              {
                type: "highlight",
                text: "Each game teaches you a special money skill! 📚",
                icon: "📚"
              }
            ]
          },
          {
            title: "🪔 Festival Games - Party Time!",
            content: [
              {
                type: "text",
                text: "Celebrate amazing Indian festivals while learning! 🎊",
                icon: "🪔"
              },
              {
                type: "bullet",
                text: "🪔 Diwali Lights - Save rupees for bright festival lights!"
              },
              {
                type: "bullet",
                text: "🎨 Holi Colors - Buy magical colors for Holi fun!"
              },
              {
                type: "bullet",
                text: "🏪 Indian Bazaar - Shop and bargain in the market!"
              },
              {
                type: "bullet",
                text: "🙏 Temple Giving - Learn about sharing and giving!"
              },
              {
                type: "highlight",
                text: "Games teach money while celebrating our culture! 🎊",
                icon: "🎊"
              }
            ]
          }
        ]}
      />
    </>
  );
}
