/**
 * AI Effects Engine - Adds visual effects without changing core logic
 * Includes particles, animations, and neural network-inspired visuals
 */

class AIEffects {
  constructor() {
    this.particles = [];
    this.canvas = document.createElement('canvas');
    this.setupParticleCanvas();
    this.animationFrameId = null;
    this.isAnimating = true;
  }

  setupParticleCanvas() {
    this.canvas.id = 'particle-canvas';
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    window.addEventListener('resize', () => this.resizeCanvas());
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Create particle burst effect at position
   */
  createBurst(x, y, color = '#9c7eff', count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = {
        x: Math.cos(angle) * (2 + Math.random() * 3),
        y: Math.sin(angle) * (2 + Math.random() * 3)
      };

      this.particles.push({
        x,
        y,
        velocity,
        life: 1,
        color: this.adjustBrightness(color, Math.random() * 0.4),
        size: 3 + Math.random() * 4,
        type: 'burst'
      });
    }
  }

  /**
   * Create floating particle effect
   */
  createFloatingParticles(x, y, color = '#ff70f8', count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        velocity: {
          x: (Math.random() - 0.5) * 1.5,
          y: -Math.random() * 2.5
        },
        life: 1,
        color: this.adjustBrightness(color, Math.random() * 0.5),
        size: 2 + Math.random() * 3,
        type: 'float'
      });
    }
  }

  /**
   * Create ripple/wave effect
   */
  createRipple(x, y, color = '#7465ff') {
    this.particles.push({
      x,
      y,
      velocity: { x: 0, y: 0 },
      life: 1,
      color,
      size: 2,
      maxRadius: 80,
      currentRadius: 0,
      type: 'ripple'
    });
  }

  /**
   * Adjust color brightness
   */
  adjustBrightness(hexColor, factor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const adjusted = (value) => Math.min(255, Math.floor(value + (255 - value) * factor));

    return `rgb(${adjusted(r)}, ${adjusted(g)}, ${adjusted(b)})`;
  }

  /**
   * Main animation loop
   */
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter((p) => {
      this.updateParticle(p);
      this.drawParticle(p);
      return p.life > 0;
    });

    if (this.isAnimating) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Update particle physics
   */
  updateParticle(p) {
    p.life -= 0.02;

    if (p.type === 'burst' || p.type === 'float') {
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.velocity.y += 0.08; // gravity
      p.velocity.x *= 0.99; // air resistance
      p.size *= 0.98;
    } else if (p.type === 'ripple') {
      p.currentRadius += 2;
      p.life = p.currentRadius < p.maxRadius ? p.life : -1;
    }
  }

  /**
   * Draw particle
   */
  drawParticle(p) {
    this.ctx.globalAlpha = Math.max(0, p.life);

    if (p.type === 'ripple') {
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.currentRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    } else {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Stop animation
   */
  stop() {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Resume animation
   */
  resume() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }
}

// Initialize global AI effects instance
const aiEffects = new AIEffects();
