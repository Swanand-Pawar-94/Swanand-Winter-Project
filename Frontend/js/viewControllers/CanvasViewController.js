/**
 * CanvasViewController - Manages the sticky notes canvas
 * Handles: creation, dragging, rendering sticky notes
 * Delegates to StickyNoteView for rendering
 */
class CanvasViewController extends BaseViewController {
  constructor() {
    super('Canvas');
    this.canvas = null;
    this.stickyNoteViews = new Map(); // ID -> StickyNoteView
    this.service = window.AppService;
    
    // Drag state
    this.isDragging = false;
    this.selectedNoteId = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.noteStartX = 0;
    this.noteStartY = 0;
    
    // Create state
    this.isCreating = false;
    this.createStartX = 0;
    this.createStartY = 0;
    this.dragPreview = null;

    // Debounce timers for updates
    this.updateTimers = new Map();
    
    // Confessions tracker
    this.submittedNoteIds = new Set();
  }

  /**
   * Load view from DOM
   */
  async loadView() {
    this.canvas = document.getElementById('canvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found in DOM');
    }
    
    this.canvas.style.position = 'relative';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100vh';
    this.canvas.style.backgroundColor = '#f9f9f9';
    this.canvas.style.overflowHidden = 'hidden';
    this.canvas.style.cursor = 'default';
  }

  /**
   * Initialize after view loads
   */
  async viewDidLoad() {
    await super.viewDidLoad();
    
    // Fetch data from service
    console.log('Fetching sticky notes...');
    await this.service.fetchStickyNotes();
    await this.service.fetchConfessions();
    
    // Track submitted notes
    this.updateSubmittedNotes();
    
    // Render all sticky notes
    this.renderAllStickyNotes();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Canvas view controller loaded');
  }

  /**
   * Update which notes have confessions
   */
  updateSubmittedNotes() {
    this.submittedNoteIds.clear();
    this.service.confessions.forEach(confession => {
      this.submittedNoteIds.add(confession.stickyNoteId);
    });
  }

  /**
   * Render all sticky notes
   */
  renderAllStickyNotes() {
    this.service.stickyNotes.forEach(noteData => {
      this.renderStickyNote(noteData);
    });
  }

  /**
   * Render a single sticky note
   */
  renderStickyNote(noteData) {
    // Skip if already rendered
    if (this.stickyNoteViews.has(noteData.id)) {
      return;
    }

    // Create view
    const view = new StickyNoteView(noteData);
    const element = view.render();
    
    // Check if submitted
    const isSubmitted = this.submittedNoteIds.has(noteData.id);
    if (isSubmitted) {
      view.makeReadOnly();
    }

    // Add to canvas
    this.canvas.appendChild(element);
    
    // Store view
    this.stickyNoteViews.set(noteData.id, view);

    // Setup event handlers
    this.setupStickyNoteHandlers(noteData.id, view);
  }

  /**
   * Setup event handlers for a sticky note
   */
  setupStickyNoteHandlers(noteId, view) {
    const textarea = view.getTextarea();
    const deleteBtn = view.getDeleteButton();
    const nextBtn = view.getNextButton();
    const element = view.getElement();

    // Textarea input - debounced save
    if (textarea && !this.submittedNoteIds.has(noteId)) {
      this.addEventListener(textarea, 'input', (e) => {
        this.handleTextareaInput(noteId, e.target.value);
      });

      this.addEventListener(textarea, 'blur', (e) => {
        this.flushPendingUpdate(noteId);
      });
    }

    // Delete button
    if (deleteBtn) {
      this.addEventListener(deleteBtn, 'click', (e) => {
        e.stopPropagation();
        this.handleDeleteNote(noteId);
      });
    }

    // Next button (confession)
    if (nextBtn) {
      this.addEventListener(nextBtn, 'click', (e) => {
        e.stopPropagation();
        this.handleNextNote(noteId);
      });
    }

    // Dragging
    if (element) {
      this.addEventListener(element, 'mousedown', (e) => {
        this.handleNoteMouseDown(e, noteId);
      });
    }
  }

  /**
   * Handle textarea input - debounced
   */
  handleTextareaInput(noteId, content) {
    console.log(`Content changed for note ${noteId}`);
    
    // Clear existing timer
    if (this.updateTimers.has(noteId)) {
      clearTimeout(this.updateTimers.get(noteId));
    }

    // Set new timer (500ms debounce)
    const timer = setTimeout(() => {
      this.saveNoteToDatabase(noteId, { content });
      this.updateTimers.delete(noteId);
    }, 500);

    this.updateTimers.set(noteId, timer);
  }

  /**
   * Flush pending update immediately (e.g., on blur)
   */
  flushPendingUpdate(noteId) {
    if (this.updateTimers.has(noteId)) {
      clearTimeout(this.updateTimers.get(noteId));
      
      const view = this.stickyNoteViews.get(noteId);
      if (view) {
        const content = view.getContent();
        this.saveNoteToDatabase(noteId, { content });
      }
      
      this.updateTimers.delete(noteId);
    }
  }

  /**
   * Save note to database
   */
  async saveNoteToDatabase(noteId, updates) {
    try {
      console.log(`Saving note ${noteId}:`, updates);
      await this.service.updateStickyNote(noteId, updates);
      console.log(`Successfully saved note ${noteId}`);
    } catch (error) {
      console.error(`Error saving note ${noteId}:`, error);
    }
  }

  /**
   * Handle delete note
   */
  async handleDeleteNote(noteId) {
    if (confirm('Delete this sticky note?')) {
      try {
        await this.service.deleteStickyNote(noteId);
        
        const view = this.stickyNoteViews.get(noteId);
        if (view) {
          view.remove();
          this.stickyNoteViews.delete(noteId);
        }
      } catch (error) {
        alert('Error deleting note: ' + error.message);
      }
    }
  }

  /**
   * Handle next button - show confession modal
   */
  handleNextNote(noteId) {
    const noteData = this.service.getStickyNoteById(noteId);
    if (noteData && window.AppDelegate) {
      window.AppDelegate.showConfessionModal(noteData);
    }
  }

  /**
   * Handle canvas mouse down - create sticky note on click
   */
  handleCanvasMouseDown(e) {
    // Don't create if clicking on a note
    if (e.target.closest('.sticky-note')) {
      return;
    }

    // Create sticky note at click position
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.createStickyNote(x, y, 300, 30);
  }

  /**
   * Handle note mouse down - disabled dragging
   */
  handleNoteMouseDown(e, noteId) {
    // Dragging is disabled - do nothing
    return;
  }

  /**
   * Handle canvas mouse move - disabled
   */
  handleCanvasMouseMove(e) {
    // Dragging disabled - do nothing
  }

  /**
   * Handle canvas mouse up - disabled
   */
  handleCanvasMouseUp(e) {
    // Dragging disabled - do nothing
  }

  /**
   * Create sticky note
   */
  async createStickyNote(x, y, width, height) {
    try {
      const colors = ['#FFFF99', '#FFB6C1', '#87CEEB', '#98FB98', '#FFA500', '#DDA0DD'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const noteData = await this.service.createStickyNote({
        content: '',
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.min(width, 400),
        height: Math.min(height, 300),
        color: color
      });

      this.renderStickyNote(noteData);
      console.log('Created sticky note:', noteData.id);
    } catch (error) {
      alert('Error creating sticky note: ' + error.message);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.addEventListener(this.canvas, 'mousedown', (e) => this.handleCanvasMouseDown(e));
    this.addEventListener(document, 'mousemove', (e) => this.handleCanvasMouseMove(e));
    this.addEventListener(document, 'mouseup', (e) => this.handleCanvasMouseUp(e));
  }

  /**
   * Mark a note as submitted
   */
  async markNoteAsSubmitted(noteId) {
    this.submittedNoteIds.add(noteId);
    const view = this.stickyNoteViews.get(noteId);
    if (view) {
      view.makeReadOnly();
    }
  }
}

// Make globally available
window.CanvasViewController = CanvasViewController;
