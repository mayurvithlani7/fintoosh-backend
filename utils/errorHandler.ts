/**
 * Centralized error handler for consistent API error handling across the app.
 * Provides standardized error parsing, user-friendly messages, and consistent error handling patterns.
 * Enhanced with error categorization, offline detection, and recovery actions.
 * Now uses centered message system instead of Alert.alert.
 */


export interface ErrorHandlerOptions {
  showMessage?: (message: string, type?: 'success' | 'error' | 'info') => void; // For centered message system
  showError?: (message: string) => void; // Legacy support for hook-based error display
  useAlert?: boolean; // Deprecated - now uses centered messages
  feature?: string; // Feature name for logging
  silent?: boolean; // Don't show error to user
  showRetry?: boolean; // Show retry button/option
  showOfflineMessage?: boolean; // Show offline-specific messaging
  fallbackData?: any; // Data to use for graceful degradation
}

export interface ApiError {
  message: string;
  status?: number;
  retryAfter?: number;
  code?: string; // Error code for programmatic handling
  details?: any; // Additional error details
  type: 'network' | 'auth' | 'validation' | 'server' | 'rate-limit' | 'permission' | 'unknown';
  recoveryActions?: RecoveryAction[]; // Specific actions user can take
  canRetry?: boolean; // Whether the error supports retry
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean; // Whether this is the recommended action
}

export interface ParsedApiResponse {
  success: boolean;
  data?: any;
  error?: ApiError;
}

/**
 * Handles API response errors with consistent user messaging
 */
export async function handleApiError(
  response: Response,
  options: ErrorHandlerOptions = {}
): Promise<ApiError | null> {
  const { showMessage, showError, useAlert = true, feature = 'API' } = options;

  // Rate limiting (429) - special handling with retry timing
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) : 60;
    const message = `Too many requests. Please wait ${waitTime} seconds before trying again.`;

    console.warn(`[${feature}] Rate limited: ${message}`);

    if (showMessage) {
      showMessage(message, 'error');
    } else if (showError) {
      showError(message);
    } else if (useAlert) {
      const { Alert } = require('react-native');
      Alert.alert('Please Wait', message);
    }

    return {
      message,
      status: 429,
      retryAfter: waitTime,
      type: 'rate-limit' as const,
      canRetry: true,
      recoveryActions: [
        {
          label: `Wait ${waitTime} seconds and try again`,
          action: () => {
            // On mobile, we can't reload the page. Instead, show a message
            // The calling component should handle the retry logic
            console.log(`Rate limit will expire in ${waitTime} seconds. Please wait before retrying.`);
          },
          primary: true
        }
      ]
    };
  }

  // Authentication errors (401/403)
  if (response.status === 401 || response.status === 403) {
    const message = 'Your session has expired. Please log in again.';

    console.warn(`[${feature}] Authentication error: ${response.status}`);

    if (showMessage) {
      showMessage(message, 'error');
    } else if (showError) {
      showError(message);
    } else if (useAlert) {
      const { Alert } = require('react-native');
      Alert.alert('Session Expired', message);
    }

    return {
      message,
      status: response.status,
      type: 'auth' as const,
      canRetry: false,
      recoveryActions: [
        {
          label: 'Log in again',
          action: () => {
            // Navigate to login screen
            const { router } = require('expo-router');
            router.replace('/login');
          },
          primary: true
        }
      ]
    };
  }

  // Server errors (5xx)
  if (response.status >= 500) {
    const message = 'Server is temporarily unavailable. Please try again in a few moments.';

    console.error(`[${feature}] Server error: ${response.status}`);

    if (showMessage) {
      showMessage(message, 'error');
    } else if (showError) {
      showError(message);
    } else if (useAlert) {
      const { Alert } = require('react-native');
      Alert.alert('Server Error', message);
    }

    return {
      message,
      status: response.status,
      type: 'server' as const,
      canRetry: true,
      recoveryActions: [
        {
          label: 'Try again in a few moments',
          action: () => {
            // On mobile, we can't reload the page. Instead, show a message
            // The calling component should handle the retry logic
            console.log('Server temporarily unavailable. Please try again in a few moments.');
          },
          primary: true
        }
      ]
    };
  }

  // Client errors (4xx) - try to get server message, fallback to generic
  if (response.status >= 400 && response.status < 500) {
    let message = 'Request failed. Please try again.';

    try {
      const errorData = await response.json();
      if (errorData.message) {
        message = errorData.message;
      }
    } catch {
      // JSON parsing failed, use default message
    }

    console.error(`[${feature}] Client error: ${response.status} - ${message}`);

    if (showMessage) {
      showMessage(message, 'error');
    } else if (showError) {
      showError(message);
    } else if (useAlert) {
      const { Alert } = require('react-native');
      Alert.alert('Request Failed', message);
    }

    return {
      message,
      status: response.status,
      type: 'validation' as const,
      canRetry: false
    };
  }

  // Network/other errors not handled above
  return null;
}

