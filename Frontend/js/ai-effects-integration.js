/**
 * AI Effects Integration
 * Hooks AI effects into existing app logic without modifying core functionality
 */

(function() {
  'use strict';

  // Color palette for effects matching the app theme
  const effectColors = {
    purple: '#9c7eff',
    blue: '#7465ff',
    pink: '#ff70f8',
    yellow: '#FFFF99',
    warning: '#ff4444'
  };

  // Track original canvas methods to wrap them
  const setupIntegration = () => {
    // Track note additions via DOM mutations
    const canvas = document.getElementById('canvas');
    
    // Observe when notes are added to the canvas
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList && node.classList.contains('sticky-note')) {
            const rect = node.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Create burst effect when note is added
            if (aiEffects) {
              aiEffects.createBurst(x, y, effectColors.purple, 12);
              aiEffects.createFloatingParticles(x, y, effectColors.pink, 6);
              
              // Add CSS class for animation
              node.classList.add('creating');
              setTimeout(() => node.classList.remove('creating'), 400);
            }

            // Add click effects to note
            node.addEventListener('click', () => {
              if (aiEffects) {
                aiEffects.createRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, effectColors.blue);
              }
            });

            // Add hover effects to note
            node.addEventListener('mouseenter', () => {
              if (node.classList.contains('selected') && aiEffects) {
                aiEffects.createFloatingParticles(
                  rect.left + rect.width / 2,
                  rect.top + rect.height / 2,
                  effectColors.pink,
                  3
                );
              }
            });
          }

          // Detect note deletion
          if (node.nodeType === 1 && node.classList && node.classList.contains('delete-btn')) {
            node.addEventListener('click', (e) => {
              const note = e.target.closest('.sticky-note');
              if (note && aiEffects) {
                const rect = note.getBoundingClientRect();
                // Create burst effect on deletion
                aiEffects.createBurst(
                  rect.left + rect.width / 2,
                  rect.top + rect.height / 2,
                  effectColors.warning,
                  15
                );
              }
            });
          }
        });

        // Handle removed nodes (deleted notes)
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList && node.classList.contains('sticky-note')) {
            // Effect is already created on delete button click, just visual cleanup
          }
        });
      });
    });

    observer.observe(canvas, {
      childList: true,
      subtree: true
    });
  };

  // Enhance button effects
  const setupButtonEffects = () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (aiEffects) {
          const rect = btn.getBoundingClientRect();
          aiEffects.createBurst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            effectColors.blue,
            10
          );
        }
      });
    });
  };

  // Keyboard shortcuts for effects quality (accessibility)
  const setupAccessibility = () => {
    document.addEventListener('keydown', (e) => {
      // Alt + E to toggle effects
      if (e.altKey && e.key === 'e') {
        if (aiEffects.isAnimating) {
          aiEffects.stop();
          console.log('✓ AI Effects disabled');
        } else {
          aiEffects.resume();
          console.log('✓ AI Effects enabled');
        }
      }
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        setupIntegration();
        setupButtonEffects();
        setupAccessibility();
      }, 100);
    });
  } else {
    setTimeout(() => {
      setupIntegration();
      setupButtonEffects();
      setupAccessibility();
    }, 100);
  }

  // Create welcome particle burst on page load
  window.addEventListener('load', () => {
    if (aiEffects) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      aiEffects.createBurst(centerX, centerY, effectColors.purple, 20);
    }
  });
})();
