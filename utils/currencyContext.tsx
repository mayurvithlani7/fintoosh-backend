import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from './config';
import { getAuthToken } from './secureStorage';

export interface InterestRuleType {
  rate: number;
  frequency: string; // "weekly" | "monthly"
  jar: string; // "save" or future extension
}

interface CurrencyContextType {
  currency: 'points' | 'inr';
  conversionRate: number;
  showDenominations: boolean;
  defaultSplit: {
    current: number;
    save: number;
    spend: number;
    donate: number;
    invest: number;
  };
  interestRule?: InterestRuleType;
  autoApprovalRules?: {
    choreClaimMax?: number;
    rewardClaimMax?: number;
    pointMoveMax?: number;
  };
  formatAmount: (points: number) => string;
  convertToINR: (points: number) => number;
  updateSettings: (settings: Partial<{
    currency: 'points' | 'inr';
    conversionRate: number;
    showDenominations: boolean;
    defaultSplit: {
      current: number;
      save: number;
      spend: number;
      donate: number;
      invest: number;
    };
    interestRule: InterestRuleType;
    autoApprovalRules: {
      choreClaimMax?: number;
      rewardClaimMax?: number;
      pointMoveMax?: number;
    };
  }>) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<'points' | 'inr'>('points');
  const [conversionRate, setConversionRate] = useState(1);
  const [showDenominations, setShowDenominations] = useState(false);
  const [defaultSplit, setDefaultSplit] = useState({
    current: 40,
    save: 30,
    spend: 15,
    donate: 10,
    invest: 5
  });
  const [interestRule, setInterestRule] = useState<InterestRuleType | undefined>(undefined);
  const [autoApprovalRules, setAutoApprovalRules] = useState<{
    choreClaimMax?: number;
    rewardClaimMax?: number;
    pointMoveMax?: number;
  }>({});

  const formatAmount = (points: number): string => {
    if (currency === 'inr') {
      const inr = points * conversionRate;
      return `₹${inr.toFixed(0)}`;
    }
    return `${points} pts`;
  };

  const convertToINR = (points: number): number => points * conversionRate;

  const updateSettings = async (settings: Partial<{
    currency: 'points' | 'inr';
    conversionRate: number;
    showDenominations: boolean;
    defaultSplit: {
      current: number;
      save: number;
      spend: number;
      donate: number;
      invest: number;
    };
    interestRule: InterestRuleType;
    autoApprovalRules: {
      choreClaimMax?: number;
      rewardClaimMax?: number;
      pointMoveMax?: number;
    };
  }>) => {
    console.log('updateSettings called with:', settings);
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) {
        throw new Error('Not authenticated');
      }

      const user = JSON.parse(storedUser);
      console.log('Making API call to update settings for user:', user.id);

      const response = await fetch(`${API_URL}/users/${user.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        console.error('Parsed API error:', errorData);
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const updatedUser = await response.json();
      console.log('Updated user data from API:', updatedUser);
      console.log('Currency fields in response:', {
        currency: updatedUser.currency,
        conversionRate: updatedUser.conversionRate,
        showDenominations: updatedUser.showDenominations
      });

      // Update local state
      if (settings.currency !== undefined) {
        console.log('Setting currency to:', settings.currency);
        setCurrency(settings.currency);
      }
      if (settings.conversionRate !== undefined) {
        console.log('Setting conversionRate to:', settings.conversionRate);
        setConversionRate(settings.conversionRate);
      }
      if (settings.showDenominations !== undefined) {
        console.log('Setting showDenominations to:', settings.showDenominations);
        setShowDenominations(settings.showDenominations);
      }
      if (settings.defaultSplit !== undefined) {
        console.log('Setting defaultSplit to:', settings.defaultSplit);
        setDefaultSplit(settings.defaultSplit);
      }
      if (settings.interestRule !== undefined) {
        console.log('Setting interestRule to:', settings.interestRule);
        setInterestRule(settings.interestRule);
      }
      if (settings.autoApprovalRules !== undefined) {
        console.log('Setting autoApprovalRules to:', settings.autoApprovalRules);
        setAutoApprovalRules(settings.autoApprovalRules);
      }

      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

    } catch (error) {
      console.error('Error updating currency settings:', error);
      throw error;
    }
  };

  // Reload/Load settings from API; exposed for live update after save as 'reloadSettings'
  const reloadSettings = async () => {
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) return;
      const user = JSON.parse(storedUser);
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrency(userData.currency || 'points');
        setConversionRate(userData.conversionRate || 1);
        setShowDenominations(userData.showDenominations || false);
        setDefaultSplit(userData.defaultSplit || {
          current: 40,
          save: 30,
          spend: 15,
          donate: 10,
          invest: 5
        });
        setInterestRule(userData.interestRule);
        setAutoApprovalRules(userData.autoApprovalRules || {});
      } else {
        console.log('Failed to load user data for currency settings');
      }
    } catch (error) {
      console.error('Error loading currency settings:', error);
    }
  };

  // On mount, call reload
  useEffect(() => {
    reloadSettings();
  }, []);

  return (
    <CurrencyContext.Provider value={{
      currency,
      conversionRate,
      showDenominations,
      defaultSplit,
      interestRule,
      autoApprovalRules,
      formatAmount,
      convertToINR,
      updateSettings,
      reloadSettings
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
