import React, { createContext, ReactNode, useContext, useState } from 'react';

interface CenteredMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  autoHideDuration?: number;
}

interface CenteredMessageContextType {
  showMessage: (message: string, type: 'success' | 'error' | 'info', autoHideDuration?: number) => void;
  hideMessage: (id: string) => void;
  currentMessage: CenteredMessage | null;
}

const CenteredMessageContext = createContext<CenteredMessageContextType | undefined>(undefined);

export const useCenteredMessage = () => {
  const context = useContext(CenteredMessageContext);
  if (!context) {
    throw new Error('useCenteredMessage must be used within a CenteredMessageProvider');
  }
  return context;
};

interface CenteredMessageProviderProps {
  children: ReactNode;
}

export const CenteredMessageProvider: React.FC<CenteredMessageProviderProps> = ({ children }) => {
  const [currentMessage, setCurrentMessage] = useState<CenteredMessage | null>(null);

  const showMessage = (message: string, type: 'success' | 'error' | 'info', autoHideDuration = 3000) => {
    const id = Date.now().toString();
    setCurrentMessage({
      id,
      message,
      type,
      autoHideDuration,
    });
  };

  const hideMessage = (id: string) => {
    if (currentMessage?.id === id) {
      setCurrentMessage(null);
    }
  };

  const value: CenteredMessageContextType = {
    showMessage,
    hideMessage,
    currentMessage,
  };

  return (
    <CenteredMessageContext.Provider value={value}>
      {children}
    </CenteredMessageContext.Provider>
  );
};
