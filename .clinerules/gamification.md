# 🎮 Gamification Rules

## 🎯 Gamification Architecture

### Core Game Mechanics
```
Point System Design
├── Earning Points
│   ├── Chore Completion (+10-100 points)
│   ├── Goal Milestones (+50-500 points)
│   ├── Daily Streaks (+5-25 bonus points)
│   └── Special Achievements (+100-1000 points)
├── Spending Points
│   ├── Reward Redemption (-cost points)
│   ├── Goal Contributions (-target points)
│   └── Charity Donations (-donation points)
└── Money Jars
    ├── Current (40%) - Immediate spending
    ├── Save (35%) - Short-term goals
    ├── Donate (15%) - Charity & giving
    └── Invest (10%) - Long-term growth
```

### Achievement System
```typescript
// ✅ Achievement structure
interface Achievement {
  id: string;
  type: 'points_saved' | 'chores_completed' | 'goals_achieved' | 'learning_streak';
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  completed: boolean;
  completedAt?: Date;
  reward?: {
    points: number;
    badge: string;
    title: string;
  };
}

// ✅ Achievement categories
const ACHIEVEMENT_CATEGORIES = {
  saving: ['points_saved', 'saving_streak', 'goal_milestone'],
  chores: ['chores_completed', 'chore_streak', 'perfect_week'],
  learning: ['learning_streak', 'quiz_master', 'knowledge_sharer'],
  social: ['family_helper', 'peer_mentor', 'community_contributor'],
  special: ['first_goal', 'charity_champion', 'financial_wisdom']
};
```

## 🎪 Game Components Architecture

### Game State Management
```typescript
// ✅ Game state structure
interface GameState {
  level: number;
  score: number;
  lives: number;
  timeRemaining: number;
  achievements: Achievement[];
  powerUps: PowerUp[];
  currentStreak: number;
  bestScore: number;
}

// ✅ Game session tracking
interface GameSession {
  gameId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  score: number;
  duration: number;
  completed: boolean;
  achievements: string[];
  rewards: GameReward[];
}
```

### Reward & Progression System
```typescript
// ✅ Reward types
enum RewardType {
  POINTS = 'points',
  BADGE = 'badge',
  POWER_UP = 'power_up',
  UNLOCK = 'unlock',
  TITLE = 'title',
  STREAK_BONUS = 'streak_bonus'
}

// ✅ Progression levels
const GAME_LEVELS = [
  { level: 1, pointsRequired: 0, title: 'Beginner Saver' },
  { level: 2, pointsRequired: 100, title: 'Aspiring Saver' },
  { level: 3, pointsRequired: 500, title: 'Smart Saver' },
  { level: 4, pointsRequired: 1000, title: 'Money Master' },
  { level: 5, pointsRequired: 2500, title: 'Financial Wizard' },
  // ... more levels
];
```

## 🎨 Game UI/UX Patterns

### Visual Feedback System
```typescript
// ✅ Animation feedback
const FEEDBACK_ANIMATIONS = {
  success: {
    scale: 1.2,
    color: '#34C759',
    duration: 500,
    haptic: 'success'
  },
  error: {
    shake: true,
    color: '#FF3B30',
    duration: 300,
    haptic: 'error'
  },
  achievement: {
    bounce: true,
    particles: true,
    sound: 'achievement',
    duration: 1000
  }
};

// ✅ Sound effects
const GAME_SOUNDS = {
  coin: 'coin_collect.mp3',
  success: 'success_chime.mp3',
  error: 'error_buzz.mp3',
  achievement: 'achievement_fanfare.mp3',
  level_up: 'level_up_celebration.mp3'
};
```

### Game Component Patterns
```typescript
// ✅ Reusable game components
interface GameButtonProps {
  onPress: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  soundEffect?: keyof typeof GAME_SOUNDS;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
}

const GameButton: React.FC<GameButtonProps> = ({
  onPress,
  disabled,
  variant,
  size,
  children,
  soundEffect,
  hapticFeedback
}) => {
  const handlePress = async () => {
    // Play sound effect
    if (soundEffect && !disabled) {
      playSound(GAME_SOUNDS[soundEffect]);
    }

    // Haptic feedback
    if (hapticFeedback && !disabled) {
      await triggerHaptic(hapticFeedback);
    }

    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.button, styles[variant], styles[size]]}
    >
      {children}
    </TouchableOpacity>
  );
};
```

## 📊 Analytics & Tracking

