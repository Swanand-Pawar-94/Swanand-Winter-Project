/**
 * Watermark Overlay - Rotating text messages in the canvas center
 */

class WatermarkOverlay {
  constructor() {
    this.messages = [
      'wyd right now',
      "How's your college life",
      'Tell some funny college experience',
      'Are u single',
      'how tall r u'
    ];

    this.currentMessageIndex = 0;
    this.messageChangeInterval = 6000; // Change message every 6 seconds
    this.fadeTransitionDuration = 600; // Fade transition duration
    this.rotationAngle = 0;
    this.rotationSpeed = 0.5; // Degrees per frame

    this.create();
    this.init();
  }

  /**
   * Create the watermark element
   */
  create() {
    const container = document.getElementById('canvas-container');

    // Main watermark container
    this.watermarkContainer = document.createElement('div');
    this.watermarkContainer.id = 'watermark-container';
    this.watermarkContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 5;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 400px;
      height: 200px;
    `;

    // Watermark text element
    this.watermarkText = document.createElement('div');
    this.watermarkText.id = 'watermark-text';
    this.watermarkText.style.cssText = `
      font-size: 40px;
      font-style: italic;
      color: rgba(0, 0, 0, 0.08);
      text-align: center;
      font-weight: bold;
      letter-spacing: 2px;
      max-width: 100%;
      word-wrap: break-word;
      user-select: none;
      -webkit-user-select: none;
      text-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
      opacity: 0.8;
      transition: opacity ${this.fadeTransitionDuration}ms ease-in-out;
      line-height: 1.4;
    `;

    this.watermarkContainer.appendChild(this.watermarkText);
    container.appendChild(this.watermarkContainer);
  }

  /**
   * Initialize watermark functionality
   */
  init() {
    // Set initial message
    this.updateMessage();

    // Change message periodically
    setInterval(() => this.changeMessage(), this.messageChangeInterval);

    // Animate rotation continuously
    this.animateRotation();
  }

  /**
   * Update the watermark text
   */
  updateMessage() {
    const message = this.messages[this.currentMessageIndex];
    this.watermarkText.textContent = message;

    // Fade in effect
    this.watermarkText.style.opacity = '0.8';
  }

  /**
   * Change to next message with fade effect
   */
  changeMessage() {
    // Fade out
    this.watermarkText.style.opacity = '0.3';

    // Change message after fade starts
    setTimeout(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
      this.updateMessage();
    }, this.fadeTransitionDuration / 2);
  }

  /**
   * Animate continuous rotation
   */
  animateRotation() {
    const rotate = () => {
      this.rotationAngle += this.rotationSpeed;
      this.watermarkText.style.transform = `rotate(${this.rotationAngle}deg)`;

      // Subtle scale pulse
      const scale = 1 + Math.sin(this.rotationAngle * Math.PI / 180) * 0.05;
      this.watermarkText.style.transform = `rotate(${this.rotationAngle}deg) scale(${scale})`;

      requestAnimationFrame(rotate);
    };
    rotate();
  }

  /**
   * Update watermark position to stay in center (for infinite canvas)
   */
  updatePosition() {
    // Keep watermark at viewport center
    this.watermarkContainer.style.position = 'fixed';
  }
}

// Initialize watermark when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.watermarkOverlay = new WatermarkOverlay();
    }, 100);
  });
} else {
  setTimeout(() => {
    window.watermarkOverlay = new WatermarkOverlay();
  }, 100);
}
