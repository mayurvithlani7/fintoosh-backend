import { useTheme } from '@/utils/themeContext';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  maxWidth = screenWidth * 0.7
}) => {
  const { themeColors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [tooltipLayout, setTooltipLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View>(null);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  const getTooltipPosition = () => {
    let top = tooltipLayout.y;
    let left = tooltipLayout.x + tooltipLayout.width / 2 - maxWidth / 2;

    // Ensure tooltip stays within screen bounds
    left = Math.max(10, Math.min(left, screenWidth - maxWidth - 10));

    switch (position) {
      case 'top':
        top = Math.max(10, tooltipLayout.y - 60);
        break;
      case 'bottom':
        top = tooltipLayout.y + tooltipLayout.height + 10;
        if (top + 60 > screenHeight) {
          // If bottom position goes off screen, try top
          top = Math.max(10, tooltipLayout.y - 60);
        }
        break;
      case 'left':
        top = tooltipLayout.y + tooltipLayout.height / 2 - 30;
        left = Math.max(10, tooltipLayout.x - maxWidth - 10);
        break;
      case 'right':
        top = tooltipLayout.y + tooltipLayout.height / 2 - 30;
        left = tooltipLayout.x + tooltipLayout.width + 10;
        if (left + maxWidth > screenWidth - 10) {
          // If right position goes off screen, try left
          left = Math.max(10, tooltipLayout.x - maxWidth - 10);
        }
        break;
    }

    return {
      top: Math.max(0, top),
      left: Math.max(0, left),
      transform: [{ translateX: 0 }],
    };
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
