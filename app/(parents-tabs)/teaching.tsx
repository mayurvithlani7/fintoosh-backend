import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ParentsTeachingScreen() {
  const { themeColors } = useTheme();
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [discussionStarters, setDiscussionStarters] = useState<any[]>([]);
  const [familyDiscussions, setFamilyDiscussions] = useState<any[]>([]);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [availableChildren, setAvailableChildren] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [familyTimeline, setFamilyTimeline] = useState<any>(null);
  const [dreamBoard, setDreamBoard] = useState<any>(null);
  const [showElderModal, setShowElderModal] = useState(false);
  const [showEventSelection, setShowEventSelection] = useState(false);
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [showChildSelection, setShowChildSelection] = useState(false);
  const [starterOffset, setStarterOffset] = useState(0);
  const [teachingMilestones, setTeachingMilestones] = useState<any[]>([
    {
      id: '1',
      title: 'First Money Talk',
      description: 'Started your first family discussion about money',
      achieved: false,
      progress: 0,
      maxProgress: 1,
      date: null,
      category: 'discussions'
    },
    {
      id: '2',
      title: 'Goal Setting Guide',
      description: 'Helped child set their first savings goal',
      achieved: false,
      progress: 0,
      maxProgress: 1,
      date: null,
      category: 'goals'
    },
    {
      id: '3',
      title: 'Weekly Habit',
      description: 'Had money discussions for 7 days in a row',
      achieved: false,
      progress: 0,
      maxProgress: 7,
      date: null,
      category: 'consistency'
    },
    {
      id: '4',
      title: 'Parent Guide Explorer',
      description: 'Read 3 different parent teaching guides',
      achieved: false,
      progress: 0,
      maxProgress: 3,
      date: null,
      category: 'learning'
    },
    {
      id: '5',
      title: 'Discussion Logger',
      description: 'Logged 5 family money discussions',
      achieved: false,
      progress: 0,
      maxProgress: 5,
      date: null,
      category: 'tracking'
    }
  ]);

  // Discussion form state
  const [discussionForm, setDiscussionForm] = useState({
    childId: '',
    topic: 'daily-spending',
    customTopic: '',
    duration: '15',
    keyLearnings: '',
    mood: 'good',
    notes: ''
  });

  // Dream form state
  const [dreamForm, setDreamForm] = useState({
    title: '',
    targetAmount: '',
    monthlyCommitment: '',
    category: 'vacation',
    description: '',
    deadline: ''
  });

  // Timeline form state
  const [timelineForm, setTimelineForm] = useState({
    age: '',
    year: '',
    event: '',
    customEvent: '',
    description: '',
    amount: '',
    icon: '✨'
  });

  // Update form helper
  const updateForm = (field: string, value: string) => {
    setDiscussionForm(prev => ({ ...prev, [field]: value }));
  };

  // Update dream form helper
  const updateDreamForm = (field: string, value: string) => {
    setDreamForm(prev => ({ ...prev, [field]: value }));
  };

  // Parent Guides - Static content for MVP
  const parentGuides = [
    {
      id: 'talk-about-money',
      title: '💬 How to Talk About Money',
      icon: '💬',
      content: `Start conversations naturally during everyday moments:
• "How much do you think that toy costs?"
• "What would you buy if you had ₹100?"
• "Why do we save some money for later?"

Make it positive and educational, not judgmental. Use real-life examples from your family's experiences.`,
    },
    {
      id: 'explain-saving',
      title: '🐷 Explain Saving Simply',
      icon: '🐷',
      content: `Use stories and examples your child understands:
• "Saving is like collecting rainwater in a pot for when it doesn't rain"
• "It's keeping some candy for tomorrow instead of eating it all today"
• "Money in the bank grows slowly, like a plant growing taller"

Show them their savings jar filling up over time.`,
    },
    {
      id: 'needs-vs-wants',
      title: '🔀 Teach Needs vs. Wants',
      icon: '🔀',
      content: `Help them distinguish between essentials and extras:
Needs: Food, clothes, shelter, education
Wants: Toys, games, extra snacks, entertainment

Ask: "Do we need this to live healthy and safe?" Use shopping trips as teaching moments.`,
    },
    {
      id: 'weekly-discussions',
      title: '📅 Set Up Weekly Money Talks',
      icon: '📅',
      content: `Make money discussions a regular family habit:
• Pick a consistent time (Sunday dinner, car rides)
• Keep it short and positive (10-15 minutes)
• Focus on one topic per week
• End with a specific action or goal

Celebrate progress and learning together.`,
    },
    {
      id: 'goal-setting',
      title: '🎯 Guide Goal Setting',
      icon: '🎯',
      content: `Help them set SMART goals:
Specific: "Save for a cricket bat" not "save for sports stuff"
Measurable: "Save ₹500" with a progress tracker
Achievable: Break big goals into smaller steps
Relevant: Something they really want
Time-bound: "By Diwali" or "In 3 months"

Celebrate milestones along the way!`,
    },
    {
      id: 'responsibility',
      title: '⭐ Teach Money Responsibility',
      icon: '⭐',
      content: `Connect money lessons to character development:
• "Responsible people plan ahead"
• "Caring people think about others' needs"
• "Wise people learn from mistakes"

Praise effort and learning, not just perfect decisions. Everyone makes money mistakes - it's how we learn!`,
    },
  ];

  // Discussion Starters - Daily prompts for family talks
  const discussionStartersData = [
    { id: '1', prompt: 'What\'s one thing you bought this week? Was it a need or a want?', category: 'Daily' },
    { id: '2', prompt: 'If you found ₹100 on the street, what would you do with it?', category: 'Values' },
    { id: '3', prompt: 'Why do you think some families have more money than others?', category: 'Society' },
    { id: '4', prompt: 'How much do you think it costs to run our home each month?', category: 'Reality' },
    { id: '5', prompt: 'What\'s something you want to save for? How will you do it?', category: 'Planning' },
    { id: '6', prompt: 'How does advertising make us want to buy things?', category: 'Media' },
    { id: '7', prompt: 'What\'s the difference between borrowing and buying?', category: 'Credit' },
  ];

  useEffect(() => {
    // Set demo children immediately for testing
    const demoChildren = [
      { id: 'demo-child-1', name: 'Alex', age: 10 },
      { id: 'demo-child-2', name: 'Emma', age: 8 },
      { id: 'demo-child-3', name: 'Ryan', age: 12 }
    ];
    console.log('Setting demo children:', demoChildren);
    setAvailableChildren(demoChildren);
    setSelectedChild(demoChildren[0]);
    console.log('Demo children set, availableChildren should now be:', demoChildren.length);

    loadCurrentUser();
    loadTeachingData();
    loadStoredData(); // Load data from AsyncStorage first
    loadMilestonesFromStorage(); // Load milestones from storage
  }, []);

  // Debug: Log whenever availableChildren changes
  useEffect(() => {
    console.log('availableChildren changed:', availableChildren);
    console.log('availableChildren length:', availableChildren.length);
  }, [availableChildren]);

  // Load database data when user and real children are loaded
  useEffect(() => {
    if (currentUser && selectedChild && !selectedChild.id.startsWith('demo-')) {
      console.log('User and real child loaded, attempting to load database data');
      loadFromDatabase();
    }
  }, [currentUser, selectedChild]);

  // Load current user and family data
  const loadCurrentUser = async () => {
    try {
      // Load auth token and user from AsyncStorage (set during login)
      const [token, userData] = await Promise.all([
        getAuthToken(),
        AsyncStorage.getItem('user')
      ]);

      console.log('🔐 Loading user data:', { hasToken: !!token, hasUserData: !!userData });

      if (token && userData) {
        const user = JSON.parse(userData);
        console.log('✅ Parsed authenticated user:', user);
        setCurrentUser(user);

        // Load family's children with real authentication
        await loadRealChildren(user.familyId, token);
      } else {
        console.log('⚠️ No authentication data found, using demo mode');
        // Use demo user for testing (no real auth)
        const demoUser = {
          id: 'demo-parent',
          name: 'Demo Parent',
          familyId: 'demo-family',
          role: 'parent'
        };
        setCurrentUser(demoUser);
        await loadDemoChildren();
      }
    } catch (error) {
      console.error('💥 Error loading current user:', error);
      // Fallback to demo user
      const demoUser = {
        id: 'demo-parent',
        name: 'Demo Parent',
        familyId: 'demo-family',
        role: 'parent'
      };
      setCurrentUser(demoUser);
      await loadDemoChildren();
    }
  };

  // Load real children from database with authentication
  const loadRealChildren = async (familyId: string, token: string) => {
    try {
      console.log('🔄 Loading real children from database...');

      const response = await fetch(`${API_URL}/users?familyId=${familyId}&role=child`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('📡 API response status:', response.status);

      if (response.ok) {
        const children = await response.json();
        console.log('✅ Loaded real children from API:', children);

        if (children && children.length > 0) {
          setAvailableChildren(children);
          // Always set the first real child when real children are loaded
          setSelectedChild(children[0]);
          console.log('✅ Set selectedChild to real child:', children[0].id);
        } else {
          console.log('⚠️ No children found in database, using demo children');
          await loadDemoChildren();
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API error loading children:', response.status, errorText);
        await loadDemoChildren();
      }
    } catch (error) {
      console.error('💥 Error loading real children:', error);
      await loadDemoChildren();
    }
  };

  // Load demo children for testing/fallback
  const loadDemoChildren = async () => {
    try {
      console.log('🔄 Loading demo children for testing...');

      const demoChildren = [
        { id: 'demo-child-1', name: 'Alex', age: 10 },
        { id: 'demo-child-2', name: 'Emma', age: 8 },
        { id: 'demo-child-3', name: 'Ryan', age: 12 }
      ];

      setAvailableChildren(demoChildren);
      if (!selectedChild) {
        setSelectedChild(demoChildren[0]);
      }

      console.log('✅ Demo children loaded:', demoChildren.length, 'children');
    } catch (error) {
      console.error('💥 Error loading demo children:', error);
    }
  };

  // Load family's children (legacy function for backward compatibility)
  const loadFamilyChildren = async (familyId: string, token?: string) => {
    if (token) {
      await loadRealChildren(familyId, token);
    } else {
      await loadDemoChildren();
    }
  };

  // Load stored data from AsyncStorage immediately
  const loadStoredData = async () => {
    try {
      console.log('Loading stored data from AsyncStorage...');

      // Load discussions from AsyncStorage
      const savedDiscussions = await AsyncStorage.getItem('familyDiscussions');
      if (savedDiscussions) {
        const discussionsData = JSON.parse(savedDiscussions);
        console.log('Loaded discussions from AsyncStorage:', discussionsData.length);
        setFamilyDiscussions(discussionsData);
      }

      // Load dreamboard from AsyncStorage
      const savedDreamBoard = await AsyncStorage.getItem('dreamBoard');
      if (savedDreamBoard) {
        const dreamBoardData = JSON.parse(savedDreamBoard);
        console.log('Loaded dreamboard from AsyncStorage:', dreamBoardData.items?.length || 0, 'items');
        setDreamBoard(dreamBoardData);
      }

      // Load family timeline from AsyncStorage
      const savedTimeline = await AsyncStorage.getItem('familyTimeline');
      if (savedTimeline) {
        const timelineData = JSON.parse(savedTimeline);
        console.log('Loaded timeline from AsyncStorage:', timelineData.timeline?.length || 0, 'entries');
        setFamilyTimeline(timelineData);
      }

      console.log('Finished loading stored data');
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  // Load data from database (when user is logged in)
  const loadFromDatabase = async () => {
    if (!currentUser) return;

    try {
      const token = await getAuthToken();
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log('Loading data from database for user:', currentUser.id);

      // Load discussions from database
      const discussionsResponse = await fetch(`${API_URL}/family-discussions/${currentUser.familyId}`, {
        method: 'GET',
        headers,
      });

      if (discussionsResponse.ok) {
        const discussionsData = await discussionsResponse.json();
        if (discussionsData && discussionsData.length > 0) {
          console.log('Loaded discussions from database:', discussionsData.length);
          setFamilyDiscussions(discussionsData);
          // Also save to AsyncStorage as backup
          AsyncStorage.setItem('familyDiscussions', JSON.stringify(discussionsData));
        }
      }

      // Load dreamboard from database (if endpoint exists)
      // For now, rely on AsyncStorage for dreamboard persistence

      // Load family timeline from database
      if (selectedChild && selectedChild.id) {
        console.log('Loading timeline for child:', selectedChild.id, 'in family:', currentUser.familyId);
        const timelineResponse = await fetch(`${API_URL}/family-timeline/${currentUser.familyId}/${selectedChild.id}`, {
          method: 'GET',
          headers,
        });

        console.log('Timeline API response status:', timelineResponse.status);
        if (timelineResponse.ok) {
          const timelineData = await timelineResponse.json();
          console.log('Loaded timeline data from database:', timelineData);
          if (timelineData) {
            setFamilyTimeline(timelineData);
            AsyncStorage.setItem('familyTimeline', JSON.stringify(timelineData));
          }
        } else {
          const errorText = await timelineResponse.text();
          console.error('Timeline API error:', timelineResponse.status, errorText);
          // Don't show error to user - timeline is optional feature
        }
      } else {
        console.log('No selected child available for timeline loading');
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
      // Data already loaded from AsyncStorage, so no fallback needed
    }
  };

  // Fallback to local storage if database unavailable
  const loadFromLocalStorage = async () => {
    try {
      const savedMilestones = await AsyncStorage.getItem('teachingMilestones');
      if (savedMilestones) {
        setTeachingMilestones(JSON.parse(savedMilestones));
      }

      const savedDiscussions = await AsyncStorage.getItem('familyDiscussions');
      if (savedDiscussions) {
        setFamilyDiscussions(JSON.parse(savedDiscussions));
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
  };

  // Load milestones from backend database and AsyncStorage
  const loadMilestonesFromStorage = async () => {
    try {
      console.log('🔄 Loading milestones...');

      // First try to load from backend if user is authenticated
      if (currentUser && selectedChild) {
        try {
          const token = await getAuthToken();
          if (token) {
            console.log('📡 Loading milestones from backend database...');
            const response = await fetch(
              `${API_URL}/parent-milestones/${currentUser.id}/${selectedChild.id}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
              }
            );

            console.log('📡 Backend response status:', response.status);

            if (response.ok) {
              const backendMilestones = await response.json();
              console.log('✅ Loaded milestones from backend:', backendMilestones);

              if (backendMilestones && backendMilestones.length > 0) {
                // Merge with default milestones to ensure all types exist
                const defaultMilestones = teachingMilestones.map(defaultMilestone => {
                  const backendMilestone = backendMilestones.find((bm: any) => bm.milestoneId === defaultMilestone.id);
                  if (backendMilestone) {
                    return {
                      ...defaultMilestone,
                      achieved: backendMilestone.achieved,
                      progress: backendMilestone.progress,
                      date: backendMilestone.achievedAt ? new Date(backendMilestone.achievedAt).toISOString().split('T')[0] : null
                    };
                  }
                  return defaultMilestone;
                });

                console.log('🔄 Setting milestones from backend...');
                setTeachingMilestones(defaultMilestones);

                // Save merged data to AsyncStorage as backup
                await AsyncStorage.setItem('teachingMilestones', JSON.stringify(defaultMilestones));
                console.log('✅ Milestones loaded from backend and saved to AsyncStorage');
                return;
              }
            } else {
              console.log('⚠️ Backend milestone load failed, falling back to AsyncStorage');
            }
          }
        } catch (backendError) {
          console.error('❌ Error loading from backend:', backendError);
        }
      }

      // Fallback to AsyncStorage
      console.log('📱 Loading milestones from AsyncStorage...');
      const savedMilestones = await AsyncStorage.getItem('teachingMilestones');
      console.log('📄 Raw saved milestones from AsyncStorage:', savedMilestones);

      if (savedMilestones) {
        const parsedMilestones = JSON.parse(savedMilestones);
        console.log('✅ Parsed milestones from AsyncStorage:', parsedMilestones);
        setTeachingMilestones(parsedMilestones);
      } else {
        console.log('❌ No milestones found in AsyncStorage - using defaults');
        // Initialize with default milestones if none exist
        const defaultMilestones = teachingMilestones.map(m => ({ ...m })); // Copy defaults
        setTeachingMilestones(defaultMilestones);
        await AsyncStorage.setItem('teachingMilestones', JSON.stringify(defaultMilestones));
      }

      console.log('✅ Milestones loaded from AsyncStorage');
    } catch (error) {
      console.error('💥 Error loading milestones:', error);
    }
  };

  // Save milestones to database and AsyncStorage
  const saveMilestonesToDatabase = async (milestones: any[]) => {
    try {
      // Always save to AsyncStorage first for immediate persistence
      await AsyncStorage.setItem('teachingMilestones', JSON.stringify(milestones));
      console.log('Milestones saved to AsyncStorage:', milestones.length, 'milestones');

      // If user is authenticated, also save to backend database
      if (currentUser && currentUser.id && selectedChild) {
        try {
            const token = await getAuthToken();
          if (token) {
            console.log('Saving milestones to backend database...');

            // Save each milestone to backend
            for (const milestone of milestones) {
              await fetch(`${API_URL}/parent-milestones/${currentUser.id}/${selectedChild.id}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  milestoneId: milestone.id,
                  title: milestone.title,
                  achieved: milestone.achieved,
                  progress: milestone.progress,
                  date: milestone.date,
                  category: milestone.category,
                  familyId: currentUser.familyId
                }),
              });
            }

            console.log('✅ Milestones saved to backend database');
          }
        } catch (backendError) {
          console.error('❌ Error saving to backend (continuing with local storage):', backendError);
          // Continue with AsyncStorage only - don't fail the operation
        }
      }
    } catch (error) {
      console.error('Error saving milestones:', error);
    }
  };

  // Save discussions to database and AsyncStorage
  const saveDiscussionsToDatabase = async (discussions: any[]) => {
    // Always save to AsyncStorage first for immediate persistence
    try {
      await AsyncStorage.setItem('familyDiscussions', JSON.stringify(discussions));
      console.log('Discussions saved to AsyncStorage:', discussions.length);
    } catch (storageError) {
      console.error('Error saving discussions to AsyncStorage:', storageError);
    }

    // Try to save to database if user is logged in
    if (!currentUser) return;

    try {
      for (const discussion of discussions) {
        await fetch(`${API_URL}/family-discussions/${currentUser.familyId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...discussion,
            familyId: currentUser.familyId,
            parentId: currentUser.id
          }),
        });
      }
      console.log('Discussions saved to database');
    } catch (error) {
      console.error('Error saving discussions to database:', error);
      // Data already saved to AsyncStorage, so no additional fallback needed
    }
  };

  // Save timeline to database
  const saveTimelineToDatabase = async (timelineData: any) => {
    if (!currentUser || !selectedChild) return;

    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available for timeline save');
        return;
      }

      // First, get the existing timeline to ensure it exists and get its ID
      const getResponse = await fetch(`${API_URL}/family-timeline/${currentUser.familyId}/${selectedChild.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!getResponse.ok) {
        console.error('Failed to get timeline:', getResponse.status);
        return;
      }

      const existingTimeline = await getResponse.json();

      // Now update the timeline using PATCH with the timeline ID
      const patchResponse = await fetch(`${API_URL}/family-timeline/${existingTimeline._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          timeline: timelineData.timeline
        }),
      });

      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        console.error('Failed to update timeline:', patchResponse.status, errorText);
        return;
      }

      console.log('Timeline updated successfully in database');
    } catch (error) {
      console.error('Error saving timeline to database, using local storage:', error);
    }

    // Always save to AsyncStorage as backup
    try {
      await AsyncStorage.setItem('familyTimeline', JSON.stringify(timelineData));
      console.log('Timeline saved to AsyncStorage:', timelineData);
    } catch (storageError) {
      console.error('Error saving timeline to AsyncStorage:', storageError);
    }
  };

  const loadTeachingData = async () => {
    try {
      // For MVP, use static data. Later integrate with backend milestones
      setMilestones([
        { id: '1', title: 'First Money Talk', description: 'Started your first family discussion about money', achieved: true, date: '2024-01-15' },
        { id: '2', title: 'Goal Setting Guide', description: 'Helped child set their first savings goal', achieved: true, date: '2024-01-20' },
        { id: '3', title: 'Weekly Habit', description: 'Had money discussions for 7 days in a row', achieved: false, progress: 3 },
      ]);

      // Rotate discussion starters based on offset (for refresh functionality)
      const rotatedStarters = discussionStartersData.slice(starterOffset % discussionStartersData.length)
        .concat(discussionStartersData.slice(0, starterOffset % discussionStartersData.length));
      setDiscussionStarters(rotatedStarters.slice(0, 3));

    } catch (error) {
      console.error('Error loading teaching data:', error);
    }
  };

  // Auto-reward child when milestone is achieved
  const autoRewardChildForMilestone = async (milestone: any, child: any, parent: any): Promise<{pointsAwarded: number} | null> => {
    if (!child || !parent) return null;

    try {
      const token = await getAuthToken();
      if (!token) return null;

      // Define point rewards for different milestone types
      const rewardPoints: { [key: string]: number } = {
        'discussions': 50,
        'goals': 50,
        'consistency': 75,
        'learning': 50,
        'tracking': 50
      };

      const pointsToAward = rewardPoints[milestone.category] || 25;

      // 1. Create transaction for the child
      const transactionResponse = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: child.id,
          type: 'parent-points-adjustment',
          description: `Parent reward for achieving "${milestone.title}" milestone`,
          amount: pointsToAward,
          toJar: 'current' // Reward goes to Pocket Money
        }),
      });

      if (transactionResponse.ok) {
        // 2. Add badge to child's profile
        const badgeData = {
          milestoneType: milestone.id,
          title: milestone.title,
          description: milestone.description,
          icon: '🏆',
          pointsAwarded: pointsToAward
        };

        const badgeResponse = await fetch(`${API_URL}/users/${child.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            $push: { badges: badgeData }
          }),
        });

        if (badgeResponse.ok) {
          console.log('Child rewarded with points and badge for milestone achievement');
          return { pointsAwarded: pointsToAward };
        }
      }
    } catch (error) {
      console.error('Error auto-rewarding child for milestone:', error);
    }
    return null;
  };

  const handleMilestoneAchieved = (milestoneId: string) => {
    Alert.alert(
      'Milestone Achieved! 🎉',
      'Great job teaching your child about money! Keep up the excellent work.',
      [{ text: 'Continue Teaching', style: 'default' }]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
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
      <Text style={[styles.title, { color: themeColors.text }]}>
        👨‍👩‍👧‍👦 Family Financial Coach
      </Text>

      {/* Parent Guides Section */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>📚 Parent Guides</Text>
        <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
          Expert tips to help you teach your child about money
        </Text>

        <View style={styles.guidesGrid}>
          {parentGuides.map((guide) => (
            <TouchableOpacity
              key={guide.id}
              style={[styles.guideCard, { backgroundColor: themeColors.surface }]}
              onPress={() => setSelectedGuide(guide.id)}
            >
              <Text style={styles.guideIcon}>{guide.icon}</Text>
              <Text style={[styles.guideTitle, { color: themeColors.text }]} numberOfLines={2}>
                {guide.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Discussion Starters */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>💬 Today's Discussion Starters</Text>
        <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
          Fresh conversation prompts for family money talks
        </Text>

        {discussionStarters.map((starter, index) => (
          <View key={starter.id} style={[styles.starterCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.starterNumber, { color: themeColors.primary }]}>{index + 1}</Text>
            <Text style={[styles.starterText, { color: themeColors.text }]}>
              {starter.prompt}
            </Text>
            <Text style={[styles.starterCategory, { color: themeColors.textSecondary }]}>
              {starter.category}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: themeColors.secondary }]}
          onPress={() => {
            setStarterOffset(prev => prev + 1);
            loadTeachingData();
          }}
        >
          <Text style={[styles.refreshButtonText, { color: themeColors.card }]}>
            🔄 Get New Starters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Family Discussion Journal */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>📝 Family Money Talks</Text>
        <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
          Log and track your family discussions about money
        </Text>

        {familyDiscussions.length > 0 ? (
          familyDiscussions.slice(0, 3).map((discussion) => (
            <View key={discussion._id} style={[styles.discussionCard, { backgroundColor: themeColors.surface }]}>
              <View style={styles.discussionHeader}>
                <Text style={[styles.discussionTitle, { color: themeColors.text }]}>
                  💬 {discussion.topic === 'custom' ? discussion.customTopic : discussion.topic}
                </Text>
                <View style={styles.discussionActions}>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: themeColors.secondary }]}
                    onPress={() => {
                      console.log('Delete discussion button pressed for:', discussion._id);
                      console.log('Current discussions count:', familyDiscussions.length);

                      // Directly delete without Alert confirmation for testing
                      console.log('Deleting discussion:', discussion._id);
                      const updatedDiscussions = familyDiscussions.filter(d => d._id !== discussion._id);
                      console.log('Updated discussions count:', updatedDiscussions.length);
                      console.log('Discussion to delete:', discussion);
                      console.log('Filtered discussions:', updatedDiscussions);

                      // Force re-render by creating a completely new array
                      setFamilyDiscussions([...updatedDiscussions]);
                      console.log('State updated, new discussions count:', updatedDiscussions.length);
                      console.log('Force re-render triggered');

                      saveDiscussionsToDatabase(updatedDiscussions);
                      console.log('AsyncStorage save initiated');
                    }}
                  >
                    <Text style={[styles.deleteButtonText, { color: themeColors.card }]}>🗑️</Text>
                  </TouchableOpacity>
                  <Text style={[styles.discussionDate, { color: themeColors.textSecondary }]}>
                    {new Date(discussion.discussionDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.discussionChild, { color: themeColors.primary }]}>
                with {discussion.childId?.name || 'Child'}
              </Text>

              {discussion.mood && (
                <Text style={[styles.discussionMood, { color: themeColors.textSecondary }]}>
                  Mood: {discussion.mood} • Duration: {discussion.duration}min
                </Text>
              )}

              {discussion.keyLearnings && discussion.keyLearnings.length > 0 && (
                <Text style={[styles.discussionLearnings, { color: themeColors.text }]}>
                  Key Learning: {discussion.keyLearnings[0]}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={[styles.emptyDiscussions, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              📝 No discussions logged yet. Start recording your family money talks!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
          onPress={() => setShowDiscussionModal(true)}
        >
          <Text style={[styles.primaryButtonText, { color: themeColors.card }]}>
            ➕ Log New Discussion
          </Text>
        </TouchableOpacity>
      </View>

      {/* Teaching Progress Tracker */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🏆 Your Teaching Journey</Text>
        <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
          Track your progress as a family financial coach
        </Text>

        {teachingMilestones.map((milestone) => (
          <View key={milestone.id} style={[styles.milestoneCard, { backgroundColor: themeColors.surface }]}>
            <View style={styles.milestoneHeader}>
              <Text style={[styles.milestoneTitle, { color: themeColors.text }]}>
                {milestone.title}
              </Text>
              {milestone.achieved ? (
                <TouchableOpacity onPress={() => {
                  Alert.alert(
                    'Milestone Already Achieved! 🎉',
                    `"${milestone.title}" - ${milestone.description}`,
                    [{ text: 'Great!', style: 'default' }]
                  );
                }}>
                  <Text style={styles.achievedBadge}>✅ Achieved</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{ minWidth: 120, alignItems: 'center' }}
                  onPress={async () => {
                    console.log('Mark as Achieved pressed for:', milestone.title);

                    // Directly mark as achieved (bypassing Alert.alert which isn't working)
                    const updatedMilestones = teachingMilestones.map(m =>
                      m.id === milestone.id
                        ? { ...m, achieved: true, date: new Date().toISOString().split('T')[0] }
                        : m
                    );

                    console.log('Updated milestone:', updatedMilestones.find(m => m.id === milestone.id));
                    setTeachingMilestones(updatedMilestones);
                    saveMilestonesToDatabase(updatedMilestones);

                    // Auto-reward child with points and badge
                    let rewardMessage = '';
                    console.log('Starting milestone achievement process...');
                    console.log('Selected child:', selectedChild);
                    console.log('Current user:', currentUser);

                    if (selectedChild && currentUser) {
                      try {
                        console.log('Calling autoRewardChildForMilestone...');
                        const rewardResult = await autoRewardChildForMilestone(milestone, selectedChild, currentUser);
                        console.log('Reward result:', rewardResult);
                        if (rewardResult && rewardResult.pointsAwarded) {
                          rewardMessage = `\n\n${selectedChild.name} has been rewarded with ${rewardResult.pointsAwarded} points!`;
                        }
                      } catch (error) {
                        console.error('Error rewarding child for milestone:', error);
                        rewardMessage = '\n\n(Reward processing may have failed - check child account)';
                      }
                    } else {
                      console.log('Missing child or user data:', { selectedChild, currentUser });
                    }

                    // Show success feedback
                    Alert.alert(
                      '✅ Milestone Achieved!',
                      `Congratulations! "${milestone.title}" completed successfully! 🎉${rewardMessage}`
                    );
                  }}
                >
                  <Text style={styles.inProgressBadge}>🔄 Mark as Achieved</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.milestoneDesc, { color: themeColors.textSecondary }]}>
              {milestone.description}
            </Text>

            {milestone.maxProgress > 1 && (
              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: themeColors.text }]}>
                  Progress: {milestone.progress}/{milestone.maxProgress}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: themeColors.primary,
                        width: `${Math.min((milestone.progress / milestone.maxProgress) * 100, 100)}%`
                      }
                    ]}
                  />
                </View>
                {!milestone.achieved && milestone.progress < milestone.maxProgress && (
                  <TouchableOpacity
                    style={[styles.incrementButton, { backgroundColor: themeColors.secondary }]}
                    onPress={() => {
                      setTeachingMilestones(prev =>
                        prev.map(m =>
                          m.id === milestone.id && m.progress < m.maxProgress
                            ? { ...m, progress: m.progress + 1 }
                            : m
                        )
                      );
                    }}
                  >
                    <Text style={[styles.incrementButtonText, { color: themeColors.card }]}>
                      +1 Progress
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {milestone.date && milestone.achieved && (
              <Text style={[styles.milestoneDate, { color: themeColors.textSecondary }]}>
                Achieved: {new Date(milestone.date).toLocaleDateString()}
              </Text>
            )}

            <Text style={[styles.milestoneCategory, { color: themeColors.textSecondary }]}>
              Category: {milestone.category}
            </Text>
          </View>
        ))}
      </View>

      {/* Family Timeline */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>⏳ Family Money Timeline</Text>
        <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
          Visualize your family's financial journey and milestones over time
        </Text>

        {familyTimeline?.timeline && familyTimeline.timeline.length > 0 ? (
          <View style={styles.timelineContainer}>
            {familyTimeline.timeline.slice(0, 5).map((entry: any, index: number) => (
              <View key={index} style={styles.timelineEntry}>
                <View style={[styles.timelineDot, { backgroundColor: themeColors.primary }]} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: themeColors.secondary }]}
                    onPress={() => {
                      console.log('Timeline delete button pressed for index:', index);

                      // Use appropriate confirmation method for platform
                      if (typeof window !== 'undefined' && window.confirm) {
                        // Web: use browser confirm dialog
                        const confirmed = window.confirm('Are you sure you want to delete this timeline entry?');
                        if (confirmed) {
                          console.log('Timeline delete confirmed for index:', index);
                          const updatedTimeline = {
                            timeline: familyTimeline.timeline.filter((_: any, i: number) => i !== index)
                          };
                          console.log('Updated timeline entries count:', updatedTimeline.timeline.length);
                          setFamilyTimeline(updatedTimeline);
                          saveTimelineToDatabase(updatedTimeline);
                          console.log('Timeline entry deleted successfully');
                        } else {
                          console.log('Timeline delete cancelled');
                        }
                      } else {
                        // Mobile: use Alert.alert
                        Alert.alert(
                          'Delete Timeline Entry',
                          'Are you sure you want to delete this timeline entry?',
                          [
                            { text: 'Cancel', style: 'cancel', onPress: () => console.log('Timeline delete cancelled') },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => {
                                console.log('Timeline delete confirmed for index:', index);
                                const updatedTimeline = {
                                  timeline: familyTimeline.timeline.filter((_: any, i: number) => i !== index)
                                };
                                console.log('Updated timeline entries count:', updatedTimeline.timeline.length);
                                setFamilyTimeline(updatedTimeline);
                                saveTimelineToDatabase(updatedTimeline);
                                console.log('Timeline entry deleted successfully');
                              }
                            }
                          ]
                        );
                      }
                    }}
                  >
                      <Text style={[styles.deleteButtonText, { color: themeColors.card }]}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.timelineYear, { color: themeColors.primary }]}>
                    Age {entry.age} • {entry.year}
                  </Text>
                  <Text style={[styles.timelineEvent, { color: themeColors.text }]}>
                    {entry.icon} {entry.event === 'custom' ? entry.customEvent : entry.event}
                  </Text>
                  <Text style={[styles.timelineDesc, { color: themeColors.textSecondary }]}>
                    {entry.description}
                  </Text>
                  {entry.amount > 0 && (
                    <Text style={[styles.timelineAmount, { color: themeColors.primary }]}>
                      ₹{entry.amount.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              🕰️ Start building your family's financial legacy. Add milestones to see your journey!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
          onPress={() => {
            console.log('Add Elder Wisdom button pressed - setting modal to true');
            console.log('Current showElderModal value:', showElderModal);
            setShowElderModal(true);
            console.log('Modal should now be visible');
          }}
        >
          <Text style={[styles.primaryButtonText, { color: themeColors.card }]}>
            👴 Add Elder Wisdom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dream Board */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🎯 Dream Board</Text>
        <Text style={{ color: themeColors.textSecondary, marginBottom: 12 }}>
          Visualize and plan your biggest dreams together as a family
        </Text>

        {dreamBoard?.items && dreamBoard.items.length > 0 ? (
          <View style={styles.dreamBoardGrid}>
            {dreamBoard.items.slice(0, 6).map((item: any, index: number) => (
              <View key={index} style={[styles.dreamItem, { backgroundColor: item.color || themeColors.surface }]}>
                <View style={styles.dreamItemHeader}>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: themeColors.secondary }]}
                    onPress={() => {
                      console.log('Dream delete button pressed for:', item.id, item.title);
                      console.log('Dream board items before delete:', dreamBoard.items?.length || 0);

                      // Use appropriate confirmation method for platform
                      if (typeof window !== 'undefined' && window.confirm) {
                        // Web: use browser confirm dialog
                        const confirmed = window.confirm(`Are you sure you want to delete "${item.title}" from your Dream Board?`);
                        if (confirmed) {
                          console.log('Dream delete confirmed for:', item.id, item.title);

                          // Simple direct approach - just remove the item without complex checks
                          const updatedItems = dreamBoard.items.filter((dream: any) => dream.id !== item.id);
                          console.log('Before delete:', dreamBoard.items.length, 'items');
                          console.log('After delete:', updatedItems.length, 'items');

                          const updatedDreamBoard = {
                            ...dreamBoard,
                            items: updatedItems,
                            totalDreamValue: dreamBoard.totalDreamValue - item.targetAmount,
                            monthlyCommitment: dreamBoard.monthlyCommitment - item.monthlyCommitment
                          };

                          console.log('Setting updated dream board...');
                          setDreamBoard(updatedDreamBoard);
                          console.log('Saving to AsyncStorage...');
                          AsyncStorage.setItem('dreamBoard', JSON.stringify(updatedDreamBoard));

                          console.log('Dream deleted successfully');
                        } else {
                          console.log('Dream delete cancelled');
                        }
                      } else {
                        // Mobile: use Alert.alert
                        Alert.alert(
                          'Delete Dream',
                          `Are you sure you want to delete "${item.title}" from your Dream Board?`,
                          [
                            { text: 'Cancel', style: 'cancel', onPress: () => console.log('Dream delete cancelled') },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => {
                                console.log('Dream delete confirmed for:', item.id, item.title);

                                // Simple direct approach - just remove the item without complex checks
                                const updatedItems = dreamBoard.items.filter((dream: any) => dream.id !== item.id);
                                console.log('Before delete:', dreamBoard.items.length, 'items');
                                console.log('After delete:', updatedItems.length, 'items');

                                const updatedDreamBoard = {
                                  ...dreamBoard,
                                  items: updatedItems,
                                  totalDreamValue: dreamBoard.totalDreamValue - item.targetAmount,
                                  monthlyCommitment: dreamBoard.monthlyCommitment - item.monthlyCommitment
                                };

                                console.log('Setting updated dream board...');
                                setDreamBoard(updatedDreamBoard);
                                console.log('Saving to AsyncStorage...');
                                AsyncStorage.setItem('dreamBoard', JSON.stringify(updatedDreamBoard));

                                console.log('Dream deleted successfully');
                              }
                            }
                          ]
                        );
                      }
                    }}
                  >
                    <Text style={[styles.deleteButtonText, { color: themeColors.card }]}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.dreamIcon}>{item.icon || '🎯'}</Text>
                <Text style={[styles.dreamTitle, { color: themeColors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.dreamAmount, { color: themeColors.primary }]}>
                  ₹{item.targetAmount.toLocaleString()}
                </Text>
                <View style={styles.dreamProgress}>
                  <View
                    style={[
                      styles.dreamProgressFill,
                      {
                        backgroundColor: themeColors.primary,
                        width: `${Math.min((item.currentSavings / item.targetAmount) * 100, 100)}%`
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              🌟 Create your family's dream board. Add goals, dreams, and aspirations to visualize your future!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
          onPress={() => setShowDreamModal(true)}
        >
          <Text style={[styles.primaryButtonText, { color: themeColors.card }]}>
            ➕ Add Dream
          </Text>
        </TouchableOpacity>

        <View style={styles.dreamBoardStats}>
          <Text style={[styles.dreamStatsText, { color: themeColors.text }]}>
            💰 Total Dreams: ₹{dreamBoard?.totalDreamValue?.toLocaleString() || '0'}
          </Text>
          <Text style={[styles.dreamStatsText, { color: themeColors.text }]}>
            📅 Monthly Commitment: ₹{dreamBoard?.monthlyCommitment?.toLocaleString() || '0'}
          </Text>
        </View>

        {dreamBoard?.inspiration && (
          <View style={[styles.inspirationCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.inspirationQuote, { color: themeColors.text }]}>
              "{dreamBoard.inspiration.quote}"
            </Text>
            <Text style={[styles.inspirationAuthor, { color: themeColors.textSecondary }]}>
              — {dreamBoard.inspiration.author}
            </Text>
          </View>
        )}
      </View>

      {/* Guide Modal */}
      <Modal
        visible={!!selectedGuide}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedGuide(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: themeColors.card }]}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {selectedGuide && (() => {
                const guide = parentGuides.find(g => g.id === selectedGuide);
                return guide ? (
                  <View>
                    <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                      {guide.icon} {guide.title}
                    </Text>
                    <View style={styles.guideContent}>
                      {guide.content.split('\n').map((line, index) => (
                        <Text key={index} style={[styles.guideText, { color: themeColors.text }]}>
                          {line}
                        </Text>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[styles.closeButton, { backgroundColor: themeColors.primary }]}
                      onPress={() => setSelectedGuide(null)}
                    >
                      <Text style={[styles.closeButtonText, { color: themeColors.card }]}>
                        Got it! 👍
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null;
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Discussion Logging Modal */}
      <Modal
        visible={showDiscussionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDiscussionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                📝 Log Family Discussion
              </Text>

              <Text style={[styles.label, { color: themeColors.text }]}>Child *</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                onPress={() => {
                  console.log('Child selection pressed');
                  console.log('Available children:', availableChildren);
                  console.log('Available children length:', availableChildren.length);

                  if (availableChildren.length === 0) {
                    Alert.alert('No Children Found', 'Please add children to your family first.');
                    return;
                  }

                  console.log('Opening child selection modal');
                  setShowChildSelection(true);
                }}
              >
                <Text style={{ color: discussionForm.childId ? themeColors.text : themeColors.textSecondary }}>
                  {discussionForm.childId ?
                    (availableChildren.find(c => c.id === discussionForm.childId)?.name || `Child ${discussionForm.childId}`) :
                    'Select child...'
                  }
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: themeColors.text }]}>Discussion Topic *</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                onPress={() => {
                  console.log('Topic selection pressed');
                  setShowTopicSelection(true);
                }}
              >
                <Text style={{ color: discussionForm.topic ? themeColors.text : themeColors.textSecondary }}>
                  {discussionForm.topic === 'custom' ? 'Custom Topic' :
                   discussionForm.topic ? discussionForm.topic.replace('-', ' ') : 'Select topic...'}
                </Text>
              </TouchableOpacity>

              {discussionForm.topic === 'custom' && (
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                  placeholder="Enter custom topic..."
                  placeholderTextColor={themeColors.textSecondary}
                  value={discussionForm.customTopic}
                  onChangeText={(text) => updateForm('customTopic', text)}
                />
              )}

              <Text style={[styles.label, { color: themeColors.text }]}>Duration (minutes)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="15"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={discussionForm.duration}
                onChangeText={(text) => updateForm('duration', text)}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Key Learnings</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="What did your child learn? (e.g., 'Saving helps us buy things we want later')"
                placeholderTextColor={themeColors.textSecondary}
                multiline={true}
                numberOfLines={3}
                value={discussionForm.keyLearnings}
                onChangeText={(text) => updateForm('keyLearnings', text)}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>How did the discussion go?</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                onPress={() => {
                  const moods = ['excellent', 'good', 'okay', 'challenging'];
                  Alert.alert(
                    'Discussion Mood',
                    'How did the discussion go overall?',
                    moods.map(mood => ({
                      text: mood.charAt(0).toUpperCase() + mood.slice(1),
                      onPress: () => updateForm('mood', mood)
                    }))
                  );
                }}
              >
                <Text style={{ color: themeColors.text }}>
                  {discussionForm.mood.charAt(0).toUpperCase() + discussionForm.mood.slice(1)}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: themeColors.text }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="Any additional notes about the discussion..."
                placeholderTextColor={themeColors.textSecondary}
                multiline={true}
                numberOfLines={2}
                value={discussionForm.notes}
                onChangeText={(text) => updateForm('notes', text)}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => {
                    setShowDiscussionModal(false);
                    setDiscussionForm({
                      childId: '',
                      topic: 'daily-spending',
                      customTopic: '',
                      duration: '15',
                      keyLearnings: '',
                      mood: 'good',
                      notes: ''
                    });
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                  onPress={() => {
                    // Validate required fields
                    if (!discussionForm.childId || !discussionForm.topic) {
                      const errorMessage = 'Please select a child and discussion topic.';
                      if (typeof window !== 'undefined' && window.alert) {
                        window.alert('Missing Information: ' + errorMessage);
                      } else {
                        Alert.alert('Missing Information', errorMessage);
                      }
                      return;
                    }

                    // Create discussion object
                    const newDiscussion = {
                      _id: Date.now().toString(), // Mock ID for frontend
                      familyId: 'family1', // Mock family ID
                      parentId: 'parent1', // Mock parent ID
                      childId: {
                        id: discussionForm.childId,
                        name: 'Demo Child' // Mock child name
                      },
                      topic: discussionForm.topic,
                      customTopic: discussionForm.customTopic || null,
                      discussionDate: new Date().toISOString(),
                      duration: parseInt(discussionForm.duration) || 15,
                      participants: [
                        { userId: 'parent1', role: 'parent', attended: true },
                        { userId: discussionForm.childId, role: 'child', attended: true }
                      ],
                      keyLearnings: discussionForm.keyLearnings ? [discussionForm.keyLearnings] : [],
                      mood: discussionForm.mood,
                      notes: discussionForm.notes,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };

                    // Add to discussions list
                    const updatedDiscussions = [newDiscussion, ...familyDiscussions];
                    setFamilyDiscussions(updatedDiscussions);
                    saveDiscussionsToDatabase(updatedDiscussions);

                    // Reset form and close modal
                    setDiscussionForm({
                      childId: '',
                      topic: 'daily-spending',
                      customTopic: '',
                      duration: '15',
                      keyLearnings: '',
                      mood: 'good',
                      notes: ''
                    });
                    setShowDiscussionModal(false);

                    // Show success message
                    Alert.alert(
                      'Discussion Logged! 🎉',
                      'Great job having a money talk with your child! You can now see it in your discussion history.',
                      [{ text: 'Awesome!', style: 'default' }]
                    );
                  }}
                >
                  <Text style={[styles.saveButtonText, { color: themeColors.card }]}>
                    💾 Save Discussion
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Elder Wisdom (Timeline) Modal */}
      <Modal
        visible={showElderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowElderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                👴 Add Elder Wisdom
              </Text>
              <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
                Add significant moments to your family's financial journey
              </Text>

              <Text style={[styles.label, { color: themeColors.text }]}>Child's Age *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="e.g., 8"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={timelineForm.age}
                onChangeText={(value) => setTimelineForm(prev => ({ ...prev, age: value }))}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Year *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="e.g., 2025"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={timelineForm.year}
                onChangeText={(value) => setTimelineForm(prev => ({ ...prev, year: value }))}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Event *</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                onPress={() => {
                  console.log('Event selection pressed');
                  setShowEventSelection(true);
                }}
              >
                <Text style={{ color: timelineForm.event ? themeColors.text : themeColors.textSecondary }}>
                  {timelineForm.event === 'custom' ? 'Custom Event' :
                   timelineForm.event ? `${timelineForm.icon} ${timelineForm.event.replace('-', ' ')}` : 'Select event...'}
                </Text>
              </TouchableOpacity>

              {timelineForm.event === 'custom' && (
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                  placeholder="Describe the custom event..."
                  placeholderTextColor={themeColors.textSecondary}
                  value={timelineForm.customEvent}
                  onChangeText={(value) => setTimelineForm(prev => ({ ...prev, customEvent: value }))}
                />
              )}

              <Text style={[styles.label, { color: themeColors.text }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="Describe what happened and what was learned..."
                placeholderTextColor={themeColors.textSecondary}
                multiline={true}
                numberOfLines={3}
                value={timelineForm.description}
                onChangeText={(value) => setTimelineForm(prev => ({ ...prev, description: value }))}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Amount (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="e.g., 5000"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={timelineForm.amount}
                onChangeText={(value) => setTimelineForm(prev => ({ ...prev, amount: value }))}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => {
                    setShowElderModal(false);
                    setTimelineForm({
                      age: '',
                      year: '',
                      event: '',
                      customEvent: '',
                      description: '',
                      amount: '',
                      icon: '✨'
                    });
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                  onPress={() => {
                    if (!timelineForm.age || !timelineForm.year || !timelineForm.event || !timelineForm.description) {
                      const errorMessage = 'Please fill in age, year, event, and description.';
                      if (typeof window !== 'undefined' && window.alert) {
                        window.alert('Missing Information: ' + errorMessage);
                      } else {
                        Alert.alert('Missing Information', errorMessage);
                      }
                      return;
                    }

                    const newTimelineEntry = {
                      age: parseInt(timelineForm.age),
                      year: parseInt(timelineForm.year),
                      icon: timelineForm.icon,
                      event: timelineForm.event,
                      customEvent: timelineForm.event === 'custom' ? timelineForm.customEvent : null,
                      description: timelineForm.description,
                      amount: parseInt(timelineForm.amount) || 0,
                      significance: 'medium'
                    };

                    const updatedTimeline = {
                      timeline: familyTimeline?.timeline ? [newTimelineEntry, ...familyTimeline.timeline] : [newTimelineEntry]
                    };

                    setFamilyTimeline(updatedTimeline);
                    saveTimelineToDatabase(updatedTimeline);

                    setShowElderModal(false);
                    setTimelineForm({
                      age: '',
                      year: '',
                      event: '',
                      customEvent: '',
                      description: '',
                      amount: '',
                      icon: '✨'
                    });

                    Alert.alert(
                      'Wisdom Added! 🏛️',
                      'Family financial milestone recorded successfully!',
                      [{ text: 'Wonderful!', style: 'default' }]
                    );
                  }}
                >
                  <Text style={[styles.saveButtonText, { color: themeColors.card }]}>
                    🏛️ Add Wisdom
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Event Selection Modal */}
      <Modal
        visible={showEventSelection}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEventSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>🎯 Select Event Type</Text>
              <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
                Choose the type of financial milestone
              </Text>

              <View style={styles.eventGrid}>
                {[
                  { key: 'first_savings', label: 'First Savings Account', icon: '🐷' },
                  { key: 'first_job', label: 'First Job/Allowance', icon: '💼' },
                  { key: 'big_purchase', label: 'Big Purchase Decision', icon: '🛍️' },
                  { key: 'financial_mistake', label: 'Learning from Mistake', icon: '📚' },
                  { key: 'charity_donation', label: 'First Donation', icon: '❤️' },
                  { key: 'investment_start', label: 'Investment Beginning', icon: '📈' },
                  { key: 'custom', label: 'Custom Event', icon: '✨' }
                ].map((event) => (
                  <TouchableOpacity
                    key={event.key}
                    style={[styles.eventOption, { backgroundColor: themeColors.surface }]}
                    onPress={() => {
                      console.log('Selected event:', event.key, event.icon);
                      setTimelineForm(prev => ({
                        ...prev,
                        event: event.key,
                        icon: event.icon,
                        customEvent: event.key === 'custom' ? prev.customEvent : ''
                      }));
                      setShowEventSelection(false);
                    }}
                  >
                    <Text style={styles.eventIcon}>{event.icon}</Text>
                    <Text style={[styles.eventLabel, { color: themeColors.text }]}>{event.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: themeColors.secondary }]}
                onPress={() => setShowEventSelection(false)}
              >
                <Text style={[styles.closeButtonText, { color: themeColors.card }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Topic Selection Modal */}
      <Modal
        visible={showTopicSelection}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTopicSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>💬 Select Discussion Topic</Text>
              <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
                Choose the main topic of your discussion
              </Text>

              <View style={styles.eventGrid}>
                {[
                  { key: 'daily-spending', label: 'Daily Spending', icon: '🛒' },
                  { key: 'saving-goals', label: 'Saving Goals', icon: '🐷' },
                  { key: 'needs-vs-wants', label: 'Needs vs Wants', icon: '🔀' },
                  { key: 'budget-planning', label: 'Budget Planning', icon: '📊' },
                  { key: 'family-values', label: 'Family Values', icon: '❤️' },
                  { key: 'future-planning', label: 'Future Planning', icon: '🔮' },
                  { key: 'custom', label: 'Custom Topic', icon: '💡' }
                ].map((topic) => (
                  <TouchableOpacity
                    key={topic.key}
                    style={[styles.eventOption, { backgroundColor: themeColors.surface }]}
                    onPress={() => {
                      console.log('Selected topic:', topic.key);
                      updateForm('topic', topic.key);
                      setShowTopicSelection(false);
                    }}
                  >
                    <Text style={styles.eventIcon}>{topic.icon}</Text>
                    <Text style={[styles.eventLabel, { color: themeColors.text }]}>{topic.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: themeColors.secondary }]}
                onPress={() => setShowTopicSelection(false)}
              >
                <Text style={[styles.closeButtonText, { color: themeColors.card }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Child Selection Modal */}
      <Modal
        visible={showChildSelection}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChildSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>👶 Select Child</Text>
              <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
                Choose which child this discussion was with
              </Text>

              <View style={styles.eventGrid}>
                {availableChildren.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.eventOption, { backgroundColor: themeColors.surface }]}
                    onPress={() => {
                      console.log('Selected child:', child.id, child.name);
                      updateForm('childId', child.id);
                      setSelectedChild(child);
                      setShowChildSelection(false);
                    }}
                  >
                    <Text style={styles.eventIcon}>👶</Text>
                    <Text style={[styles.eventLabel, { color: themeColors.text }]}>{child.name || `Child ${child.id}`}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: themeColors.secondary }]}
                onPress={() => setShowChildSelection(false)}
              >
                <Text style={[styles.closeButtonText, { color: themeColors.card }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dream Creation Modal */}
      <Modal
        visible={showDreamModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDreamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>🎯 Create New Dream</Text>
              <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
                Add a big dream for your family to work toward
              </Text>

              <Text style={[styles.label, { color: themeColors.text }]}>Dream Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="e.g., Bali Family Vacation"
                placeholderTextColor={themeColors.textSecondary}
                value={dreamForm.title}
                onChangeText={(text) => updateDreamForm('title', text)}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Target Amount (₹) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="e.g., 200000"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={dreamForm.targetAmount}
                onChangeText={(text) => updateDreamForm('targetAmount', text)}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Monthly Commitment (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="e.g., 8000 (calculated automatically)"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={dreamForm.monthlyCommitment}
                onChangeText={(text) => updateDreamForm('monthlyCommitment', text)}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Category *</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                onPress={() => {
                  const categories = [
                    { key: 'vacation', label: 'Vacation', icon: '🏖️' },
                    { key: 'home', label: 'Home Purchase', icon: '🏠' },
                    { key: 'education', label: 'Education', icon: '🎓' },
                    { key: 'emergency', label: 'Emergency Fund', icon: '🛡️' },
                    { key: 'vehicle', label: 'Vehicle', icon: '🚗' },
                    { key: 'business', label: 'Business', icon: '💼' },
                    { key: 'other', label: 'Other', icon: '✨' }
                  ];

                  // Use appropriate selection method for platform
                  if (typeof window !== 'undefined' && window.prompt) {
                    // Web: use prompt for simple selection
                    const options = categories.map(cat => `${cat.icon} ${cat.label}`).join('\n');
                    const selectedText = window.prompt(`Choose the type of dream:\n\n${options}\n\nEnter the emoji or name:`);

                    if (selectedText) {
                      // Find the category by icon or label
                      const selectedCategory = categories.find(cat =>
                        selectedText.includes(cat.icon) ||
                        selectedText.toLowerCase().includes(cat.label.toLowerCase())
                      );
                      if (selectedCategory) {
                        updateDreamForm('category', selectedCategory.key);
                      }
                    }
                  } else {
                    // Mobile: use Alert.alert
                    Alert.alert(
                      'Select Category',
                      'Choose the type of dream',
                      categories.map(cat => ({
                        text: `${cat.icon} ${cat.label}`,
                        onPress: () => updateDreamForm('category', cat.key)
                      })),
                      { cancelable: true }
                    );
                  }
                }}
              >
                <Text style={{ color: dreamForm.category ? themeColors.text : themeColors.textSecondary }}>
                  {dreamForm.category === 'vacation' ? '🏖️ Vacation' :
                   dreamForm.category === 'home' ? '🏠 Home Purchase' :
                   dreamForm.category === 'education' ? '🎓 Education' :
                   dreamForm.category === 'emergency' ? '🛡️ Emergency Fund' :
                   dreamForm.category === 'vehicle' ? '🚗 Vehicle' :
                   dreamForm.category === 'business' ? '💼 Business' :
                   dreamForm.category === 'other' ? '✨ Other' :
                   'Select category...'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: themeColors.text }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="Describe your dream and why it's important to your family..."
                placeholderTextColor={themeColors.textSecondary}
                multiline={true}
                numberOfLines={3}
                value={dreamForm.description}
                onChangeText={(text) => updateDreamForm('description', text)}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Target Date (optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                placeholder="e.g., 2026-12-31"
                placeholderTextColor={themeColors.textSecondary}
                value={dreamForm.deadline}
                onChangeText={(text) => updateDreamForm('deadline', text)}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => {
                    setShowDreamModal(false);
                    setDreamForm({
                      title: '',
                      targetAmount: '',
                      monthlyCommitment: '',
                      category: 'vacation',
                      description: '',
                      deadline: ''
                    });
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                  onPress={() => {
                    if (!dreamForm.title || !dreamForm.targetAmount || !dreamForm.category) {
                      const errorMessage = 'Please fill in title, target amount, and category.';
                      console.error('Validation Error:', errorMessage);

                      // Try multiple approaches for error display
                      if (typeof window !== 'undefined' && window.alert) {
                        window.alert('Missing Information: ' + errorMessage);
                      } else if (Alert && Alert.alert) {
                        Alert.alert('Missing Information', errorMessage);
                      } else {
                        // Fallback: show error in console only
                        console.error('Could not display error dialog - please fill in all required fields');
                      }
                      return;
                    }

                    const targetAmount = parseFloat(dreamForm.targetAmount);
                    const monthlyCommitment = dreamForm.monthlyCommitment ?
                      parseFloat(dreamForm.monthlyCommitment) :
                      Math.ceil(targetAmount / 24); // Default to 2 years

                    const newDream = {
                      id: Date.now().toString(),
                      title: dreamForm.title,
                      targetAmount: targetAmount,
                      currentSavings: 0,
                      monthlyCommitment: monthlyCommitment,
                      category: dreamForm.category,
                      description: dreamForm.description,
                      deadline: dreamForm.deadline,
                      icon: dreamForm.category === 'vacation' ? '🏖️' :
                            dreamForm.category === 'home' ? '🏠' :
                            dreamForm.category === 'education' ? '🎓' :
                            dreamForm.category === 'emergency' ? '🛡️' :
                            dreamForm.category === 'vehicle' ? '🚗' :
                            dreamForm.category === 'business' ? '💼' : '✨',
                      color: dreamForm.category === 'vacation' ? '#FFEB3B' :
                             dreamForm.category === 'home' ? '#2196F3' :
                             dreamForm.category === 'education' ? '#4CAF50' :
                             dreamForm.category === 'emergency' ? '#FF5722' :
                             dreamForm.category === 'vehicle' ? '#9C27B0' :
                             dreamForm.category === 'business' ? '#FF9800' : '#607D8B',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };

                    const updatedDreamBoard = {
                      items: dreamBoard?.items ? [newDream, ...dreamBoard.items] : [newDream],
                      totalDreamValue: (dreamBoard?.totalDreamValue || 0) + targetAmount,
                      monthlyCommitment: (dreamBoard?.monthlyCommitment || 0) + monthlyCommitment,
                      inspiration: dreamBoard?.inspiration || {
                        quote: "The future belongs to those who believe in the beauty of their dreams.",
                        author: "Eleanor Roosevelt"
                      }
                    };

                    setDreamBoard(updatedDreamBoard);

                    // Save to AsyncStorage for persistence
                    AsyncStorage.setItem('dreamBoard', JSON.stringify(updatedDreamBoard));

                    setShowDreamModal(false);
                    setDreamForm({
                      title: '',
                      targetAmount: '',
                      monthlyCommitment: '',
                      category: 'vacation',
                      description: '',
                      deadline: ''
                    });

                    Alert.alert(
                      'Dream Added! 🎯',
                      `"${dreamForm.title}" has been added to your Dream Board!`,
                      [{ text: 'Fantastic!', style: 'default' }]
                    );
                  }}
                >
                  <Text style={[styles.saveButtonText, { color: themeColors.card }]}>
                    ✨ Create Dream
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="Family Financial Coach Help"
        tabs={[
          {
            title: "Getting Started",
            content: [
              {
                type: "text",
                text: "Welcome to the Family Financial Coach! This tab provides everything you need to teach your children about money through structured guidance and tools.",
              },
              {
                type: "highlight",
                text: "💡 Start by reading the Parent Guides for expert tips on talking about money with kids.",
              },
            ],
          },
          {
            title: "Parent Guides",
            content: [
              {
                type: "text",
                text: "Expert tips from financial educators to help you teach your children about money.",
              },
              {
                type: "bullet",
                text: "Tap any guide card to read detailed advice on topics like saving, needs vs. wants, goal setting, and more.",
              },
              {
                type: "bullet",
                text: "Each guide includes practical examples and conversation starters you can use with your child.",
              },
              {
                type: "highlight",
                text: "📚 Reading 3 different guides helps you achieve the 'Parent Guide Explorer' milestone!",
              },
            ],
          },
          {
            title: "Discussion Starters",
            content: [
              {
                type: "text",
                text: "Fresh conversation prompts to help you talk naturally about money with your children.",
              },
              {
                type: "bullet",
                text: "Each day shows 3 new prompts covering different financial topics.",
              },
              {
                type: "bullet",
                text: "Tap '🔄 Get New Starters' to refresh with different prompts.",
              },
              {
                type: "bullet",
                text: "Prompts are categorized (Daily, Values, Society, Reality, Planning, Media, Credit) to help you choose relevant topics.",
              },
              {
                type: "highlight",
                text: "💬 Use these prompts during meals, car rides, or shopping trips to make money discussions natural and fun!",
              },
            ],
          },
          {
            title: "Family Discussions",
            content: [
              {
                type: "text",
                text: "Log and track your family's money conversations to see progress over time.",
              },
              {
                type: "bullet",
                text: "Tap '➕ Log New Discussion' to record a money talk you've had.",
              },
              {
                type: "bullet",
                text: "Select which child participated and what topic you discussed.",
              },
              {
                type: "bullet",
                text: "Rate the discussion mood and note key learnings.",
              },
              {
                type: "bullet",
                text: "View your recent discussions in the journal above.",
              },
              {
                type: "highlight",
                text: "📝 Logging discussions helps you achieve milestones like 'Discussion Logger' and track your family's financial education journey!",
              },
            ],
          },
          {
            title: "Teaching Milestones",
            content: [
              {
                type: "text",
                text: "Track your progress as a family financial coach and celebrate achievements.",
              },
              {
                type: "bullet",
                text: "Milestones include: First Money Talk, Goal Setting Guide, Weekly Habit, Parent Guide Explorer, and Discussion Logger.",
              },
              {
                type: "bullet",
                text: "Some milestones require multiple actions (like having discussions 7 days in a row).",
              },
              {
                type: "bullet",
                text: "Tap '🔄 Mark as Achieved' on completed milestones to unlock celebrations.",
              },
              {
                type: "bullet",
                text: "Progress bars show how close you are to completing ongoing milestones.",
              },
              {
                type: "highlight",
                text: "🏆 Achieving milestones celebrates your dedication to teaching financial literacy!",
              },
            ],
          },
          {
            title: "Family Timeline",
            content: [
              {
                type: "text",
                text: "Document significant financial moments in your family's journey.",
              },
              {
                type: "bullet",
                text: "Tap '👴 Add Elder Wisdom' to record financial milestones.",
              },
              {
                type: "bullet",
                text: "Choose from preset events or create custom ones.",
              },
              {
                type: "bullet",
                text: "Include the child's age, year, and financial amounts involved.",
              },
              {
                type: "bullet",
                text: "View your family's financial legacy visualized as a timeline.",
              },
              {
                type: "highlight",
                text: "⏳ Building a family timeline creates lasting memories of financial learning and achievements!",
              },
            ],
          },
          {
            title: "Dream Board",
            content: [
              {
                type: "text",
                text: "Create and visualize big dreams that your family can work toward together.",
              },
              {
                type: "bullet",
                text: "Tap '➕ Add Dream' to create a new family aspiration.",
              },
              {
                type: "bullet",
                text: "Choose categories like Vacation, Education, Home Purchase, etc.",
              },
              {
                type: "bullet",
                text: "Set target amounts and monthly commitments.",
              },
              {
                type: "bullet",
                text: "Track progress and view total dream values at the bottom.",
              },
              {
                type: "highlight",
                text: "🎯 Dream Boards help families stay motivated and work together toward meaningful goals!",
              },
            ],
          },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 22,
    marginTop: 6,
    // color set inline with themeColors
  },
  sectionCard: {
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
    minWidth: 300,
    width: '97%',
    maxWidth: 520,
    elevation: 2,
    borderWidth: 1,
    // backgroundColor, shadowColor, borderColor set inline with themeColors
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    // color set inline with themeColors
  },
  guidesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  guideCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 100,
    elevation: 1,
    borderWidth: 1,
    // backgroundColor, borderColor set inline with themeColors
  },
  guideIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    // color set inline with themeColors
  },
  guideContent: {
    marginBottom: 20,
  },
  guideText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  starterCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    // backgroundColor, borderColor set inline with themeColors
  },
  starterNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 24,
    // color set inline with themeColors
  },
  starterText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    // color set inline with themeColors
  },
  starterCategory: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    // color set inline with themeColors
  },
  refreshButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
    // backgroundColor set inline with themeColors
  },
  refreshButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    // color set inline with themeColors
  },
  milestoneCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    // backgroundColor, borderColor set inline with themeColors
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    // color set inline with themeColors
  },
  achievedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    // backgroundColor and color set inline with themeColors
  },
  inProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    // backgroundColor and color set inline with themeColors
  },
  milestoneDesc: {
    fontSize: 14,
    marginBottom: 8,
    // color set inline with themeColors
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    // color set inline with themeColors
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    // backgroundColor set inline with themeColors
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    // backgroundColor set inline with themeColors
  },
  milestoneDate: {
    fontSize: 12,
    // color set inline with themeColors
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalScroll: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalTextContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  discussionCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  discussionDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  discussionChild: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  discussionMood: {
    fontSize: 13,
    marginBottom: 4,
  },
  discussionLearnings: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  discussionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyDiscussions: {
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timelineContainer: {
    marginBottom: 15,
  },
  timelineEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 8,
  },
  timelineYear: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineEvent: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 14,
    marginBottom: 4,
  },
  timelineAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dreamBoardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dreamItem: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 120,
    elevation: 1,
  },
  dreamItemHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 8,
  },
  dreamIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  dreamTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  dreamAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dreamProgress: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dreamProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  dreamBoardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dreamStatsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inspirationCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  inspirationQuote: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  inspirationAuthor: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  incrementButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  incrementButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  milestoneCategory: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  eventModalContent: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 380,
    padding: 20,
    marginHorizontal: 20,
  },
  eventModalScroll: {
    padding: 0,
  },
  eventGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eventOption: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    minHeight: 80,
  },
  eventIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
