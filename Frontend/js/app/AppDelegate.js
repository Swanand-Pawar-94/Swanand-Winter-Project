/**
 * AppDelegate - Application entry point and coordinator
 * Manages view controller lifecycle and inter-controller communication
 * Singleton pattern
 */
class AppDelegate {
  constructor() {
    if (AppDelegate.instance) {
      return AppDelegate.instance;
    }

    this.canvasViewController = null;
    this.confessionViewController = null;
    this.isInitialized = false;

    AppDelegate.instance = this;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('AppDelegate already initialized');
      return;
    }

    try {
      console.log('Initializing Campus Confession Wall...');

      // Initialize Canvas View Controller
      this.canvasViewController = new CanvasViewController();
      await this.canvasViewController.loadView();
      await this.canvasViewController.viewDidLoad();

      // Initialize Confession View Controller
      this.confessionViewController = new ConfessionViewController();

      // Setup navigation
      this.setupNavigation();

      // Show welcome popup
      this.showWelcomePopup();

      this.isInitialized = true;
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      throw error;
    }
  }

  /**
   * Show welcome popup
   */
  showWelcomePopup() {
    const welcomeMessage = `Welcome to IIIT Campus Confession!

About the Application:
This is an anonymous confession wall where you can share your thoughts, secrets, and confessions with the campus community anonymously.

How to Use:
1. Click anywhere on the canvas to create a sticky note
2. Type your confession in the sticky note
3. Click the "Next →" button to submit your confession
4. Your confession will be posted anonymously on the history page

Share your thoughts and be part of our community!`;

    alert(welcomeMessage);
  }

  /**
   * Setup navigation between views
   */
  setupNavigation() {
    const viewHistoryBtn = document.getElementById('viewHistory');
    if (viewHistoryBtn) {
      viewHistoryBtn.addEventListener('click', () => {
        this.navigateToHistory();
      });
    }
  }

  /**
   * Show confession modal
   */
  showConfessionModal(noteData) {
    if (this.confessionViewController) {
      this.confessionViewController.showModal(noteData);
    }
  }

  /**
   * Navigate to history page
   */
  navigateToHistory() {
    window.location.href = '/history';
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.canvasViewController) {
      this.canvasViewController.dealloc();
    }
    if (this.confessionViewController) {
      this.confessionViewController.dealloc();
    }
    this.isInitialized = false;
  }
}

// Create singleton instance
window.AppDelegate = new AppDelegate();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AppDelegate.initialize().catch(error => {
      console.error('Fatal error:', error);
      alert('Application failed to initialize. Check console for details.');
    });
  });
} else {
  window.AppDelegate.initialize().catch(error => {
    console.error('Fatal error:', error);
    alert('Application failed to initialize. Check console for details.');
  });
}
