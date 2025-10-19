import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL, DEFAULT_REFRESH_INTERVALS } from './config';
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
  refreshIntervals: {
    kidsHome: number;
    notifications: number;
    general: number;
  };
  formatAmount: (points: number) => string;
  convertToINR: (points: number) => number;
  calculateSplit: (total: number, percentage: number) => number;
  validateSplit: (splits: { [key: string]: number }) => void;
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
    refreshIntervals: {
      kidsHome: number;
      notifications: number;
      general: number;
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
  const [refreshIntervals, setRefreshIntervals] = useState({
    kidsHome: DEFAULT_REFRESH_INTERVALS.KIDS_HOME,
    notifications: DEFAULT_REFRESH_INTERVALS.NOTIFICATIONS,
    general: DEFAULT_REFRESH_INTERVALS.GENERAL
  });

  const formatAmount = (points: number): string => {
    // Ensure integer values for points
    const rounded = Math.round(points);
    if (currency === 'inr') {
      const inr = rounded * conversionRate;
      return `₹${inr.toFixed(0)}`;
    }
    return `${rounded} pts`;
  };

  const convertToINR = (points: number): number => points * conversionRate;

  const calculateSplit = (total: number, percentage: number): number => {
    // Ensure splits result in integers
    return Math.round(total * (percentage / 100));
  };

  const validateSplit = (splits: { [key: string]: number }) => {
    const total = Object.values(splits).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      throw new Error('Split percentages must total exactly 100%');
    }

    // Ensure all values are integers
    Object.values(splits).forEach(val => {
      if (!Number.isInteger(val)) {
        throw new Error('Split percentages must be whole numbers');
      }
    });
  };

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
    refreshIntervals: {
      kidsHome: number;
      notifications: number;
      general: number;
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
      if (settings.refreshIntervals !== undefined) {
        console.log('Setting refreshIntervals to:', settings.refreshIntervals);
        setRefreshIntervals(settings.refreshIntervals);
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
        setRefreshIntervals(userData.refreshIntervals || {
          kidsHome: DEFAULT_REFRESH_INTERVALS.KIDS_HOME,
          notifications: DEFAULT_REFRESH_INTERVALS.NOTIFICATIONS,
          general: DEFAULT_REFRESH_INTERVALS.GENERAL
        });
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
      refreshIntervals,
      formatAmount,
      convertToINR,
      calculateSplit,
      validateSplit,
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
