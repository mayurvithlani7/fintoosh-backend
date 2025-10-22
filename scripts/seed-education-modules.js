const mongoose = require('mongoose');
const EducationModule = require('../models/EducationModule');
require('dotenv').config();

// Existing lessons from learn.tsx converted to EducationModule format
const existingLessons = [
  {
    title: "🐷 Piggy Bank Power!",
    category: "saving",
    difficulty: "beginner",
    description: "Saving means putting aside some of your points or money for future needs or goals. It helps you buy something special later!",
    icon: "🐷",
    color: "#FF6B6B",
    estimatedTime: 3,
    pointsReward: 25,
    content: {
      introduction: "Welcome to your savings adventure! Learning to save is like having a magical piggy bank that grows with you. Let's discover why saving is so important and how you can start building your own savings habit.",
      lessons: [
        {
          title: "What is Saving?",
          content: "Saving means putting aside money or points for future use. Instead of spending everything right away, you keep some for important things later. It's like collecting seeds to plant a money tree!",
          type: "text",
          estimatedTime: 1,
          order: 0
        },
        {
          title: "Why Save Money?",
          content: "Saving helps you reach big goals! You can save for a new bike, video games, or even help others. Every point you save brings you closer to something special.",
          type: "text",
          estimatedTime: 1,
          order: 1
        },
        {
          title: "Different Ways to Save",
          content: "You can save in different ways: putting money in a piggy bank, using a savings account, or even saving points in the app! The key is to save a little bit regularly.",
          type: "text",
          estimatedTime: 1,
          order: 2
        }
      ],
      quiz: {
        title: "Savings Quiz",
        questions: [
          {
            question: "What does saving mean?",
            type: "multiple-choice",
            options: [
              "Spending all your money right away",
              "Putting money aside for later use",
              "Giving all your money to friends"
            ],
            correctAnswer: "Putting money aside for later use",
            explanation: "Saving means keeping money for future needs or goals, not spending it all immediately."
          },
          {
            question: "Why is saving important?",
            type: "multiple-choice",
            options: [
              "To reach big goals and buy special things",
              "To make money disappear",
              "To spend less time with friends"
            ],
            correctAnswer: "To reach big goals and buy special things",
            explanation: "Saving helps you achieve important goals and buy things you really want later."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      },
      resources: [
        {
          title: "Savings Tips for Kids",
          type: "article",
          description: "Fun tips on how to start saving money"
        }
      ]
    },
    badgeReward: {
      title: "Savings Champion",
      description: "Mastered the basics of saving money!",
      icon: "🐷"
    },
    order: 1
  },
  {
    title: "🛒 Spend Smart!",
    category: "budgeting",
    difficulty: "beginner",
    description: "Spending is using your money or points to buy things you need or want right now. Always check if you can afford it!",
    icon: "🛒",
    color: "#4ECDC4",
    estimatedTime: 4,
    pointsReward: 30,
    content: {
      introduction: "Smart spending is like being a wise shopper! Learn how to make good choices with your money and points. Discover the difference between needs and wants, and how to spend responsibly.",
      lessons: [
        {
          title: "Needs vs Wants",
          content: "Needs are things you must have to live and be healthy, like food and clothes. Wants are nice things but not necessary, like toys or candy. Learning this difference helps you spend wisely!",
          type: "interactive",
          estimatedTime: 2,
          order: 0,
          interactiveData: { type: "needs-wants-sort" }
        },
        {
          title: "Planning Your Spending",
          content: "Before buying something, ask yourself: Do I really need this? Can I afford it? Is there a better way to spend my points? Planning helps you make better choices!",
          type: "text",
          estimatedTime: 1,
          order: 1
        },
        {
          title: "Comparing Prices",
          content: "Smart shoppers compare prices before buying. Sometimes waiting for a sale or finding a better deal can save you money for other things you want more.",
          type: "text",
          estimatedTime: 1,
          order: 2
        }
      ],
      quiz: {
        title: "Smart Spending Quiz",
        questions: [
          {
            question: "Which of these is a NEED?",
            type: "multiple-choice",
            options: ["Food", "Video games", "Candy"],
            correctAnswer: "Food",
            explanation: "Food is a basic need that you must have to live and be healthy."
          },
          {
            question: "What should you do before buying something?",
            type: "multiple-choice",
            options: [
              "Check if you can afford it",
              "Buy it immediately",
              "Ask for more money"
            ],
            correctAnswer: "Check if you can afford it",
            explanation: "Always check your budget and points before making a purchase."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      },
      resources: [
        {
          title: "Needs vs Wants Game",
          type: "game",
          description: "Interactive game to practice sorting needs and wants"
        }
      ]
    },
    badgeReward: {
      title: "Smart Shopper",
      description: "Learned to spend money wisely!",
      icon: "🛒"
    },
    order: 2
  },
  {
    title: "🤲 Share & Care!",
    category: "giving",
    difficulty: "beginner",
    description: "Donating is giving away some of your points or money to help others. It's a generous and kind act!",
    icon: "🤲",
    color: "#45B7D1",
    estimatedTime: 3,
    pointsReward: 25,
    content: {
      introduction: "Giving to others is one of the most wonderful things you can do! Learn how sharing your points and helping others can make the world a better place. Discover different ways to be generous and kind.",
      lessons: [
        {
          title: "Why Giving Matters",
          content: "When you give to others, you help make the world better. It can make you feel happy and help people who need it. Giving doesn't just help others - it helps you too!",
          type: "text",
          estimatedTime: 1,
          order: 0
        },
        {
          title: "Ways to Give",
          content: "You can give in many ways: sharing points with friends, donating to charities, helping others with chores, or just being kind. Every act of giving makes a difference!",
          type: "text",
          estimatedTime: 1,
          order: 1
        },
        {
          title: "How Much to Give",
          content: "You don't have to give everything! Even small amounts can help. Many people give 10% of what they earn. Find an amount that feels right for you.",
          type: "text",
          estimatedTime: 1,
          order: 2
        }
      ],
      quiz: {
        title: "Giving Quiz",
        questions: [
          {
            question: "Why is giving important?",
            type: "multiple-choice",
            options: [
              "It helps others and makes you feel good",
              "It makes money disappear",
              "It makes you spend more"
            ],
            correctAnswer: "It helps others and makes you feel good",
            explanation: "Giving helps people in need and brings joy to both the giver and receiver."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      },
      resources: [
        {
          title: "Charity Organizations for Kids",
          type: "article",
          description: "Learn about charities that help children around the world"
        }
      ]
    },
    badgeReward: {
      title: "Generous Heart",
      description: "Learned the joy of giving to others!",
      icon: "🤲"
    },
    order: 3
  },
  {
    title: "📈 How My Money Grows!",
    category: "investing",
    difficulty: "intermediate",
    description: "See the magic of compounding! Find out how your savings can grow with interest over time.",
    icon: "📈",
    color: "#96CEB4",
    estimatedTime: 5,
    pointsReward: 40,
    prerequisites: [], // Can be set after other modules are created
    content: {
      introduction: "Did you know your money can grow all by itself? Learn about interest and compounding - the magical way money multiplies over time. See how saving regularly can lead to amazing results!",
      lessons: [
        {
          title: "What is Interest?",
          content: "Interest is like a thank you from the bank for saving your money. They pay you extra money just for keeping your savings with them. It's like getting free money!",
          type: "text",
          estimatedTime: 1,
          order: 0
        },
        {
          title: "The Power of Compounding",
          content: "Compounding is when you earn interest on your interest! Over time, this creates a snowball effect where your money grows faster and faster. The longer you save, the more it grows!",
          type: "interactive",
          estimatedTime: 2,
          order: 1,
          interactiveData: { type: "compound-interest-calculator" }
        },
        {
          title: "Starting Early Matters",
          content: "The sooner you start saving, the more time your money has to grow. Even small amounts saved regularly can become large sums over many years. Time is your best friend when saving!",
          type: "text",
          estimatedTime: 1,
          order: 2
        }
      ],
      quiz: {
        title: "Money Growth Quiz",
        questions: [
          {
            question: "What is compound interest?",
            type: "multiple-choice",
            options: [
              "Earning interest on your original savings only",
              "Earning interest on both your savings and previous interest",
              "Losing money over time"
            ],
            correctAnswer: "Earning interest on both your savings and previous interest",
            explanation: "Compound interest means you earn 'interest on interest,' making your money grow faster over time."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      },
      resources: [
        {
          title: "Compound Interest Calculator",
          type: "game",
          description: "Interactive tool to see how your savings grow over time"
        }
      ]
    },
    badgeReward: {
      title: "Money Magician",
      description: "Mastered the magic of compound interest!",
      icon: "📈"
    },
    order: 4
  },
  {
    title: "🔍 Spend Smart Review",
    category: "budgeting",
    difficulty: "intermediate",
    description: "Reflect on your last purchase: was it really a need or just a want?",
    icon: "🔍",
    color: "#FFEAA7",
    estimatedTime: 3,
    pointsReward: 35,
    content: {
      introduction: "Let's take a closer look at your spending habits! Reviewing your purchases helps you understand your spending patterns and make better choices in the future. Every spending decision is a learning opportunity!",
      lessons: [
        {
          title: "Reviewing Your Purchases",
          content: "Think about your recent spending. Was each purchase a need or a want? Did you plan for it, or was it impulsive? Understanding your spending helps you make better choices.",
          type: "interactive",
          estimatedTime: 2,
          order: 0,
          interactiveData: { type: "purchase-review" }
        },
        {
          title: "Learning from Spending",
          content: "Every purchase teaches you something! If you spent on something you regret, that's okay - it helps you make better decisions next time. The goal is to spend on things that bring you real happiness.",
          type: "text",
          estimatedTime: 1,
          order: 1
        }
      ],
      quiz: {
        title: "Spending Review Quiz",
        questions: [
          {
            question: "What should you consider before making a purchase?",
            type: "multiple-choice",
            options: [
              "Is this a need or want?",
              "What color is it?",
              "How heavy is it?"
            ],
            correctAnswer: "Is this a need or want?",
            explanation: "Considering whether something is a true need or just a want helps you make better spending decisions."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      }
    },
    badgeReward: {
      title: "Spending Detective",
      description: "Became an expert at reviewing spending choices!",
      icon: "🔍"
    },
    order: 5
  },
  {
    title: "🧠 Money Quiz Time!",
    category: "general",
    difficulty: "beginner",
    description: "Take a fun quiz to test what you've learned about money!",
    icon: "🧠",
    color: "#DDA0DD",
    estimatedTime: 5,
    pointsReward: 45,
    content: {
      introduction: "Time to test your money smarts! This quiz covers everything you've learned about saving, spending, and managing money. Don't worry if you don't know all the answers - it's all about learning and having fun!",
      quiz: {
        title: "Money Master Quiz",
        questions: [
          {
            question: "Which of these is a need, not a want?",
            type: "multiple-choice",
            options: ["Food", "A video game"],
            correctAnswer: "Food",
            explanation: "Food is a basic need for living, while a video game is a want."
          },
          {
            question: "Why should you save some of your points or money?",
            type: "multiple-choice",
            options: [
              "So you can buy something special later",
              "So you can spend it all at once"
            ],
            correctAnswer: "So you can buy something special later",
            explanation: "Saving lets you reach bigger goals instead of spending everything now."
          },
          {
            question: "Which is a good example of donating?",
            type: "multiple-choice",
            options: [
              "Giving extra points to help a friend in need",
              "Buying candy for yourself"
            ],
            correctAnswer: "Giving extra points to help a friend in need",
            explanation: "Donating is using your resources to help others."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      }
    },
    badgeReward: {
      title: "Money Master",
      description: "Passed the comprehensive money quiz!",
      icon: "🧠"
    },
    order: 6
  },
  {
    title: "🔀 Sort Fun Things!",
    category: "budgeting",
    difficulty: "beginner",
    description: "Drag and drop items into the correct categories of Needs and Wants!",
    icon: "🔀",
    color: "#98D8C8",
    estimatedTime: 4,
    pointsReward: 35,
    content: {
      introduction: "Get ready for a sorting adventure! In this game, you'll practice telling the difference between needs and wants by dragging items into the right categories. It's like being a shopping detective!",
      lessons: [
        {
          title: "Needs vs Wants Game",
          content: "Drag each item to either the 'Need' basket or the 'Want' basket. Needs are things you must have, while wants are nice extras. Think carefully about each item!",
          type: "interactive",
          estimatedTime: 3,
          order: 0,
          interactiveData: {
            type: "drag-drop-game",
            items: [
              { name: "Food", category: "need" },
              { name: "Water", category: "need" },
              { name: "House", category: "need" },
              { name: "Video Game", category: "want" },
              { name: "Candy", category: "want" },
              { name: "Toy Car", category: "want" }
            ]
          }
        }
      ],
      quiz: {
        title: "Sorting Quiz",
        questions: [
          {
            question: "Which category should 'food' go in?",
            type: "multiple-choice",
            options: ["Need", "Want"],
            correctAnswer: "Need",
            explanation: "Food is essential for survival, so it's a need."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      }
    },
    badgeReward: {
      title: "Sorting Superstar",
      description: "Mastered sorting needs from wants!",
      icon: "🔀"
    },
    order: 7
  },
  {
    title: "💵 Pocket Money Magic!",
    category: "general",
    difficulty: "beginner",
    description: "Allowance is money parents give you regularly to help learn about managing money. You can decide to spend, save, donate, or invest it!",
    icon: "💵",
    color: "#F7DC6F",
    estimatedTime: 3,
    pointsReward: 30,
    content: {
      introduction: "Pocket money (or allowance) is your regular money that helps you learn about managing finances. It's like a mini salary that you can use to practice all the money skills you've learned!",
      lessons: [
        {
          title: "What is Allowance?",
          content: "Allowance is money your parents give you regularly, usually weekly or monthly. It's not 'free' money - it's a tool to help you learn about managing money responsibly.",
          type: "text",
          estimatedTime: 1,
          order: 0
        },
        {
          title: "How to Use Your Allowance",
          content: "You can divide your allowance into different money jars: some for spending now, some for saving, some for giving to others, and some for growing through investing. This helps you practice smart money management!",
          type: "text",
          estimatedTime: 1,
          order: 1
        },
        {
          title: "Earning Extra Money",
          content: "Besides allowance, you can earn extra money by doing chores, helping neighbors, or starting small jobs. This teaches you that money comes from work and effort.",
          type: "text",
          estimatedTime: 1,
          order: 2
        }
      ],
      quiz: {
        title: "Allowance Quiz",
        questions: [
          {
            question: "What is allowance used for?",
            type: "multiple-choice",
            options: [
              "Learning to manage money",
              "Buying everything you want",
              "Replacing parents' money"
            ],
            correctAnswer: "Learning to manage money",
            explanation: "Allowance is a tool for learning financial responsibility and money management skills."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      }
    },
    badgeReward: {
      title: "Allowance Expert",
      description: "Mastered managing pocket money wisely!",
      icon: "💵"
    },
    order: 8
  },
  {
    title: "🛍️ Shopper Superstar!",
    category: "budgeting",
    difficulty: "intermediate",
    description: "Smart shopping means making good choices, comparing prices, checking if something is a need or a want, and looking for deals.",
    icon: "🛍️",
    color: "#BB8FCE",
    estimatedTime: 4,
    pointsReward: 40,
    content: {
      introduction: "Become a shopping superstar! Learn advanced shopping skills like comparing prices, finding deals, and making smart purchasing decisions. Shopping smart means getting the best value for your money!",
      lessons: [
        {
          title: "Planning Before Shopping",
          content: "Make a shopping list before you go! Know what you need, how much you can spend, and what stores have the best prices. Planning prevents impulse buying and saves money.",
          type: "text",
          estimatedTime: 1,
          order: 0
        },
        {
          title: "Comparing Prices and Quality",
          content: "Don't buy the first thing you see! Compare prices at different stores, check reviews, and consider quality. Sometimes paying a little more for better quality saves money in the long run.",
          type: "text",
          estimatedTime: 1,
          order: 1
        },
        {
          title: "Finding Deals and Saving Money",
          content: "Look for sales, coupons, and discounts! Buy generic brands when they work as well. Consider buying used items or waiting for seasonal sales. Smart shoppers save money on everything they buy!",
          type: "text",
          estimatedTime: 1,
          order: 2
        },
        {
          title: "Avoiding Impulse Buys",
          content: "Wait before buying something you want but don't need. Ask yourself: Do I really need this? Can I afford it? Is there something better I could spend this money on? Taking time prevents buyer's remorse!",
          type: "text",
          estimatedTime: 1,
          order: 3
        }
      ],
      quiz: {
        title: "Smart Shopping Quiz",
        questions: [
          {
            question: "What should you do before going shopping?",
            type: "multiple-choice",
            options: [
              "Make a list and set a budget",
              "Grab all your money and go",
              "Buy whatever looks fun"
            ],
            correctAnswer: "Make a list and set a budget",
            explanation: "Planning your shopping trip with a list and budget helps you make smart purchasing decisions."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      }
    },
    badgeReward: {
      title: "Shopping Superstar",
      description: "Became a master of smart shopping!",
      icon: "🛍️"
    },
    order: 9
  },
  {
    title: "🎯 Test Your Money Smarts!",
    category: "general",
    difficulty: "intermediate",
    description: "Test yourself to see how much you've learned about saving, spending, and more!",
    icon: "🎯",
    color: "#85C1E9",
    estimatedTime: 6,
    pointsReward: 50,
    content: {
      introduction: "Ready for the ultimate money challenge? This comprehensive assessment tests everything you've learned about financial literacy. Show off your money smarts and earn your Financial Genius badge!",
      quiz: {
        title: "Money Smarts Assessment",
        questions: [
          {
            question: "What should you do before buying a toy?",
            type: "multiple-choice",
            options: [
              "Check if you have enough points/money",
              "Buy it first and worry later"
            ],
            correctAnswer: "Check if you have enough points/money",
            explanation: "Always check your balance before spending."
          },
          {
            question: "Giving points to charity is an example of:",
            type: "multiple-choice",
            options: ["Donating", "Spending"],
            correctAnswer: "Donating",
            explanation: "Donating helps others and is generous."
          },
          {
            question: "If you put all your points in spend jar, what might you have trouble with?",
            type: "multiple-choice",
            options: [
              "Saving for big goals",
              "Having fun"
            ],
            correctAnswer: "Saving for big goals",
            explanation: "You need to save for important or large expenses."
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      }
    },
    badgeReward: {
      title: "Financial Genius",
      description: "Passed the ultimate money smarts assessment!",
      icon: "🎯"
    },
    order: 10
  }
];

async function seedEducationModules() {
  try {
    console.log('🌱 Starting education modules seeding...');

    // Clear existing modules
    await EducationModule.deleteMany({});
    console.log('🧹 Cleared existing education modules');

    // Insert new modules
    const modules = await EducationModule.insertMany(existingLessons);
    console.log(`✅ Successfully seeded ${modules.length} education modules`);

    // Set up prerequisites (modules that reference other modules)
    const moneyGrowthModule = modules.find(m => m.title === "📈 How My Money Grows!");
    const savingsModule = modules.find(m => m.title === "🐷 Piggy Bank Power!");

    if (moneyGrowthModule && savingsModule) {
      moneyGrowthModule.prerequisites = [savingsModule._id];
      await moneyGrowthModule.save();
      console.log('🔗 Set prerequisites for Money Growth module');
    }

    console.log('🎉 Education modules seeding completed successfully!');
    console.log('\n📚 Available modules:');
    modules.forEach(module => {
      console.log(`  - ${module.icon} ${module.title} (${module.category}, ${module.difficulty})`);
    });

  } catch (error) {
    console.error('❌ Error seeding education modules:', error);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kid-budgeting-simulator', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('📡 Connected to MongoDB');
    return seedEducationModules();
  })
  .then(() => {
    console.log('🏁 Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedEducationModules };
