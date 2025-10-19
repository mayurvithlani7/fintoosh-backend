import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, Pattern, Rect } from 'react-native-svg';

interface RangoliPatternProps {
  color?: string;
  opacity?: number;
  size?: number;
}

export const RangoliPattern: React.FC<RangoliPatternProps> = ({
  color = '#FF9933',
  opacity = 0.1,
  size = 60
}) => (
  <View style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern
          id="rangoli"
          patternUnits="userSpaceOnUse"
          width={size}
          height={size}
        >
          <Circle cx={size/6} cy={size/6} r="2" fill={color} opacity={opacity} />
          <Circle cx={size/2} cy={size/6} r="2" fill={color} opacity={opacity} />
          <Circle cx={(5*size)/6} cy={size/6} r="2" fill={color} opacity={opacity} />

          <Circle cx={size/6} cy={size/2} r="2" fill={color} opacity={opacity} />
          <Circle cx={size/2} cy={size/2} r="2" fill={color} opacity={opacity} />
          <Circle cx={(5*size)/6} cy={size/2} r="2" fill={color} opacity={opacity} />

          <Circle cx={size/6} cy={(5*size)/6} r="2" fill={color} opacity={opacity} />
          <Circle cx={size/2} cy={(5*size)/6} r="2" fill={color} opacity={opacity} />
          <Circle cx={(5*size)/6} cy={(5*size)/6} r="2" fill={color} opacity={opacity} />

          <Path d={`M${size/6},${size/6} L${(5*size)/6},${size/6} M${size/6},${(5*size)/6} L${(5*size)/6},${(5*size)/6}`}
                stroke={color}
                strokeWidth="1"
                opacity={opacity * 0.7} />

          <Path d={`M${size/6},${size/6} L${size/6},${(5*size)/6} M${(5*size)/6},${size/6} L${(5*size)/6},${(5*size)/6}`}
                stroke={color}
                strokeWidth="1"
                opacity={opacity * 0.7} />

          <Path d={`M${size/2},${size/6} L${size/2},${(5*size)/6} M${size/6},${size/2} L${(5*size)/6},${size/2}`}
                stroke={color}
                strokeWidth="1"
                opacity={opacity * 0.5} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#rangoli)" />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  // Add any additional styles if needed
});
