# 🚀 Performance Rules

## 🎯 Performance Optimization Standards

### Bundle Optimization
- **Bundle Size**: < 15MB (APK)
- **Startup Time**: < 3 seconds
- **Memory Usage**: < 100MB
- **Battery Impact**: Minimal

## 📱 Mobile Performance

### Image Optimization
```typescript
// ✅ Optimized image component
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
```typescript
// ✅ FlatList optimization
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

### Component Memoization
```typescript
// ✅ Prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component);

const ExpensiveComponent = useMemo(() => (
  <ComplexCalculation data={data} />
), [data]);

const callback = useCallback(() => {
  doSomething(dependency);
}, [dependency]);
```

## 🔄 State Performance

### Selector Patterns
```typescript
// ✅ Prevent store re-renders
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
// ✅ Batch multiple updates
const useBulkUpdateStore = create((set, get) => ({
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

## 🌐 Network Performance

### Request Optimization
```typescript
// ✅ Request deduplication
const useDebouncedSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchAPI(query),
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000,
  });
};
```

### Caching Strategies
```typescript
// ✅ Intelligent caching
const useUserData = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## 🎮 Game Performance

### Animation Optimization
```typescript
// ✅ Use native animations
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: sharedValue.value }],
}));
```

### Game State Optimization
```typescript
// ✅ Efficient game loops
const useGameLoop = (callback: () => void, fps = 60) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
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
  }, [callback, fps]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
};
```

## 📊 Performance Monitoring

### Metrics Tracking
```typescript
// ✅ Performance monitoring
const usePerformanceMonitor = () => {
  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();

    useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16.67) { // Slower than 60fps
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    });
  }, []);

  return { measureRenderTime };
};
```

### Memory Monitoring
```typescript
// ✅ Memory leak detection
const useMemoryMonitor = () => {
  const monitorMemory = useCallback(() => {
    if (__DEV__) {
      // Log memory usage in development
      console.log('Memory usage:', performance.memory);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(monitorMemory, 30000);
    return () => clearInterval(interval);
  }, [monitorMemory]);
};
```

## 🔧 Code Splitting

### Route-Based Splitting
```typescript
// ✅ Lazy load routes
const LazyProfileScreen = lazy(() =>
  import('../screens/ProfileScreen')
);

const LazyGameScreen = lazy(() =>
  import('../games/CoinMatchingFrenzy')
);

// ✅ Component lazy loading
const LazyHeavyComponent = lazy(() =>
  import('../components/HeavyChart')
);
```

### Bundle Analysis
```typescript
// ✅ Bundle size monitoring
if (__DEV__) {
  // Log bundle size in development
  console.log('Bundle size monitoring enabled');
}
```

This comprehensive performance framework ensures your app runs smoothly across all devices and network conditions.
