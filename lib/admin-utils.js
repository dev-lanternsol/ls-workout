// Client-side admin utilities
"use client";

// Admin utilities
function isAdmin() {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('admin_mode=true');
}

function setAdminMode(enabled = true) {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.cookie = 'admin_mode=true; path=/; max-age=86400'; // 24 hours
  } else {
    document.cookie = 'admin_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

// Reprocess workout utility
async function reprocessWorkout(workoutId) {
  try {
    const response = await fetch('/api/reprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workout_id: workoutId
      }),
    });
    
    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Global admin utilities (accessible from console)
if (typeof window !== 'undefined') {
  window.enableAdminMode = () => {
    setAdminMode(true);
    console.log('Admin mode enabled! Refresh the page to see admin controls.');
  };
  
  window.disableAdminMode = () => {
    setAdminMode(false);
    console.log('Admin mode disabled! Refresh the page to hide admin controls.');
  };
  
  window.checkAdminMode = () => {
    console.log('Admin mode is:', isAdmin() ? 'ENABLED' : 'DISABLED');
  };
}

export { isAdmin, setAdminMode, reprocessWorkout };