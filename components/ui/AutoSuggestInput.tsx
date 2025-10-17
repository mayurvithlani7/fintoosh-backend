import React, { useState, useMemo } from "react";
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Keyboard } from "react-native";

/**
 * Props:
 * - value: string
 * - onChangeText: (t: string) => void
 * - suggestions: string[] (static array or from parent)
 * - placeholder: string
 * - onSuggestionSelected: (val: string) => void (optional)
 * - inputProps: extra props for TextInput
 * - ariaLabel: for accessibility
 */
export default function AutoSuggestInput({
  value,
  onChangeText,
  suggestions,
  placeholder,
  onSuggestionSelected,
  inputProps,
  ariaLabel
}: {
  value: string;
  onChangeText: (t: string) => void;
  suggestions: string[];
  placeholder?: string;
  onSuggestionSelected?: (val: string) => void;
  inputProps?: any;
  ariaLabel?: string;
}) {
  const [showList, setShowList] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);

  // Filtered suggestions
  const filtered = useMemo(() => {
    const v = value.trim().toLowerCase();
    if (!v) return suggestions.slice(0, 6);
    return suggestions.filter(
      s => s.toLowerCase().includes(v)
    ).slice(0, 6);
  }, [value, suggestions]);

  function handlePressSuggestion(val: string) {
    onChangeText(val);
    onSuggestionSelected?.(val);
    setShowList(false);
    Keyboard.dismiss();
  }

  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={txt => {
          onChangeText(txt);
          setShowList(true);
        }}
        placeholder={placeholder}
        autoCorrect={false}
        style={styles.input}
        accessibilityLabel={ariaLabel}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        {...inputProps}
      />
      {showList && filtered.length > 0 && (
        <View style={styles.dropdown} accessibilityLiveRegion="polite">
          <FlatList
            data={filtered}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.item, focusedIdx === index && styles.itemFocused]}
                onPress={() => handlePressSuggestion(item)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Suggestion: ${item}`}
              >
                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    position: "relative"
  },
  input: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#b6b4cc",
    borderRadius: 8,
    backgroundColor: "#fff"
  },
  dropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#b6b4cc",
    borderRadius: 8,
    zIndex: 120,
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 5,
    elevation: 3,
    maxHeight: 152
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  itemFocused: {
    backgroundColor: "#ede9fd",
  },
  itemText: {
    fontSize: 15,
    color: "#353445"
  }
});