/**
 * Handles general errors (not response-related) with consistent messaging
 */
export function handleGeneralError(
  error: any,
  context: string,
  options: ErrorHandlerOptions = {}
): void {
  const { showMessage, showError, useAlert = true, feature = 'General' } = options;

  console.error(`[${feature}] ${context}:`, error);

  // Network connectivity issues
  if (!navigator.onLine || error.name === 'NetworkError' || error.message?.includes('fetch')) {
    const message = 'No internet connection. Please check your connection and try again.';

    if (showMessage) {
      showMessage(message, 'error');
    } else if (showError) {
      showError(message);
    } else if (useAlert) {
      const { Alert } = require('react-native');
      Alert.alert('Connection Error', message);
    }
    return;
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    const message = 'Request timed out. Please try again.';

    if (showMessage) {
      showMessage(message, 'error');
    } else if (showError) {
      showError(message);
    } else if (useAlert) {
      const { Alert } = require('react-native');
      Alert.alert('Timeout', message);
    }
    return;
  }

  // Generic fallback
  const message = 'Something went wrong. Please try again.';

  if (showMessage) {
    showMessage(message, 'error');
  } else if (showError) {
    showError(message);
  } else if (useAlert) {
    const { Alert } = require('react-native');
    Alert.alert('Error', message);
  }
}

/**
 * Parses API response and returns standardized result with error handling
 */
export async function parseApiResponse<T = any>(
  response: Response,
  options: ErrorHandlerOptions = {}
): Promise<ParsedApiResponse> {
  const { feature = 'API' } = options;

  try {
    // Handle HTTP error status codes
    if (!response.ok) {
      const errorResult = await handleApiError(response, { ...options, silent: true });
      if (errorResult) {
        return {
          success: false,
          error: errorResult
        };
      }
    }

    // Parse response body
    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle non-JSON responses (like plain text)
      const textData = await response.text();
      data = textData as any;
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error(`[${feature}] Error parsing API response:`, error);

    const errorResult: ApiError = {
      message: 'Failed to process server response. Please try again.',
      code: 'PARSE_ERROR',
      type: 'unknown' as const,
      canRetry: true
    };

    if (!options.silent) {
      if (options.showMessage) {
        options.showMessage(errorResult.message, 'error');
      } else if (options.showError) {
        options.showError(errorResult.message);
      } else if (options.useAlert !== false) {
        const { Alert } = require('react-native');
        Alert.alert('Response Error', errorResult.message);
      }
    }

    return {
      success: false,
      error: errorResult
    };
  }
}

/**
 * Enhanced API request wrapper with automatic error parsing and handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  errorOptions: ErrorHandlerOptions = {}
): Promise<ParsedApiResponse> {
  const { feature = 'API' } = errorOptions;

  try {
    console.log(`[${feature}] Making request to: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return await parseApiResponse<T>(response, errorOptions);

  } catch (error) {
    console.error(`[${feature}] Network error for ${url}:`, error);

    const errorResult: ApiError = {
      message: 'Unable to connect to server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      type: 'network' as const,
      canRetry: true
    };

    if (!errorOptions.silent) {
      if (errorOptions.showMessage) {
        errorOptions.showMessage(errorResult.message, 'error');
      } else if (errorOptions.showError) {
        errorOptions.showError(errorResult.message);
      } else if (errorOptions.useAlert !== false) {
        const { Alert } = require('react-native');
        Alert.alert('Connection Error', errorResult.message);
      }
    }

    return {
      success: false,
      error: errorResult
    };
  }
}

/**
 * Standardized wrapper for fetch operations with error handling
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  errorOptions: ErrorHandlerOptions = {}
): Promise<Response | null> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorResult = await handleApiError(response, errorOptions);
      if (errorResult) {
        // Error was handled, don't return response
        return null;
      }
    }

    return response;
  } catch (error) {
    handleGeneralError(error, `Fetch to ${url}`, errorOptions);
    return null;
  }
}

/**
 * Standardized error messages for common API error scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server is temporarily unavailable. Please try again later.',
  AUTH_ERROR: 'Your session has expired. Please log in again.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment before trying again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PERMISSION_ERROR: 'You don\'t have permission to perform this action.',
  NOT_FOUND_ERROR: 'The requested item was not found.',
  CONFLICT_ERROR: 'This action conflicts with existing data.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
} as const;

/**
 * Maps HTTP status codes to standardized error messages and codes
 */
