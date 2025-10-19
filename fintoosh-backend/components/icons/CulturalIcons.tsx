import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse, Polygon } from 'react-native-svg';

interface CulturalIconProps {
  size?: number;
  color?: string;
}

export const LotusIcon: React.FC<CulturalIconProps> = ({
  size = 24,
  color = '#FF9933'
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 2.76 1.65 5.17 4.07 6.32C6.65 13.47 5 11.06 5 8.5 5 6.57 6.57 5 8.5 5c1.76 0 3.22 1.13 3.72 2.72C13.78 6.23 15.24 5 17 5c1.93 0 3.5 1.57 3.5 3.5 0 2.56-1.65 4.97-4.07 6.82C17.35 14.17 19 11.76 19 9c0-3.87-3.13-7-7-7z"
      fill={color}
    />
    <Circle cx="12" cy="16" r="3" fill={color} />
  </Svg>
);

export const PeacockIcon: React.FC<CulturalIconProps> = ({
  size = 24,
  color = '#138808'
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2zm-2 6c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2zm4 0c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2zM8 12c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2zM6 16c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2z"
      fill={color}
    />
    <Path
      d="M12 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
      fill={color}
    />
  </Svg>
);

export const DiyaIcon: React.FC<CulturalIconProps> = ({
  size = 24,
  color = '#FFD700'
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2l2 6h-4l2-6z" fill="#8B4513" />
    <Rect x="10" y="8" width="4" height="6" fill="#8B4513" />
    <Circle cx="12" cy="6" r="1" fill={color} />
    <Path d="M9 14l6-2v4l-6 2z" fill="#FFD700" opacity={0.7} />
  </Svg>
);

export const MangoIcon: React.FC<CulturalIconProps> = ({
  size = 24,
  color = '#FF8C00'
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2c-2.76 0-5 2.24-5 5 0 1.63.78 3.07 2 4.01V17c0 1.1.9 2 2 2s2-.9 2-2v-5.99c1.22-.94 2-2.38 2-4.01 0-2.76-2.24-5-5-5z"
      fill={color}
    />
    <Path
      d="M8 7c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2H8V7z"
      fill="#228B22"
    />
  </Svg>
);

export const RangoliPatternIcon: React.FC<CulturalIconProps> = ({
  size = 24,
  color = '#FF9933'
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="6" cy="6" r="1" fill={color} />
    <Circle cx="18" cy="6" r="1" fill={color} />
    <Circle cx="12" cy="12" r="1" fill={color} />
    <Circle cx="6" cy="18" r="1" fill={color} />
    <Circle cx="18" cy="18" r="1" fill={color} />
    <Path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke={color} strokeWidth="1" />
    <Path d="M4 4l2.5 2.5M17.5 6.5L20 9M6.5 17.5L9 20M15 15l2.5 2.5" stroke={color} strokeWidth="1" />
  </Svg>
);
