import { useTheme } from '@/utils/themeContext';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import RNRestart from 'react-native-restart'; // Temporarily commented out due to import issues

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log to external service in production
    if (!__DEV__) {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E53935',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#6A49F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reportButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  reportButtonText: {
    color: '#6A49F3',
    fontSize: 14,
    fontWeight: '500',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  restartButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    minWidth: 120,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const ErrorFallback: React.FC<{
  error: Error | null;
  retryCount: number;
  onRetry: () => void;
}> = ({ error, retryCount, onRetry }) => {
  const { themeColors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={[styles.errorEmoji, { color: themeColors.error }]}>😵</Text>
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>
          Oops! Something went wrong
        </Text>
        <Text style={[styles.errorMessage, { color: themeColors.textSecondary }]}>
          {retryCount < 3 ?
            "Don't worry, this happens sometimes. Let's try again!" :
            "We're having trouble. Please restart the app."
          }
        </Text>

        {retryCount < 3 && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
            onPress={onRetry}
          >
            <Text style={[styles.retryButtonText, { color: themeColors.card }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.restartButton, { borderColor: themeColors.secondary }]}
          onPress={() => {
            // For now, just show an alert - in production you'd restart the app
            alert('Please restart the app manually by closing and reopening it.');
          }}
        >
          <Text style={[styles.restartButtonText, { color: themeColors.secondary }]}>
            Restart App
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ErrorBoundary;
