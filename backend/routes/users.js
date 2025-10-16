import express from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../services/database.js';
import { authenticateToken } from "./auth.js";
import {
  profileUpload,
  normalizeProfilePicturePath,
  resolveProfilePicturePayload,
} from "../services/uploadService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const formatUserRecord = (user) => {
  if (!user) return user;
  const formatted = { ...user };
  const { profile_picture, profile_picture_url } = resolveProfilePicturePayload(
    formatted.profile_picture
  );
  formatted.profile_picture = profile_picture;
  formatted.profile_picture_url = profile_picture_url;
  return formatted;
};

// Normalize role to english keyword for checks
const normalizeRole = (role) => {
  const r = String(role || "").toLowerCase();
  if (r === "auteur") return "author";
  if (r === "chercheur") return "researcher";
  return r;
};

// Pending-like statuses to consider for "Auteurs en attente"
const PENDING_STATUSES = new Set([
  null,
  "",
  "pending",
  "requested",
  "en_attente",
  "to_validate",
]);

// Admin guard helper
const ensureAdmin = (req, res) => {
  const requesterRole = normalizeRole(req.user?.role);
  if (requesterRole !== "admin") {
    res.status(403).json({
      status: "error",
      message: "Accès réservé aux administrateurs",
    });
    return false;
  }
  return true;
};

const coalesceBodyValue = (body, ...keys) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      return body[key];
    }
  }
  return undefined;
};

const parseJsonField = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  return undefined;
};

const normalizeString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : "";
};

const normalizeNullableString = (value) => {
  const result = normalizeString(value);
  if (result === "") return null;
  return result;
};

// GET /api/users - RÃ©cupÃ©rer tous les utilisateurs
router.get("/", async (req, res) => {
  try {
    const users = await db.query(`
      SELECT id, email, firstname, lastname, name, role, status, created_at, updated_at, professional_status, other_status, biography, profile_picture, sex, phone, socials 
      FROM users 
      ORDER BY created_at DESC
    `);

    const formattedUsers = users.map(formatUserRecord);

    res.json({
      status: "success",
      data: formattedUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(
      "âŒ Erreur lors de l'exÃ©cution de la requÃªte:",
      error.message
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la rÃ©cupÃ©ration des utilisateurs",
      error: error.message,
    });
  }
});

// GET /api/users/pending-authors - Liste des auteurs en attente (admin uniquement)
// Place BEFORE dynamic routes like /:id
router.get("/pending-authors", authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    // Fetch authors whose status is pending or equivalent
    // Treat NULL and variants as pending; use LOWER for robustness
    const rows = await db.query(
      `SELECT id, email, firstname, lastname, name, role, status, phone, sex, professional_status, profile_picture, created_at
       FROM users
       WHERE LOWER(role) IN ('author','auteur')
         AND (status IS NULL OR LOWER(status) IN ('pending','requested','en_attente','to_validate'))
       ORDER BY created_at DESC`
    );

    const data = rows.map(formatUserRecord);

    res.json({
      status: "success",
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(
      "❌ Erreur lors de la récupération des auteurs en attente:",
      error.message
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des auteurs en attente",
      error: error.message,
    });
  }
});

// POST /api/users/:id/approve-author - Approuver un auteur (admin seulement)
router.post("/:id/approve-author", authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;

    const users = await db.query(
      "SELECT id, role, status FROM users WHERE id = ?",
      [id]
    );
    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé",
      });
    }

    const user = users[0];
    if (normalizeRole(user.role) !== "author") {
      return res.status(400).json({
        status: "error",
        message: "L'utilisateur n'a pas le rôle auteur",
      });
    }

    try {
      await db.query(
        "UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ?",
        [id]
      );
    } catch (err) {
      // Fallback to 'confirmed' for legacy schemas
      await db.query(
        "UPDATE users SET status = 'confirmed', updated_at = NOW() WHERE id = ?",
        [id]
      );
    }

    const [updated] = await db.query(
      "SELECT id, email, firstname, lastname, role, status, profile_picture FROM users WHERE id = ?",
      [id]
    );

    res.json({
      status: "success",
      message: "Auteur approuvé avec succès",
      data: formatUserRecord(updated),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'approbation de l'auteur:", error.message);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de l'approbation de l'auteur",
      error: error.message,
    });
  }
});

