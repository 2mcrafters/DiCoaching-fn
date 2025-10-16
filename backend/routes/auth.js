import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from "path";
import fs from "fs";
import db from "../services/database.js";
import {
  registrationUpload,
  cleanupFile,
  normalizeProfilePicturePath,
  resolveProfilePicturePayload,
} from "../services/uploadService.js";

const router = express.Router();

const normalizeRole = (role) => {
  const r = String(role || "").toLowerCase();
  if (r === "auteur") return "author";
  if (r === "chercheur") return "researcher";
  if (["author", "researcher", "admin"].includes(r)) return r;
  return r || "researcher";
};

const formatUserForResponse = (user) => {
  if (!user) return user;
  const formatted = { ...user };
  const { profile_picture, profile_picture_url } = resolveProfilePicturePayload(
    formatted.profile_picture
  );
  formatted.profile_picture = profile_picture;
  formatted.profile_picture_url = profile_picture_url;
  return formatted;
};

// Middleware pour vérifier le token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Token d'accès requis",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) {
        return res.status(403).json({
          status: "error",
          message: "Token invalide",
        });
      }
      req.user = user;
      next();
    }
  );
};

// Route de connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Tentative de connexion:", email);

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email et mot de passe requis",
      });
    }

    // Chercher l'utilisateur dans la base de données
    const users = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    console.log("👥 Résultat de la requête utilisateur:", {
      type: typeof users,
      isArray: Array.isArray(users),
      length: users?.length,
      users: users,
    });

    if (!users || !Array.isArray(users) || users.length === 0) {
      console.log("❌ Utilisateur non trouvé:", email);
      return res.status(401).json({
        status: "error",
        message: "Email ou mot de passe incorrect",
      });
    }

    const user = users[0];
    const normalizedRole = normalizeRole(user.role);
    // Try to persist normalized role if it differs
    if (normalizedRole && normalizedRole !== user.role) {
      try {
        await db.query("UPDATE users SET role = ? WHERE id = ?", [
          normalizedRole,
          user.id,
        ]);
      } catch (_) {}
      user.role = normalizedRole;
    }
    console.log("✅ Utilisateur trouvé:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        status: "error",
        message: "Email ou mot de passe incorrect",
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Retourner les données de l'utilisateur (sans le mot de passe) et le token
    const { password: _, ...userWithoutPassword } = user;
    const formattedUser = formatUserForResponse(userWithoutPassword);

    res.json({
      status: "success",
      message: "Connexion réussie",
      data: {
        user: { ...formattedUser, role: user.role },
        token,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la connexion:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Route d'inscription avec upload de fichiers
// Custom wrapper to catch Multer errors (file too large, invalid type, too many files)
router.post(
  "/register",
  (req, res, next) => {
    registrationUpload.fields([
      { name: "profilePicture", maxCount: 1 },
      { name: "documents", maxCount: 5 },
    ])(req, res, (err) => {
      if (!err) return next();

      let status = 400;
      let message = "Erreur lors du téléchargement des fichiers";
      let code = err.code || undefined;
      let fields = {};

      // Handle common Multer error codes
      if (code === "LIMIT_FILE_SIZE") {
        status = 413; // Payload Too Large
        message = "Fichier trop volumineux (max 10MB par fichier)";
        fields = { files: message };
      } else if (code === "LIMIT_FILE_COUNT") {
        message = "Trop de fichiers envoyés (max 5 documents)";
        fields = { documents: message };
      } else if (
        typeof err.message === "string" &&
        err.message.includes("Type de fichier non autorisé")
      ) {
        message = err.message;
        fields = { files: message };
      } else if (typeof err.message === "string" && err.message.trim()) {
        message = err.message;
      }

      return res.status(status).json({
        status: "error",
        message,
        code,
        fields,
      });
    });
  },
  async (req, res) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        name,
        role = "researcher",
        sex,
        phone,
        birthDate,
        professionalStatus,
        otherStatus,
        presentation,
        biography,
        socials,
      } = req.body;

      // Validation des champs obligatoires de base
      if (!email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Email et mot de passe sont requis",
        });
      }

      // Déterminer le prénom et nom
      let firstname = firstName;
      let lastname = lastName;

      // Si firstName/lastName ne sont pas fournis mais que name l'est, diviser name
      if (!firstname && !lastname && name) {
        const nameParts = name.trim().split(" ");
        firstname = nameParts[0] || "";
        lastname = nameParts.slice(1).join(" ") || "";
      }

      // Traiter les fichiers uploadés
      let profilePicturePath = null;
      let documentsData = [];

      if (req.files) {
        // Photo de profil
        if (req.files.profilePicture && req.files.profilePicture[0]) {
          const uploadedProfile = req.files.profilePicture[0];
          profilePicturePath = normalizeProfilePicturePath(
            uploadedProfile.filename
          );
          console.log(`✅ Profile picture uploaded: ${profilePicturePath}`);
        }

        // Documents
        if (req.files.documents && req.files.documents.length > 0) {
          documentsData = req.files.documents.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
          }));
          console.log(`✅ Documents uploaded: ${documentsData.length} files`);
        }
      }

      const normalizedRole = normalizeRole(role);

      // Validation différenciée selon le rôle
      if (normalizedRole === "author") {
        // Pour les auteurs, plus de champs sont requis
        const fields = {};
        if (!firstname) fields.firstname = "Le prénom est requis";
        if (!lastname) fields.lastname = "Le nom est requis";
        if (!sex) fields.sex = "Le sexe est requis";
        if (!phone) fields.phone = "Le téléphone est requis";
        if (!professionalStatus)
          fields.professionalStatus = "Le statut professionnel est requis";
        if (Object.keys(fields).length) {
          return res.status(400).json({
            status: "error",
            message:
              "Champs requis manquants pour l'inscription en tant qu'auteur",
            fields,
          });
        }
      } else {
        // Pour les chercheurs, seuls prénom et nom sont requis en plus de email/password
        const fields = {};
        if (!firstname) fields.firstname = "Le prénom est requis";
        if (!lastname) fields.lastname = "Le nom est requis";
        if (Object.keys(fields).length) {
          return res.status(400).json({
            status: "error",
            message: "Champs requis manquants",
            fields,
          });
        }
      }

      // Vérifier si l'email existe déjà
      const existingUsers = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Cet email est déjà utilisé",
          fields: { email: "Cet email est déjà utilisé" },
        });
      }

      // Hasher le mot de passe
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Créer le nouvel utilisateur avec tous les champs disponibles
      // Status policy: authors start as 'pending' until approved; others are 'active'
      const userStatus = normalizedRole === "author" ? "pending" : "active";

      // Prepare socials payload (avoid double-encoding JSON)
      let socialsPayload = null;
      if (typeof socials === "string") {
        socialsPayload = socials;
      } else if (socials && typeof socials === "object") {
        try {
          socialsPayload = JSON.stringify(socials);
        } catch (_) {
          socialsPayload = null;
        }
      }

      const result = await db.query(
        `
      INSERT INTO users (
        email, password, firstname, lastname, name, role, sex, phone, 
        birth_date, professional_status, other_status, presentation, 
        biography, socials, profile_picture, status, created_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
        [
          email,
          hashedPassword,
          firstname,
          lastname,
          name || `${firstname} ${lastname}`.trim(),
          normalizedRole,
          sex || null,
          phone || null,
          birthDate || null,
          professionalStatus || null,
          otherStatus || null,
          presentation || null,
          biography || null,
          socialsPayload,
          profilePicturePath,
          userStatus,
        ]
      );

      const userId = result.insertId;
      console.log("✅ User created with ID:", userId);

      // Enregistrer les documents dans la base de données
      if (documentsData.length > 0) {
        const documentQueries = documentsData.map((doc) => {
          // Migration defines columns as: filename, original_filename, file_path, file_size, mime_type, uploaded_at
          // Ensure we insert into the correct column names and order to avoid SQL errors.
          return db.query(
            "INSERT INTO user_documents (user_id, filename, original_filename, file_path, file_size, mime_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [
              userId,
              doc.filename,
              doc.originalName,
              doc.path,
              doc.size,
              doc.mimetype,
            ]
          );
        });

        await Promise.all(documentQueries);
        console.log(`✅ ${documentsData.length} documents saved to database`);
      }

      const token = jwt.sign(
        {
          id: result.insertId,
          email,
          role: normalizedRole,
          firstname,
          lastname,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      // Fetch the created user row to include status and other fields
      const createdUsers = await db.query(
        `SELECT id, email, firstname, lastname, role, status, profile_picture FROM users WHERE id = ?`,
        [result.insertId]
      );

      const createdUser =
        createdUsers && createdUsers[0]
          ? createdUsers[0]
          : {
              id: result.insertId,
              email,
              firstname,
              lastname,
              role: normalizedRole,
              profile_picture: profilePicturePath,
              status: userStatus,
            };

      const formattedUser = formatUserForResponse(createdUser);

      res.status(201).json({
        status: "success",
        message: "Compte créé avec succès",
        data: {
          user: formattedUser,
          token,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription:", error);
      res.status(500).json({
        status: "error",
        message: "Erreur interne du serveur",
        error: error.message,
      });
    }
  }
);

// Route pour vérifier le token et obtenir les infos de l'utilisateur
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const users = await db.query(
      `
      SELECT id, email, firstname, lastname, sex, phone, birth_date, role, status, biography,
        professional_status, other_status, profile_picture, presentation,
        socials, created_at, updated_at 
      FROM users WHERE id = ?
    `,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé",
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

    const formattedUser = formatUserForResponse(userRecord);

    res.json({
      status: "success",
      data: {
        user: formattedUser,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
});

// Route de déconnexion (côté client, on supprime juste le token)
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Déconnexion réussie',
    timestamp: new Date().toISOString()
  });
});

export default router;
