import { useTheme } from '@/utils/themeContext';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface RealAllowanceFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: RealAllowanceData) => Promise<void>;
  children: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export interface RealAllowanceData {
  childId: string;
  amount: string;
  currency: string;
  date: string;
  method: string;
  note: string;
  category: string;
}

const RealAllowanceForm: React.FC<RealAllowanceFormProps> = ({
  visible,
  onClose,
  onSubmit,
  children,
  loading = false
}) => {
  const { themeColors } = useTheme();

  const [formData, setFormData] = useState<RealAllowanceData>({
    childId: '',
    amount: '',
    currency: 'INR',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    method: 'Cash',
    note: '',
    category: 'Allowance'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RealAllowanceData, string>>>({});

  const currencies = [
    { label: 'INR (₹)', value: 'INR' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'GBP (£)', value: 'GBP' },
    { label: 'CAD (C$)', value: 'CAD' },
    { label: 'AUD (A$)', value: 'AUD' }
  ];

  const methods = [
    'Cash',
    'UPI',
    'Bank Transfer',
    'Card',
    'Wallet',
    'Other'
  ];

  const categories = [
    'Allowance',
    'Reward',
    'Gift',
    'Extra',
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RealAllowanceData, string>> = {};

    if (!formData.childId) {
      newErrors.childId = 'Please select a child';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid positive amount';
      } else if (amount > 100000) {
        newErrors.amount = 'Amount cannot exceed ₹100,000';
      }
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount).toString()
      });

      // Reset form on success
      setFormData({
        childId: '',
        amount: '',
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        method: 'Cash',
        note: '',
        category: 'Allowance'
      });
      setErrors({});
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save real allowance. Please try again.');
    }
  };

  const updateFormData = (key: keyof RealAllowanceData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const styles = createStyles(themeColors);

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
            <Text style={styles.title}>Record Real Allowance</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Child Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Child *</Text>
              <View style={[styles.pickerContainer, errors.childId && styles.errorBorder]}>
                <Picker
                  selectedValue={formData.childId}
                  onValueChange={(value) => updateFormData('childId', value)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select a child..." value="" />
                  {children.map(child => (
                    <Picker.Item key={child.id} label={child.name} value={child.id} />
                  ))}
                </Picker>
              </View>
              {errors.childId && <Text style={styles.errorText}>{errors.childId}</Text>}
            </View>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Amount *</Text>
              <View style={[styles.inputContainer, errors.amount && styles.errorBorder]}>
                <Text style={styles.currencySymbol}>
                  {currencies.find(c => c.value === formData.currency)?.label.split(' ')[1] || '₹'}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={formData.amount}
                  onChangeText={(value) => updateFormData('amount', value)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
            </View>

            {/* Currency */}
            <View style={styles.field}>
              <Text style={styles.label}>Currency</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.currency}
                  onValueChange={(value) => updateFormData('currency', value)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {currencies.map(currency => (
                    <Picker.Item key={currency.value} label={currency.label} value={currency.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={[styles.input, errors.date && styles.errorBorder]}
                value={formData.date}
                onChangeText={(value) => updateFormData('date', value)}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>

            {/* Method */}
            <View style={styles.field}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.method}
                  onValueChange={(value) => updateFormData('method', value)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {methods.map(method => (
                    <Picker.Item key={method} label={method} value={method} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => updateFormData('category', value)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {categories.map(category => (
                    <Picker.Item key={category} label={category} value={category} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Note */}
            <View style={styles.field}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.note}
                onChangeText={(value) => updateFormData('note', value)}
                placeholder="Add any additional notes..."
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[styles.submitButtonText, loading && styles.disabledText]}>
                {loading ? 'Saving...' : 'Save Allowance'}
              </Text>
            </TouchableOpacity>
          </View>
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
    maxWidth: 400,
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
  content: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 12,
    backgroundColor: themeColors.surface,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.primary,
    paddingLeft: 16,
    paddingRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    color: themeColors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 12,
    backgroundColor: themeColors.surface,
    overflow: 'hidden',
  },
  picker: {
    color: themeColors.text,
    backgroundColor: themeColors.surface,
  },
  pickerItem: {
    color: themeColors.text,
    backgroundColor: themeColors.surface,
  },
  errorBorder: {
    borderColor: themeColors.error || '#f44336',
  },
  errorText: {
    color: themeColors.error || '#f44336',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  cancelButtonText: {
    color: themeColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: themeColors.primary,
  },
  submitButtonText: {
    color: themeColors.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: themeColors.surface,
    opacity: 0.6,
  },
  disabledText: {
    color: themeColors.textSecondary,
  },
});

export default RealAllowanceForm;