// POST /api/users/:id/reject-author - Rejeter un auteur (admin seulement)
router.post("/:id/reject-author", authenticateToken, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;

    const users = await db.query(
      "SELECT id, role, status FROM users WHERE id = ?",
      [id]
    );
    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé",
      });
    }

    const user = users[0];
    if (normalizeRole(user.role) !== "author") {
      return res.status(400).json({
        status: "error",
        message: "L'utilisateur n'a pas le rôle auteur",
      });
    }

    // On rejection: set status to rejected (or suspended) AND downgrade role to researcher
    // Attempt a robust sequence to accommodate legacy enum values
    const attempts = [
      { status: "rejected", role: "researcher" },
      { status: "suspended", role: "researcher" },
      // In case role enum uses French terms
      { status: "suspended", role: "chercheur" },
    ];
    let updatedOk = false;
    let lastError = null;
    for (const a of attempts) {
      try {
        await db.query(
          "UPDATE users SET status = ?, role = ?, updated_at = NOW() WHERE id = ?",
          [a.status, a.role, id]
        );
        updatedOk = true;
        break;
      } catch (e) {
        lastError = e;
        // Try next fallback
      }
    }
    if (!updatedOk) {
      throw (
        lastError || new Error("Unable to update user role/status on rejection")
      );
    }

    const [updated] = await db.query(
      "SELECT id, email, firstname, lastname, role, status, profile_picture FROM users WHERE id = ?",
      [id]
    );

    res.json({
      status: "success",
      message: "Auteur rejeté avec succès",
      data: formatUserRecord(updated),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors du rejet de l'auteur:", error.message);
    res.status(500).json({
      status: "error",
      message: "Erreur lors du rejet de l'auteur",
      error: error.message,
    });
  }
});

// GET /api/users/:id - RÃ©cupÃ©rer un utilisateur spÃ©cifique
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const users = await db.query(
      `SELECT id, email, firstname, lastname, sex, phone, birth_date, role, status, biography,
        professional_status, other_status, profile_picture, presentation,
        socials, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvÃ©",
      });
    }

    const userRecord = { ...users[0] };

    // Parse socials if it's a string
    if (userRecord.socials && typeof userRecord.socials === "string") {
      try {
        userRecord.socials = JSON.parse(userRecord.socials);
      } catch (e) {
        userRecord.socials = [];
      }
    }

    const formattedUser = formatUserRecord(userRecord);

    res.json({
      status: "success",
      data: formattedUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(
      "âŒ Erreur lors de l'exÃ©cution de la requÃªte:",
      error.message
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la rÃ©cupÃ©ration de l'utilisateur",
      error: error.message,
    });
  }
});

// POST /api/users - CrÃ©er un nouvel utilisateur
router.post("/", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      firstname,
      lastname, // Support both formats
      name,
      sex,
      phone,
      birth_date,
      professionalStatus,
      professional_status, // Support both formats
      other_status,
      profile_picture,
      presentation,
      biography,
      institution,
      specialization,
      socials,
      role = "researcher",
    } = req.body;

    // Determine firstName/lastName from both possible formats
    const finalFirstName = firstName || firstname;
    const finalLastName = lastName || lastname;
    const finalProfessionalStatus = professionalStatus || professional_status;
    const finalName = name || `${finalFirstName} ${finalLastName}`.trim();

    if (!email || !password || !finalFirstName || !finalLastName) {
      return res.status(400).json({
        status: "error",
        message: "Email, mot de passe, prÃ©nom et nom sont requis",
      });
    }

    // VÃ©rifier si l'email existe dÃ©jÃ
    const existingUsers = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Cet email est dÃ©jÃ  utilisÃ©",
      });
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Déterminer le statut selon le rôle: always 'active' per normalization policy
    const status = "active";

    // CrÃ©er le nouvel utilisateur
    const result = await db.query(
      `
      INSERT INTO users (
        email, password, firstname, lastname, name, sex, phone, birth_date,
        professional_status, other_status, profile_picture, presentation,
        biography, institution, specialization, socials, role, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [
        email,
        hashedPassword,
        finalFirstName,
        finalLastName,
        finalName,
        sex,
        phone,
        birth_date,
        finalProfessionalStatus,
        other_status,
        profile_picture,
        presentation,
        biography,
        institution,
        specialization,
        socials ? JSON.stringify(socials) : null,
        role,
        status,
      ]
    );

    // RÃ©cupÃ©rer l'utilisateur crÃ©Ã© (sans le mot de passe)
    const newUser = await db.query(
      `SELECT id, email, firstname, lastname, name, sex, phone, birth_date,
              professional_status, other_status, profile_picture, presentation,
              biography, institution, specialization, socials, role, status, 
              created_at, updated_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      status: "success",
      message: "Utilisateur crÃ©Ã© avec succÃ¨s",
      data: newUser[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(
      "âŒ Erreur lors de l'exÃ©cution de la requÃªte:",
      error.message
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la crÃ©ation de l'utilisateur",
      error: error.message,
    });
  }
});

// PUT /api/users/:id - Modifier un utilisateur (admin)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstname, lastname, role, status } = req.body;

    // Only admins can update users (approve/reject authors, change roles, etc.)
    const requesterRole = (req.user?.role || "").toLowerCase();
    if (requesterRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Accès réservé aux administrateurs",
      });
    }

    // VÃ©rifier que l'utilisateur existe
    const existingUsers = await db.query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (existingUsers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvÃ©",
      });
    }

    // Si l'email est modifiÃ©, vÃ©rifier qu'il n'est pas dÃ©jÃ  utilisÃ©
    if (email) {
      const emailCheck = await db.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );
      if (emailCheck.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Cet email est dÃ©jÃ  utilisÃ© par un autre utilisateur",
        });
      }
    }

    // Construire la requÃªte de mise Ã  jour dynamiquement
    const updateFields = [];
    const updateValues = [];

    if (email) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (firstname) {
      updateFields.push("firstname = ?");
      updateValues.push(firstname);
    }
    if (lastname) {
      updateFields.push("lastname = ?");
      updateValues.push(lastname);
    }
    if (role) {
      updateFields.push("role = ?");
      updateValues.push(role);
    }
    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Aucun champ Ã  mettre Ã  jour",
      });
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(id);

    await db.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // RÃ©cupÃ©rer l'utilisateur mis Ã  jour
    const updatedUser = await db.query(
      `SELECT id, email, firstname, lastname, role, status, created_at, updated_at, professional_status, other_status, biography, profile_picture, sex FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      status: "success",
      message: "Utilisateur mis Ã  jour avec succÃ¨s",
      data: updatedUser[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(
      "âŒ Erreur lors de l'exÃ©cution de la requÃªte:",
      error.message
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la mise Ã  jour de l'utilisateur",
      error: error.message,
    });
  }
});

