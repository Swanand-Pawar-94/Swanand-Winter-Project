/**
 * StickyNoteView - Manages rendering and DOM for a single sticky note
 * Purely presentational - no business logic
 */
class StickyNoteView {
  constructor(noteData) {
    this.noteData = noteData;
    this.element = null;
    this.textareaElement = null;
    this.observer = null;
  }

  /**
   * Create and return the DOM element for this sticky note
   */
  render() {
    const noteElement = document.createElement('div');
    noteElement.className = 'sticky-note';
    noteElement.dataset.id = this.noteData.id;
    noteElement.style.left = this.noteData.x + 'px';
    noteElement.style.top = this.noteData.y + 'px';
    noteElement.style.width = this.noteData.width + 'px';
    noteElement.style.height = this.noteData.height + 'px';
    noteElement.style.backgroundColor = this.noteData.color;

    // Textarea for content
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Write your confession here...';
    textarea.value = this.noteData.content || '';
    textarea.style.width = 'calc(100% - 30px)';
    textarea.style.height = '100%';
    textarea.style.border = 'none';
    textarea.style.padding = '5px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.resize = 'none';
    textarea.style.fontFamily = 'Arial, sans-serif';
    textarea.style.fontSize = '14px';
    
    this.textareaElement = textarea;
    noteElement.appendChild(textarea);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '5px';
    deleteBtn.style.right = '5px';
    deleteBtn.style.width = '24px';
    deleteBtn.style.height = '24px';
    deleteBtn.style.padding = '0';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.border = 'none';
    deleteBtn.style.fontSize = '20px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.color = '#666';
    noteElement.appendChild(deleteBtn);

    // Next button (call to action)
    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.style.position = 'absolute';
    nextBtn.style.bottom = '5px';
    nextBtn.style.right = '5px';
    nextBtn.style.padding = '6px 12px';
    nextBtn.style.background = '#4287f5';
    nextBtn.style.color = 'white';
    nextBtn.style.border = 'none';
    nextBtn.style.borderRadius = '4px';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '12px';
    nextBtn.style.fontWeight = 'bold';
    noteElement.appendChild(nextBtn);

    // Store references for later use
    this.element = noteElement;
    this.deleteBtnElement = deleteBtn;
    this.nextBtnElement = nextBtn;

    return noteElement;
  }

  /**
   * Make the sticky note read-only (after submission)
   */
  makeReadOnly() {
    if (this.textareaElement) {
      this.textareaElement.disabled = true;
      this.textareaElement.style.backgroundColor = '#FFFEF0';
      this.textareaElement.style.cursor = 'default';
    }

    if (this.nextBtnElement) {
      this.nextBtnElement.style.display = 'none';
    }

    if (this.deleteBtnElement) {
      this.deleteBtnElement.style.display = 'none';
    }

    // Add pinned indicator
    this.addPinnedIndicator();
    
    // Update styling
    if (this.element) {
      this.element.style.boxShadow = '3px 8px 16px rgba(0,0,0,0.25)';
      this.element.classList.add('pinned-note');
    }
  }

  /**
   * Add the red pinned indicator dot
   */
  addPinnedIndicator() {
    if (!this.element || this.element.querySelector('.pinned-indicator')) {
      return;
    }

    const indicator = document.createElement('div');
    indicator.className = 'pinned-indicator';
    indicator.style.position = 'absolute';
    indicator.style.top = '-8px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.width = '8px';
    indicator.style.height = '8px';
    indicator.style.backgroundColor = '#E74C3C';
    indicator.style.borderRadius = '50%';
    indicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    indicator.style.zIndex = '25';

    this.element.appendChild(indicator);
  }

  /**
   * Update position
   */
  updatePosition(x, y) {
    if (this.element) {
      this.element.style.left = x + 'px';
      this.element.style.top = y + 'px';
    }
    this.noteData.x = x;
    this.noteData.y = y;
  }

  /**
   * Get textarea value
   */
  getContent() {
    return this.textareaElement ? this.textareaElement.value : '';
  }

  /**
   * Set textarea value
   */
  setContent(content) {
    if (this.textareaElement) {
      this.textareaElement.value = content;
    }
  }

  /**
   * Get delete button element
   */
  getDeleteButton() {
    return this.deleteBtnElement;
  }

  /**
   * Get next button element
   */
  getNextButton() {
    return this.nextBtnElement;
  }

  /**
   * Get textarea element
   */
  getTextarea() {
    return this.textareaElement;
  }

  /**
   * Get main element
   */
  getElement() {
    return this.element;
  }

  /**
   * Remove from DOM
   */
  remove() {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}

// Make globally available
window.StickyNoteView = StickyNoteView;
