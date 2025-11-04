// Utility functions for avatar management
import { buildProfilePictureUrl } from './uploadUtils';

export const getGenderAvatar = (userId, gender) => {
  // Generate a consistent seed based on user ID for consistent avatar
  const seed = `user${userId}`;
  const g = String(gender || "").toLowerCase();
  const isFemale = ["femme", "female", "f", "woman", "girl"].includes(g);
  const isMale = ["homme", "male", "m", "man", "boy"].includes(g);

  if (isFemale) {
    return `https://avatar.iran.liara.run/public/girl?username=${seed}`;
  }
  if (isMale) {
    return `https://avatar.iran.liara.run/public/boy?username=${seed}`;
  }
  // Default/neutral avatar for 'autre' or undefined gender
  return `https://avatar.iran.liara.run/public?username=${seed}`;
};

// Alternative service if the above doesn't work well
export const getGenderAvatarAlternative = (userId, gender) => {
  const seed = `user${userId}`;

  if (gender === "femme") {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=female`;
  } else if (gender === "homme") {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male`;
  } else {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }
};

// Get profile picture URL with proper fallback
export const getProfilePictureUrl = (user = {}) => {
  // Accept a wide range of common fields coming from various backends
  const storedPicture =
    user.profile_picture_url ||
    user.profilePictureUrl ||
    user.profile_picture ||
    user.profilePicture ||
    user.profilePhoto ||
    user.avatar_url ||
    user.avatarUrl ||
    user.avatar ||
    user.photo_url ||
    user.photoUrl ||
    user.photo ||
    user.imageUrl ||
    user.image;

  // Try to build profile picture URL from stored data
  const profileUrl = buildProfilePictureUrl(storedPicture);
  
  if (profileUrl) {
    return profileUrl;
  }

  // Otherwise use gender-appropriate avatar
  return getGenderAvatar(user.id || "user", user.sex || user.gender);
};
