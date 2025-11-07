# 🎪 State Management Rules

## 🎯 State Management Strategy

### When to Use Different State Solutions

#### Local Component State (useState)
```typescript
// ✅ Use for component-specific state
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [selectedItem, setSelectedItem] = useState(null);
```

#### Complex Local State (useReducer)
```typescript
// ✅ Use for complex state transitions
const [state, dispatch] = useReducer(reducer, initialState);

// Example: Form state management
const formReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'VALIDATE':
      return { ...state, errors: validateForm(state) };
    case 'SUBMIT':
      return { ...state, isSubmitting: true };
    default:
      return state;
  }
};
```

#### Global App State (Zustand)
```typescript
// ✅ Use for app-wide state
const useUserStore = create((set, get) => ({
  user: null,
  familyMembers: [],
  settings: {},

  // Actions
  setUser: (user) => set({ user }),
  updateSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings }
  })),

  // Computed values
  get isParent() {
    const { user } = get();
    return user?.role === 'parent';
  },

  get activeFamilyMembers() {
    const { familyMembers } = get();
    return familyMembers.filter(member => member.status === 'active');
  }
}));
```

## 🔄 State Organization Patterns

### Store Structure by Domain
```
stores/
├── auth.ts          # Authentication state
├── user.ts          # User profile data
├── family.ts        # Family relationships
├── finances.ts      # Financial data (goals, transactions)
├── games.ts         # Game state and progress
├── ui.ts            # UI state (modals, navigation)
└── settings.ts      # App preferences
```

### State Slice Pattern
```typescript
// ✅ Organize related state into slices
const useAuthStore = create((set, get) => ({
  // Auth state
  user: null,
  token: null,
  isAuthenticated: false,

  // Auth actions
  login: async (credentials) => {
    const response = await api.login(credentials);
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true
    });
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  }
}));
```

## 🔄 State Synchronization Rules

### Server State Management
```typescript
// ✅ Synchronize with server state
const useGoalsStore = create((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  // Server sync actions
  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const goals = await api.getGoals();
      set({ goals, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createGoal: async (goalData) => {
    const newGoal = await api.createGoal(goalData);
    set((state) => ({
      goals: [...state.goals, newGoal]
    }));
  },

  updateGoal: async (id, updates) => {
    const updatedGoal = await api.updateGoal(id, updates);
    set((state) => ({
      goals: state.goals.map(goal =>
        goal.id === id ? updatedGoal : goal
      )
    }));
  }
}));
```

### Optimistic Updates
```typescript
// ✅ Optimistic updates for better UX
const useTasksStore = create((set, get) => ({
  tasks: [],

  toggleTask: async (taskId) => {
    const { tasks } = get();

    // Optimistic update
    const task = tasks.find(t => t.id === taskId);
    const optimisticTask = { ...task, completed: !task.completed };

    set({
      tasks: tasks.map(t => t.id === taskId ? optimisticTask : t)
    });

    try {
      // Server update
      await api.updateTask(taskId, { completed: optimisticTask.completed });
    } catch (error) {
      // Revert on failure
      set({ tasks });
      throw error;
    }
  }
}));
```

## 🔄 State Persistence Rules

### Persistent State Strategy
```typescript
// ✅ Persist important state to AsyncStorage
const usePersistentStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      notifications: true,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () =>
        set((state) => ({ notifications: !state.notifications }))
    }),
    {
      name: 'app-settings',
      // Only persist these fields
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notifications: state.notifications
      })
    }
  )
);
```

### Hydration Handling
```typescript
// ✅ Handle hydration safely
const useHydratedStore = create((set, get) => ({
  _hasHydrated: false,

  setHasHydrated: (state) => {
    set({ _hasHydrated: true });
  },

  // Only expose data after hydration
  get user() {
    const { _hasHydrated, user } = get();
    return _hasHydrated ? user : null;
  }
}));
```

## 🔄 State Communication Patterns

### Store Communication
```typescript
// ✅ Cross-store communication
const useFamilyStore = create((set, get) => ({
  family: null,

  setFamily: (family) => {
    set({ family });

    // Update related stores
    const userStore = get().userStore;
    if (userStore) {
      userStore.updateFamilyMembers(family.members);
    }
  }
}));

const useUserStore = create((set, get) => ({
  user: null,

  updateFamilyMembers: (members) => {
    // Update user relationships
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        familyMembers: members
      };
      set({ user: updatedUser });
    }
  }
}));
```

### Event-Driven State Updates
```typescript
// ✅ Event-driven updates
const useNotificationStore = create((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    set((state) => ({
      notifications: [...state.notifications, notification]
    }));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      get().removeNotification(notification.id);
    }, 5000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }
}));
```

## 🔄 State Testing Patterns

### Store Testing
```typescript
// ✅ Test store logic
describe('useUserStore', () => {
  it('should set user correctly', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle logout', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser(mockUser);
      result.current.logout();
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### State Integration Testing
```typescript
// ✅ Test state interactions
describe('State Integration', () => {
  it('should update related stores when family changes', () => {
    const { result: familyResult } = renderHook(() => useFamilyStore());
    const { result: userResult } = renderHook(() => useUserStore());

    act(() => {
      familyResult.current.setFamily(mockFamily);
    });

    expect(userResult.current.user.familyMembers)
      .toEqual(mockFamily.members);
  });
});
```

## 🔄 Performance Optimization

### State Selector Patterns
```typescript
// ✅ Use selectors to prevent unnecessary re-renders
const useSelectedData = () => {
  return useStore((state) => ({
    userName: state.user?.name,
    userAvatar: state.user?.avatar,
    isOnline: state.user?.isOnline
  }));
};
```

### State Batching
```typescript
// ✅ Batch multiple state updates
const useBulkUpdateStore = create((set, get) => ({
  items: [],

  bulkUpdate: (updates) => {
    set((state) => {
      const newItems = [...state.items];
      updates.forEach(update => {
        const index = newItems.findIndex(item => item.id === update.id);
        if (index !== -1) {
          newItems[index] = { ...newItems[index], ...update };
        }
      });
      return { items: newItems };
    });
  }
}));
```

## 🔄 State Migration Patterns

### Versioned State
```typescript
// ✅ Handle state migrations
const useMigratedStore = create(
  persist(
    (set, get) => ({
      version: 1,
      data: {},

      migrate: () => {
        const currentVersion = get().version;
        if (currentVersion < 2) {
          // Migration logic for version 2
          set((state) => ({
            ...state,
            version: 2,
            // Transform old data structure to new
          }));
        }
      }
    }),
    {
      name: 'app-data',
      version: 2,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return { ...persistedState, version: 1 };
        }
        return persistedState;
      }
    }
  )
);
```

This comprehensive state management system ensures predictable, maintainable, and performant state handling across your entire application.
