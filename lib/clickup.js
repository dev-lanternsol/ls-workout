// lib/clickup.js
import axios from 'axios';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

/**
 * Get a user object from a Workspace using a Personal API token.
 * This uses the members list endpoint (works on non-Enterprise plans).
 *
 * @param {string|number} teamId  - ClickUp Workspace (team) ID
 * @param {string|number} userId  - ClickUp user ID to look up
 * @returns {Promise<Object|null>} The user object or null if not found
 */
export async function getClickUpUser(teamId, userId) {
  try {
    const { data } = await axios.get(`${CLICKUP_API_URL}/team/${teamId}/member`, {
      headers: {
        // Personal API token (no "Bearer " prefix)
        Authorization: process.env.CLICKUP_API_TOKEN,
        Accept: 'application/json',
      },
    });

    const member = data?.members?.find(
      (m) => String(m?.user?.id) === String(userId)
    );

    return member?.user ?? null;
  } catch (error) {
    console.error('ClickUp API (members) error:', error?.response?.data || error);
    return null;
  }
}

/**
 * Download an image and return it as a base64 string.
 * ClickUp attachment URLs are usually public; we try without auth first,
 * then fall back to including the API token if needed.
 */
export async function downloadImage(url) {
  try {
    // Try without auth (most ClickUp signed URLs work this way)
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data).toString('base64');
  } catch (err1) {
    // Fallback: retry with token in case the workspace requires auth
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: process.env.CLICKUP_API_TOKEN,
        },
      });
      return Buffer.from(res.data).toString('base64');
    } catch (err2) {
      console.error('Error downloading image:', err2?.response?.data || err2);
      throw err2;
    }
  }
}
