# 🧭 Navigation Rules

## 🎯 Navigation Architecture Standards

### Expo Router File-Based Routing
```
# File-based routing structure
app/
├── _layout.tsx              # Root layout with navigation container
├── index.tsx               # Home screen (/)
├── login.tsx              # Login screen (/login)
├── (auth)/                # Auth group (not in tab bar)
│   ├── signup.tsx
│   └── forgot-password.tsx
├── (tabs)/                # Tab-based navigation
│   ├── _layout.tsx       # Tab layout
│   ├── index.tsx         # Home tab
│   ├── profile.tsx       # Profile tab
│   └── settings.tsx      # Settings tab
└── modal.tsx             # Modal screen
```

### Route Protection Patterns
```typescript
// ✅ Authentication-based routing
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <ProtectedScreen />;
}
```

### Role-Based Navigation
```typescript
// ✅ Parent/Child navigation separation
import { useAuth } from '@/hooks/useAuth';

export default function AppLayout() {
  const { user } = useAuth();

  if (user?.role === 'parent') {
    return <ParentTabLayout />;
  }

  if (user?.role === 'child') {
    return <ChildTabLayout />;
  }

  return <AuthLayout />;
}
```

## 🔄 Navigation Patterns

### Deep Linking Support
```typescript
// ✅ Deep linking configuration
import * as Linking from 'expo-linking';

const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: '',
      Profile: 'profile',
      Settings: 'settings',
      NotFound: '*',
    },
  },
};

// Usage in navigation
<NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
  <Stack.Navigator>
    {/* Screens */}
  </Stack.Navigator>
</NavigationContainer>
```

### Navigation State Management
```typescript
// ✅ Navigation state persistence
import { useNavigationState } from '@react-navigation/native';

const useNavigationPersistence = () => {
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
        const state = savedStateString ? JSON.parse(savedStateString) : undefined;

        if (state !== undefined) {
          setInitialState(state);
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  return { isReady, initialState };
};
```

### Conditional Navigation
```typescript
// ✅ Feature-based navigation
const useConditionalNavigation = () => {
  const navigation = useNavigation();
  const { user, features } = useAuth();

  const navigateToFeature = (featureName: string) => {
    if (!features.includes(featureName)) {
      navigation.navigate('Upgrade');
      return;
    }

    switch (featureName) {
      case 'goals':
        navigation.navigate('Goals');
        break;
      case 'rewards':
        navigation.navigate('Rewards');
        break;
      default:
        navigation.navigate('Home');
    }
  };

  return { navigateToFeature };
};
```

## 🎨 Navigation Theming

### Custom Header Styles
```typescript
// ✅ Consistent header styling
const screenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.surface,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: theme.colors.text,
  headerTitleStyle: {
    ...theme.typography['type-heading-medium'],
    color: theme.colors.text,
  },
  headerBackTitleVisible: false,
  headerLeft: () => <BackButton />,
};

// Usage
<Stack.Navigator screenOptions={screenOptions}>
  {/* Screens */}
</Stack.Navigator>
```

### Tab Bar Customization
```typescript
// ✅ Custom tab bar styling
const tabBarOptions = {
  activeTintColor: theme.colors.primary,
  inactiveTintColor: theme.colors.textSecondary,
  style: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  labelStyle: {
    ...theme.typography['type-label-small'],
  },
};

// Usage
<Tab.Navigator tabBarOptions={tabBarOptions}>
  {/* Tab screens */}
</Tab.Navigator>
```

## 🔄 Navigation Hooks

### Custom Navigation Hooks
```typescript
// ✅ Reusable navigation hooks
export const useAppNavigation = () => {
  const navigation = useNavigation();

  const navigateToUser = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const resetToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return {
    navigateToUser,
    goBack,
    resetToHome,
  };
};
```

### Route Parameter Hooks
```typescript
// ✅ Type-safe route parameters
export const useRouteParams = <T extends Record<string, any>>() => {
  const route = useRoute();
  return route.params as T;
};

// Usage
const ProfileScreen = () => {
  const { userId, editMode } = useRouteParams<{ userId: string; editMode?: boolean }>();

  // Component logic
};
```

## 🎯 Navigation Best Practices

### Loading States
```typescript
// ✅ Navigation loading states
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <MainNavigator />;
};
```

### Error Boundaries
```typescript
// ✅ Navigation error boundaries
class NavigationErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log navigation errors
    console.error('Navigation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
```

### Performance Optimization
```typescript
// ✅ Lazy loading screens
const LazyProfileScreen = lazy(() => import('../screens/ProfileScreen'));

// ✅ Screen preloading
const useScreenPreloader = () => {
  const navigation = useNavigation();

  const preloadScreen = (screenName: string) => {
    // Preload screen assets
    // Cache data if needed
  };

  return { preloadScreen };
};
```

## 🧪 Navigation Testing

### Navigation Testing Patterns
```typescript
// ✅ Navigation testing
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

const renderWithNavigation = (component, options = {}) => {
  const Wrapper = ({ children }) => (
    <NavigationContainer {...options}>
      {children}
    </NavigationContainer>
  );

  return render(component, { wrapper: Wrapper });
};

describe('Navigation', () => {
  it('navigates to profile screen', () => {
    const { getByText } = renderWithNavigation(<HomeScreen />);

    fireEvent.press(getByText('Go to Profile'));
    // Assert navigation occurred
  });
});
```

### Deep Link Testing
```typescript
// ✅ Deep link testing
describe('Deep Linking', () => {
  it('handles profile deep link', () => {
    const { getByText } = renderWithNavigation(<App />, {
      initialState: {
        routes: [{ name: 'Profile', params: { userId: '123' } }],
      },
    });

    expect(getByText('User Profile')).toBeTruthy();
  });
});
```

This navigation framework ensures consistent, accessible, and performant navigation throughout your React Native application.
