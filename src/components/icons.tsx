import Svg, { Path, Circle, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string; sw?: number };

const stroked = (size: number, color: string, sw: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Heart = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 21s-7-4.5-9.5-9.5C.8 7.8 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.7 3.8 4 7.5C19 16.5 12 21 12 21z" />
  </Svg>
);

export const Plane = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L2 10l8 3 3 8 9-19z" fill={color} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    <Path d="M22 2L10 13" stroke="rgba(0,0,0,0.18)" strokeWidth={1.4} strokeLinecap="round" />
  </Svg>
);

export const X = ({ size = 24, color = '#000', sw = 2.5 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const Star = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.5 5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z" />
  </Svg>
);

export const Bolt = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
  </Svg>
);

export const Pin = ({ size = 16, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Path d="M12 21s-7-7-7-12a7 7 0 1114 0c0 5-7 12-7 12z" />
    <Circle cx={12} cy={9} r={2.5} />
  </Svg>
);

export const Clock = ({ size = 14, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 7v5l3 2" />
  </Svg>
);

export const Home = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" />
  </Svg>
);

export const HomeOutline = ({ size = 24, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" />
  </Svg>
);

export const Chat = ({ size = 24, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Path d="M21 15a3 3 0 01-3 3H8l-5 4V6a3 3 0 013-3h12a3 3 0 013 3v9z" />
  </Svg>
);

export const User = ({ size = 24, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Circle cx={12} cy={8} r={4} />
    <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </Svg>
);

export const Sliders = ({ size = 18, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14" />
    <Circle cx={16} cy={6} r={2} fill={color} />
    <Circle cx={8} cy={12} r={2} fill={color} />
    <Circle cx={17} cy={18} r={2} fill={color} />
  </Svg>
);

export const Money = ({ size = 16, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Rect x={3} y={6} width={18} height={12} rx={2} />
    <Circle cx={12} cy={12} r={2.5} />
  </Svg>
);

export const Wifi = ({ size = 16, color = '#000', sw = 2 }: IconProps) => (
  <Svg {...stroked(size, color, sw)}>
    <Path d="M2 9c5.5-5.5 14.5-5.5 20 0M5 12.5c4-4 10-4 14 0M8.5 16c2-2 5-2 7 0" />
    <Circle cx={12} cy={19.5} r={1.2} fill={color} />
  </Svg>
);

export const Sparkle = ({ size = 16, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" />
  </Svg>
);

export const Flame = ({ size = 16, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2c1 4 4 5 4 9a4 4 0 11-8 0c0-2 1-3 1-5-2 1-4 3-4 7a7 7 0 1014 0c0-5-4-7-7-11z" />
  </Svg>
);
