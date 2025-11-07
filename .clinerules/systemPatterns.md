# 🏗 System Architecture & Patterns

## 📊 System Architecture

### Overall Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │     Express     │    │    MongoDB      │
│     (Mobile)    │◄──►│     (API)       │◄──►│    (Database)   │
│                 │    │                 │    │                 │
│ • Expo Router   │    │ • RESTful API   │    │ • Atlas Cloud   │
│ • Zustand       │    │ • JWT Auth      │    │ • Indexing      │
│ • File-based    │    │ • Rate Limiting │    │ • Aggregation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture
```
📱 Mobile App Structure
├── 🏠 App Router (File-based routing)
├── 🧩 Components
│   ├── 🎨 UI Components (Buttons, Cards, Forms)
│   ├── 📱 Screen Components (Pages)
│   ├── 🎯 Feature Components (Business logic)
│   └── 🔄 Shared Components (Common utilities)
├── 🎪 State Management (Zustand stores)
├── 🌐 API Layer (Axios interceptors)
└── 🛠 Utilities (Helpers, Constants, Types)
```

## 🔄 Design Patterns

### State Management Pattern
```javascript
// Zustand Store Pattern
const useStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,

  // Actions
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const result = await api.getData();
      set({ data: result, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Computed values
  get processedData() {
    const { data } = get();
    return data ? processData(data) : null;
  }
}));
```

### API Service Pattern
```javascript
// Axios Service Pattern
class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### Component Pattern
```javascript
// Component with proper TypeScript and error boundaries
interface ComponentProps {
  data: DataType;
  onAction: (action: ActionType) => void;
}

const MyComponent: React.FC<ComponentProps> = ({ data, onAction }) => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <View style={styles.container}>
        <Text>{data.title}</Text>
        <Button onPress={() => onAction('submit')}>
          <Text>Submit</Text>
        </Button>
      </View>
    </ErrorBoundary>
  );
};
```

## 🗂 File Organization Patterns

### Component File Structure
```
components/
├── Button/
│   ├── Button.tsx           # Main component
│   ├── Button.styles.ts     # Styles
│   ├── Button.types.ts      # TypeScript types
│   ├── index.ts            # Export file
│   └── Button.test.tsx     # Unit tests
```

### Screen File Structure
```
app/
├── dashboard/
│   ├── page.tsx            # Main screen
│   ├── loading.tsx         # Loading state
│   ├── error.tsx           # Error state
│   ├── components/         # Screen-specific components
│   └── hooks/             # Screen-specific hooks
```

### API File Structure
```
services/
├── api/
│   ├── client.ts           # Axios client setup
│   ├── endpoints.ts        # API endpoint constants
│   └── interceptors.ts     # Request/response interceptors
├── features/
│   ├── auth.ts             # Authentication API calls
│   ├── users.ts            # User management API calls
│   └── data.ts             # Data operations API calls
```

## 🔐 Security Patterns

### Authentication Flow
```javascript
// JWT Token Management
const auth = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token, refreshToken } = response.data;

    // Store securely
    await SecureStore.setItemAsync('accessToken', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    return response.data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  getToken: async () => {
    return await SecureStore.getItemAsync('accessToken');
  }
};
```

### Data Validation Pattern
```javascript
// Joi Schema Validation
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
  role: Joi.string().valid('parent', 'child').default('parent')
});

const validateUser = (data) => {
  const { error, value } = userSchema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return value;
};
```

## 🚀 Performance Patterns

### Image Optimization
```javascript
// Responsive Image Component
const OptimizedImage = ({ source, style, ...props }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Image
      source={source}
      style={[style, !imageLoaded && { opacity: 0 }]}
      onLoad={() => setImageLoaded(true)}
      resizeMode="cover"
      progressiveRenderingEnabled={true}
      {...props}
    />
  );
};
```

### List Virtualization
```javascript
// FlatList Optimization
const OptimizedList = ({ data, renderItem }) => {
  const keyExtractor = useCallback((item, index) => item.id || index.toString(), []);
  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
    />
  );
};
```

## 🧪 Testing Patterns

### Unit Test Pattern
```javascript
// Component Testing
import { render, fireEvent } from '@testing-library/react-native';

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
});
```

### API Testing Pattern
```javascript
// API Integration Test
describe('User API', () => {
  it('creates user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(userData.email);
  });
});
```

## 📱 Platform-Specific Patterns

### iOS/Android Conditional Code
```javascript
import { Platform } from 'react-native';

// Platform-specific styling
const styles = StyleSheet.create({
  container: {
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

// Platform-specific behavior
const handleNotification = () => {
  if (Platform.OS === 'ios') {
    // iOS notification handling
  } else {
    // Android notification handling
  }
};
