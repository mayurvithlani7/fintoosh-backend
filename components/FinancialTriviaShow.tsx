import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Comprehensive financial trivia questions
const TRIVIA = [
  {
    q: "You earn ₹1000. What's the BEST way to use your money?",
    options: [
      "Spend all at once",
      "Save part, spend part",
      "Donate all immediately",
      "Hide it under your bed"
    ],
    answer: 1,
    explanation: "Saving a portion and spending the rest is a balanced approach!",
  },
  {
    q: "Which of these is an 'expense'?",
    options: [
      "Earning interest",
      "Buying a new game",
      "Getting a cash gift",
      "Starting a savings account"
    ],
    answer: 1,
    explanation: "Buying something is spending—an expense!",
  },
  {
    q: "If you put ₹100 in a savings account at 5% interest, how much will you have after 1 year?",
    options: [
      "₹150",
      "₹95",
      "₹105",
      "₹1000"
    ],
    answer: 2,
    explanation: "₹100 + 5% = ₹105 after a year.",
  },
  {
    q: "What's the safest way to keep your money?",
    options: [
      "Tell everyone where you keep it",
      "Deposit in a bank",
      "Leave it at the playground",
      "Carry all your money always"
    ],
    answer: 1,
    explanation: "Banks are secure places for your money.",
  },
  {
    q: "You want a toy costing ₹500, but have only ₹200. What's a smart move?",
    options: [
      "Borrow ₹300 from everyone",
      "Save up for it",
      "Ask a stranger to buy",
      "Spend on sweets instead"
    ],
    answer: 1,
    explanation: "Saving teaches patience and goal-setting."
  },
  {
    q: "Which is the BEST example of a need?",
    options: [
      "New shoes for growing feet",
      "More phone games",
      "Chocolate cake daily",
      "Latest designer jeans"
    ],
    answer: 0,
    explanation: "Needs are essentials, like proper shoes.",
  },
  {
    q: "Investing means...",
    options: [
      "Storing coins under your pillow",
      "Buying assets hoping they'll grow",
      "Never touching your money",
      "Spending as fast as possible"
    ],
    answer: 1,
    explanation: "Investment aims for growth over time."
  },
  {
    q: "What does 'budgeting' help you do?",
    options: [
      "Spend randomly",
      "Keep track of income and spending",
      "Skip saving altogether",
      "Guess your balance always"
    ],
    answer: 1,
    explanation: "Budgeting means planning money use, not guessing.",
  },
  {
    q: "What is compound interest?",
    options: [
      "Interest paid only once",
      "Interest on both principal and accumulated interest",
      "Interest that decreases over time",
      "Interest paid by the borrower"
    ],
    answer: 1,
    explanation: "Compound interest earns 'interest on interest' for faster growth."
  },
  {
    q: "Which is generally the safest investment?",
    options: [
      "Cryptocurrency",
      "Stocks",
      "Bonds",
      "Real estate"
    ],
    answer: 2,
    explanation: "Bonds are generally safer than stocks or crypto."
  },
  {
    q: "What does 'diversification' mean in investing?",
    options: [
      "Putting all money in one stock",
      "Spreading investments across different assets",
      "Investing only in foreign markets",
      "Buying expensive investment products"
    ],
    answer: 1,
    explanation: "Diversification reduces risk by not putting all eggs in one basket."
  },
  {
    q: "What's the main purpose of an emergency fund?",
    options: [
      "To buy luxury items",
      "To cover unexpected expenses",
      "To invest in stocks",
      "To pay for vacations"
    ],
    answer: 1,
    explanation: "Emergency funds protect against financial surprises."
  },
  {
    q: "What is a credit score used for?",
    options: [
      "Calculating your height",
      "Determining loan eligibility",
      "Measuring intelligence",
      "Counting your friends"
    ],
    answer: 1,
    explanation: "Credit scores help lenders assess borrowing risk."
  },
  {
    q: "Which is better for long-term savings?",
    options: [
      "Under your mattress",
      "High-interest savings account",
      "Checking account",
      "Wallet"
    ],
    answer: 1,
    explanation: "Savings accounts earn interest and are FDIC insured."
  },
  {
    q: "What does 'APR' stand for?",
    options: [
      "Annual Payment Rate",
      "Average Purchase Rate",
      "Annual Percentage Rate",
      "Asset Protection Ratio"
    ],
    answer: 2,
    explanation: "APR shows the true cost of borrowing annually."
  },
  {
    q: "What's the benefit of paying credit card bills on time?",
    options: [
      "Higher interest rates",
      "Better credit score",
      "More debt",
      "Fewer rewards"
    ],
    answer: 1,
    explanation: "On-time payments build a strong credit history."
  },
  {
    q: "What is 'inflation'?",
    options: [
      "Money becoming more valuable",
      "Prices decreasing over time",
      "General increase in prices",
      "Banks closing early"
    ],
    answer: 2,
    explanation: "Inflation means goods cost more over time."
  },
  {
    q: "Which saves more money?",
    options: [
      "Buying brand name products",
      "Using coupons and shopping sales",
      "Buying on impulse",
      "Shopping online only"
    ],
    answer: 1,
    explanation: "Smart shopping saves money on everyday purchases."
  },
  {
    q: "What is a 'budget'?",
    options: [
      "A type of flower",
      "A plan for spending and saving money",
      "A government tax",
      "A bank account type"
    ],
    answer: 1,
    explanation: "A budget is a spending and saving plan."
  },
  {
    q: "What's the first step in creating a budget?",
    options: [
      "Buy new clothes",
      "Track your income and expenses",
      "Open more credit cards",
      "Quit your job"
    ],
    answer: 1,
    explanation: "Knowing your money flow is essential for budgeting."
  },
  {
    q: "What does 'ROI' stand for?",
    options: [
      "Return on Investment",
      "Rate of Interest",
      "Risk of Inflation",
      "Revenue on Income"
    ],
    answer: 0,
    explanation: "ROI measures investment profitability."
  },
  {
    q: "Which is a fixed expense?",
    options: [
      "Groceries",
      "Rent or mortgage payment",
      "Entertainment",
      "Clothing"
    ],
    answer: 1,
    explanation: "Fixed expenses don't change much monthly."
  },
  {
    q: "What is a 'mutual fund'?",
    options: [
      "A bank account",
      "A pool of money from many investors",
      "A type of loan",
      "A savings bond"
    ],
    answer: 1,
    explanation: "Mutual funds allow many people to invest together."
  },
  {
    q: "Why is it important to have health insurance?",
    options: [
      "To look cool",
      "To protect against high medical costs",
      "To get free medicine",
      "To avoid doctors"
    ],
    answer: 1,
    explanation: "Insurance protects against unexpected health expenses."
  },
  {
    q: "What is 'net worth'?",
    options: [
      "Your height in centimeters",
      "Assets minus liabilities",
      "Your monthly salary",
      "Bank account balance"
    ],
    answer: 1,
    explanation: "Net worth is what you own minus what you owe."
  },
  {
    q: "Which is a good reason to start saving early?",
    options: [
      "To buy more toys now",
      "Compound interest grows over time",
      "To spend more money",
      "To avoid banks"
    ],
    answer: 1,
    explanation: "Time allows compound interest to work for you."
  },
  {
    q: "What is a 'debit card'?",
    options: [
      "A credit card",
      "Spends money directly from your account",
      "A gift card",
      "A loan application"
    ],
    answer: 1,
    explanation: "Debit cards withdraw money immediately from your account."
  },
  {
    q: "Why should you avoid impulse buying?",
    options: [
      "It's too much fun",
      "It leads to unnecessary debt",
      "Stores will close",
      "Prices will drop"
    ],
    answer: 1,
    explanation: "Impulse purchases can strain your budget."
  },
  {
    q: "What is a '401(k)'?",
    options: [
      "A type of bicycle",
      "A retirement savings plan",
      "A credit card",
      "A bank account"
    ],
    answer: 1,
    explanation: "401(k)s are employer-sponsored retirement plans."
  },
  {
    q: "Which is better for everyday spending?",
    options: [
      "Savings account",
      "Checking account",
      "Investment account",
      "Retirement account"
    ],
    answer: 1,
    explanation: "Checking accounts are designed for frequent transactions."
  },
  {
    q: "What does 'FDIC insured' mean?",
    options: [
      "Your money is guaranteed safe up to certain limits",
      "The bank is very old",
      "You get free insurance",
      "Your deposits are taxed"
    ],
    answer: 0,
    explanation: "FDIC protects bank deposits up to $250,000."
  },
  {
    q: "Why is it smart to pay off high-interest debt first?",
    options: [
      "To keep more debt",
      "Because it costs less over time",
      "To avoid paying taxes",
      "To buy more things"
    ],
    answer: 1,
    explanation: "High-interest debt grows quickly and costs more."
  },
  {
    q: "What is a 'stock'?",
    options: [
      "A shopping item",
      "Ownership share in a company",
      "A type of bond",
      "A savings account"
    ],
    answer: 1,
    explanation: "Stocks represent partial ownership of companies."
  },
  {
    q: "Which is a variable expense?",
    options: [
      "Rent payment",
      "Electricity bill",
      "Car insurance",
      "Phone plan"
    ],
    answer: 1,
    explanation: "Electricity costs vary based on usage."
  },
  {
    q: "What does 'APR' include that 'interest rate' might not?",
    options: [
      "Only principal payments",
      "Fees and other charges",
      "Stock prices",
      "Bank profits"
    ],
    answer: 1,
    explanation: "APR includes all borrowing costs, not just interest."
  },
  {
    q: "Why should you have car insurance?",
    options: [
      "To drive faster",
      "To protect against accident costs",
      "To avoid traffic tickets",
      "To get free car washes"
    ],
    answer: 1,
    explanation: "Insurance covers damage and injuries from accidents."
  },
  {
    q: "What is 'identity theft'?",
    options: [
      "Forgetting your name",
      "Someone stealing your personal information",
      "Changing your address",
      "Losing your wallet"
    ],
    answer: 1,
    explanation: "Identity theft involves criminals using your information fraudulently."
  },
  {
    q: "Which is a good way to reduce monthly expenses?",
    options: [
      "Buy more subscriptions",
      "Cancel unused services",
      "Take more vacations",
      "Buy new appliances"
    ],
    answer: 1,
    explanation: "Eliminating unused services frees up money."
  },
  {
    q: "What is a 'coupon'?",
    options: [
      "A type of cookie",
      "A certificate offering a discount",
      "A bank statement",
      "A credit card"
    ],
    answer: 1,
    explanation: "Coupons help you save money on purchases."
  },
  {
    q: "Why is it important to read credit card terms?",
    options: [
      "To learn a new language",
      "To understand fees and interest rates",
      "To find the fine print",
      "To avoid the card"
    ],
    answer: 1,
    explanation: "Understanding terms prevents unexpected costs."
  },
  {
    q: "What is 'phishing'?",
    options: [
      "Fishing with a computer",
      "Scams trying to steal information",
      "A type of loan",
      "Online shopping"
    ],
    answer: 1,
    explanation: "Phishing scams trick people into revealing sensitive information."
  },
  {
    q: "Which is a benefit of having good credit?",
    options: [
      "Higher loan rates",
      "Lower loan rates",
      "More debt",
      "Fewer loan options"
    ],
    answer: 1,
    explanation: "Good credit gets you better loan terms."
  },
  {
    q: "What is a 'will'?",
    options: [
      "A type of bank",
      "Legal document distributing your assets after death",
      "A savings account",
      "A credit card"
    ],
    answer: 1,
    explanation: "A will ensures your wishes are followed after passing."
  },
  {
    q: "Why should you avoid payday loans?",
    options: [
      "They're too easy to get",
      "They have very high interest rates",
      "They last too long",
      "They require collateral"
    ],
    answer: 1,
    explanation: "Payday loans often have triple-digit interest rates."
  },
  {
    q: "What is 'financial literacy'?",
    options: [
      "Reading financial newspapers",
      "Understanding money management",
      "Counting money quickly",
      "Having lots of money"
    ],
    answer: 1,
    explanation: "Financial literacy means knowing how to manage money effectively."
  },
  {
    q: "Which is a smart way to invest for retirement?",
    options: [
      "Put everything in one stock",
      "Start early and contribute regularly",
      "Wait until you're 65",
      "Spend all savings first"
    ],
    answer: 1,
    explanation: "Starting early gives compound interest more time to work."
  },
  {
    q: "What is a 'balance transfer'?",
    options: [
      "Moving money between checking accounts",
      "Transferring credit card debt to lower rate",
      "Sending money overseas",
      "Buying a new balance"
    ],
    answer: 1,
    explanation: "Balance transfers can save money on credit card debt."
  },
  {
    q: "Why is it good to have multiple savings goals?",
    options: [
      "To spend more money",
      "To stay motivated and organized",
      "To avoid saving",
      "To confuse yourself"
    ],
    answer: 1,
    explanation: "Multiple goals keep savings focused and achievable."
  },
  {
    q: "What is 'tax deduction'?",
    options: [
      "Extra money the government gives you",
      "Amount subtracted from taxable income",
      "A type of loan",
      "Bank fee"
    ],
    answer: 1,
    explanation: "Deductions reduce the income subject to taxation."
  },
  {
    q: "Which is better for large purchases?",
    options: [
      "Credit cards with high interest",
      "Saving up first",
      "Multiple store cards",
      "Borrowing from friends"
    ],
    answer: 1,
    explanation: "Saving avoids interest charges on purchases."
  },
  {
    q: "What is 'liquidity'?",
    options: [
      "How wet something is",
      "How quickly you can access your money",
      "Bank account size",
      "Investment risk"
    ],
    answer: 1,
    explanation: "Liquidity measures how easily assets can be converted to cash."
  },
  {
    q: "Why should you keep receipts?",
    options: [
      "To start a collection",
      "To track spending and for returns/warranties",
      "To show off purchases",
      "To avoid taxes"
    ],
    answer: 1,
    explanation: "Receipts help monitor spending and resolve issues."
  },
  {
    q: "What is a 'trust fund'?",
    options: [
      "A bank account",
      "Legal arrangement holding assets for beneficiaries",
      "A type of investment",
      "A savings bond"
    ],
    answer: 1,
    explanation: "Trust funds manage assets for others' benefit."
  },
  {
    q: "Which reduces investment risk?",
    options: [
      "Putting all money in one stock",
      "Diversifying across different investments",
      "Investing only in new companies",
      "Trading frequently"
    ],
    answer: 1,
    explanation: "Diversification spreads risk across investments."
  },
  {
    q: "What is 'capital gains tax'?",
    options: [
      "Tax on salary",
      "Tax on investment profits",
      "Tax on purchases",
      "Tax on savings"
    ],
    answer: 1,
    explanation: "Capital gains tax applies to profits from selling investments."
  },
  {
    q: "Why is it smart to have an emergency fund?",
    options: [
      "To buy emergency supplies",
      "To avoid high-interest debt in crises",
      "To spend during emergencies",
      "To give to charity"
    ],
    answer: 1,
    explanation: "Emergency funds prevent costly borrowing during crises."
  },
  {
    q: "What is 'collateral'?",
    options: [
      "A type of investment",
      "Asset pledged to secure a loan",
      "Bank fee",
      "Credit score"
    ],
    answer: 1,
    explanation: "Collateral is property used to back a loan."
  },
  {
    q: "Which is a good financial habit?",
    options: [
      "Spending more than you earn",
      "Living below your means",
      "Ignoring your budget",
      "Maxing out credit cards"
    ],
    answer: 1,
    explanation: "Living below your means allows saving and reduces stress."
  },
  {
    q: "What is a 'CD' (Certificate of Deposit)?",
    options: [
      "A music album",
      "Savings account with fixed interest rate",
      "Credit card",
      "Investment fund"
    ],
    answer: 1,
    explanation: "CDs offer higher interest for leaving money deposited longer."
  },
  {
    q: "Why should you avoid late payment fees?",
    options: [
      "They're good for your credit",
      "They add unnecessary costs",
      "They help you save money",
      "They reduce your balance"
    ],
    answer: 1,
    explanation: "Late fees increase the cost of borrowing unnecessarily."
  },
  {
    q: "What is 'financial planning'?",
    options: [
      "Planning vacations",
      "Organizing your money goals and strategies",
      "Buying expensive cars",
      "Ignoring bills"
    ],
    answer: 1,
    explanation: "Financial planning helps achieve money goals."
  },
  {
    q: "Which is a benefit of compound interest?",
    options: [
      "It decreases your savings",
      "It makes your money grow faster over time",
      "It charges extra fees",
      "It reduces bank profits"
    ],
    answer: 1,
    explanation: "Compound interest earns interest on previous interest."
  },
  {
    q: "What is a 'budget variance'?",
    options: [
      "A type of budget",
      "Difference between planned and actual spending",
      "Budget size",
      "Bank account"
    ],
    answer: 1,
    explanation: "Budget variance shows where spending differs from plan."
  },
  {
    q: "Why is it important to have life insurance?",
    options: [
      "To get rich quick",
      "To protect your family's finances",
      "To avoid paying taxes",
      "To invest in stocks"
    ],
    answer: 1,
    explanation: "Life insurance provides financial security for dependents."
  },
  {
    q: "What is 'asset allocation'?",
    options: [
      "Selling all assets",
      "Distributing investments across asset types",
      "Buying only one type of investment",
      "Avoiding investments"
    ],
    answer: 1,
    explanation: "Asset allocation balances risk across investment types."
  },
  {
    q: "Which is a good debt?",
    options: [
      "Credit card debt with 25% interest",
      "Student loan for education",
      "Payday loan",
      "Car loan with 15% interest"
    ],
    answer: 1,
    explanation: "Good debt invests in future earning potential."
  },
  {
    q: "What is 'robo-advising'?",
    options: [
      "Robot financial advice",
      "Automated investment management",
      "Bank robbery",
      "Computer repair"
    ],
    answer: 1,
    explanation: "Robo-advisors use algorithms for investment management."
  },
  {
    q: "Why should you review credit reports annually?",
    options: [
      "To see how old you look",
      "To check for errors and fraud",
      "To count your debts",
      "To avoid banks"
    ],
    answer: 1,
    explanation: "Regular reviews catch identity theft and errors."
  },
  {
    q: "What is 'dollar-cost averaging'?",
    options: [
      "Buying dollars at low prices",
      "Investing fixed amounts regularly",
      "Selling investments quickly",
      "Avoiding stock market"
    ],
    answer: 1,
    explanation: "Dollar-cost averaging reduces timing risk in investing."
  },
  {
    q: "Which is better for long-term goals?",
    options: [
      "High-risk, high-reward investments",
      "Conservative, steady investments",
      "No investments",
      "Frequent trading"
    ],
    answer: 1,
    explanation: "Conservative investments preserve capital for long-term goals."
  },
  {
    q: "What is a 'bear market'?",
    options: [
      "When bears attack investors",
      "When stock prices fall 20% or more",
      "When bulls charge",
      "When markets close early"
    ],
    answer: 1,
    explanation: "Bear markets are periods of significant price declines."
  },
  {
    q: "Why is it smart to have multiple income sources?",
    options: [
      "To work harder",
      "To reduce financial risk",
      "To spend more money",
      "To avoid taxes"
    ],
    answer: 1,
    explanation: "Multiple income sources provide financial stability."
  },
  {
    q: "What is 'financial independence'?",
    options: [
      "Having lots of money",
      "Having enough income to cover expenses without working",
      "Being debt-free",
      "Having expensive possessions"
    ],
    answer: 1,
    explanation: "Financial independence means passive income covers living expenses."
  },
  {
    q: "Which reduces credit card interest costs?",
    options: [
      "Making minimum payments",
      "Paying more than minimum",
      "Using cash advances",
      "Missing payments"
    ],
    answer: 1,
    explanation: "Paying more than minimum reduces interest charges faster."
  },
  {
    q: "What is a 'bull market'?",
    options: [
      "When bulls fight",
      "When stock prices rise 20% or more",
      "When bears hibernate",
      "When markets crash"
    ],
    answer: 1,
    explanation: "Bull markets are periods of significant price increases."
  },
  {
    q: "Why should you have disability insurance?",
    options: [
      "To get sick more often",
      "To protect income if you can't work",
      "To avoid doctors",
      "To get rich"
    ],
    answer: 1,
    explanation: "Disability insurance replaces income during inability to work."
  },
  {
    q: "What is 'portfolio rebalancing'?",
    options: [
      "Selling all investments",
      "Adjusting investments to maintain target allocation",
      "Buying more of everything",
      "Ignoring investments"
    ],
    answer: 1,
    explanation: "Rebalancing maintains desired risk level as investments grow."
  },
  {
    q: "Which is a smart way to handle windfalls?",
    options: [
      "Spend it all immediately",
      "Pay off high-interest debt first",
      "Hide it",
      "Give it all away"
    ],
    answer: 1,
    explanation: "Using windfalls for debt reduction saves money long-term."
  },
  {
    q: "What is 'financial wellness'?",
    options: [
      "Having perfect health",
      "Overall financial health and security",
      "Being wealthy",
      "Having no debts"
    ],
    answer: 1,
    explanation: "Financial wellness means managing money effectively for security."
  }
];