// PATCH /api/users/:id/profile - Mettre Ã  jour le profil utilisateur complet
router.patch(
  "/:id/profile",
  profileUpload.single("profilePicture"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const existingUsers = await db.query(
        "SELECT id, email, firstname, lastname, profile_picture FROM users WHERE id = ?",
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Utilisateur non trouvÃ©",
        });
      }

      const existingUser = existingUsers[0];

      // Construire la requÃªte de mise Ã  jour dynamiquement
      const updateFields = [];
      const updateValues = [];

      const firstname = normalizeString(
        coalesceBodyValue(req.body, "firstname", "firstName")
      );
      const lastname = normalizeString(
        coalesceBodyValue(req.body, "lastname", "lastName")
      );
      const biography = coalesceBodyValue(req.body, "biography");
      const professionalStatus = normalizeString(
        coalesceBodyValue(req.body, "professional_status", "professionalStatus")
      );
      const otherStatus = normalizeString(
        coalesceBodyValue(req.body, "other_status", "otherStatus")
      );
      const presentation = coalesceBodyValue(req.body, "presentation");
      const socialsRaw = coalesceBodyValue(req.body, "socials");
      const emailRaw = normalizeString(coalesceBodyValue(req.body, "email"));
      const phoneRaw = normalizeNullableString(
        coalesceBodyValue(req.body, "phone")
      );
      const sexRaw = normalizeString(coalesceBodyValue(req.body, "sex"));
      const birthDateRaw = coalesceBodyValue(
        req.body,
        "birth_date",
        "birthDate"
      );

      const socials = parseJsonField(socialsRaw);

      if (firstname !== undefined) {
        updateFields.push("firstname = ?");
        updateValues.push(firstname);
      }
      if (lastname !== undefined) {
        updateFields.push("lastname = ?");
        updateValues.push(lastname);
      }
      if (biography !== undefined) {
        updateFields.push("biography = ?");
        updateValues.push(biography);
      }
      if (professionalStatus !== undefined) {
        updateFields.push("professional_status = ?");
        updateValues.push(professionalStatus);
      }
      if (otherStatus !== undefined) {
        updateFields.push("other_status = ?");
        updateValues.push(otherStatus);
      }
      if (presentation !== undefined) {
        updateFields.push("presentation = ?");
        updateValues.push(presentation);
      }
      if (socials !== undefined) {
        updateFields.push("socials = ?");
        updateValues.push(JSON.stringify(socials));
      }

      if (emailRaw !== undefined) {
        const normalizedEmail = emailRaw || null;
        if (normalizedEmail && normalizedEmail !== existingUser.email) {
          const emailConflict = await db.query(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [normalizedEmail, id]
          );
          if (emailConflict.length > 0) {
            return res.status(409).json({
              status: "error",
              message: "Cet email est dÃ©jÃ  utilisÃ© par un autre utilisateur",
            });
          }
        }
        updateFields.push("email = ?");
        updateValues.push(normalizedEmail);
      }

      if (phoneRaw !== undefined) {
        updateFields.push("phone = ?");
        updateValues.push(phoneRaw);
      }

      if (sexRaw !== undefined) {
        updateFields.push("sex = ?");
        updateValues.push(sexRaw || null);
      }

      if (birthDateRaw !== undefined) {
        const normalizedBirth =
          typeof birthDateRaw === "string" && !birthDateRaw.trim()
            ? null
            : birthDateRaw;
        updateFields.push("birth_date = ?");
        updateValues.push(normalizedBirth);
      }

      // Gestion de la photo de profil
      if (req.file && req.file.fieldname === "profilePicture") {
        // Supprimer l'ancienne photo si elle existe
        if (existingUser.profile_picture) {
          const normalizedExisting = normalizeProfilePicturePath(
            existingUser.profile_picture
          );
          if (normalizedExisting && !normalizedExisting.startsWith("http")) {
            const oldPicturePath = path.join(
              __dirname,
              "../uploads",
              normalizedExisting
            );
            if (fs.existsSync(oldPicturePath)) {
              fs.unlinkSync(oldPicturePath);
            }
          }
        }

        const normalizedProfile = normalizeProfilePicturePath(
          req.file.filename
        );
        updateFields.push("profile_picture = ?");
        updateValues.push(normalizedProfile);
      }

      if (firstname !== undefined || lastname !== undefined) {
        const effectiveFirstname =
          firstname !== undefined ? firstname : existingUser.firstname;
        const effectiveLastname =
          lastname !== undefined ? lastname : existingUser.lastname;
        const composedName =
          [effectiveFirstname, effectiveLastname]
            .filter((part) => typeof part === "string" && part.trim().length)
            .join(" ") || null;
        updateFields.push("name = ?");
        updateValues.push(composedName);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Aucun champ Ã  mettre Ã  jour",
        });
      }

      updateFields.push("updated_at = NOW()");
      updateValues.push(id);

      await db.query(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

      // RÃ©cupÃ©rer l'utilisateur mis Ã  jour avec tous les champs du profil
      const updatedUser = await db.query(
        `SELECT id, email, firstname, lastname, name, sex, phone, birth_date,
              role, status, biography, professional_status, other_status,
              profile_picture, presentation, socials, created_at, updated_at
       FROM users WHERE id = ?`,
        [id]
      );
      const userRecord = { ...updatedUser[0] };

      if (userRecord.socials && typeof userRecord.socials === "string") {
        try {
          userRecord.socials = JSON.parse(userRecord.socials);
        } catch (error) {
          userRecord.socials = [];
        }
      }

      const formattedUser = formatUserRecord(userRecord);

      res.json({
        status: "success",
        message: "Profil mis Ã  jour avec succÃ¨s",
        data: formattedUser,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.log(
        "âŒ Erreur lors de l'exÃ©cution de la requÃªte:",
        error.message
      );
      res.status(500).json({
        status: "error",
        message: "Erreur lors de la mise Ã  jour du profil",
        error: error.message,
      });
    }
  }
);

