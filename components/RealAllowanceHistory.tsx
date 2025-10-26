import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface RealAllowance {
  _id: string;
  childId: string;
  amount: number;
  currency: string;
  date: string;
  method: string;
  note: string;
  category: string;
  createdAt: string;
}

interface RealAllowanceHistoryProps {
  visible: boolean;
  onClose: () => void;
  children: Array<{ id: string; name: string }>;
}

const RealAllowanceHistory: React.FC<RealAllowanceHistoryProps> = ({
  visible,
  onClose,
  children
}) => {
  const { themeColors } = useTheme();
  const [allowances, setAllowances] = useState<RealAllowance[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllowances = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/real-allowances?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllowances(data.allowances || []);
      } else {
        Alert.alert('Error', 'Failed to load real allowances');
      }
    } catch (error) {
      console.error('Error fetching allowances:', error);
      Alert.alert('Error', 'Failed to load real allowances');
    }
  }, []);

  const loadData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    await fetchAllowances();

    if (isRefreshing) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, [fetchAllowances]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child ? child.name : 'Unknown Child';
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$'
    };
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const styles = createStyles(themeColors);

  const renderAllowanceItem = ({ item }: { item: RealAllowance }) => (
    <View style={styles.allowanceItem}>
      <View style={styles.itemHeader}>
        <Text style={[styles.childName, { color: themeColors.primary }]}>
          {getChildName(item.childId)}
        </Text>
        <Text style={[styles.amount, { color: themeColors.success }]}>
          {formatCurrency(item.amount, item.currency)}
        </Text>
      </View>

      <View style={styles.itemDetails}>
        <Text style={[styles.category, { backgroundColor: themeColors.accent + '20', color: themeColors.accent }]}>
          {item.category}
        </Text>
        <Text style={[styles.method, { color: themeColors.textSecondary }]}>
          {item.method}
        </Text>
      </View>

      <Text style={[styles.date, { color: themeColors.textSecondary }]}>
        {formatDate(item.date)}
      </Text>

      {item.note && (
        <Text style={[styles.note, { color: themeColors.text }]}>
          "{item.note}"
        </Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Real Allowance History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                Loading allowances...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summary}>
                <Text style={[styles.summaryText, { color: themeColors.text }]}>
                  Total allowances recorded: {allowances.length}
                </Text>
                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: themeColors.secondary }]}
                  onPress={() => loadData(true)}
                  disabled={refreshing}
                >
                  <Text style={[styles.refreshButtonText, { color: themeColors.card }]}>
                    {refreshing ? 'Refreshing...' : '🔄 Refresh'}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={allowances}
                keyExtractor={(item) => item._id}
                renderItem={renderAllowanceItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                      No real allowances recorded yet.
                    </Text>
                    <Text style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
                      Use "Record Allowance" to log your children's allowances.
                    </Text>
                  </View>
                }
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (themeColors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: themeColors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
  },
  closeButtonText: {
    fontSize: 16,
    color: themeColors.text,
    fontWeight: 'bold',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  allowanceItem: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.success,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  method: {
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    padding: 8,
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: themeColors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default RealAllowanceHistory;
