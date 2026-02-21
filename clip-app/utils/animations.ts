import { Easing } from 'react-native';

// Reusable animation configurations
export const animations = {
  // Spring physics for natural movement
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Smooth easing curves
  easing: {
    easeInOut: Easing.bezier(0.4, 0.0, 0.2, 1),
    easeOut: Easing.bezier(0.0, 0.0, 0.2, 1),
    easeIn: Easing.bezier(0.4, 0.0, 1, 1),
    sharp: Easing.bezier(0.4, 0.0, 0.6, 1),
  },

  // Duration presets (in ms)
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// Animation timing functions
export const timingConfig = (duration: number = 300, easing = animations.easing.easeInOut) => ({
  duration,
  easing,
  useNativeDriver: true,
});

// Spring animation config
export const springConfig = {
  ...animations.spring,
  useNativeDriver: true,
};
