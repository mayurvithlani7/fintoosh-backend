export interface GoalTemplate {
  id: string;
  name: string;
  category: 'saving' | 'spending' | 'learning' | 'charity';
  targetAmount: number;
  duration: number; // days
  jarAllocations: {
    current: number;
    save: number;
    spend: number;
    donate: number;
    invest: number;
  };
  milestones: {
    description: string;
    targetAmount: number;
    reward?: string;
  }[];
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  recommendedAge?: string;
}

export const goalTemplates: GoalTemplate[] = [
  {
    id: 'bike-fund',
    name: 'New Bike Fund',
    category: 'saving',
    targetAmount: 5000,
    duration: 90,
    jarAllocations: {
      current: 30,
      save: 50,
      spend: 10,
      donate: 5,
      invest: 5
    },
    milestones: [
      { description: 'Save first 1,000 points', targetAmount: 1000, reward: 'Bike sticker pack' },
      { description: 'Halfway to bike!', targetAmount: 2500, reward: 'Extra screen time' },
      { description: 'Bike fund complete!', targetAmount: 5000, reward: 'New bicycle!' }
    ],
    description: 'Save up for your dream bicycle! Learn patience and delayed gratification.',
    icon: '🚲',
    difficulty: 'medium',
    recommendedAge: '8-12'
  },
  {
    id: 'vacation-fund',
    name: 'Family Vacation Fund',
    category: 'saving',
    targetAmount: 15000,
    duration: 180,
    jarAllocations: {
      current: 20,
      save: 60,
      spend: 5,
      donate: 10,
      invest: 5
    },
    milestones: [
      { description: 'Save first 3,000 points', targetAmount: 3000, reward: 'Family movie night' },
      { description: 'Halfway to vacation!', targetAmount: 7500, reward: 'Choose vacation activity' },
      { description: 'Vacation fund complete!', targetAmount: 15000, reward: 'Dream vacation!' }
    ],
    description: 'Help save for an amazing family vacation. Every contribution counts!',
    icon: '✈️',
    difficulty: 'hard',
    recommendedAge: '10-15'
  },
  {
    id: 'charity-drive',
    name: 'Help Others Fund',
    category: 'charity',
    targetAmount: 2000,
    duration: 60,
    jarAllocations: {
      current: 10,
      save: 20,
      spend: 5,
      donate: 60,
      invest: 5
    },
    milestones: [
      { description: 'Save first 500 points', targetAmount: 500, reward: 'Thank you card from charity' },
      { description: 'Halfway to helping others!', targetAmount: 1000, reward: 'Charity work visit' },
      { description: 'Donation goal reached!', targetAmount: 2000, reward: 'Charity impact certificate' }
    ],
    description: 'Save money to donate to a cause you care about. Giving feels great!',
    icon: '❤️',
    difficulty: 'easy',
    recommendedAge: '6-12'
  },
  {
    id: 'learning-books',
    name: 'Book Collection Fund',
    category: 'learning',
    targetAmount: 3000,
    duration: 75,
    jarAllocations: {
      current: 25,
      save: 40,
      spend: 20,
      donate: 10,
      invest: 5
    },
    milestones: [
      { description: 'Save for first book', targetAmount: 750, reward: 'New adventure book' },
      { description: 'Halfway to book collection!', targetAmount: 1500, reward: 'Book reading challenge' },
      { description: 'Complete book fund!', targetAmount: 3000, reward: 'Personal library!' }
    ],
    description: 'Build your own library! Save for books that will expand your mind.',
    icon: '📚',
    difficulty: 'medium',
    recommendedAge: '7-14'
  },
  {
    id: 'sports-equipment',
    name: 'Sports Gear Fund',
    category: 'saving',
    targetAmount: 4000,
    duration: 100,
    jarAllocations: {
      current: 35,
      save: 45,
      spend: 15,
      donate: 3,
      invest: 2
    },
    milestones: [
      { description: 'Save for basic equipment', targetAmount: 1000, reward: 'Sports team sticker' },
      { description: 'Halfway to sports gear!', targetAmount: 2000, reward: 'Extra practice session' },
      { description: 'Complete sports fund!', targetAmount: 4000, reward: 'Full sports equipment!' }
    ],
    description: 'Get the gear you need to excel at your favorite sport!',
    icon: '⚽',
    difficulty: 'medium',
    recommendedAge: '8-16'
  },
  {
    id: 'art-supplies',
    name: 'Art Studio Fund',
    category: 'saving',
    targetAmount: 2500,
    duration: 80,
    jarAllocations: {
      current: 30,
      save: 35,
      spend: 25,
      donate: 5,
      invest: 5
    },
    milestones: [
      { description: 'Save for basic supplies', targetAmount: 625, reward: 'Art supply starter pack' },
      { description: 'Halfway to art studio!', targetAmount: 1250, reward: 'Art class enrollment' },
      { description: 'Complete art fund!', targetAmount: 2500, reward: 'Home art studio!' }
    ],
    description: 'Create your own art studio with paints, canvases, and supplies!',
    icon: '🎨',
    difficulty: 'easy',
    recommendedAge: '6-14'
  },
  {
    id: 'emergency-fund',
    name: 'Safety Net Fund',
    category: 'saving',
    targetAmount: 10000,
    duration: 365,
    jarAllocations: {
      current: 15,
      save: 70,
      spend: 0,
      donate: 5,
      invest: 10
    },
    milestones: [
      { description: 'Save first 2,500 points', targetAmount: 2500, reward: 'Emergency kit inspection' },
      { description: 'Halfway to safety net!', targetAmount: 5000, reward: 'Financial planning session' },
      { description: 'Complete emergency fund!', targetAmount: 10000, reward: 'Peace of mind!' }
    ],
    description: 'Build a financial safety net for unexpected expenses. Smart planning!',
    icon: '🛡️',
    difficulty: 'hard',
    recommendedAge: '12-16'
  },
  {
    id: 'music-lessons',
    name: 'Music Journey Fund',
    category: 'learning',
    targetAmount: 8000,
    duration: 150,
    jarAllocations: {
      current: 20,
      save: 50,
      spend: 10,
      donate: 10,
      invest: 10
    },
    milestones: [
      { description: 'Save for first lesson', targetAmount: 2000, reward: 'Instrument practice session' },
      { description: 'Halfway to music journey!', targetAmount: 4000, reward: 'Music theory book' },
      { description: 'Complete music fund!', targetAmount: 8000, reward: 'Full music course!' }
    ],
    description: 'Learn to play an instrument! Music education builds discipline and creativity.',
    icon: '🎵',
    difficulty: 'hard',
    recommendedAge: '8-16'
  }
];

export const getTemplatesByCategory = (category: GoalTemplate['category']) => {
  return goalTemplates.filter(template => template.category === category);
};

export const getTemplatesByDifficulty = (difficulty: GoalTemplate['difficulty']) => {
  return goalTemplates.filter(template => template.difficulty === difficulty);
};

export const getTemplateById = (id: string) => {
  return goalTemplates.find(template => template.id === id);
};

export const getRecommendedTemplates = (age?: number, interests?: string[]) => {
  // This could be enhanced with more sophisticated recommendation logic
  return goalTemplates.filter(template => {
    if (age && template.recommendedAge) {
      const [min, max] = template.recommendedAge.split('-').map(Number);
      if (age < min || age > max) return false;
    }
    return true;
  });
};
