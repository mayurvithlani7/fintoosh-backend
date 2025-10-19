import React from "react";
import { Text, StyleSheet } from "react-native";

/**
 * Displays a validation message with accessible style.
 * Props:
 * - message: string | null
 * - type: "error" | "success" | "info"
 */
export default function ValidationMessage({ message, type = "error" }: { message?: string | null; type?: "error" | "success" | "info"; }) {
  if (!message) return null;
  const color =
    type === "error"
      ? "#d10228"
      : type === "success"
      ? "#1a8a26"
      : "#37446e";

  return (
    <Text
      style={[styles.base, { color }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 14,
    marginTop: 3,
    marginBottom: 0,
    fontWeight: "500"
  }
});
