import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LotusIcon, PeacockIcon, DiyaIcon, MangoIcon } from '../icons/CulturalIcons';
import { useTheme } from '../../utils/themeContext';

interface CulturalBorderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showIcons?: boolean;
  variant?: 'lotus' | 'peacock' | 'diya' | 'mango' | 'mixed';
}

export const CulturalBorder: React.FC<CulturalBorderProps> = ({
  children,
  style,
  showIcons = true,
  variant = 'mixed'
}) => {
  const { themeColors } = useTheme();

  const getIcons = () => {
    switch (variant) {
      case 'lotus':
        return [
          <LotusIcon key="left" size={16} color={themeColors.primary} />,
          <LotusIcon key="center" size={16} color={themeColors.secondary} />,
          <LotusIcon key="right" size={16} color={themeColors.accent} />
        ];
      case 'peacock':
        return [
          <PeacockIcon key="left" size={16} color={themeColors.primary} />,
          <PeacockIcon key="center" size={16} color={themeColors.secondary} />,
          <PeacockIcon key="right" size={16} color={themeColors.accent} />
        ];
      case 'diya':
        return [
          <DiyaIcon key="left" size={16} color={themeColors.primary} />,
          <DiyaIcon key="center" size={16} color={themeColors.secondary} />,
          <DiyaIcon key="right" size={16} color={themeColors.accent} />
        ];
      case 'mango':
        return [
          <MangoIcon key="left" size={16} color={themeColors.primary} />,
          <MangoIcon key="center" size={16} color={themeColors.secondary} />,
          <MangoIcon key="right" size={16} color={themeColors.accent} />
        ];
      default: // mixed
        return [
          <LotusIcon key="left" size={16} color={themeColors.primary} />,
          <DiyaIcon key="center" size={16} color={themeColors.secondary} />,
          <PeacockIcon key="right" size={16} color={themeColors.accent} />
        ];
    }
  };

  return (
    <View style={[styles.culturalBorder, { borderColor: themeColors.primary }, style]}>
      {showIcons && (
        <View style={styles.borderTop}>
          {getIcons()}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

interface CulturalDividerProps {
  color?: string;
  thickness?: number;
  style?: ViewStyle;
  showDots?: boolean;
}

export const CulturalDivider: React.FC<CulturalDividerProps> = ({
  color,
  thickness = 2,
  style,
  showDots = true
}) => {
  const { themeColors } = useTheme();
  const dividerColor = color || themeColors.primary;

  return (
    <View style={[styles.divider, style]}>
      {showDots && (
        <>
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 2, height: thickness * 2 }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 1.5, height: thickness * 1.5 }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness, height: thickness }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 1.5, height: thickness * 1.5 }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 2, height: thickness * 2 }]} />
        </>
      )}
      <View style={[styles.line, { backgroundColor: dividerColor, height: thickness }]} />
      {showDots && (
        <>
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 2, height: thickness * 2 }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 1.5, height: thickness * 1.5 }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness, height: thickness }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 1.5, height: thickness * 1.5 }]} />
          <View style={[styles.dot, { backgroundColor: dividerColor, width: thickness * 2, height: thickness * 2 }]} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  culturalBorder: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  borderTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
  },
  content: {
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  line: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 1,
  },
});
