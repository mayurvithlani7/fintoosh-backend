import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ErrorCardProps {
  error: string;
  onRetry: () => void;
  onCancel?: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, onRetry, onCancel }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Something Went Wrong</Text>
    <Text style={styles.errorText}>{error}</Text>
    <View style={styles.buttonRow}>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} accessibilityLabel="Retry">
        <Text style={styles.btnText}>Retry</Text>
      </TouchableOpacity>
      {onCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} accessibilityLabel="Cancel">
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff0f2",
    borderRadius: 16,
    padding: 22,
    marginVertical: 17,
    alignItems: "center",
    borderWidth: 1.3,
    borderColor: "#e18bb9",
    shadowColor: "#e18bb9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a03d6c",
    marginBottom: 8,
  },
  errorText: {
    color: "#a03d6c",
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
    backgroundColor: "#e18bb9",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 7,
    marginHorizontal: 2,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#e5def3",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 7,
    marginHorizontal: 2,
    alignItems: "center",
  },
  btnText: {
    color: "#673557",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default ErrorCard;
