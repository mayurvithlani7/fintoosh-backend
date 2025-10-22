import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GlobalSnackbar: React.FC = () => {
  const { error, feedback, clearError, clearFeedback } = useGlobalFeedback();

  const message = error || feedback;
  const isError = !!error;

  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.snackbar, isError ? styles.errorSnackbar : styles.feedbackSnackbar]}>
        <Text style={[styles.message, isError ? styles.errorText : styles.feedbackText]}>
          {isError ? '❌ ' : '✅ '}{message}
        </Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={isError ? clearError : clearFeedback}
          accessibilityLabel="Close notification"
        >
          <Text style={[styles.closeText, isError ? styles.errorCloseText : styles.feedbackCloseText]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  snackbar: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  errorSnackbar: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  feedbackSnackbar: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  message: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  errorText: {
    color: '#c62828',
  },
  feedbackText: {
    color: '#2e7d32',
  },
  closeBtn: {
    marginLeft: 12,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorCloseText: {
    color: '#c62828',
  },
  feedbackCloseText: {
    color: '#2e7d32',
  },
});

export default GlobalSnackbar;
