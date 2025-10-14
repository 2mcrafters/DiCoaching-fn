/**
 * Application Constants
 * Centralized configuration values for the DiCoaching application
 */

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  AUTHOR: 'author',
  RESEARCHER: 'chercheur',
};

// User Status
export const STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

// Term Status
export const TERM_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REVIEW: 'review',
  REJECTED: 'rejected',
};

// Modification Status
export const MODIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IMPLEMENTED: 'implemented',
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  MAX_DOCUMENTS: 5,
};

// Social Networks
export const SOCIAL_NETWORKS = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  X: 'X',
  TWITTER: 'Twitter', // Alias for X
  GITHUB: 'GitHub',
  YOUTUBE: 'YouTube',
};

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  ITEMS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s\-\+\(\)]+$/,
  URL_REGEX: /^https?:\/\/.+/,
};

// UI Configuration
export const UI = {
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
  SKELETON_ITEMS: 3,
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur réseau. Vérifiez votre connexion.',
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action.',
  FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires.',
  NOT_FOUND: 'La ressource demandée n\'existe pas.',
  SERVER_ERROR: 'Une erreur s\'est produite. Veuillez réessayer.',
  FILE_TOO_LARGE: `Le fichier est trop volumineux. Taille maximale: ${FILE_LIMITS.MAX_SIZE_MB}MB`,
  INVALID_FILE_TYPE: 'Type de fichier non autorisé.',
  SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Connexion réussie!',
  LOGOUT: 'Déconnexion réussie.',
  REGISTER: 'Inscription réussie!',
  PROFILE_UPDATED: 'Profil mis à jour avec succès.',
  TERM_CREATED: 'Terme créé avec succès.',
  TERM_UPDATED: 'Terme mis à jour avec succès.',
  TERM_DELETED: 'Terme supprimé avec succès.',
  COMMENT_ADDED: 'Commentaire ajouté.',
  COMMENT_DELETED: 'Commentaire supprimé.',
  LIKE_ADDED: 'Terme ajouté aux favoris.',
  LIKE_REMOVED: 'Terme retiré des favoris.',
  MODIFICATION_SUBMITTED: 'Modification proposée avec succès.',
  USER_APPROVED: 'Utilisateur approuvé.',
  USER_REJECTED: 'Utilisateur rejeté.',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  THEME: 'theme',
  NEWSLETTER_SHOWN: 'newsletterShown',
  RECENT_SEARCHES: 'recentSearches',
};

// Theme Configuration
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Badge Levels (for author rankings)
export const BADGE_LEVELS = {
  BRONZE: { name: 'Bronze', minScore: 0, maxScore: 49, color: '#CD7F32' },
  SILVER: { name: 'Argent', minScore: 50, maxScore: 99, color: '#C0C0C0' },
  GOLD: { name: 'Or', minScore: 100, maxScore: 199, color: '#FFD700' },
  PLATINUM: { name: 'Platine', minScore: 200, maxScore: 499, color: '#E5E4E2' },
  DIAMOND: { name: 'Diamant', minScore: 500, maxScore: Infinity, color: '#B9F2FF' },
};

// Categories (can be loaded from API)
export const DEFAULT_CATEGORIES = [
  'Coaching',
  'PNL',
  'Analyse Transactionnelle',
  'Gestalt',
  'Psychologie',
  'Management',
  'Leadership',
  'Communication',
];

export default {
  ROLES,
  STATUS,
  TERM_STATUS,
  MODIFICATION_STATUS,
  FILE_LIMITS,
  SOCIAL_NETWORKS,
  API_CONFIG,
  PAGINATION,
  VALIDATION,
  UI,
  DATE_FORMATS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  THEME,
  BADGE_LEVELS,
  DEFAULT_CATEGORIES,
};