export function getErrorForStatus(status: number, serverMessage?: string): ApiError {
  switch (status) {
    case 400:
      return {
        message: serverMessage || ERROR_MESSAGES.VALIDATION_ERROR,
        status,
        code: 'VALIDATION_ERROR',
        type: 'validation' as const,
        canRetry: false
      };
    case 401:
      return {
        message: ERROR_MESSAGES.AUTH_ERROR,
        status,
        code: 'AUTH_ERROR',
        type: 'auth' as const,
        canRetry: false
      };
    case 403:
      return {
        message: ERROR_MESSAGES.PERMISSION_ERROR,
        status,
        code: 'PERMISSION_ERROR',
        type: 'permission' as const,
        canRetry: false
      };
    case 404:
      return {
        message: ERROR_MESSAGES.NOT_FOUND_ERROR,
        status,
        code: 'NOT_FOUND_ERROR',
        type: 'validation' as const,
        canRetry: false
      };
    case 409:
      return {
        message: ERROR_MESSAGES.CONFLICT_ERROR,
        status,
        code: 'CONFLICT_ERROR',
        type: 'validation' as const,
        canRetry: false
      };
    case 429:
      return {
        message: ERROR_MESSAGES.RATE_LIMIT_ERROR,
        status,
        code: 'RATE_LIMIT_ERROR',
        type: 'rate-limit' as const,
        canRetry: true
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: ERROR_MESSAGES.SERVER_ERROR,
        status,
        code: 'SERVER_ERROR',
        type: 'server' as const,
        canRetry: true
      };
    default:
      return {
        message: serverMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
        status,
        code: 'UNKNOWN_ERROR',
        type: 'unknown' as const,
        canRetry: true
      };
  }
}

/**
 * Enhanced error handler that can process both Response objects and raw error data
 */
export async function handleApiResponseError(
  responseOrError: Response | any,
  options: ErrorHandlerOptions = {}
): Promise<ApiError> {
  const { showMessage, showError, useAlert = true, feature = 'API', silent = false } = options;

  let errorResult: ApiError;

  // Handle Response objects
  if (responseOrError instanceof Response) {
    const status = responseOrError.status;

    // Try to parse server-provided error message
    let serverMessage: string | undefined;
    try {
      const contentType = responseOrError.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await responseOrError.json();
        serverMessage = errorData.message || errorData.error;
      }
    } catch {
      // JSON parsing failed, use status-based message
    }

    errorResult = getErrorForStatus(status, serverMessage);
  } else {
    // Handle other error types (network errors, parsing errors, etc.)
    const error = responseOrError;
    console.error(`[${feature}] Error:`, error);

    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      errorResult = {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        type: 'network' as const,
        canRetry: true
      };
    } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorResult = {
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        code: 'TIMEOUT_ERROR',
        type: 'network' as const,
        canRetry: true
      };
    } else {
      errorResult = {
        message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        code: 'UNKNOWN_ERROR',
        type: 'unknown' as const,
        canRetry: true
      };
    }
  }

  console.error(`[${feature}] API Error:`, errorResult);

  if (!silent) {
    if (showMessage) {
      showMessage(errorResult.message, 'error');
    } else if (showError) {
      showError(errorResult.message);
    } else if (useAlert) {
      const { Alert } = require('react-native');
      const title = getErrorTitle(errorResult.code);
      Alert.alert(title, errorResult.message);
    }
  }

  return errorResult;
}

/**
 * Get appropriate alert title for error code
 */
function getErrorTitle(errorCode?: string): string {
  switch (errorCode) {
    case 'AUTH_ERROR':
      return 'Session Expired';
    case 'NETWORK_ERROR':
      return 'Connection Error';
    case 'SERVER_ERROR':
      return 'Server Error';
    case 'RATE_LIMIT_ERROR':
      return 'Please Wait';
    case 'VALIDATION_ERROR':
      return 'Invalid Input';
    case 'PERMISSION_ERROR':
      return 'Access Denied';
    case 'NOT_FOUND_ERROR':
      return 'Not Found';
    default:
      return 'Error';
  }
}
