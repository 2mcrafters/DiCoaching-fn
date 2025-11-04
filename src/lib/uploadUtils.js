// Centralized upload URL utilities
import { getApiBaseUrl } from './url';

/**
 * Get the base URL for uploads (without /api suffix)
 */
export const getUploadBaseUrl = () => {
  return getApiBaseUrl();
};

/**
 * Build a complete URL for uploaded files
 * @param {string|object} filePathOrObject - File path or object containing file info
 * @param {string} category - Upload category (profiles, documents, etc.)
 * @returns {string|null} Complete URL to the file
 */
export const buildFileUrl = (filePathOrObject, category = 'uploads') => {
  if (!filePathOrObject) return null;

  // Handle objects with various possible properties
  if (typeof filePathOrObject === 'object') {
    const candidate = 
      filePathOrObject.url ||
      filePathOrObject.file_url ||
      filePathOrObject.path ||
      filePathOrObject.filePath ||
      filePathOrObject.filename ||
      filePathOrObject.file;
    
    if (!candidate) return null;
    return buildFileUrl(candidate, category);
  }

  let path = String(filePathOrObject).trim();
  if (!path) return null;

  // If it's already an absolute URL (http/https) or data URI, return as-is
  if (/^(https?:\/\/|data:)/i.test(path)) {
    return path;
  }

  // Normalize path separators
  path = path.replace(/\\/g, '/');
  
  // Remove leading slashes
  path = path.replace(/^\/+/, '');

  // If path already contains 'uploads/', use it as-is
  if (path.startsWith('uploads/')) {
    return `${getUploadBaseUrl()}/${path}`;
  }

  // Otherwise, construct the full path
  const fullPath = category === 'uploads' ? `uploads/${path}` : `uploads/${category}/${path}`;
  return `${getUploadBaseUrl()}/${fullPath}`;
};

/**
 * Build URL specifically for profile pictures
 * @param {string|object} profilePicture - Profile picture path or object
 * @returns {string|null} Complete URL to profile picture
 */
export const buildProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null;
  
  // Handle various profile picture field names
  if (typeof profilePicture === 'object') {
    const candidate = 
      profilePicture.profile_picture_url ||
      profilePicture.profilePictureUrl ||
      profilePicture.profile_picture ||
      profilePicture.profilePicture ||
      profilePicture.url ||
      profilePicture.path ||
      profilePicture.filename;
    
    if (!candidate) return null;
    return buildProfilePictureUrl(candidate);
  }

  return buildFileUrl(profilePicture, 'profiles');
};

/**
 * Build URL for document downloads
 * @param {string|number} documentId - Document ID
 * @returns {string} Download URL
 */
export const buildDocumentDownloadUrl = (documentId) => {
  if (!documentId) return null;
  return `${getApiBaseUrl()}/api/documents/download/${documentId}`;
};

/**
 * Build URL for document files
 * @param {string|object} document - Document path or object
 * @returns {string|null} Complete URL to document
 */
export const buildDocumentUrl = (document) => {
  if (!document) return null;
  
  if (typeof document === 'object') {
    // If there's an ID, prefer download URL
    if (document.id) {
      return buildDocumentDownloadUrl(document.id);
    }
    
    const candidate = 
      document.url ||
      document.file_url ||
      document.filename ||
      document.original_filename ||
      document.path;
    
    if (!candidate) return null;
    return buildDocumentUrl(candidate);
  }

  return buildFileUrl(document, 'documents');
};