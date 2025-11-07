# 🌐 API Integration Rules

## 🎯 API Architecture Standards

### Request/Response Patterns
```typescript
// ✅ Standardized API response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ✅ Consistent error handling
interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}
```

### HTTP Client Configuration
```typescript
// ✅ Axios instance with interceptors
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);
```

## 🔄 Data Fetching Patterns

### React Query/SWR Integration
```typescript
// ✅ Server state management
const useUserData = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.get(`/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ✅ Mutation with optimistic updates
const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserData) =>
      apiClient.patch('/users/profile', data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['user']);

      // Optimistically update
      queryClient.setQueryData(['user'], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousData };
    },
    onError: (err, newData, context) => {
      // Revert on error
      if (context?.previousData) {
        queryClient.setQueryData(['user'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
```

### API Service Layer
```typescript
// ✅ Centralized API services
class ApiService {
  // Authentication
  static async login(credentials: LoginCredentials) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }

  static async refreshToken() {
    const refreshToken = await getRefreshToken();
    const response = await apiClient.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  // User management
  static async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }

  static async updateProfile(data: UpdateProfileData) {
    const response = await apiClient.patch('/auth/profile', data);
    return response.data;
  }

  // Family management
  static async getFamilyMembers() {
    const response = await apiClient.get('/users/children');
    return response.data;
  }

  static async addChild(childData: CreateChildData) {
    const response = await apiClient.post('/auth/create-child', childData);
    return response.data;
  }
}
```

## 🔐 Authentication & Security

### Token Management
```typescript
// ✅ Secure token storage and management
class AuthService {
  static async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  static async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('accessToken', token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  static async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) return null;

      const response = await apiClient.post('/auth/refresh', {
        refreshToken,
      });

      const newToken = response.data.token;
      await this.setToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      // Clear user data from stores
      userStore.getState().clearUser();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}
```

### Request/Response Transformation
```typescript
// ✅ Data transformation layer
class DataTransformer {
  static transformUserResponse(apiResponse: any): User {
    return {
      id: apiResponse.id,
      name: apiResponse.name,
      email: apiResponse.email,
      role: apiResponse.role,
      avatar: apiResponse.avatar || null,
      familyId: apiResponse.familyId,
      createdAt: new Date(apiResponse.createdAt),
      updatedAt: new Date(apiResponse.updatedAt),
    };
  }

  static transformFamilyResponse(apiResponse: any): Family {
    return {
      id: apiResponse.id,
      name: apiResponse.name,
      members: apiResponse.members.map(this.transformUserResponse),
      settings: apiResponse.settings,
      createdAt: new Date(apiResponse.createdAt),
    };
  }

  static transformApiError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        code: error.response.data?.code || 'API_ERROR',
        message: error.response.data?.message || error.message,
        statusCode: error.response.status,
        details: error.response.data?.details,
      };
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        statusCode: 0,
      };
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred.',
        statusCode: 0,
      };
    }
  }
}
```

## 🔄 Synchronization Patterns

### Offline Queue Management
```typescript
// ✅ Offline request queuing
class OfflineQueue {
  private static queue: QueuedRequest[] = [];
  private static isProcessing = false;

  static async addRequest(request: QueuedRequest): Promise<void> {
    this.queue.push(request);
    await this.persistQueue();

    if (!this.isProcessing && navigator.onLine) {
      this.processQueue();
    }
  }

  static async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && navigator.onLine) {
        const request = this.queue.shift();
        if (request) {
          try {
            await this.executeRequest(request);
          } catch (error) {
            // Re-queue failed requests
            this.queue.unshift(request);
            break;
          }
        }
      }
    } finally {
      this.isProcessing = false;
      await this.persistQueue();
    }
  }

  private static async executeRequest(request: QueuedRequest): Promise<void> {
    const response = await apiClient.request({
      method: request.method,
      url: request.url,
      data: request.data,
    });

    // Update local state with server response
    if (request.onSuccess) {
      request.onSuccess(response.data);
    }
  }

  private static async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }
}
```

### Real-time Updates
```typescript
// ✅ WebSocket/SSE integration
class RealTimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string): void {
    try {
      this.ws = new WebSocket(`${WS_BASE_URL}?userId=${userId}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'goal_updated':
        // Update goal in store
        goalStore.getState().updateGoal(message.data);
        break;
      case 'family_member_added':
        // Update family store
        familyStore.getState().addMember(message.data);
        break;
      case 'notification':
        // Add notification
        notificationStore.getState().addNotification(message.data);
        break;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        // Reconnect logic
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }
}
```

## 🧪 API Testing Standards

### Integration Test Patterns
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

    it('should return 403 for unauthorized access', async () => {
      const token = generateTestToken('different-family-user');

      await request(app)
        .get('/api/users/other-family-user')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
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

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Test User',
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('required');
    });
  });
});

// ✅ Mock API responses for component testing
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

  it('should handle API errors gracefully', async () => {
    api.getUser.mockRejectedValue(new Error('API Error'));

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
    });
  });
});
```

This comprehensive API integration framework ensures reliable, secure, and maintainable communication between your mobile app and backend services.
