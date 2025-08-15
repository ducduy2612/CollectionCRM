// Design tokens for Collexis
// Based on collexis brand colors

export const colors = {
  // Primary Colors - collexis Green
  primary: {
    900: '#004d26', // Darkest green
    800: '#00592e', // Dark green
    700: '#006633', // Medium-dark green
    600: '#007336', // Medium green
    500: '#00803a', // collexis primary green
    400: '#00a651', // collexis brand green (main)
    300: '#33b86d', // Light green
    200: '#66ca89', // Lighter green
    100: '#e6f5ec', // Palest green
    50: '#f0faf4',  // Very light green
  },
  
  // Secondary Colors - collexis Red
  secondary: {
    900: '#7a0000', // Darkest red
    800: '#8b0000', // Dark red
    700: '#9c0000', // Medium-dark red
    600: '#ad0000', // Medium red
    500: '#be0000', // Standard red
    400: '#cf0000', // collexis red
    300: '#e03333', // Light red
    200: '#f16666', // Lighter red
    100: '#fde6e6', // Palest red
    50: '#fef5f5',  // Very light red
  },
  
  // Neutral Colors
  neutral: {
    900: '#1a1a1a', // Nearly black - text
    800: '#333333', // Dark gray - headings
    700: '#4d4d4d', // Medium-dark gray - subheadings
    600: '#666666', // Medium gray - body text
    500: '#808080', // Standard gray - secondary text
    400: '#999999', // Light gray - disabled text
    300: '#b3b3b3', // Lighter gray - borders
    200: '#e0e0e0', // Very light gray - dividers
    100: '#f5f5f5', // Nearly white - backgrounds
    50: '#fafafa',  // White - card backgrounds
    0: '#ffffff',   // Pure white
  },
  
  // Status Colors
  success: {
    700: '#1b5e20', // Dark green
    600: '#2e7d32', // Medium-dark green
    500: '#388e3c', // Standard green - success states
    400: '#43a047', // Light green
    300: '#66bb6a', // Lighter green
    200: '#81c784', // Very light green
    100: '#c8e6c9', // Pale green
    50: '#e8f5e9',  // Palest green
  },
  
  warning: {
    700: '#f57c00', // Dark orange
    600: '#fb8c00', // Medium-dark orange
    500: '#ff9800', // Standard orange - warning states
    400: '#ffa726', // Light orange
    300: '#ffb74d', // Lighter orange
    200: '#ffcc80', // Very light orange
    100: '#ffe0b2', // Pale orange
    50: '#fff3e0',  // Palest orange
  },
  
  danger: {
    700: '#c62828', // Dark red
    600: '#d32f2f', // Medium-dark red
    500: '#f44336', // Standard red - error states
    400: '#ef5350', // Light red
    300: '#e57373', // Lighter red
    200: '#ef9a9a', // Very light red
    100: '#ffcdd2', // Pale red
    50: '#ffebee',  // Palest red
  },
  
  info: {
    700: '#0277bd', // Dark blue
    600: '#0288d1', // Medium-dark blue
    500: '#03a9f4', // Standard blue - info states
    400: '#29b6f6', // Light blue
    300: '#4fc3f7', // Lighter blue
    200: '#81d4fa', // Very light blue
    100: '#b3e5fc', // Pale blue
    50: '#e1f5fe',  // Palest blue
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    mono: "'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace",
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem',   // 256px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
} as const;

export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  slower: '500ms ease-in-out',
} as const;

export const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: 'auto',
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
} as const;

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type DesignTokens = typeof designTokens;