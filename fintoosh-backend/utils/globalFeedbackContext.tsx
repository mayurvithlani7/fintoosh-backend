import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface GlobalFeedbackContextType {
  error: string | null;
  feedback: string | null;
  showError: (message: string) => void;
  showFeedback: (message: string) => void;
  clearError: () => void;
  clearFeedback: () => void;
}

const GlobalFeedbackContext = createContext<GlobalFeedbackContextType | undefined>(undefined);

export const useGlobalFeedback = () => {
  const context = useContext(GlobalFeedbackContext);
  if (!context) {
    throw new Error('useGlobalFeedback must be used within a GlobalFeedbackProvider');
  }
  return context;
};

interface GlobalFeedbackProviderProps {
  children: ReactNode;
}

export const GlobalFeedbackProvider: React.FC<GlobalFeedbackProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    // Auto-clear feedback after 3 seconds
    setTimeout(() => setFeedback(null), 3000);
  };

  const clearError = () => setError(null);
  const clearFeedback = () => setFeedback(null);

  // Set the global error handler when the provider mounts
  useEffect(() => {
    // Lazy require prevents circular dependency at module scope
    const { setGlobalErrorHandler } = require('./api');
    setGlobalErrorHandler(showError);
  }, []);

  return (
    <GlobalFeedbackContext.Provider
      value={{
        error,
        feedback,
        showError,
        showFeedback,
        clearError,
        clearFeedback,
      }}
    >
      {children}
    </GlobalFeedbackContext.Provider>
  );
};
