import axios from 'axios';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

export async function getClickUpUser(userId) {
  try {
    const response = await axios.get(`${CLICKUP_API_URL}/user/${userId}`, {
      headers: {
        'Authorization': process.env.CLICKUP_API_TOKEN
      }
    });
    return response.data.user;
  } catch (error) {
    console.error('ClickUp API error:', error);
    return null;
  }
}

export async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': process.env.CLICKUP_API_TOKEN
      }
    });
    return Buffer.from(response.data).toString('base64');
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}