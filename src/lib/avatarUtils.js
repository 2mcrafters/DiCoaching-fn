// Utility functions for avatar management
export const getGenderAvatar = (userId, gender) => {
  // Generate a consistent seed based on user ID for consistent avatar
  const seed = `user${userId}`;
  
  if (gender === 'femme') {
    // Female avatars - using different avatar services for women
    return `https://avatar.iran.liara.run/public/girl?username=${seed}`;
  } else if (gender === 'homme') {
    // Male avatars - using different avatar services for men  
    return `https://avatar.iran.liara.run/public/boy?username=${seed}`;
  } else {
    // Default/neutral avatar for 'autre' or undefined gender
    return `https://avatar.iran.liara.run/public?username=${seed}`;
  }
};

// Alternative service if the above doesn't work well
export const getGenderAvatarAlternative = (userId, gender) => {
  const seed = `user${userId}`;
  
  if (gender === 'femme') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=female`;
  } else if (gender === 'homme') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male`;
  } else {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }
};

// Normalize stored filename or object to an accessible relative path
const buildProfilePicturePath = (profilePicture) => {
  if (!profilePicture) return null;

  // Handle objects returned from some APIs ({ url, path, filename, ... })
  if (typeof profilePicture === "object") {
    const candidate =
      profilePicture.url ||
      profilePicture.path ||
      profilePicture.filePath ||
      profilePicture.filename;
    return buildProfilePicturePath(candidate);
  }

  let sanitized = String(profilePicture).trim();
  if (!sanitized) return null;

  // If it's already an absolute URL, keep it as-is
  if (/^https?:\/\//i.test(sanitized)) {
    return sanitized;
  }

  sanitized = sanitized.replace(/\\/g, "/").replace(/^\/+/, "");

  // Remove leading uploads/ that might already be part of the stored value
  if (sanitized.startsWith("uploads/")) {
    sanitized = sanitized.substring("uploads/".length);
  }

  const alreadyScoped =
    sanitized.startsWith("profiles/") || sanitized.startsWith("documents/");

  return alreadyScoped ? sanitized : `profiles/${sanitized}`;
};

// Get profile picture URL with proper fallback
export const getProfilePictureUrl = (user = {}) => {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "")?.replace(/\/+$/, "") ||
    "http://localhost:5000";

  const storedPicture =
    user.profile_picture_url ||
    user.profilePictureUrl ||
    user.profile_picture ||
    user.profilePicture ||
    user.profilePhoto;
  const normalizedPath = buildProfilePicturePath(storedPicture);

  if (normalizedPath) {
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }
    return `${API_BASE_URL}/uploads/${normalizedPath}`;
  }

  // Otherwise use gender-appropriate avatar
  return getGenderAvatar(user.id || "user", user.sex);
};
