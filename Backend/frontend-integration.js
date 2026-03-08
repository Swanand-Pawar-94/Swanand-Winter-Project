// Frontend Integration Guide
// This shows how to modify the frontend to use the backend API instead of localStorage

// ==================== Configuration ====================
const API_BASE_URL = 'http://localhost:5000/api';

// Generate or retrieve a unique device ID
function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// ==================== CONFESSIONS API ====================

// Get all confessions from backend
async function getConfessions() {
  try {
    const response = await fetch(`${API_BASE_URL}/confessions`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching confessions:', error);
    return [];
  }
}

// Create new confession
async function submitConfession(text) {
  try {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const period = now.getHours() >= 12 ? 'PM' : 'AM';
    const timeString = `${hours}:${minutes} ${period}`;

    const response = await fetch(`${API_BASE_URL}/confessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        time: timeString,
        timestamp: Date.now()
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error submitting confession:', error);
    return null;
  }
}

// Delete all confessions
async function deleteAllConfessions() {
  try {
    const response = await fetch(`${API_BASE_URL}/confessions/all`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting confessions:', error);
    return null;
  }
}

// ==================== REPLIES API ====================

// Add reply to confession
async function addReply(confessionId, text) {
  try {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const period = now.getHours() >= 12 ? 'PM' : 'AM';
    const timeString = `${hours}:${minutes} ${period}`;

    const response = await fetch(
      `${API_BASE_URL}/confessions/${confessionId}/replies`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          time: timeString
        })
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error adding reply:', error);
    return null;
  }
}

// ==================== REACTIONS API ====================

// Toggle like/dislike for confession
async function toggleReaction(confessionId, reactionType) {
  const deviceId = getOrCreateDeviceId();
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/confessions/${confessionId}/react`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          reactionType // 'like' or 'dislike'
        })
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return null;
  }
}

// Get user's current reaction for a confession
async function getUserReaction(confessionId) {
  const deviceId = getOrCreateDeviceId();
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/confessions/${confessionId}/user-reaction/${deviceId}`
    );
    const data = await response.json();
    return data.reaction; // 'like', 'dislike', or null
  } catch (error) {
    console.error('Error fetching user reaction:', error);
    return null;
  }
}

// ==================== STATS API ====================

// Get confessions submitted in last hour
async function getLastHourCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/confessions/stats/last-hour`);
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return 0;
  }
}

// ==================== Usage Examples ====================

// Example: When form is submitted
// async function handleConfessionSubmit(text) {
//   const newConfession = await submitConfession(text);
//   if (newConfession) {
//     console.log('Confession submitted with ID:', newConfession.id);
//     // Update UI with new confession
//     const confessions = await getConfessions();
//     renderConfessions(confessions);
//   }
// }

// Example: When loading confessions page
// async function loadConfessionsPage() {
//   const confessions = await getConfessions();
//   renderConfessions(confessions);
//   
//   const hourCount = await getLastHourCount();
//   updateStatsDisplay(hourCount);
// }

// Example: When clicking like/dislike
// async function handleLikeClick(confessionId) {
//   const result = await toggleReaction(confessionId, 'like');
//   if (result) {
//     updateConfessionLikes(confessionId, result.likes, result.dislikes);
//   }
// }

// Example: When adding reply
// async function handleReplySubmit(confessionId, replyText) {
//   const reply = await addReply(confessionId, replyText);
//   if (reply) {
//     console.log('Reply added:', reply);
//     // Update UI with new reply
//   }
// }

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getConfessions,
    submitConfession,
    deleteAllConfessions,
    addReply,
    toggleReaction,
    getUserReaction,
    getLastHourCount,
    getOrCreateDeviceId
  };
}
