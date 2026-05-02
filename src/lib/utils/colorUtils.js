import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

// context: https://www.reddit.com/r/google/comments/hw5nsz/default_google_profile_pics_colors_dont_know_if_i/
export const userColors = [
  "#9e4db6",
  "#71269c",
  "#7d8f9b",
  "#4a5964",
  "#da4f6f",
  "#b22d5c",
  "#5f6bba",
  "#3b86cb",
  "#235697",
  "#4395a4",
  "#3b867a",
  "#1e4b40",
  "#749e48",
  "#416829",
  "#876f65",
  "#594139",
  "#7859bc",
  "#4c2fa1",
  "#df742c",
  "#e35d33",
  "#b04021",
];

// Function to get an available color within a project, prioritizing unused ones
export const getAvailableColor = async (projectId) => {
  try {
    // Get all existing project members to see which colors are already in use
    const usersCollection = collection(db, `projects/${projectId}/members`);
    const usersSnapshot = await getDocs(usersCollection);
    
    const usedColors = new Set();
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.color) {
        usedColors.add(userData.color);
      }
    });

    // Find unused colors first
    const availableColors = userColors.filter(color => !usedColors.has(color));
    
    if (availableColors.length > 0) {
      // Return a random unused color
      return availableColors[Math.floor(Math.random() * availableColors.length)];
    } else {
      // All colors are used, fall back to random selection
      return userColors[Math.floor(Math.random() * userColors.length)];
    }
  } catch (error) {
    console.error('Error getting available color:', error);
    // Fallback to random color if there's an error
    return userColors[Math.floor(Math.random() * userColors.length)];
  }
};

/**
 * Convert hex color to rgba with specified opacity
 * @param {string} hex - Hex color string (e.g., "#ff0000")
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGBA color string
 */
export const hexToRgba = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