### Game Analytics
```typescript
// ✅ Game event tracking
const trackGameEvent = (event: GameEvent) => {
  analytics.track('game_event', {
    gameId: event.gameId,
    userId: event.userId,
    eventType: event.type,
    score: event.score,
    duration: event.duration,
    level: event.level,
    achievements: event.achievements,
    timestamp: new Date()
  });
};

// ✅ Performance metrics
const GAME_METRICS = {
  averageSessionTime: 0,
  completionRate: 0,
  averageScore: 0,
  retentionRate: 0,
  difficultyBalance: 0,
  engagementScore: 0
};
```

### Learning Analytics
```typescript
// ✅ Educational effectiveness tracking
interface LearningMetrics {
  conceptsLearned: string[];
  timeSpentLearning: number;
  quizScores: number[];
  goalCompletionRate: number;
  moneyManagementSkills: {
    budgeting: number;
    saving: number;
    investing: number;
    giving: number;
  };
  behaviorChanges: {
    spendingHabits: 'improving' | 'stable' | 'declining';
    savingConsistency: number;
    financialConfidence: number;
  };
}
```

## 🎯 Achievement System Design

### Achievement Categories
```typescript
// ✅ Achievement definitions
const ACHIEVEMENTS = {
  // Saving Achievements
  first_savings: {
    id: 'first_savings',
    title: 'First Steps',
    description: 'Save your first 100 points',
    icon: '💰',
    target: 100,
    category: 'saving',
    reward: { points: 50, badge: 'saver' }
  },

  saving_streak: {
    id: 'saving_streak',
    title: 'Consistency Champion',
    description: 'Save points for 7 days in a row',
    icon: '🔥',
    target: 7,
    category: 'saving',
    reward: { points: 200, badge: 'consistent' }
  },

  // Chore Achievements
  chore_master: {
    id: 'chore_master',
    title: 'Chore Champion',
    description: 'Complete 50 chores',
    icon: '🧹',
    target: 50,
    category: 'chores',
    reward: { points: 500, badge: 'responsible' }
  },

  // Goal Achievements
  goal_achiever: {
    id: 'goal_achiever',
    title: 'Goal Getter',
    description: 'Complete 10 savings goals',
    icon: '🎯',
    target: 10,
    category: 'goals',
    reward: { points: 1000, badge: 'achiever' }
  },

  // Learning Achievements
  quiz_expert: {
    id: 'quiz_expert',
    title: 'Financial Expert',
    description: 'Score 100% on 5 quizzes',
    icon: '🧠',
    target: 5,
    category: 'learning',
    reward: { points: 300, badge: 'smart' }
  }
};
```

### Achievement Unlocking Logic
```typescript
// ✅ Achievement checking system
const checkAchievements = async (userId: string, action: UserAction) => {
  const user = await getUser(userId);
  const unlockedAchievements: Achievement[] = [];

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (!user.achievements.includes(achievement.id)) {
      let progress = 0;

      // Calculate progress based on achievement type
      switch (achievement.type) {
        case 'points_saved':
          progress = user.totalPointsSaved;
          break;
        case 'chores_completed':
          progress = user.completedChoresCount;
          break;
        case 'goals_achieved':
          progress = user.completedGoalsCount;
          break;
        case 'learning_streak':
          progress = user.currentLearningStreak;
          break;
      }

      if (progress >= achievement.target) {
        // Unlock achievement
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date(),
          progress: achievement.target
        };

        unlockedAchievements.push(unlockedAchievement);

        // Update user achievements
        await updateUserAchievements(userId, achievement.id);

        // Award points and badge
        await awardAchievementReward(userId, achievement.reward);

        // Notify user
        await sendAchievementNotification(userId, achievement);
      }
    }
  }

  return unlockedAchievements;
};
```

## 🎪 Game Difficulty & Balancing

### Adaptive Difficulty
```typescript
// ✅ Dynamic difficulty adjustment
const adjustGameDifficulty = (playerSkill: number, gameHistory: GameResult[]) => {
  const recentPerformance = gameHistory.slice(-5);
  const averageScore = recentPerformance.reduce((sum, game) => sum + game.score, 0) / recentPerformance.length;

  if (averageScore > 80) {
    // Increase difficulty
    return {
      enemySpeed: 'fast',
      obstacles: 'many',
      timeLimit: 'shorter'
    };
  } else if (averageScore < 40) {
    // Decrease difficulty
    return {
      enemySpeed: 'slow',
      obstacles: 'few',
      timeLimit: 'longer',
      hints: 'enabled'
    };
  } else {
    // Maintain current difficulty
    return {
      enemySpeed: 'normal',
      obstacles: 'normal',
      timeLimit: 'normal'
    };
  }
};
```

