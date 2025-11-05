import HelpModal from '@/components/HelpModal';
import { KIDS_TYPOGRAPHY, TYPOGRAPHY } from '@/constants/theme';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { useTheme } from "@/utils/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import React, { useState } from "react";
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

/** Proper typing for games section */
type Game = {
  key: string;
  title: string;
  description: string;
  source: string;
  type: "web" | "native";
  license: string;
  attribution: string;
  comingSoon: boolean;
};

// List of open-source/free, dynamic, mobile-friendly games (attribution in comments)
const GAME_LIST = [
  {
    key: "market-rollercoaster",
    title: "Market Rollercoaster",
    description: "Ride live stock charts, time your trades, score combos in this thrilling investment sim!",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "financial-trivia-show",
    title: "Financial Trivia Show",
    description: "Game show quiz with lifelines, streaks, and audience reactions—test your money smarts!",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "coin-matching-frenzy",
    title: "Coin Matching Frenzy",
    description: "Match pairs of INR rupee coins—flip, remember, race the clock!",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "money-rain-catcher",
    title: "Money Rain Catcher",
    description: "Catch falling rupees, allocate to jars! Fast-paced arcade action for financial learning.",
    source: "https://codesandbox.io/embed/money-rain-catcher-fintoosh?fontsize=14&view=preview",
    type: "web", // In this demo use a placeholder; see dev note below
    license: "MIT",
    attribution: "Custom open-source build. Replace URL with your deployed HTML5 game.",
    comingSoon: false,
  },
  {
    key: "budget-dash",
    title: "Budget Dash",
    description: "Manage a shopping spree—buy smart before time runs out!",
    source: "https://codesandbox.io/embed/budget-dash-fintoosh?fontsize=14&view=preview",
    type: "web",
    license: "MIT",
    attribution: "Custom open-source build. Replace URL with your deployed HTML5 game.",
    comingSoon: false,
  },
  {
    key: "investment-bubble-pop",
    title: "Investment Bubble Pop",
    description: "Pop bubbles with rising/falling investment values. Fast, animated, skill-based.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  // {
  //   key: "savings-obstacle-course",
  //   title: "Savings Obstacle Course",
  //   description: "Navigate a maze, collect coins, reach your savings goal first!",
  //   source: "",
  //   type: "web",
  //   license: "MIT",
  //   attribution: "Now available natively in-app!",
  //   comingSoon: false,
  // },
  {
    key: "expense-dodger",
    title: "Expense Dodger",
    description: "Dodge flying expenses, collect rupees, crazy combos, and powerups! Fast-paced fun for all ages.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "charity-chain-reaction",
    title: "Charity Chain Reaction",
    description: "Donate rupees, watch your generosity trigger beautiful chain reactions across the network!",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "magic-piggy-bank",
    title: "Magic Piggy Bank",
    description: "Tap the piggy to watch your savings grow magically! Learn compound interest through fun levels.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "dream-jar-builder",
    title: "Dream Jar Builder",
    description: "Drop coins into dream jars and watch your goals fill up! Perfect for teaching saving habits.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "stock-market-adventure",
    title: "Stock Market Adventure",
    description: "Buy and sell kid-friendly stocks! Experience market events and learn investment basics.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "smart-choice-game",
    title: "Smart Choice Game",
    description: "Make festival decisions: play it safe or take calculated risks! Learn risk-reward thinking.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "entrepreneurs-stall",
    title: "Entrepreneur's Stall",
    description: "Run your own business stall! Set prices, manage inventory, and maximize profits.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "toy-market-mela",
    title: "Toy Market Mela",
    description: "Buy and sell toys at the fair! Experience supply/demand with changing market prices.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "picnic-budget-challenge",
    title: "Picnic Budget Challenge",
    description: "Plan the perfect picnic within budget! Make smart spending choices for maximum fun.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "neighbourhood-charity",
    title: "Neighbourhood Charity",
    description: "Help your community! Allocate points to support animals, education, and local causes.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "diwali-light-savings",
    title: "Diwali Light Savings",
    description: "Save for Diwali festival lights! Learn delayed gratification and cultural celebration planning.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "holi-color-economics",
    title: "Holi Color Economics",
    description: "Budget for Holi festival colors! Mix colors and learn about opportunity costs.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "indian-street-market",
    title: "Indian Street Market",
    description: "Shop in a bustling bazaar! Practice bargaining, comparison shopping, and smart purchases.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
  {
    key: "temple-donation-game",
    title: "Temple Donation Game",
    description: "Learn the joy of giving! Allocate donations between temples, food banks, and education.",
    source: "",
    type: "web",
    license: "MIT",
    attribution: "Now available natively in-app!",
    comingSoon: false,
  },
];

const { width, height } = Dimensions.get("window");
const GAME_MODAL_HEIGHT = Math.min(height * 0.85, 600);

export default function GamesSection() {
  const [selected, setSelected] = useState<Game | null>(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

  function openGame(game: Game) {
    if (!game.comingSoon) setSelected(game);
  }

  function closeGame() {
    setSelected(null);
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: themeColors.background }}
        contentContainerStyle={{ paddingTop: 24 }}
      >
        <View style={{ ...MOBILE_STYLES.fullWidthContainer, marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing }}>
          <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.surface,
                borderRadius: MOBILE_LAYOUT.cardBorderRadius,
                paddingHorizontal: MOBILE_LAYOUT.cardPadding,
                paddingVertical: MOBILE_LAYOUT.itemSpacing,
                elevation: MOBILE_LAYOUT.buttonElevation,
                minWidth: MOBILE_LAYOUT.minTouchTarget,
                minHeight: MOBILE_LAYOUT.minTouchTarget,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => router.push('/(kids-tabs)')}
              accessibilityRole="button"
              accessibilityLabel="Go back to home"
              accessibilityHint="Return to the main kids dashboard"
            >
              <Text style={[styles.buttonLabel, { color: themeColors.text }]}>⬅️ Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.accent,
                borderRadius: MOBILE_LAYOUT.cardBorderRadius,
                paddingHorizontal: MOBILE_LAYOUT.cardPadding,
                paddingVertical: MOBILE_LAYOUT.itemSpacing,
                elevation: MOBILE_LAYOUT.buttonElevation,
                minWidth: MOBILE_LAYOUT.minTouchTarget,
                minHeight: MOBILE_LAYOUT.minTouchTarget,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setHelpModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Help and information"
              accessibilityHint="Open help guide for money games"
            >
              <Text style={[styles.buttonLabel, { color: themeColors.card }]}>❓ Help</Text>
            </TouchableOpacity>
          </View>
          <View style={MOBILE_STYLES.center}>
            <Text style={styles.title}>🎮 Play Money Games</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {(GAME_LIST as Game[]).map((game) => (
            <TouchableOpacity
              key={game.key}
              style={[styles.card, game.comingSoon && styles.cardComingSoon]}
              activeOpacity={game.comingSoon ? 1 : 0.7}
              onPress={() => openGame(game)}
              disabled={game.comingSoon}
            >
              <Ionicons
                name={game.comingSoon ? "lock-closed-outline" : "game-controller-outline"}
                size={40}
                color={game.comingSoon ? "#bbb" : "#509925"}
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.gameCardTitle}>{game.title}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
              {game.comingSoon && (
                <View style={styles.comingSoon}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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

      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={closeGame}
        transparent={true}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { height: GAME_MODAL_HEIGHT, width: width * 0.96 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selected && selected.title}
              </Text>
              <TouchableOpacity onPress={closeGame} style={styles.modalClose}>
                <Ionicons name="close-circle" size={32} color="#666" />
              </TouchableOpacity>
            </View>
            {/* Native implementation for Money Rain Catcher and Budget Dash */}
            {selected && selected.key === "money-rain-catcher" ? (
              (() => {
                const MoneyRainCatcher = require("../../components/MoneyRainCatcher").default;
                return (
                  <MoneyRainCatcher
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "budget-dash" ? (
              (() => {
                const BudgetDash = require("../../components/BudgetDash").default;
                return (
                  <BudgetDash
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "investment-bubble-pop" ? (
              (() => {
                const InvestmentBubblePop = require("../../components/InvestmentBubblePop").default;
                return (
                  <InvestmentBubblePop
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "expense-dodger" ? (
              (() => {
                const ExpenseDodger = require("../../components/ExpenseDodger").default;
                return (
                  <ExpenseDodger
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "coin-matching-frenzy" ? (
              (() => {
                const CoinMatchingFrenzy = require("../../components/CoinMatchingFrenzy").default;
                return (
                  <CoinMatchingFrenzy
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "market-rollercoaster" ? (
              (() => {
                const MarketRollercoaster = require("../../components/MarketRollercoaster").default;
                return (
                  <MarketRollercoaster
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "charity-chain-reaction" ? (
              (() => {
                const CharityChainReaction = require("../../components/CharityChainReaction").default;
                return (
                  <CharityChainReaction
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "financial-trivia-show" ? (
              (() => {
                const FinancialTriviaShow = require("../../components/FinancialTriviaShow").default;
                return (
                  <FinancialTriviaShow
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "magic-piggy-bank" ? (
              (() => {
                const MagicPiggyBank = require("../../components/MagicPiggyBank").default;
                return (
                  <MagicPiggyBank
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "dream-jar-builder" ? (
              (() => {
                const DreamJarBuilder = require("../../components/DreamJarBuilder").default;
                return (
                  <DreamJarBuilder
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "stock-market-adventure" ? (
              (() => {
                const StockMarketAdventure = require("../../components/StockMarketAdventure").default;
                return (
                  <StockMarketAdventure
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "smart-choice-game" ? (
              (() => {
                const SmartChoiceGame = require("../../components/SmartChoiceGame").default;
                return (
                  <SmartChoiceGame
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "entrepreneurs-stall" ? (
              (() => {
                const EntrepreneurStall = require("../../components/EntrepreneurStall").default;
                return (
                  <EntrepreneurStall
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "toy-market-mela" ? (
              (() => {
                const ToyMarketMela = require("../../components/ToyMarketMela").default;
                return (
                  <ToyMarketMela
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "neighbourhood-charity" ? (
              (() => {
                const NeighbourhoodCharity = require("../../components/NeighbourhoodCharity").default;
                return (
                  <NeighbourhoodCharity
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "diwali-light-savings" ? (
              (() => {
                const DiwaliLightSavings = require("../../components/DiwaliLightSavings").default;
                return (
                  <DiwaliLightSavings
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "holi-color-economics" ? (
              (() => {
                const HoliColorEconomics = require("../../components/HoliColorEconomics").default;
                return (
                  <HoliColorEconomics
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "indian-street-market" ? (
              (() => {
                const IndianStreetMarket = require("../../components/IndianStreetMarket").default;
                return (
                  <IndianStreetMarket
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "temple-donation-game" ? (
              (() => {
                const TempleDonationGame = require("../../components/TempleDonationGame").default;
                return (
                  <TempleDonationGame
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.key === "picnic-budget-challenge" ? (
              (() => {
                const PicnicBudgetChallenge = require("../../components/PicnicBudgetChallenge").default;
                return (
                  <PicnicBudgetChallenge
                    onClose={closeGame}
                  />
                );
              })()
            ) : selected && selected.type === "web" && selected.source ? (
              <WebView
                source={{ uri: selected.source }}
                style={{ flex: 1, minHeight: GAME_MODAL_HEIGHT - 52 }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                allowsFullscreenVideo={true}
                mixedContentMode="always"
                startInLoadingState={true}
                scalesPageToFit={true}
              />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="game-controller" size={64} color="#ccc" />
                <Text style={styles.placeholderText}>
                  Game loading not available yet.
                </Text>
                <Text style={styles.comingSoonText}>
                  {selected && selected.attribution}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    backgroundColor: theme?.background || "#fafbff",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: theme?.primary || "#31984b",
    marginBottom: 14,
    textAlign: "center",
    letterSpacing: 0.15
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  card: {
    width: (width - 48) / 2, // 2 cards per row with 16px padding on sides and 16px gap
    minHeight: 180,
    backgroundColor: theme?.background || "#fff",
    borderRadius: 14,
    margin: 8,
    alignItems: "center",
    padding: 18,
    elevation: 3,
    shadowColor: theme?.primary || "#5ab9a3",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardComingSoon: {
    backgroundColor: theme?.surface || "#edeef3",
  },
  title: {
    ...KIDS_TYPOGRAPHY.kidTitle,
    color: theme?.text || "#275c4d",
    textAlign: "center",
  },
  gameCardTitle: {
    ...KIDS_TYPOGRAPHY.gameCardHeader,
    color: theme?.text || "#275c4d",
    marginBottom: 4,
    textAlign: "center",
  },
  gameDescription: {
    ...KIDS_TYPOGRAPHY.gameDescription,
    color: theme?.textSecondary || "#4e4e4e",
    marginBottom: 7,
    textAlign: "center",
  },
  comingSoon: {
    marginTop: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: theme?.accent || "#f5d365",
  },
  comingSoonText: {
    ...KIDS_TYPOGRAPHY.comingSoonLabel,
    color: theme?.text || "#af8111",
    textAlign: "center"
  },
  buttonLabel: {
    ...KIDS_TYPOGRAPHY.buttonLabel,
    textAlign: "center"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  modalBox: {
    backgroundColor: theme?.background || "#fff",
    borderRadius: 14,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    padding: 10,
    justifyContent: "space-between",
  },
  modalTitle: {
    ...KIDS_TYPOGRAPHY.modalTitle,
    color: theme?.success || "#30797a",
    flex: 1,
    flexWrap: "wrap"
  },
  modalClose: {
    marginLeft: 16,
    padding: 2,
  },
  placeholderBox: {
    flex: 1,
    minHeight: GAME_MODAL_HEIGHT - 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme?.textSecondary || "#9d9d9d",
    marginTop: 8,
    marginBottom: 13,
    textAlign: "center"
  }
});

/*
====================
DEV / INTEGRATION NOTES:
- For demo, the first two games are loaded from example codesandbox links. For production, rebuild open-source HTML5 games and host (e.g., on github-pages).
- To add native/React Native games, add to GAME_LIST, set type="native", and render in modal body.
- All games should be open-source and referenced with license/attribution.
- For progressive enhancement: replace "coming soon" with real game links as built/integrated.
- Connect to Fintoosh achievement/analytics APIs for score tracking, if required.
*/