const ROUND_SIZE = 10; // Number of questions per round
const MAX_TIME = 15; // seconds per question
const STREAK_BONUS = 2; // Bonus multiplier per correct streak step

const HOSTS = [
  { name: "Fintoosh", emoji: "👩‍💼", color: "#eca8ff" },
  { name: "Fintoosh", emoji: "👨‍🎤", color: "#90dfff" },
  { name: "Fintoosh", emoji: "🕺", color: "#ffe691" },
];

export default function FinancialTriviaShow({ onClose }: { onClose: () => void }) {
  const [shuffled, setShuffled] = useState<number[]>([]);
  const [host, setHost] = useState(() => HOSTS[Math.floor(Math.random() * HOSTS.length)]);
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(MAX_TIME);
  const [showExp, setShowExp] = useState(false);
  const [audience, setAudience] = useState<"cheer" | "boo" | "win" | null>(null);
  const [lifelines, setLifelines] = useState({ fifty: true, skip: true, hint: true });
  const [usedHint, setUsedHint] = useState(false);
  const [gameover, setGameover] = useState(false);
  const [highscore, setHighscore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Shuffle quiz and reset
    let ids = Array.from({ length: TRIVIA.length }, (_, i) => i);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffled(ids.slice(0, ROUND_SIZE));
    setQIdx(0);
    setScore(0);
    setStreak(0);
    setLifelines({ fifty: true, skip: true, hint: true });
    setUsedHint(false);
    setShowExp(false);
    setAudience(null);
    setChosen(null);
    setTimer(MAX_TIME);
    setGameover(false);
  }, [host]);

  // Question timer
  useEffect(() => {
    if (gameover || showExp) return;
    if (timer <= 0) {
      setShowExp(true);
      setAudience("boo");
      setTimeout(() => nextQuestion(false), 1800);
    } else {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
      return () => clearTimeout(timerRef.current!);
    }
  }, [timer, showExp, gameover, qIdx]);

  // Lifeline logic (50/50, skip, hint)
  function lifelineFifty() {
    setLifelines(l => ({ ...l, fifty: false }));
    setUsedHint(true);
  }
  function lifelineSkip() {
    setLifelines(l => ({ ...l, skip: false }));
    setAudience("cheer");
    nextQuestion(false);
  }
  function lifelineHint() {
    setLifelines(l => ({ ...l, hint: false }));
    setUsedHint(true);
  }
  // Answer selection and streak logic
  function chooseAnswer(opt: number) {
    if (showExp || chosen !== null) return;
    setChosen(opt);
    setShowExp(true);
    // Audience/host reactions
    if (opt === TRIVIA[shuffled[qIdx]].answer) {
      setAudience("cheer");
      setScore(s => s + 100 + streak * 25);
      setStreak(s => s + 1);
    } else {
      setAudience("boo");
      setStreak(0);
    }
    setTimeout(() => nextQuestion(opt === TRIVIA[shuffled[qIdx]].answer), 1850);
  }

  // Progression
  function nextQuestion(correct: boolean) {
    setChosen(null);
    setShowExp(false);
    setAudience(correct ? "cheer" : "boo");
    setUsedHint(false);
    setTimer(MAX_TIME);
    setQIdx(i => {
      if (i + 1 >= ROUND_SIZE) {
        setGameover(true);
        setHighscore(h => Math.max(h, score));
        setAudience("win");
        return i;
      }
      return i + 1;
    });
  }

  function restart() {
    const newHost = HOSTS[Math.floor(Math.random() * HOSTS.length)];
    setHost(newHost);
    // Explicitly reset all state
    let ids = Array.from({ length: TRIVIA.length }, (_, i) => i);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffled(ids.slice(0, ROUND_SIZE));
    setQIdx(0);
    setScore(0);
    setStreak(0);
    setLifelines({ fifty: true, skip: true, hint: true });
    setUsedHint(false);
    setShowExp(false);
    setAudience(null);
    setChosen(null);
    setTimer(MAX_TIME);
    setGameover(false);
  }

  // Current Q
  const currQ = shuffled.length > 0 ? TRIVIA[shuffled[qIdx]] : null;

  // Fifty-fifty logic
  let hiddenOpts: number[] = [];
  if (usedHint && lifelines.fifty === false && currQ) {
    let correct = currQ.answer;
    hiddenOpts = [];
    while (hiddenOpts.length < 2) {
      let rnd = Math.floor(Math.random() * 4);
      if (rnd !== correct && !hiddenOpts.includes(rnd)) hiddenOpts.push(rnd);
    }
  }

  // Hint logic
  let hintText: string | null = usedHint && lifelines.hint === false && currQ
      ? "HINT: " + currQ.options[currQ.answer][0] + "..." : null;

  // Render
  if (shuffled.length === 0 || !currQ) {
    return (
      <View style={styles.container}>
        <View style={styles.hostWrap}>
          <Text style={[styles.hostEmoji, { backgroundColor: host.color }]}>{host.emoji}</Text>
          <Text style={styles.hostName}>{host.name} the Host</Text>
        </View>
        <View style={styles.questionCard}>
          <Ionicons name="hourglass-outline" size={40} color="#20be97" />
          <Text style={styles.question}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hostWrap}>
        <Text style={[styles.hostEmoji, { backgroundColor: host.color }]}>{host.emoji}</Text>
        <Text style={styles.hostName}>{host.name} the Host</Text>
      </View>
      {/* Audience reactions */}
      {audience === "cheer" && <Text style={styles.crowd}>👏👏 Awesome! 👏👏</Text>}
      {audience === "boo" && <Text style={styles.crowd}>😯 Oh no! Try next one!</Text>}
      {audience === "win" && <Text style={styles.crowd}>🏆 FINISHED! 🏆</Text>}
      <View style={styles.questionCard}>
        <Text style={styles.qnum}>Question {qIdx + 1}/{ROUND_SIZE}</Text>
        <Text style={styles.question}>{currQ.q}</Text>
        <View style={styles.optionsWrap}>
          {currQ.options.map((opt, idx) => {
            if (hiddenOpts.includes(idx)) return null;
            let btnStyle = [styles.optionBtn];
            if (chosen === idx)
              btnStyle.push(idx === currQ.answer ? styles.btnCorrect : styles.btnWrong);
            else if (showExp && idx === currQ.answer)
              btnStyle.push(styles.btnCorrect);
            return (
              <TouchableOpacity
                key={idx}
                style={btnStyle}
                onPress={() => chooseAnswer(idx)}
                disabled={chosen !== null || showExp}
              >
                <Ionicons
                  name={
                    showExp
                      ? idx === currQ.answer
                        ? "checkmark-circle"
                        : chosen === idx
                        ? "close-circle"
                        : "ellipse"
                      : "ellipse-outline"
                  }
                  size={23}
                  color={
                    showExp
                      ? idx === currQ.answer
                        ? "#39d233"
                        : chosen === idx
                        ? "#e43e49"
                        : "#999"
                      : "#b7b7b7"
                  }
                  style={{ marginRight: 7 }}
                />
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {/* Lifeline bar */}
      <View style={styles.lifelineBar}>
        <TouchableOpacity
          style={[styles.lifelineBtn, !lifelines.fifty && styles.lifelineUsed]}
          onPress={lifelineFifty}
          disabled={!lifelines.fifty || showExp}
        >
          <Ionicons name="remove-circle-outline" size={21} color="#b5a233" />
          <Text style={styles.lifelineText}>50/50</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.lifelineBtn, !lifelines.skip && styles.lifelineUsed]}
          onPress={lifelineSkip}
          disabled={!lifelines.skip || showExp}
        >
          <Ionicons name="arrow-forward" size={21} color="#3b46aa" />
          <Text style={styles.lifelineText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.lifelineBtn, !lifelines.hint && styles.lifelineUsed]}
          onPress={lifelineHint}
          disabled={!lifelines.hint || showExp}
        >
          <Ionicons name="bulb-outline" size={20} color="#209a78" />
          <Text style={styles.lifelineText}>Hint</Text>
        </TouchableOpacity>
      </View>
      {hintText && <Text style={styles.hintText}>{hintText}</Text>}
      {/* Timer */}
      <View style={styles.timerBar}>
        <Ionicons name="alarm" size={15} color="#1b409a" />
        <Text style={styles.timerVal}>{timer}s</Text>
      </View>
      <Text style={styles.score}>
        Score: {score} | Streak: {streak} | High Score: {highscore}
      </Text>
      {/* End-game modal */}
      {gameover && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>
            {score === ROUND_SIZE * 100 ? "🎉 PERFECT GAME!" : score >= 800 ? "Great Job!" : "More practice!"}
          </Text>
          <Text style={styles.modalScore}>Round Score: {score}</Text>
          <Text style={styles.modalScore}>Longest Streak: {streak}</Text>
          <Text style={styles.modalScore}>High Score: {highscore}</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={restart}>
            <Ionicons name="reload" size={20} color="#219a6b" />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginLeft: 8 }}>
              New Round
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: "#efe1ab" }]}
            onPress={onClose}
          >
            <Ionicons name="exit-outline" size={22} color="#a29237" />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                color: "#bf9c3d",
                marginLeft: 7,
              }}
            >
              Back to Games
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fff9",
    alignItems: "center",
    paddingTop: 18,
    paddingHorizontal: 4,
  },
  hostWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 3,
    marginTop: 3,
  },
  hostEmoji: {
    fontSize: 37,
    marginRight: 6,
    padding: 9,
    borderRadius: 19,
    backgroundColor: "#e8fdb7",
  },
  hostName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1b409a",
    marginRight: 2,
  },
  crowd: {
    color: "#a592e7",
    fontSize: 17,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 0,
  },
  questionCard: {
    backgroundColor: "#e9ffd5",
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#d3e6b9",
    padding: 19,
    margin: 4,
    width: "98%",
    alignSelf: "center",
    alignItems: "center",
    elevation: 3,
  },
  qnum: {
    fontWeight: "900",
    fontSize: 15,
    color: "#b0996d",
    marginBottom: 2,
  },
  question: {
    fontWeight: "700",
    fontSize: 18,
    color: "#20be97",
    marginBottom: 7,
    textAlign: "center",
    letterSpacing: 0.18,
  },
  optionsWrap: {
    width: "100%",
    marginTop: 2,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 11,
    paddingVertical: 11,
    paddingHorizontal: 9,
    marginVertical: 3,
    elevation: 2.3,
    shadowColor: "#229c6b44",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#195c4a",
    letterSpacing: 0.09,
  },
  btnCorrect: {
    backgroundColor: "#deffde",
    borderColor: "#22c91d",
    borderWidth: 2,
  },
  btnWrong: {
    backgroundColor: "#ffe0e6",
    borderColor: "#eb2b40",
    borderWidth: 2,
  },
  lifelineBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginVertical: 8,
  },
  lifelineBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f9ff",
    borderRadius: 19,
    paddingVertical: 6,
    paddingHorizontal: 16,
    elevation: 1.2,
    borderWidth: 1,
    borderColor: "#e3e5f7",
  },
  lifelineUsed: {
    backgroundColor: "#efefef",
    opacity: 0.6,
  },
  lifelineText: {
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 7,
    color: "#62799a"
  },
  hintText: {
    color: "#b68d18",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  timerVal: {
    fontWeight: "bold",
    color: "#e79721",
    fontSize: 17,
    marginLeft: 5,
  },
  score: {
    marginTop: 6,
    fontSize: 15,
    color: "#45637d",
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "center"
  },
  modal: {
    position: "absolute",
    top: "27%",
    left: "13%",
    width: "74%",
    backgroundColor: "#fffae7de",
    borderRadius: 22,
    alignItems: "center",
    padding: 30,
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#efdc68",
    elevation: 8,
  },
  modalTitle: {
    fontSize: 25,
    color: "#e39738",
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center"
  },
  modalScore: {
    fontSize: 16,
    marginBottom: 7,
    color: "#267f64",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e2fbe9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 12,
    elevation: 2,
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 4,
  },
});
