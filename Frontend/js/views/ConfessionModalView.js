/**
 * ConfessionModalView - Manages rendering and DOM for confession submission modal
 * Purely presentational
 */
class ConfessionModalView {
  constructor(noteData) {
    this.noteData = noteData;
    this.element = null;
    this.nameInput = null;
    this.emailInput = null;
    this.submitBtn = null;
    this.cancelBtn = null;
  }

  /**
   * Render and return the modal element
   */
  render() {
    // Modal background
    const modal = document.createElement('div');
    modal.className = 'writer-modal';
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Submit Your Confession';
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    modalContent.appendChild(title);

    // Confession ID display
    const idContainer = document.createElement('div');
    idContainer.style.marginBottom = '15px';
    idContainer.style.padding = '10px';
    idContainer.style.background = '#f5f5f5';
    idContainer.style.borderRadius = '4px';
    
    const idLabel = document.createElement('label');
    idLabel.style.display = 'block';
    idLabel.style.fontSize = '12px';
    idLabel.style.color = '#666';
    idLabel.style.marginBottom = '5px';
    idLabel.textContent = 'Confession ID:';
    idContainer.appendChild(idLabel);

    const idValue = document.createElement('div');
    idValue.style.fontSize = '14px';
    idValue.style.fontWeight = 'bold';
    idValue.style.fontFamily = 'monospace';
    idValue.style.color = '#333';
    idValue.textContent = `${this.noteData.id}`;
    idContainer.appendChild(idValue);
    modalContent.appendChild(idContainer);

    // Name input
    const nameLabel = document.createElement('label');
    nameLabel.style.display = 'block';
    nameLabel.style.fontSize = '12px';
    nameLabel.style.color = '#666';
    nameLabel.style.marginBottom = '5px';
    nameLabel.textContent = 'Your Name:';
    modalContent.appendChild(nameLabel);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter your name (or leave blank for Anonymous)';
    nameInput.className = 'modal-input';
    nameInput.style.width = '100%';
    nameInput.style.padding = '10px';
    nameInput.style.boxSizing = 'border-box';
    nameInput.style.borderRadius = '4px';
    nameInput.style.border = '1px solid #ddd';
    nameInput.style.marginBottom = '15px';
    modalContent.appendChild(nameInput);
    this.nameInput = nameInput;

    // Email input
    const emailLabel = document.createElement('label');
    emailLabel.style.display = 'block';
    emailLabel.style.fontSize = '12px';
    emailLabel.style.color = '#666';
    emailLabel.style.marginBottom = '5px';
    emailLabel.textContent = 'Your Email:';
    modalContent.appendChild(emailLabel);

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Enter your email address';
    emailInput.className = 'modal-input';
    emailInput.style.width = '100%';
    emailInput.style.padding = '10px';
    emailInput.style.boxSizing = 'border-box';
    emailInput.style.borderRadius = '4px';
    emailInput.style.border = '1px solid #ddd';
    emailInput.style.marginBottom = '20px';
    modalContent.appendChild(emailInput);
    this.emailInput = emailInput;

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.className = 'modal-btn submit-btn';
    submitBtn.style.flex = '1';
    submitBtn.style.padding = '10px';
    submitBtn.style.background = '#4287f5';
    submitBtn.style.color = 'white';
    submitBtn.style.border = 'none';
    submitBtn.style.borderRadius = '4px';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.fontWeight = 'bold';
    buttonContainer.appendChild(submitBtn);
    this.submitBtn = submitBtn;

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'modal-btn cancel-btn';
    cancelBtn.style.flex = '1';
    cancelBtn.style.padding = '10px';
    cancelBtn.style.background = '#ddd';
    cancelBtn.style.color = '#333';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.fontWeight = 'bold';
    buttonContainer.appendChild(cancelBtn);
    this.cancelBtn = cancelBtn;

    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    this.element = modal;
    return modal;
  }

  /**
   * Get form data
   */
  getFormData() {
    return {
      name: this.nameInput.value.trim() || 'Anonymous',
      email: this.emailInput.value.trim(),
      confessionId: this.noteData.id
    };
  }

  /**
   * Get submit button
   */
  getSubmitButton() {
    return this.submitBtn;
  }

  /**
   * Get cancel button
   */
  getCancelButton() {
    return this.cancelBtn;
  }

  /**
   * Show modal
   */
  show() {
    if (this.element) {
      document.body.appendChild(this.element);
      // Focus name input
      if (this.nameInput) {
        setTimeout(() => this.nameInput.focus(), 0);
      }
    }
  }

  /**
   * Remove modal from DOM
   */
  remove() {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }

  /**
   * Show validation error
   */
  showError(message) {
    alert(message);
  }
}

// Make globally available
window.ConfessionModalView = ConfessionModalView;
