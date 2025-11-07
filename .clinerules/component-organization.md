# 📦 Component Organization Rules

## 🏗 Component Architecture Standards

### Component File Structure
```
components/
├── ComponentName/
│   ├── ComponentName.tsx           # Main component file
│   ├── ComponentName.styles.ts     # Styled components or StyleSheet
│   ├── ComponentName.types.ts      # TypeScript interfaces/types
│   ├── index.ts                    # Export file
│   └── ComponentName.test.tsx      # Unit tests
```

### Component Categories

#### 🎨 UI Components (`components/ui/`)
- Basic building blocks: Button, Input, Card, Modal, etc.
- Pure functional components
- No business logic
- Highly reusable across the app

#### 📱 Screen Components (`components/`)
- Page-level components
- Contain business logic
- Handle data fetching and state
- May contain multiple UI components

#### 🎯 Feature Components (`components/`)
- Business logic components
- Feature-specific functionality
- May contain multiple UI/screen components
- Self-contained feature modules

#### 🎪 Specialized Components
```
components/
├── forms/          # Form components (LoginForm, SignupForm)
├── modals/         # Modal components (ErrorModal, ConfirmModal)
├── charts/         # Data visualization (AnalyticsChart, GoalProgressChart)
├── games/          # Game components (CoinMatchingFrenzy, MoneyRainCatcher)
├── cultural/       # Cultural components (DiwaliLightSavings, HoliColorEconomics)
├── animations/     # Animation components
├── patterns/       # Layout patterns (SwipeNavigator, Breadcrumbs)
```

## 🔧 Component Development Rules

### Component Creation Checklist
- [ ] **Single Responsibility**: One component = one purpose
- [ ] **Props Interface**: Define TypeScript interface for props
- [ ] **Default Props**: Provide sensible defaults
- [ ] **Error Boundaries**: Wrap complex components
- [ ] **Accessibility**: Include accessibility props
- [ ] **Testing**: Create corresponding test file
- [ ] **Documentation**: JSDoc comments for complex logic

### Component Naming Conventions
```typescript
// ✅ Good naming patterns
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  onPress: () => void;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  onPress
}) => { ... }

// ✅ Consistent file naming
Button.tsx           // Main component
Button.styles.ts     // Styles
Button.types.ts      // Types
Button.test.tsx      // Tests
Button.stories.tsx   // Storybook (optional)
```

### Props Design Patterns

#### Required vs Optional Props
```typescript
// ✅ Clear prop requirements
interface CardProps {
  title: string;           // Required
  content?: string;        // Optional
  variant?: CardVariant;   // Optional with default
  onPress?: () => void;    // Optional callback
}
```

#### Children Props Pattern
```typescript
// ✅ Flexible children handling
interface CardProps {
  title: string;
  children: React.ReactNode;  // Flexible content
}

const Card: React.FC<CardProps> = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.content}>{children}</View>
  </View>
);

// Usage
<Card title="My Card">
  <Text>Custom content here</Text>
  <Button title="Action" />
</Card>
```

#### Render Props Pattern
```typescript
// ✅ Advanced customization
interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
}
```

### State Management in Components

#### Local State Rules
```typescript
// ✅ Use useState for local component state
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ✅ Use useReducer for complex local state
const [state, dispatch] = useReducer(reducer, initialState);
```

#### Global State Rules
```typescript
// ✅ Use Zustand stores for global state
const useUserStore = create((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

### Styling Patterns

#### StyleSheet Organization
```typescript
// ✅ Group related styles
const styles = StyleSheet.create({
  // Layout styles
  container: {
    flex: 1,
    padding: 16,
  },

  // Component styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
  },

  // Text styles
  title: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
});
```

#### Theme Integration
```typescript
// ✅ Use theme colors, never hardcoded colors
const themedStyles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,    // ✅ Theme-based
    // backgroundColor: '#007AFF',             // ❌ Hardcoded
  },
});
```

### Performance Optimization Patterns

#### Memoization Rules
```typescript
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0);
}, [data]);

// ✅ Memoize callback functions
const handlePress = useCallback(() => {
  navigation.navigate('Details', { id: item.id });
}, [navigation, item.id]);

// ✅ Memoize components when appropriate
const MemoizedComponent = React.memo(Component);
```

#### List Optimization
```typescript
// ✅ Optimize FlatList performance
<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
/>
```

### Error Handling Patterns

#### Error Boundaries
```typescript
// ✅ Wrap components that might fail
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to service
    errorReporting.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
```

#### Error States in Components
```typescript
// ✅ Handle loading and error states
const MyComponent: React.FC<Props> = () => {
  const { data, loading, error, refetch } = useData();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return <DataDisplay data={data} />;
};
```

### Testing Patterns

#### Component Testing Structure
```typescript
// ✅ Comprehensive component testing
import { render, fireEvent, waitFor } from '@testing-library/react-native';

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Test" onPress={onPressMock} />
    );

    fireEvent.press(getByText('Test'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { getByTestId } = render(<Button loading={true} />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### Accessibility Standards

#### Screen Reader Support
```typescript
// ✅ Essential accessibility props
<Button
  accessible={true}
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit your information"
  accessibilityRole="button"
/>

// ✅ Image accessibility
<Image
  source={icon}
  accessible={true}
  accessibilityLabel="User profile picture"
/>
```

#### Touch Target Requirements
```typescript
// ✅ Minimum touch target size (44x44pt)
const styles = StyleSheet.create({
  touchable: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
```

### Component Composition Patterns

#### Higher-Order Components (HOC)
```typescript
// ✅ Create reusable HOCs
const withLoading = (WrappedComponent) => {
  return (props) => {
    const [loading, setLoading] = useState(false);

    return (
      <WrappedComponent
        {...props}
        loading={loading}
        setLoading={setLoading}
      />
    );
  };
};
```

#### Render Props Pattern
```typescript
// ✅ Flexible component composition
interface DataProviderProps {
  children: (data: Data, loading: boolean) => React.ReactElement;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, loading] = useData();

  return children(data, loading);
};

// Usage
<DataProvider>
  {(data, loading) => loading ? <Spinner /> : <DataList data={data} />}
</DataProvider>
```

### Component Lifecycle Rules

#### Cleanup Rules
```typescript
// ✅ Always cleanup subscriptions and timers
useEffect(() => {
  const subscription = subscribeToData();

  return () => {
    subscription.unsubscribe();  // ✅ Cleanup
  };
}, []);

// ✅ Cleanup intervals
useEffect(() => {
  const interval = setInterval(fetchData, 30000);

  return () => {
    clearInterval(interval);  // ✅ Cleanup
  };
}, []);
```

#### Dependency Array Rules
```typescript
// ✅ Include all dependencies
useEffect(() => {
  fetchUser(userId);
}, [userId]);  // ✅ Correct

// ❌ Missing dependencies
useEffect(() => {
  fetchUser(userId);
}, []);  // ❌ Wrong - missing userId
```

### Export Patterns

#### Barrel Exports
```typescript
// ✅ Use index.ts for clean imports
// components/ui/index.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Card } from './Card';

// ✅ Clean imports
import { Button, Input, Card } from '@/components/ui';
```

#### Default vs Named Exports
```typescript
// ✅ Prefer named exports for better tree shaking
export const Button = (props) => <TouchableOpacity {...props} />;
export const Input = (props) => <TextInput {...props} />;

// ✅ Use default export only for page components
const LoginScreen = () => { ... };
export default LoginScreen;
```

This comprehensive component organization system ensures maintainable, scalable, and high-quality React Native applications.
