import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <NavigationContext.Provider value={{ activeModal, setActiveModal }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};
