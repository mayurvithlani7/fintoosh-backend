import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// Visually enhanced HapticTab with underline and scale for active tab
export function HapticTab(props: BottomTabBarButtonProps) {
  const { accessibilityState, children, style, ...others } = props;
  const selected = accessibilityState?.selected;

  return (
    <PlatformPressable
      {...others}
      style={[
        style,
        styles.base,
        selected && styles.selected,
      ]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    >
      <View style={[styles.inner, selected && styles.innerSelected]}>
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              style: [
                children.props.style,
                selected && { fontWeight: 'bold', transform: [{ scale: 1.15 }] },
              ],
            })
          : children}
        {selected && <View style={styles.underline} />}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  selected: {},
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerSelected: {},
  underline: {
    marginTop: 3,
    height: 3,
    width: 28,
    backgroundColor: '#237BE2',
    borderRadius: 999,
  },
});
