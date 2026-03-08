const API_BASE_URL = '/api';

class StickyNoteApp {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.viewHistoryBtn = document.getElementById('viewHistory');
    this.stickyNotes = [];
    this.isDragging = false;
    this.isCreating = false;
    this.startX = 0;
    this.startY = 0;
    this.dragPreview = null;
    this.selectedNote = null;
    this.dragOffset = { x: 0, y: 0 };

    this.colors = ['#FFFF99', '#FFB6C1', '#87CEEB', '#98FB98', '#FFA500', '#DDA0DD'];
    this.colorIndex = 0;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadStickyNotes();
  }

  setupEventListeners() {
    // Canvas events for creating sticky notes
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // View history button
    this.viewHistoryBtn.addEventListener('click', () => {
      window.location.href = 'history.html';
    });

    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
      if (e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    });
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing sticky note
    const clickedNote = this.getStickyNoteAt(x, y);
    if (clickedNote) {
      this.startDragging(e, clickedNote);
      return;
    }

    // Start creating new sticky note
    this.isCreating = true;
    this.startX = x;
    this.startY = y;

    // Create drag preview
    this.dragPreview = document.createElement('div');
    this.dragPreview.className = 'drag-preview';
    this.dragPreview.style.left = x + 'px';
    this.dragPreview.style.top = y + 'px';
    this.dragPreview.style.width = '0px';
    this.dragPreview.style.height = '0px';
    document.body.appendChild(this.dragPreview);
  }

  handleMouseMove(e) {
    if (this.isDragging && this.selectedNote) {
      this.handleDragMove(e);
    } else if (this.isCreating && this.dragPreview) {
      this.handleCreateMove(e);
    }
  }

  handleMouseUp(e) {
    if (this.isDragging) {
      this.stopDragging();
    } else if (this.isCreating && this.dragPreview) {
      this.finishCreating();
    }
  }

  getStickyNoteAt(x, y) {
    for (let note of this.stickyNotes) {
      if (x >= note.x && x <= note.x + note.width &&
          y >= note.y && y <= note.y + note.height) {
        return note;
      }
    }
    return null;
  }

  startDragging(e, note) {
    this.isDragging = true;
    this.selectedNote = note;

    const rect = this.canvas.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left - note.x;
    this.dragOffset.y = e.clientY - rect.top - note.y;

    const noteElement = document.querySelector(`[data-id="${note.id}"]`);
    noteElement.style.zIndex = '100';
    this.selectNote(note);
  }

  handleDragMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left - this.dragOffset.x;
    const newY = e.clientY - rect.top - this.dragOffset.y;

    const noteElement = document.querySelector(`[data-id="${this.selectedNote.id}"]`);
    noteElement.style.left = Math.max(0, newX) + 'px';
    noteElement.style.top = Math.max(0, newY) + 'px';

    // Update position in data
    this.selectedNote.x = Math.max(0, newX);
    this.selectedNote.y = Math.max(0, newY);
  }

  stopDragging() {
    if (this.selectedNote) {
      const noteElement = document.querySelector(`[data-id="${this.selectedNote.id}"]`);
      noteElement.style.zIndex = '10';

      // Persist position
      this.updateStickyNote(this.selectedNote.id, {
        x: this.selectedNote.x,
        y: this.selectedNote.y
      });
    }

    this.isDragging = false;
    this.selectedNote = null;
  }

  handleCreateMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);
    const left = Math.min(currentX, this.startX);
    const top = Math.min(currentY, this.startY);

    this.dragPreview.style.left = left + 'px';
    this.dragPreview.style.top = top + 'px';
    this.dragPreview.style.width = width + 'px';
    this.dragPreview.style.height = height + 'px';
  }

  finishCreating() {
    const rect = this.dragPreview.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    // Remove preview
    document.body.removeChild(this.dragPreview);
    this.dragPreview = null;
    this.isCreating = false;

    // Only create if large enough
    if (width > 50 && height > 50) {
      const x = rect.left - canvasRect.left;
      const y = rect.top - canvasRect.top;
      this.createStickyNote(x, y, width, height);
    }
  }

  async createStickyNote(x, y, width, height) {
    const color = this.colors[this.colorIndex % this.colors.length];
    this.colorIndex++;

    try {
      const response = await fetch(`${API_BASE_URL}/stickynotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '',
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.min(width, 400),
          height: Math.min(height, 300),
          color: color
        })
      });

      if (response.ok) {
        const noteData = await response.json();
        noteData.tempId = noteData.id; // Store temp ID for later
        this.renderStickyNote(noteData);
        // Don't show popup yet - wait for user to write and click Next
      }
    } catch (error) {
      console.error('Error creating sticky note:', error);
    }
  }

  showWriterInfoPopup(noteData) {
    const modal = document.createElement('div');
    modal.className = 'writer-modal';
    modal.style.display = 'flex';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Submit Your Confession';
    modalContent.appendChild(title);

    // Display Confession ID
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
    idValue.textContent = `${noteData.id}`;
    idContainer.appendChild(idValue);
    modalContent.appendChild(idContainer);

    // Writer Name Input
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
    modalContent.appendChild(nameInput);

    // Writer Email Input
    const emailLabel = document.createElement('label');
    emailLabel.style.display = 'block';
    emailLabel.style.fontSize = '12px';
    emailLabel.style.color = '#666';
    emailLabel.style.marginBottom = '5px';
    emailLabel.style.marginTop = '15px';
    emailLabel.textContent = 'Your Email:';
    modalContent.appendChild(emailLabel);

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Enter your email address';
    emailInput.className = 'modal-input';
    modalContent.appendChild(emailInput);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.className = 'modal-btn submit-btn';
    submitBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim() || 'Anonymous';
      const email = emailInput.value.trim();

      if (email && !this.validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Save the confession with writer info
      await this.saveConfession(noteData, name, email);
      
      // Mark the note as submitted
      const noteElement = document.querySelector(`[data-id="${noteData.id}"]`);
      if (noteElement) {
        // Disable textarea
        const textarea = noteElement.querySelector('textarea');
        if (textarea) {
          textarea.disabled = true;
          textarea.style.backgroundColor = '#FFFEF0';
          textarea.style.cursor = 'default';
        }

        // Hide Next button
        const nextBtn = noteElement.querySelector('.next-btn');
        if (nextBtn) {
          nextBtn.style.display = 'none';
        }

        // Add pinned indicator
        const pinnedIndicator = document.createElement('div');
        pinnedIndicator.style.position = 'absolute';
        pinnedIndicator.style.top = '-8px';
        pinnedIndicator.style.left = '50%';
        pinnedIndicator.style.transform = 'translateX(-50%)';
        pinnedIndicator.style.width = '8px';
        pinnedIndicator.style.height = '8px';
        pinnedIndicator.style.backgroundColor = '#E74C3C';
        pinnedIndicator.style.borderRadius = '50%';
        pinnedIndicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        pinnedIndicator.style.zIndex = '25';
        noteElement.appendChild(pinnedIndicator);

        // Style as pinned note
        noteElement.style.boxShadow = '3px 8px 16px rgba(0,0,0,0.25)';
        noteElement.classList.add('pinned-note');
      }
      
      // Remove modal
      document.body.removeChild(modal);
    });
    buttonContainer.appendChild(submitBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'modal-btn cancel-btn';
    cancelBtn.addEventListener('click', () => {
      // Delete the sticky note
      this.deleteStickyNote(noteData.id);
      document.body.removeChild(modal);
    });
    buttonContainer.appendChild(cancelBtn);

    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Focus on name input
    nameInput.focus();
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async saveConfession(noteData, writerName, writerEmail) {
    try {
      const response = await fetch(`${API_BASE_URL}/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '', // Will be updated when user types in the textarea
          writerName: writerName,
          writerEmail: writerEmail,
          stickyNoteId: noteData.id,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const confessionData = await response.json();
        // Store the confession ID with the sticky note
        this.updateStickyNote(noteData.id, { confessionId: confessionData.id });
      }
    } catch (error) {
      console.error('Error saving confession:', error);
    }
  }

  renderStickyNote(noteData) {
    const noteElement = document.createElement('div');
    noteElement.className = 'sticky-note';
    noteElement.dataset.id = noteData.id;
    noteElement.style.left = noteData.x + 'px';
    noteElement.style.top = noteData.y + 'px';
    noteElement.style.width = noteData.width + 'px';
    noteElement.style.height = noteData.height + 'px';
    noteElement.style.backgroundColor = noteData.color;

    // Create textarea for content
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Write your confession here...';
    textarea.value = noteData.content || '';
    textarea.addEventListener('input', (e) => {
      this.updateStickyNote(noteData.id, { content: e.target.value });
      // Also update the associated confession
      if (noteData.confessionId) {
        this.updateConfessionText(noteData.confessionId, e.target.value);
      }
    });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        textarea.blur();
      }
    });

    // if the note already has a confession, lock it down immediately
    if (noteData.confessionId) {
      textarea.disabled = true;
      textarea.style.backgroundColor = '#FFFEF0';
      textarea.style.cursor = 'default';
      noteElement.style.boxShadow = '3px 8px 16px rgba(0,0,0,0.25)';
      noteElement.classList.add('pinned-note');
    }

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '5px';
    deleteBtn.style.right = '5px';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.border = 'none';
    deleteBtn.style.fontSize = '18px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.color = '#666';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteStickyNote(noteData.id);
    });

    // hide delete control if note already submitted
    if (noteData.confessionId) {
      deleteBtn.style.display = 'none';
    }

    // Create Next button to submit confession info
    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.style.position = 'absolute';
    nextBtn.style.bottom = '5px';
    nextBtn.style.right = '5px';
    nextBtn.style.padding = '8px 12px';
    nextBtn.style.background = '#4287f5';
    nextBtn.style.color = 'white';
    nextBtn.style.border = 'none';
    nextBtn.style.borderRadius = '4px';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '12px';
    nextBtn.style.fontWeight = 'bold';
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showWriterInfoPopup(noteData);
    });

    // hide next button if already submitted
    if (noteData.confessionId) {
      nextBtn.style.display = 'none';
    }

    noteElement.appendChild(textarea);
    noteElement.appendChild(deleteBtn);
    noteElement.appendChild(nextBtn);
    this.canvas.appendChild(noteElement);

    this.stickyNotes.push(noteData);
  }

  selectNote(note) {
    // Remove selection from all notes
    document.querySelectorAll('.sticky-note').forEach(el => {
      el.classList.remove('selected');
    });

    // Select the current note
    const noteElement = document.querySelector(`[data-id="${note.id}"]`);
    if (noteElement) {
      noteElement.classList.add('selected');
    }
  }

  async updateStickyNote(id, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/stickynotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Update local data
        const noteIndex = this.stickyNotes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
          Object.assign(this.stickyNotes[noteIndex], updates);

          // if confessionId was added, apply pinned UI changes
          if (updates.confessionId) {
            const noteElement = document.querySelector(`[data-id="${id}"]`);
            if (noteElement) {
              // lock textarea and remove controls
              const textarea = noteElement.querySelector('textarea');
              if (textarea) {
                textarea.disabled = true;
                textarea.style.backgroundColor = '#FFFEF0';
                textarea.style.cursor = 'default';
              }
              const nextBtn = noteElement.querySelector('.next-btn');
              if (nextBtn) nextBtn.style.display = 'none';
              const deleteBtn = noteElement.querySelector('.delete-btn');
              if (deleteBtn) deleteBtn.style.display = 'none';
              noteElement.style.boxShadow = '3px 8px 16px rgba(0,0,0,0.25)';
              noteElement.classList.add('pinned-note');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating sticky note:', error);
    }
  }

  async deleteStickyNote(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/stickynotes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from DOM
        const noteElement = document.querySelector(`[data-id="${id}"]`);
        if (noteElement) {
          noteElement.parentElement.removeChild(noteElement);
        }

        // Remove from local array
        this.stickyNotes = this.stickyNotes.filter(note => note.id !== id);
      }
    } catch (error) {
      console.error('Error deleting sticky note:', error);
    }
  }

  async loadStickyNotes() {
    try {
      const response = await fetch(`${API_BASE_URL}/stickynotes`);
      if (response.ok) {
        const notes = await response.json();
        notes.forEach(note => this.renderStickyNote(note));
      }
    } catch (error) {
      console.error('Error loading sticky notes:', error);
    }
  }

  async updateConfessionText(confessionId, text) {
    try {
      await fetch(`${API_BASE_URL}/confessions/${confessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
    } catch (error) {
      console.error('Error updating confession:', error);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.stickyNoteApp = new StickyNoteApp();
});

// render a single confession element
function makeConfessionElement(text, time, replies, confessionId, isHistory, likes, dislikes, id) {
  const confessionDiv = document.createElement('div');
  confessionDiv.classList.add('confession');
  confessionDiv.id = 'confession-' + id;

  const textElement = document.createElement('div');
  textElement.classList.add('confession-text');
  textElement.textContent = text;
  confessionDiv.appendChild(textElement);

  const timestampElement = document.createElement('div');
  timestampElement.classList.add('confession-timestamp');
  timestampElement.textContent = `submitted at ${time}`;
  confessionDiv.appendChild(timestampElement);

  // like / dislike controls
  const reactionContainer = document.createElement('div');
  reactionContainer.classList.add('reaction-container');

  // like group: icon + count
  const likeGroup = document.createElement('div');
  likeGroup.classList.add('reaction-group');
  const likeBtn = document.createElement('button');
  likeBtn.classList.add('like-btn');
  likeBtn.textContent = '👍';
  const likeCountSpan = document.createElement('span');
  likeCountSpan.classList.add('like-count');
  likeCountSpan.textContent = likes;
  likeGroup.appendChild(likeBtn);
  likeGroup.appendChild(likeCountSpan);
  reactionContainer.appendChild(likeGroup);

  // dislike group: icon + count
  const dislikeGroup = document.createElement('div');
  dislikeGroup.classList.add('reaction-group');
  const dislikeBtn = document.createElement('button');
  dislikeBtn.classList.add('dislike-btn');
  dislikeBtn.textContent = '👎';
  const dislikeCountSpan = document.createElement('span');
  dislikeCountSpan.classList.add('dislike-count');
  dislikeCountSpan.textContent = dislikes;
  dislikeGroup.appendChild(dislikeBtn);
  dislikeGroup.appendChild(dislikeCountSpan);
  reactionContainer.appendChild(dislikeGroup);

  confessionDiv.appendChild(reactionContainer);

  // add reply functionality only on history page
  if (isHistory) {
    // button container at bottom right
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('confession-buttons');

    // button to add reply
    const addReplyBtn = document.createElement('button');
    addReplyBtn.classList.add('add-reply-btn');
    addReplyBtn.textContent = 'Add Reply';
    buttonContainer.appendChild(addReplyBtn);

    // button to view replies
    const viewRepliesBtn = document.createElement('button');
    viewRepliesBtn.classList.add('view-replies-btn');
    viewRepliesBtn.textContent = `View Replies (${replies ? replies.length : 0})`;
    buttonContainer.appendChild(viewRepliesBtn);

    confessionDiv.appendChild(buttonContainer);

    // reply form
    const replyForm = document.createElement('div');
    replyForm.classList.add('reply-form');
    replyForm.style.display = 'none';

    const replyTextarea = document.createElement('textarea');
    replyTextarea.placeholder = 'Write a reply...';
    replyForm.appendChild(replyTextarea);

    const submitReplyBtn = document.createElement('button');
    submitReplyBtn.textContent = 'Submit Reply';
    replyForm.appendChild(submitReplyBtn);

    confessionDiv.appendChild(replyForm);

    // replies dropdown
    const repliesDropdown = document.createElement('div');
    repliesDropdown.classList.add('replies-dropdown');
    repliesDropdown.style.display = 'none';

    if (replies && replies.length > 0) {
      replies.forEach(reply => {
        const replyDiv = document.createElement('div');
        replyDiv.classList.add('reply');
        replyDiv.innerHTML = `<p class="reply-text">${reply.text}</p><div class="reply-timestamp">replied at ${reply.time}</div>`;
        repliesDropdown.appendChild(replyDiv);
      });
    } else {
      const noRepliesMsg = document.createElement('div');
      noRepliesMsg.classList.add('no-replies-msg');
      noRepliesMsg.textContent = 'No replies yet';
      repliesDropdown.appendChild(noRepliesMsg);
    }

    confessionDiv.appendChild(repliesDropdown);

    // add reply button click
    addReplyBtn.addEventListener('click', function() {
      replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
      repliesDropdown.style.display = 'none';
    });

    // view replies button click
    viewRepliesBtn.addEventListener('click', function() {
      repliesDropdown.style.display = repliesDropdown.style.display === 'none' ? 'block' : 'none';
      replyForm.style.display = 'none';
    });

    // submit reply
    submitReplyBtn.addEventListener('click', async function() {
      const replyText = replyTextarea.value.trim();
      if (replyText !== '') {
        const reply = await addReply(confessionId, replyText);
        if (reply) {
          // update dropdown
          const noRepliesMsg = repliesDropdown.querySelector('.no-replies-msg');
          if (noRepliesMsg) noRepliesMsg.remove();

          const replyDiv = document.createElement('div');
          replyDiv.classList.add('reply');
          replyDiv.innerHTML = `<p class="reply-text">${replyText}</p><div class="reply-timestamp">replied at ${reply.time}</div>`;
          repliesDropdown.appendChild(replyDiv);

          // update button count
          const newCount = repliesDropdown.querySelectorAll('.reply').length + 1;
          viewRepliesBtn.textContent = `View Replies (${newCount})`;

          replyTextarea.value = '';
          replyForm.style.display = 'none';
        }
      }
    });
  }

  return confessionDiv;
}

// persist confession list to localStorage
function saveConfessions(list) {
  localStorage.setItem('confessions', JSON.stringify(list));
}

// load confession list from localStorage
function loadConfessions() {
  return JSON.parse(localStorage.getItem('confessions') || '[]');
}

// get count of confessions in the last hour
function getLastHourCountOld() {
  const all = loadConfessions();
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
  return all.filter(item => item.timestamp && item.timestamp > oneHourAgo).length;
}

// reactions map stored per device to prevent multiple votes on same confession
function loadReactions() {
  return JSON.parse(localStorage.getItem('reactions') || '{}');
}
function saveReactions(map) {
  localStorage.setItem('reactions', JSON.stringify(map));
}

// update the stats display
async function updateStatsDisplay() {
  const countElement = document.getElementById('hourCount');
  if (countElement) {
    const count = await getLastHourCount();
    countElement.textContent = count;
  }
}


// render a list of confession objects into a given container
async function renderConfessionsInto(container, list) {
  // newest first
  container.innerHTML = '';
  const isHistory = container.id === 'confessionHistoryWall';
  list.slice().reverse().forEach(async (item, index) => {
    const el = makeConfessionElement(item.text, item.time, item.replies || [], list.length - 1 - index, isHistory, item.likes || 0, item.dislikes || 0, item.id);
    // attach like/dislike handlers after element created
    if (isHistory) {
      const likeBtn = el.querySelector('.like-btn');
      const dislikeBtn = el.querySelector('.dislike-btn');
      const likeCount = el.querySelector('.like-count');
      const dislikeCount = el.querySelector('.dislike-count');

      // set initial active classes
      const userReaction = await getUserReaction(item.id);
      likeBtn.classList.toggle('active', userReaction === 'like');
      dislikeBtn.classList.toggle('active', userReaction === 'dislike');

      likeBtn.addEventListener('click', async () => {
        const result = await toggleReaction(item.id, 'like');
        if (result) {
          likeCount.textContent = result.likes;
          dislikeCount.textContent = result.dislikes;
          // update active classes
          const userReaction = await getUserReaction(item.id);
          likeBtn.classList.toggle('active', userReaction === 'like');
          dislikeBtn.classList.toggle('active', userReaction === 'dislike');
        }
      });

      dislikeBtn.addEventListener('click', async () => {
        const result = await toggleReaction(item.id, 'dislike');
        if (result) {
          likeCount.textContent = result.likes;
          dislikeCount.textContent = result.dislikes;
          // update active classes
          const userReaction = await getUserReaction(item.id);
          likeBtn.classList.toggle('active', userReaction === 'like');
          dislikeBtn.classList.toggle('active', userReaction === 'dislike');
        }
      });
    }
    container.appendChild(el);
  });
}

// common on-load logic
document.addEventListener('DOMContentLoaded', async function() {
  const wall = document.getElementById('confessionWall') || document.getElementById('confessionHistoryWall');
  if (wall) {
    const existing = await getConfessions();
    await renderConfessionsInto(wall, existing);
  }

  // delete history button (history page only)
  const deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
  if (deleteHistoryBtn) {
    deleteHistoryBtn.addEventListener('click', async function() {
      if (confirm('Are you sure you want to delete all confession history? This cannot be undone.')) {
        const result = await deleteAllConfessions();
        if (result) {
          wall.innerHTML = '';
          const noDataMsg = document.createElement('div');
          noDataMsg.style.textAlign = 'center';
          noDataMsg.style.color = '#999';
          noDataMsg.style.padding = '20px';
          noDataMsg.textContent = 'No confessions yet';
          wall.appendChild(noDataMsg);
        }
      }
    });
  }

  const form = document.getElementById('confessionForm');
  const input = document.getElementById('confessionInput');
  if (form && input) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const confessionText = input.value.trim();
      if (confessionText !== "") {
        const newConfession = await submitConfession(confessionText);
        if (newConfession) {
          // update wall on this page if present
          if (wall) {
            const confessionDiv = makeConfessionElement(newConfession.text, newConfession.time, [], 0, false, 0, 0, newConfession.id);
            wall.prepend(confessionDiv);
          }

          // update stats display
          await updateStatsDisplay();

          input.value = "";
        }
      }
    });
  }

  // cycle placeholder text if input exists (index page only)
  const cycleInput = document.getElementById('confessionInput');
  if (cycleInput) {
    const phrases = [
      'share some secrets',
      'are u single?',
      "how's your college life",
      'do you prefer texting or facetime',
      'wyd right now',
      'what are your plans for the weekend',
      'what’s your biggest fear',
      'what’s your guilty pleasure',
      'what’s something you wish people knew about you',
      'what’s a secret you’ve never told anyone'
    ];
    let idx = 0;
    // initialize first placeholder
    cycleInput.placeholder = phrases[idx];
    setInterval(() => {
      idx = (idx + 1) % phrases.length;
      cycleInput.placeholder = phrases[idx];
    }, 1500);
  }

  // history button handler (index page)
  const historyBtn = document.getElementById('viewHistory');
  if (historyBtn) {
    historyBtn.addEventListener('click', function() {
      window.open('history.html?ts=' + Date.now(), '_blank');
    });
  }

  // initialize stats display on page load
  await updateStatsDisplay();
});
