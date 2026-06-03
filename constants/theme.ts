// AI Recaps Maker - Design Tokens

export const Colors = {
  // Brand - Neon AI Theme
  primary: '#00D4FF',        // Cyan AI glow
  primaryDark: '#0099CC',
  secondary: '#B24BF3',      // Purple accent
  secondaryDark: '#8B3CC7',
  
  // Backgrounds
  background: '#0a0a14',     // Deep dark blue
  surface: '#1a1a2e',        // Card surface
  surfaceLight: '#242438',
  
  // Text
  text: '#E8E8F0',           // Almost white
  textSecondary: '#9B9BAF',
  textMuted: '#6B6B7F',
  
  // Semantic
  success: '#00FF7F',
  warning: '#FFB800',
  error: '#FF3366',
  info: '#00D4FF',
  
  // Overlays
  overlay: 'rgba(10, 10, 20, 0.85)',
  border: 'rgba(0, 212, 255, 0.2)',
  
  // Gradients (strings for LinearGradient)
  gradientPrimary: ['#00D4FF', '#B24BF3'],
  gradientDark: ['#0a0a14', '#1a1a2e'],
  gradientSurface: ['#1a1a2e', '#242438'],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  // Font sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  
  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#B24BF3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  neon: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
};
