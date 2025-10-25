/**
 * Festival Calendar Configuration for Festival Finance Academy
 * Defines festival dates, themes, and module availability
 */

const FESTIVAL_CALENDAR = {
  christmas: {
    name: 'Christmas',
    theme: 'gift-planning',
    displayName: '🎄 Christmas Gift Economics',
    description: 'Plan your family\'s Secret Santa and stick to your budget!',
    icon: '🎄',
    startDate: new Date('2025-10-24'),
    endDate: new Date('2025-12-31'),
    budgetLimit: 3000, // ₹1000 virtual budget
    challenges: [
      {
        id: 'wish-list-creation',
        title: 'Create Wish Lists',
        description: 'Both parent and child create their top 3 gift wishes',
        points: 10
      },
      {
        id: 'secret-santa-assignment',
        title: 'Secret Santa Assignment',
        description: 'Get randomly assigned as Secret Santa for each other',
        points: 15
      },
      {
        id: 'budget-allocation',
        title: 'Budget Allocation Game',
        description: 'Shop for gifts within the family budget',
        points: 25
      },
      {
        id: 'charity-decision',
        title: 'Giving Back',
        description: 'Decide how to use any leftover budget',
        points: 20
      }
    ],
    rewards: {
      badge: {
        name: 'Christmas Cheer Badge',
        icon: '🎅',
        description: 'Completed the Christmas Gift Economics challenge!'
      },
      points: 70,
      virtualCoins: 50
    },
    content: {
      welcomeMessage: '🎄 Happy Christmas! This year\'s challenge: Plan your Secret Santa gifts and learn about budgeting for celebrations!',
      lessons: [
        'Planning gifts helps you think about what others really want vs. what costs more.',
        'Sticking to a budget means you can give meaningful gifts without overspending.',
        'Sometimes giving time or helping others is the best gift of all!'
      ],
      tips: [
        'Start with needs, then add wants if budget allows',
        'Compare prices and think about value for money',
        'Remember: The best gifts come from the heart!'
      ]
    }
  },

  newyear: {
    name: 'New Year',
    theme: 'resolutions',
    displayName: '🎆 New Year Resolutions Rally',
    description: 'Set your family\'s money goals for the year ahead!',
    icon: '🎆',
    startDate: new Date('2025-12-28'),
    endDate: new Date('2026-01-05'),
    challenges: [
      {
        id: 'goal-brainstorm',
        title: 'Brainstorm Goals',
        description: 'Each family member suggests 2 money goals',
        points: 15
      },
      {
        id: 'priority-voting',
        title: 'Priority Voting',
        description: 'Vote on which goals are most important',
        points: 20
      },
      {
        id: 'commitment-signing',
        title: 'Commitment Signing',
        description: 'Sign your family resolution board',
        points: 25
      },
      {
        id: 'progress-check',
        title: 'First Week Check',
        description: 'Check progress on your first resolution',
        points: 20
      }
    ],
    rewards: {
      badge: {
        name: 'Resolution Star Badge',
        icon: '⭐',
        description: 'Set meaningful family money goals for 2026!'
      },
      points: 80,
      virtualCoins: 60
    },
    content: {
      welcomeMessage: '🎆 Happy New Year! Let\'s set money goals that will make your family stronger and happier!',
      lessons: [
        'Good goals are specific, measurable, and achievable together.',
        'Family goals help everyone work toward the same dreams.',
        'Small consistent actions lead to big changes over time.'
      ],
      tips: [
        'Make goals fun and celebrate small wins',
        'Review progress regularly as a family',
        'Be flexible and adjust goals as needed'
      ]
    }
  }
};

/**
 * Get currently active festival based on current date
 */
function getActiveFestival() {
  const now = new Date();

  for (const [key, festival] of Object.entries(FESTIVAL_CALENDAR)) {
    if (now >= festival.startDate && now <= festival.endDate) {
      return { ...festival, id: key };
    }
  }

  return null;
}

/**
 * Get festival by ID
 */
function getFestivalById(festivalId) {
  return FESTIVAL_CALENDAR[festivalId] ? { ...FESTIVAL_CALENDAR[festivalId], id: festivalId } : null;
}

/**
 * Get all festivals
 */
function getAllFestivals() {
  return Object.entries(FESTIVAL_CALENDAR).map(([id, festival]) => ({
    ...festival,
    id
  }));
}

/**
 * Check if a festival is currently active
 */
function isFestivalActive(festivalId) {
  const festival = FESTIVAL_CALENDAR[festivalId];
  if (!festival) return false;

  const now = new Date();
  return now >= festival.startDate && now <= festival.endDate;
}

/**
 * Get upcoming festivals (next 30 days)
 */
function getUpcomingFestivals() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return Object.entries(FESTIVAL_CALENDAR)
    .filter(([_, festival]) => festival.startDate > now && festival.startDate <= thirtyDaysFromNow)
    .map(([id, festival]) => ({ ...festival, id }));
}

module.exports = {
  FESTIVAL_CALENDAR,
  getActiveFestival,
  getFestivalById,
  getAllFestivals,
  isFestivalActive,
  getUpcomingFestivals
};
