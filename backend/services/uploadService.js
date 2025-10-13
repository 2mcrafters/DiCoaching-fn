import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory
const BASE_UPLOAD_DIR = path.join(__dirname, '../uploads');

// Ensure base upload directory exists
if (!fs.existsSync(BASE_UPLOAD_DIR)) {
  fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
}

// Create subdirectories
const SUBDIRS = {
  profiles: path.join(BASE_UPLOAD_DIR, 'profiles'),
  documents: path.join(BASE_UPLOAD_DIR, 'documents'),
  temp: path.join(BASE_UPLOAD_DIR, 'temp')
};

// Create subdirectories if they don't exist
Object.values(SUBDIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for different file types
const createStorage = (subfolder = '') => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadDir = BASE_UPLOAD_DIR;
      
      // Determine upload directory based on file field or subfolder
      if (subfolder) {
        uploadDir = path.join(BASE_UPLOAD_DIR, subfolder);
      } else if (file.fieldname === 'profilePicture') {
        uploadDir = SUBDIRS.profiles;
      } else if (file.fieldname === 'documents') {
        uploadDir = SUBDIRS.documents;
      } else {
        uploadDir = SUBDIRS.temp;
      }

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with timestamp and random number
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const fieldPrefix = file.fieldname || 'file';
      
      const filename = `${fieldPrefix}-${timestamp}-${randomNum}${extension}`;
      cb(null, filename);
    }
  });
};

// File filter for different types
const createFileFilter = (allowedTypes = 'all') => {
  return function (req, file, cb) {
    const allowedExtensions = {
      images: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      documents: /\.(pdf|doc|docx|txt|rtf)$/i,
      profiles: /\.(jpg|jpeg|png|gif|webp)$/i,
      all: /\.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx|txt|rtf)$/i
    };

    const allowedMimeTypes = {
      images: /^image\//,
      documents: /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/)/,
      profiles: /^image\/(jpeg|png|gif|webp)/,
      all: /^(image\/|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/)/
    };

    const extRegex = allowedExtensions[allowedTypes] || allowedExtensions.all;
    const mimeRegex = allowedMimeTypes[allowedTypes] || allowedMimeTypes.all;

    const extname = extRegex.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimeRegex.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes}`), false);
    }
  };
};

// Profile picture upload configuration
export const profileUpload = multer({
  storage: createStorage('profiles'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for profile pictures
    files: 1 // Only one profile picture
  },
  fileFilter: createFileFilter('profiles')
});

// Document upload configuration
export const documentUpload = multer({
  storage: createStorage('documents'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for documents
    files: 5 // Max 5 documents
  },
  fileFilter: createFileFilter('documents')
});

// General upload configuration (mixed files)
export const generalUpload = multer({
  storage: createStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Max 10 files
  },
  fileFilter: createFileFilter('all')
});

// Registration upload (profile + documents)
export const registrationUpload = multer({
  storage: createStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 6 // 1 profile + 5 documents max
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'profilePicture') {
      return createFileFilter('profiles')(req, file, cb);
    } else if (file.fieldname === 'documents') {
      return createFileFilter('documents')(req, file, cb);
    } else {
      return createFileFilter('all')(req, file, cb);
    }
  }
});

// Utility function to clean up old files
export const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ File deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${filePath}:`, error.message);
  }
};

// Utility function to move file between directories
export const moveFile = (oldPath, newPath) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(newPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.renameSync(oldPath, newPath);
    console.log(`✅ File moved: ${oldPath} → ${newPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error moving file ${oldPath} → ${newPath}:`, error.message);
    return false;
  }
};

const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value);

// Get file URL for serving
export const getFileUrl = (filename, subfolder = '') => {
  if (!filename) return null;
  if (isHttpUrl(filename)) {
    return filename;
  }

  const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(
    /\/+$/,
    ''
  );
  let filePath = filename;

  if (subfolder) {
    filePath = `${subfolder}/${filename}`;
  }

  filePath = String(filePath)
    .replace(/\\/g, '/')
    .replace(/^uploads\//i, '');

  return `${baseUrl}/uploads/${filePath}`;
};

export const normalizeProfilePicturePath = (value) => {
  if (!value) return null;

  if (typeof value === 'object') {
    const candidate =
      value.path ||
      value.url ||
      value.filePath ||
      value.filename ||
      value.name ||
      '';
    return normalizeProfilePicturePath(candidate);
  }

  let sanitized = String(value).trim();
  if (!sanitized) return null;

  sanitized = sanitized.replace(/\\/g, '/');

  if (isHttpUrl(sanitized)) {
    return sanitized;
  }

  sanitized = sanitized.replace(/^uploads\//i, '');

  if (
    !sanitized.startsWith('profiles/') &&
    !sanitized.startsWith('documents/')
  ) {
    sanitized = `profiles/${sanitized}`;
  }

  return sanitized;
};

export const resolveProfilePicturePayload = (value) => {
  const normalized = normalizeProfilePicturePath(value);

  if (!normalized) {
    return {
      profile_picture: null,
      profile_picture_url: null,
    };
  }

  if (isHttpUrl(normalized)) {
    return {
      profile_picture: normalized,
      profile_picture_url: normalized,
    };
  }

  return {
    profile_picture: normalized,
    profile_picture_url: getFileUrl(normalized),
  };
};

export default {
  profileUpload,
  documentUpload,
  generalUpload,
  registrationUpload,
  cleanupFile,
  moveFile,
  getFileUrl,
  normalizeProfilePicturePath,
  resolveProfilePicturePayload,
  SUBDIRS,
  BASE_UPLOAD_DIR
};