// GET /api/users/:id/stats - RÃ©cupÃ©rer les statistiques d'un utilisateur
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const users = await db.query("SELECT id, role FROM users WHERE id = ?", [
      id,
    ]);
    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvÃ©",
      });
    }

    const user = users[0];
    let stats = {};

    // If user is an author, get term-related stats
    if (user.role === "author") {
      try {
        const [authorStats] = await db.query(
          `
          SELECT 
            COUNT(CASE WHEN status = 'published' THEN 1 END) as published_terms,
            COUNT(CASE WHEN status = 'review' THEN 1 END) as review_terms,
            COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_terms,
            COUNT(*) as total_terms
          FROM termes 
          WHERE author_id = ?
        `,
          [id]
        );
        stats = authorStats;
      } catch (errFr) {
        // Fallback to English schema
        const [authorStats] = await db.query(
          `
          SELECT 
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_terms,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_terms,
            COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_terms,
            COUNT(*) as total_terms
          FROM termes 
          WHERE author_id = ?
        `,
          [id]
        );
        stats = authorStats;
      }
    }
    // If user is a researcher, get research-related stats
    else if (user.role === "researcher") {
      try {
        // Get likes given by researcher
        const [likesStats] = await db.query(
          `
          SELECT COUNT(*) as terms_liked
          FROM likes 
          WHERE user_id = ?
        `,
          [id]
        );

        // Get research documents uploaded from user_documents table
        const [documentsStats] = await db.query(
          `
          SELECT COUNT(*) as research_documents
          FROM user_documents 
          WHERE user_id = ?
        `,
          [id]
        );

        // Get proposed modifications - try both schemas
        let modificationsStats = {
          total_modifications: 0,
          approved_modifications: 0,
          pending_modifications: 0,
        };

        try {
          // Try new schema first (from migration)
          const [modStats] = await db.query(
            `
            SELECT 
              COUNT(*) as total_modifications,
              COUNT(CASE WHEN status = 'approved' OR status = 'implemented' THEN 1 END) as approved_modifications,
              COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_modifications
            FROM proposed_modifications 
            WHERE proposer_id = ?
          `,
            [id]
          );
          modificationsStats = modStats;
        } catch (errNew) {
          try {
            // Fallback to old schema
            const [modStats] = await db.query(
              `
              SELECT 
                COUNT(*) as total_modifications,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_modifications,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_modifications
              FROM proposed_modifications 
              WHERE user_id = ?
            `,
              [id]
            );
            modificationsStats = modStats;
          } catch (errOld) {
            console.log(
              "âš ï¸ No proposed_modifications table found, using default values"
            );
          }
        }

        // Calculate activity score: 1 point per like + 5 points per approved modification
        const activityScore =
          (likesStats.terms_liked || 0) +
          (modificationsStats.approved_modifications || 0) * 5;

        stats = {
          terms_liked: likesStats.terms_liked || 0,
          research_documents: documentsStats.research_documents || 0,
          total_modifications: modificationsStats.total_modifications || 0,
          approved_modifications:
            modificationsStats.approved_modifications || 0,
          pending_modifications: modificationsStats.pending_modifications || 0,
          activity_score: activityScore,
        };

        console.log(`âœ… Researcher stats for user ${id}:`, stats);
      } catch (error) {
        console.log(
          "âŒ Erreur lors de la rÃ©cupÃ©ration des stats chercheur:",
          error.message
        );
        // Return default stats for researchers
        stats = {
          terms_liked: 0,
          research_documents: 0,
          total_modifications: 0,
          approved_modifications: 0,
          pending_modifications: 0,
          activity_score: 0,
        };
      }
    }
    // Default stats for other roles
    else {
      stats = {
        total_terms: 0,
        published_terms: 0,
        review_terms: 0,
        draft_terms: 0,
      };
    }

    res.json({
      status: "success",
      data: stats,
      user_role: user.role,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(
      "âŒ Erreur lors de l'exÃ©cution de la requÃªte:",
      error.message
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la rÃ©cupÃ©ration des statistiques utilisateur",
      error: error.message,
    });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // VÃ©rifier que l'utilisateur existe
    const existingUsers = await db.query('SELECT id, email FROM users WHERE id = ?', [id]);
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvÃ©',
      });
    }

    // Supprimer l'utilisateur
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      status: 'success',
      message: 'Utilisateur supprimÃ© avec succÃ¨s',
      data: { id, email: existingUsers[0].email },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("âŒ Erreur lors de l'exÃ©cution de la requÃªte:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message,
    });
  }
});

export default router;
