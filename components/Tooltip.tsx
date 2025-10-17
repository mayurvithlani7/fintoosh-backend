import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useTheme } from '@/utils/themeContext';

const { width } = Dimensions.get('window');

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  maxWidth = width * 0.7
}) => {
  const { themeColors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [tooltipLayout, setTooltipLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View>(null);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  const getTooltipPosition = () => {
    const positions = {
      top: {
        top: tooltipLayout.y - 60,
        left: tooltipLayout.x + tooltipLayout.width / 2 - maxWidth / 2,
        transform: [{ translateX: 0 }],
      },
      bottom: {
        top: tooltipLayout.y + tooltipLayout.height + 10,
        left: tooltipLayout.x + tooltipLayout.width / 2 - maxWidth / 2,
        transform: [{ translateX: 0 }],
      },
      left: {
        top: tooltipLayout.y + tooltipLayout.height / 2 - 30,
        left: tooltipLayout.x - maxWidth - 10,
        transform: [{ translateX: 0 }],
      },
      right: {
        top: tooltipLayout.y + tooltipLayout.height / 2 - 30,
        left: tooltipLayout.x + tooltipLayout.width + 10,
        transform: [{ translateX: 0 }],
      },
    };
    return positions[position];
  };

  const styles = StyleSheet.create({
    tooltipContainer: {
      position: 'absolute',
      backgroundColor: themeColors.card,
      borderRadius: 8,
      padding: 12,
      maxWidth: maxWidth,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: themeColors.border,
      zIndex: 1000,
    },
    tooltipText: {
      fontSize: 14,
      color: themeColors.text,
      lineHeight: 20,
    },
    tooltipArrow: {
      position: 'absolute',
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: themeColors.card,
    },
    arrowBottom: {
      top: -8,
      left: '50%',
      marginLeft: -8,
      borderTopWidth: 8,
      borderTopColor: themeColors.card,
      borderBottomWidth: 0,
    },
    arrowTop: {
      bottom: -8,
      left: '50%',
      marginLeft: -8,
      borderBottomWidth: 8,
      borderBottomColor: themeColors.card,
      borderTopWidth: 0,
    },
    arrowRight: {
      left: -8,
      top: '50%',
      marginTop: -8,
      borderLeftWidth: 8,
      borderLeftColor: themeColors.card,
      borderRightWidth: 0,
    },
    arrowLeft: {
      right: -8,
      top: '50%',
      marginTop: -8,
      borderRightWidth: 8,
      borderRightColor: themeColors.card,
      borderLeftWidth: 0,
    },
  });

  const getArrowStyle = () => {
    switch (position) {
      case 'top': return styles.arrowBottom;
      case 'bottom': return styles.arrowTop;
      case 'left': return styles.arrowRight;
      case 'right': return styles.arrowLeft;
      default: return styles.arrowBottom;
    }
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        onPress={showTooltip}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
            setTooltipLayout({ x: pageX, y: pageY, width, height });
          });
        }}
      >
        {children}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideTooltip}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          }}
          activeOpacity={1}
          onPress={hideTooltip}
        >
          <View
            style={[
              styles.tooltipContainer,
              getTooltipPosition(),
            ]}
          >
            <Text style={styles.tooltipText}>{content}</Text>
            <View style={getArrowStyle()} />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default Tooltip;
