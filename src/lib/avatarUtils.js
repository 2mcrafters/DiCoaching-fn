// Utility functions for avatar management
import { buildProfilePictureUrl } from './uploadUtils';

export const getGenderAvatar = (userId, gender) => {
  return null;
};

// Alternative service if the above doesn't work well
export const getGenderAvatarAlternative = (userId, gender) => {
  return null;
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

  // No profile picture found
  return null;
};
