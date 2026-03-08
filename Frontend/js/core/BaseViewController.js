/**
 * BaseViewController - Base class for all View Controllers
 * Handles lifecycle, view management, and event delegation
 */
class BaseViewController {
  constructor(viewName) {
    this.viewName = viewName;
    this.view = null;
    this.isLoaded = false;
  }

  /**
   * Load view - override in subclasses
   */
  async loadView() {
    throw new Error('loadView() must be implemented in subclass');
  }

  /**
   * View did load - override in subclasses for initialization after view loads
   */
  async viewDidLoad() {
    this.isLoaded = true;
  }

  /**
   * Add event listener with automatic cleanup
   */
  addEventListener(element, event, handler) {
    if (!element) return;
    element.addEventListener(event, handler);
    
    // Store for cleanup
    if (!this._listeners) this._listeners = [];
    this._listeners.push({ element, event, handler });
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    if (!this._listeners) return;
    this._listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._listeners = [];
  }

  /**
   * Cleanup resources
   */
  dealloc() {
    this.removeEventListeners();
    this.view = null;
    this.isLoaded = false;
  }
}

// Make globally available
window.BaseViewController = BaseViewController;
