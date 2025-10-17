import { useTheme } from "@/utils/themeContext";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ErrorCardProps {
  error: string;
  onRetry: () => void;
  onCancel?: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, onRetry, onCancel }) => {
  const { themeColors } = useTheme();

  // Make error messages child-friendly
  const getChildFriendlyMessage = (errorMsg: string) => {
    if (errorMsg.includes('Failed to load user data') || errorMsg.includes('Having trouble loading')) {
      return 'Oops! 🤔 We\'re having trouble loading your points right now. Please try again!';
    }
    if (errorMsg.includes('Not authenticated') || errorMsg.includes('log you back in')) {
      return 'Oops! 😅 We need to log you back in. Please ask a grown-up for help!';
    }
    if (errorMsg.includes('connection') || errorMsg.includes('network')) {
      return 'Hmm! 📡 We can\'t connect right now. Check your internet and try again!';
    }
    // Return the original message if it doesn't match any pattern
    return errorMsg;
  };

  return (
    <View style={[styles.container, {
      backgroundColor: themeColors.warning + '30',
      borderColor: themeColors.warning,
      shadowColor: themeColors.warning
    }]}>
      <Text style={[styles.title, { color: themeColors.warning }]}>Oops! 🤔</Text>
      <Text style={[styles.errorText, { color: themeColors.text }]}>{getChildFriendlyMessage(error)}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: themeColors.error }]}
          onPress={onRetry}
          accessibilityLabel="Retry"
        >
          <Text style={[styles.btnText, { color: themeColors.card }]}>Retry</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: themeColors.surface }]}
            onPress={onCancel}
            accessibilityLabel="Cancel"
          >
            <Text style={[styles.btnText, { color: themeColors.text }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 22,
    marginVertical: 17,
    alignItems: "center",
    borderWidth: 1.3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    marginBottom: 15,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 7,
    marginHorizontal: 2,
    alignItems: "center",
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 7,
    marginHorizontal: 2,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "600",
    fontSize: 15,
  },
});

export default ErrorCard;
