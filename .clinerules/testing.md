# 🧪 Testing Rules

## 🎯 Testing Strategy

### Testing Pyramid
```
End-to-End Tests (5%)
  ↳ User journey validation
  ↳ Critical path testing
  ↳ Cross-platform compatibility

Integration Tests (15%)
  ↳ API endpoint testing
  ↳ Component integration
  ↳ State management testing
  ↳ Database operations

Unit Tests (80%)
  ↳ Component rendering
  ↳ Business logic
  ↳ Utility functions
  ↳ Hook testing
```

### Coverage Requirements
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: 15% coverage
- **E2E Tests**: 5% coverage
- **Critical Paths**: 100% coverage

## 🔧 Testing Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
  ],
};
```

### React Native Testing Library Setup
```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: { name: 'TestApp' },
}));

// Global test utilities
global.fetch = jest.fn();
```

## 🧩 Component Testing Patterns

### Basic Component Testing
```typescript
// ✅ Component rendering test
import { render } from '@testing-library/react-native';

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

### Hook Testing
```typescript
// ✅ Custom hook testing
import { renderHook, act } from '@testing-library/react-native';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement counter', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

### Async Testing
```typescript
// ✅ Async operations testing
describe('UserProfile Component', () => {
  it('loads user data', async () => {
    const mockUser = { id: '1', name: 'John' };
    // Mock API call
    jest.spyOn(api, 'getUser').mockResolvedValue(mockUser);

    const { findByText } = render(<UserProfile userId="1" />);

    expect(await findByText('John')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const { getByTestId } = render(<UserProfile userId="1" />);
    expect(getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    jest.spyOn(api, 'getUser').mockRejectedValue(new Error('API Error'));

    const { findByText } = render(<UserProfile userId="1" />);

    expect(await findByText('Failed to load user')).toBeInTheDocument();
  });
});
```

## 🌐 API Testing Patterns

### Endpoint Testing
```typescript
// ✅ API endpoint testing
describe('User API', () => {
  beforeEach(() => {
    // Setup test database
    // Mock external services
  });

  describe('GET /users/:id', () => {
    it('should return user data for authenticated request', async () => {
      const userId = 'test-user-id';
      const token = generateTestToken(userId);

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });

    it('should return 404 for non-existent user', async () => {
      const token = generateTestToken('test-user-id');

      await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /users', () => {
    it('should create new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'securePassword123',
        role: 'parent',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');
    });
  });
});
```

### Mock Setup
```typescript
// ✅ API mocking for component tests
jest.mock('../services/api', () => ({
  getUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

describe('UserProfile Component', () => {
  beforeEach(() => {
    // Reset mocks
    api.getUser.mockReset();
    api.updateUser.mockReset();
  });

  it('should display user data when loaded', async () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    api.getUser.mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });
});
```

## 📱 Navigation Testing

### Navigation Testing
```typescript
// ✅ Navigation flow testing
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

  it('handles deep links', () => {
    const { getByText } = renderWithNavigation(<App />, {
      initialState: {
        routes: [{ name: 'Profile', params: { userId: '123' } }],
      },
    });

    expect(getByText('User Profile')).toBeTruthy();
  });
});
```

## 🎪 State Testing

### Zustand Store Testing
```typescript
// ✅ Store testing
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
// ✅ Cross-store interaction testing
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

## 🎮 Game Testing

### Game Component Testing
```typescript
// ✅ Game interaction testing
describe('CoinMatchingFrenzy', () => {
  it('should track correct matches', () => {
    const { getByTestId } = render(<CoinMatchingFrenzy />);

    // Simulate game interactions
    fireEvent.press(getByTestId('coin-1'));
    fireEvent.press(getByTestId('coin-2'));

    expect(getByTestId('score')).toHaveTextContent('2');
  });

  it('should handle game completion', () => {
    const onComplete = jest.fn();
    const { getByText } = render(
      <CoinMatchingFrenzy onComplete={onComplete} />
    );

    // Complete all matches
    // ...

    expect(onComplete).toHaveBeenCalledWith({
      score: 100,
      time: expect.any(Number),
      stars: 3,
    });
  });
});
```

### Animation Testing
```typescript
// ✅ Animation testing
describe('Animated Components', () => {
  it('should animate on press', () => {
    const { getByTestId } = render(<AnimatedButton />);

    fireEvent.press(getByTestId('button'));

    // Check animation styles
    expect(getByTestId('button')).toHaveStyle({
      transform: [{ scale: 0.95 }],
    });
  });
});
```

## 📊 Test Utilities

### Custom Test Helpers
```typescript
// ✅ Test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'parent',
  ...overrides,
});

export const renderWithTheme = (component) => {
  const Wrapper = ({ children }) => (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );

  return render(component, { wrapper: Wrapper });
};

export const renderWithNavigation = (component, options = {}) => {
  const Wrapper = ({ children }) => (
    <NavigationContainer {...options}>
      {children}
    </NavigationContainer>
  );

  return render(component, { wrapper: Wrapper });
};

export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
};
```

### Test Data Factories
```typescript
// ✅ Test data factories
export const createMockGoal = (overrides = {}) => ({
  id: 'goal-123',
  name: 'Save for Bike',
  targetAmount: 2000,
  currentAmount: 500,
  status: 'active',
  jar: 'save',
  user: 'user-123',
  ...overrides,
});

export const createMockReward = (overrides = {}) => ({
  id: 'reward-123',
  name: 'Movie Night',
  cost: 50,
  category: 'experience',
  available: true,
  purchased: false,
  ...overrides,
});
```

## 🚀 CI/CD Testing

### GitHub Actions Testing
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Test Reporting
```typescript
// ✅ Coverage reporting
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

This comprehensive testing framework ensures reliable, maintainable, and high-quality React Native applications.
