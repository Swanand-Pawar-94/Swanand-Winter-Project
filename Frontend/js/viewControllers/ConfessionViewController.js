/**
 * ConfessionViewController - Manages confession submission flow
 * Handles: modal display, form validation, confession submission
 */
class ConfessionViewController extends BaseViewController {
  constructor() {
    super('Confession');
    this.currentModal = null;
    this.service = window.AppService;
  }

  /**
   * Show confession modal for a sticky note
   */
  async showModal(noteData) {
    // Create and render modal
    const modalView = new ConfessionModalView(noteData);
    const modalElement = modalView.render();
    
    this.currentModal = {
      view: modalView,
      element: modalElement,
      noteData: noteData
    };

    // Show modal
    modalView.show();

    // Setup button handlers
    this.setupModalHandlers(modalView, noteData);
  }

  /**
   * Setup modal button event handlers
   */
  setupModalHandlers(modalView, noteData) {
    const submitBtn = modalView.getSubmitButton();
    const cancelBtn = modalView.getCancelButton();

    this.addEventListener(submitBtn, 'click', async (e) => {
      e.preventDefault();
      await this.handleSubmit(modalView, noteData);
    });

    this.addEventListener(cancelBtn, 'click', (e) => {
      e.preventDefault();
      this.closeModal();
    });

    // Allow Enter key to submit
    const nameInput = modalView.nameInput;
    if (nameInput) {
      this.addEventListener(nameInput, 'keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSubmit(modalView, noteData);
        }
      });
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit(modalView, noteData) {
    try {
      // Get form data
      const formData = modalView.getFormData();

      // Validate
      if (formData.email && !this.validateEmail(formData.email)) {
        modalView.showError('Please enter a valid email address');
        return;
      }

      // Get textarea content
      const textarea = document.querySelector(`[data-id="${noteData.id}"] textarea`);
      const confessionText = textarea ? textarea.value : '';

      // Save confession
      console.log('Submitting confession for note:', noteData.id);
      const confession = await this.service.createConfession({
        text: confessionText || '',
        writerName: formData.name,
        writerEmail: formData.email,
        stickyNoteId: noteData.id,
        timestamp: Date.now()
      });

      console.log('Confession saved:', confession.id);

      // Mark sticky note with confessionId
      await this.service.updateStickyNote(noteData.id, { confessionId: confession.id });

      // Update view
      if (window.AppDelegate && window.AppDelegate.canvasViewController) {
        await window.AppDelegate.canvasViewController.markNoteAsSubmitted(noteData.id);
      }

      // Close modal
      this.closeModal();
      
      // Show success message
      alert('Confession submitted successfully!');
    } catch (error) {
      console.error('Error submitting confession:', error);
      modalView.showError('Error submitting confession: ' + error.message);
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Close modal
   */
  closeModal() {
    if (this.currentModal) {
      this.currentModal.view.remove();
      this.currentModal = null;
    }
    this.removeEventListeners();
  }
}

// Make globally available
window.ConfessionViewController = ConfessionViewController;