### Reward Balancing
```typescript
// ✅ Fair reward distribution
const calculateRewardPoints = (difficulty: number, completionTime: number, playerLevel: number) => {
  const basePoints = 100;
  const difficultyMultiplier = difficulty * 0.5; // 0.5x to 2x
  const timeBonus = Math.max(0, (300 - completionTime) / 10); // Bonus for speed
  const levelMultiplier = 1 + (playerLevel * 0.1); // 10% bonus per level

  return Math.round((basePoints + timeBonus) * difficultyMultiplier * levelMultiplier);
};
```

## 📱 Mobile Game Optimization

### Touch & Gesture Handling
```typescript
// ✅ Optimized touch interactions
const GameTouchable = ({ onPress, onSwipe, children, ...props }) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        // Touch started
        triggerHaptic('light');
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 50) onSwipe?.('right');
          else if (dx < -50) onSwipe?.('left');
        } else {
          // Vertical swipe or tap
          if (Math.abs(dy) < 10) onPress?.(); // Tap
          else if (dy > 50) onSwipe?.('down');
          else if (dy < -50) onSwipe?.('up');
        }
      }
    })
  ).current;

  return (
    <View {...panResponder.panHandlers} {...props}>
      {children}
    </View>
  );
};
```

### Performance Optimization
```typescript
// ✅ Game performance optimization
const useGameLoop = (callback: () => void, fps = 60) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        if (deltaTime >= 1000 / fps) {
          callback();
          previousTimeRef.current = time;
        }
      } else {
        previousTimeRef.current = time;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, fps]);
};
```

## 🧪 Game Testing Patterns

### Game Component Testing
```typescript
// ✅ Game interaction testing
describe('CoinMatchingFrenzy', () => {
  it('tracks correct matches', () => {
    const { getByTestId } = render(<CoinMatchingFrenzy />);

    fireEvent.press(getByTestId('coin-1'));
    fireEvent.press(getByTestId('coin-2'));

    expect(getByTestId('score')).toHaveTextContent('2');
  });

  it('handles game completion', () => {
    const onComplete = jest.fn();
    const { getByText } = render(
      <CoinMatchingFrenzy onComplete={onComplete} />
    );

    // Simulate completing all matches
    expect(onComplete).toHaveBeenCalledWith({
      score: 100,
      time: expect.any(Number),
      stars: 3,
    });
  });

  it('provides haptic feedback', () => {
    const mockHaptic = jest.fn();
    jest.mock('expo-haptics', () => ({
      impactAsync: mockHaptic
    }));

    const { getByTestId } = render(<CoinMatchingFrenzy />);
    fireEvent.press(getByTestId('coin-match'));

    expect(mockHaptic).toHaveBeenCalled();
  });
});
```

### Achievement Testing
```typescript
// ✅ Achievement system testing
describe('Achievement System', () => {
  it('unlocks first savings achievement', async () => {
    const userId = 'test-user';
    const action = { type: 'points_saved', amount: 150 };

    const achievements = await checkAchievements(userId, action);

    expect(achievements).toContainEqual(
      expect.objectContaining({
        id: 'first_savings',
        completed: true
      })
    );
  });

  it('awards achievement points', async () => {
    const userId = 'test-user';
    const achievement = ACHIEVEMENTS.first_savings;

    await awardAchievementReward(userId, achievement.reward);

    const user = await getUser(userId);
    expect(user.points).toBeGreaterThan(0);
  });
});
```

## 📈 Game Analytics & Insights

### Player Behavior Analysis
```typescript
// ✅ Game analytics tracking
const GAME_ANALYTICS = {
  trackGameStart: (gameId: string, userId: string) => {
    analytics.track('game_started', {
      gameId,
      userId,
      timestamp: new Date(),
      userLevel: getUserLevel(userId),
      deviceInfo: getDeviceInfo()
    });
  },

  trackGameProgress: (gameId: string, progress: number, score: number) => {
    analytics.track('game_progress', {
      gameId,
      progress,
      score,
      timestamp: new Date()
    });
  },

  trackGameComplete: (gameId: string, finalScore: number, duration: number, achievements: string[]) => {
    analytics.track('game_completed', {
      gameId,
      finalScore,
      duration,
      achievements,
      completionRate: calculateCompletionRate(gameId),
      timestamp: new Date()
    });
  },

  trackPlayerRetention: (userId: string, daysSinceLastPlay: number) => {
    analytics.track('player_retention', {
      userId,
      daysSinceLastPlay,
      retentionCohort: calculateRetentionCohort(daysSinceLastPlay)
    });
  }
};
```

This comprehensive gamification framework ensures engaging, educational, and rewarding game experiences that teach financial literacy through play.
