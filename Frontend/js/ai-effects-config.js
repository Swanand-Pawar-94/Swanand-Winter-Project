/**
 * AI Effects Configuration
 * Customize particle effects, colors, and animations without modifying core code
 */

const AIEffectsConfig = {
  // Enable/disable effects globally
  enabled: true,

  // Particle effect settings
  particles: {
    // Burst effect when notes are created
    burstOnCreate: {
      enabled: true,
      particleCount: 12,
      speed: 'medium' // 'slow' | 'medium' | 'fast'
    },

    // Floating particles when notes appear
    floatingParticles: {
      enabled: true,
      particleCount: 6,
      duration: 'normal' // 'short' | 'normal' | 'long'
    },

    // Ripple effect on note interaction
    ripple: {
      enabled: true,
      radius: 80,
      expandSpeed: 2
    },

    // Burst effect on note deletion
    deleteEffect: {
      enabled: true,
      particleCount: 15,
      color: '#ff4444'
    }
  },

  // Animation settings
  animations: {
    // Floating animation for header
    headerFloat: {
      enabled: true,
      duration: 4000 // milliseconds
    },

    // Hover pulse effect on notes
    hoverPulse: {
      enabled: true,
      duration: 2000
    },

    // Glow effect on selected notes
    selectionGlow: {
      enabled: true,
      duration: 1500
    },

    // Fade in effect for new elements
    fadeIn: {
      enabled: true,
      duration: 500
    }
  },

  // Color customization
  colors: {
    primary: '#9c7eff',    // Purple
    secondary: '#7465ff',  // Blue
    accent: '#ff70f8',     // Pink
    danger: '#ff4444'      // Red
  },

  // Performance settings
  performance: {
    // Reduce particle count on low-end devices
    adaptive: true,

    // Maximum particles allowed on screen
    maxParticles: 100,

    // Disable effects on low performance devices
    lowPerformanceMode: false
  },

  // Accessibility settings
  accessibility: {
    // Respect prefers-reduced-motion preference
    respectReducedMotion: true,

    // Keyboard shortcut to toggle effects (Alt + E)
    enableKeyboardToggle: true,

    // Show visual feedback for important actions
    contrastMode: false
  }
};

// Helper function to apply config to effects
function applyEffectsConfig(config) {
  if (!window.aiEffects) return;

  // Store config
  window.aiEffects.config = config;

  // Apply reduced motion preference
  if (config.accessibility.respectReducedMotion) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      window.aiEffects.stop();
      console.log('✓ Respecting prefers-reduced-motion');
    }
  }

  // Log applied config
  console.log('✓ AI Effects Config Applied', config);
}

// Apply config when AI effects are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => applyEffectsConfig(AIEffectsConfig), 100);
  });
} else {
  setTimeout(() => applyEffectsConfig(AIEffectsConfig), 100);
}

// Export for use in browser console
window.AIEffectsConfig = AIEffectsConfig;
window.applyEffectsConfig = applyEffectsConfig;
